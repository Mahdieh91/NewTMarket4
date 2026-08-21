# ============================================================
# matching/views.py - نسخه نهایی با Celery + ترکیب امتیاز
# ============================================================

import json
import logging
import re
import requests
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Max, Min

from .models import MatchResult, MatchingRequest
from .serializers import (
    MatchResultSerializer,
    MatchResultListSerializer,
    MatchResultCreateSerializer,
    MatchResultStatsSerializer,
    MatchingRequestSerializer,
)
from products.models import Product
from needs.models import Need

logger = logging.getLogger(__name__)


# ============================================================
# MatchResult ViewSet
# ============================================================

class MatchResultViewSet(viewsets.ModelViewSet):
    """
    ViewSet برای مدیریت نتایج تطبیق
    """
    
    queryset = MatchResult.objects.select_related('need', 'product', 'product__seller', 'product__industry')
    serializer_class = MatchResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    
    filterset_fields = [
        'need',
        'product',
        'status',
        'need__industry',
        'product__category',
        'product__trl',
        'product__mrl',
    ]
    
    search_fields = [
        'need__title',
        'need__description',
        'product__title',
        'product__short_description',
        'reason',
        'recommended_actions',
    ]
    
    ordering_fields = [
        'score',
        'match_percentage',
        'created_at',
        'product__price',
    ]
    
    ordering = ['-match_percentage', '-score']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MatchResultListSerializer
        elif self.action == 'create':
            return MatchResultCreateSerializer
        elif self.action == 'stats':
            return MatchResultStatsSerializer
        return MatchResultSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_staff:
            queryset = queryset.filter(need__user=user)
        
        return queryset
    
    @action(detail=False, methods=['get'], url_path='needs/(?P<need_id>[^/.]+)')
    def by_need(self, request, need_id=None):
        """
        دریافت نتایج تطبیق برای یک نیاز خاص
        """
        need = get_object_or_404(Need, id=need_id)
        
        if request.user != need.user and not request.user.is_staff:
            return Response(
                {'detail': 'شما به این نیاز دسترسی ندارید.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        results = self.get_queryset().filter(need=need)
        results = results.order_by('-match_percentage', '-score')
        
        page = self.paginate_queryset(results)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """
        دریافت آمار تطبیق برای کاربر جاری
        """
        user = request.user
        queryset = MatchResult.objects.filter(need__user=user)
        
        total = queryset.count()
        
        if total == 0:
            return Response({
                'total_matches': 0,
                'average_match_percentage': 0,
                'highest_match_percentage': 0,
                'lowest_match_percentage': 0,
                'high_matches_count': 0,
                'medium_matches_count': 0,
                'low_matches_count': 0,
            })
        
        stats_data = {
            'total_matches': total,
            'average_match_percentage': queryset.aggregate(Avg('match_percentage'))['match_percentage__avg'] or 0,
            'highest_match_percentage': queryset.aggregate(Max('match_percentage'))['match_percentage__max'] or 0,
            'lowest_match_percentage': queryset.aggregate(Min('match_percentage'))['match_percentage__min'] or 0,
            'high_matches_count': queryset.filter(match_percentage__gte=80).count(),
            'medium_matches_count': queryset.filter(match_percentage__gte=60, match_percentage__lt=80).count(),
            'low_matches_count': queryset.filter(match_percentage__lt=60).count(),
        }
        
        serializer = MatchResultStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='rate')
    def rate(self, request, pk=None):
        """
        امتیازدهی کاربر به یک نتیجه تطبیق
        """
        match = self.get_object()
        rating = request.data.get('rating')
        
        if not rating:
            return Response(
                {'detail': 'لطفاً امتیاز را وارد کنید.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError
        except ValueError:
            return Response(
                {'detail': 'امتیاز باید عددی بین 1 تا 5 باشد.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        match.user_rating = rating
        match.save(update_fields=['user_rating'])
        
        serializer = self.get_serializer(match)
        return Response(serializer.data)


# ============================================================
# MatchingRequest ViewSet (با Celery)
# ============================================================

class MatchingRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet برای مدیریت درخواست‌های تطبیق با استفاده از Celery + LLM
    """
    
    queryset = MatchingRequest.objects.select_related('need', 'user')
    serializer_class = MatchingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['need', 'status', 'priority']
    ordering_fields = ['created_at', 'updated_at', 'completed_at', 'total_matches']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_staff:
            queryset = queryset.filter(user=user)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'], url_path='trigger/(?P<need_id>[^/.]+)')
    def trigger_matching(self, request, need_id=None):
        """
        راه‌اندازی فرآیند تطبیق با استفاده از Celery
        پاسخ فوری با status='pending' برمی‌گردد
        """
        need = get_object_or_404(Need, id=need_id)
        
        # بررسی دسترسی
        if request.user != need.user and not request.user.is_staff:
            return Response(
                {'detail': 'شما به این نیاز دسترسی ندارید.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # بررسی وجود درخواست قبلی در حال پردازش
        existing_request = MatchingRequest.objects.filter(
            need=need,
            status__in=['pending', 'processing']
        ).first()
        
        if existing_request:
            return Response(
                {
                    'detail': 'یک درخواست تطبیق برای این نیاز در حال پردازش است.',
                    'request_id': existing_request.id,
                    'status': existing_request.status,
                },
                status=status.HTTP_409_CONFLICT
            )
        
        # ایجاد درخواست جدید
        matching_request = MatchingRequest.objects.create(
            need=need,
            user=request.user,
            status='pending'
        )
        
        # ارسال به Celery برای پردازش پس‌زمینه
        try:
            from .tasks import process_matching_task
            process_matching_task.delay(matching_request.id)
            logger.info(f'✅ Task Celery برای نیاز {need.id} ارسال شد (request_id: {matching_request.id})')
        except ImportError:
            # اگر Celery تنظیم نشده، به صورت هم‌زمان اجرا کن
            logger.warning('⚠️ Celery در دسترس نیست. پردازش به صورت هم‌زمان انجام می‌شود.')
            try:
                process_matching_sync(matching_request.id)
            except Exception as e:
                logger.error(f'❌ خطا در پردازش هم‌زمان: {e}')
                matching_request.mark_failed(str(e))
                return Response(
                    {
                        'detail': f'خطا در پردازش: {str(e)}',
                        'request_id': matching_request.id,
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            logger.error(f'❌ خطا در ارسال Task Celery: {e}')
            matching_request.mark_failed(str(e))
            return Response(
                {
                    'detail': f'خطا در شروع پردازش: {str(e)}',
                    'request_id': matching_request.id,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # پاسخ فوری با status pending
        serializer = self.get_serializer(matching_request)
        return Response(
            {
                'request_id': matching_request.id,
                'status': 'pending',
                'message': 'فرآیند تطبیق در پس‌زمینه شروع شد. لطفاً بعداً وضعیت را بررسی کنید.',
                'data': serializer.data,
            },
            status=status.HTTP_202_ACCEPTED
        )
    
    @action(detail=True, methods=['get'], url_path='status')
    def check_status(self, request, pk=None):
        """
        بررسی وضعیت یک درخواست تطبیق
        """
        matching_request = self.get_object()
        
        # بررسی دسترسی
        if request.user != matching_request.user and not request.user.is_staff:
            return Response(
                {'detail': 'شما به این درخواست دسترسی ندارید.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(matching_request)
        
        # اگر کامل شده، تعداد نتایج را هم برگردان
        response_data = serializer.data
        if matching_request.status == 'completed':
            results_count = MatchResult.objects.filter(need=matching_request.need).count()
            response_data['results_count'] = results_count
        
        return Response(response_data)


# ============================================================
# تابع پردازش هم‌زمان (برای Celery Task)
# ============================================================

def process_matching_sync(matching_request_id):
    """
    پردازش هم‌زمان تطبیق (که توسط Celery Task صدا زده می‌شود)
    """
    matching_request = MatchingRequest.objects.get(id=matching_request_id)
    need = matching_request.need
    
    logger.info(f'🔄 شروع پردازش تطبیق برای نیاز {need.id} (request: {matching_request_id})')
    
    # بروزرسانی وضعیت
    matching_request.status = 'processing'
    matching_request.save(update_fields=['status'])
    
    # حذف نتایج قبلی
    MatchResult.objects.filter(need=need).delete()
    
    # دریافت همه محصولات منتشر شده (بدون فیلتر صنعت)
    products = Product.objects.filter(status__in=['published', 'approved'])
    
    logger.info(f'📦 تعداد کل محصولات: {products.count()}')
    
    # اگر محصولی وجود نداشت
    if not products.exists():
        matching_request.total_matches = 0
        matching_request.mark_completed()
        logger.info(f'⚠️ هیچ محصولی برای نیاز {need.id} یافت نشد.')
        return
    
    results = []
    llm_success_count = 0
    fallback_count = 0
    llm_failed_count = 0
    
    # بررسی وجود LLM
    use_llm = bool(getattr(settings, 'OPENROUTER_API_KEY', None))
    
    # پردازش هر محصول
    for product in products:
        try:
            llm_score = None
            llm_reason = None
            llm_actions = None
            llm_success = False
            
            # 1. اگر LLM در دسترس است، امتیاز LLM را بگیر
            if use_llm:
                try:
                    llm_result = _get_llm_match_score(need, product)
                    if llm_result is not None:
                        llm_score = llm_result.get('score', 50)
                        llm_reason = llm_result.get('reason', '')
                        llm_actions = llm_result.get('recommended_actions', '')
                        llm_success = True
                        llm_success_count += 1
                        logger.debug(f'✅ LLM موفق برای محصول {product.id}: score={llm_score}')
                    else:
                        llm_failed_count += 1
                        logger.debug(f'❌ LLM ناموفق برای محصول {product.id}')
                except Exception as e:
                    llm_failed_count += 1
                    logger.error(f'❌ خطا در LLM برای محصول {product.id}: {e}')
            
            # 2. محاسبه امتیاز Rule-Based
            rule_score = _calculate_match_score(need, product)
            
            # 3. ترکیب امتیازها
            if llm_success and llm_score is not None:
                # ترکیب: 40% Rule-Based + 60% LLM
                final_score = (rule_score * 0.4) + (llm_score * 0.6)
                final_score = round(final_score, 1)
                
                # استفاده از دلیل و اقدامات LLM (با بهبود Rule-Based)
                reason = llm_reason or _generate_reason(need, product, rule_score)
                actions = llm_actions or _generate_actions(need, product, final_score)
                
                logger.debug(f'🎯 ترکیب امتیاز برای محصول {product.id}: '
                           f'Rule={rule_score}, LLM={llm_score}, Final={final_score}')
            else:
                # فقط از Rule-Based استفاده کن
                final_score = rule_score
                reason = _generate_reason(need, product, rule_score)
                actions = _generate_actions(need, product, rule_score)
                fallback_count += 1
                logger.debug(f'🔄 استفاده از Fallback برای محصول {product.id}: score={final_score}')
            
            # 4. اگر امتیاز نهایی بالای 40 بود، ذخیره کن
            if final_score >= 40:
                result = MatchResult(
                    need=need,
                    product=product,
                    score=final_score,
                    match_percentage=final_score,
                    reason=reason,
                    recommended_actions=actions,
                    status='approved'
                )
                results.append(result)
                
        except Exception as e:
            logger.error(f'❌ خطا در پردازش محصول {product.id}: {e}')
            # در صورت خطا، از Rule-Based استفاده کن
            try:
                rule_score = _calculate_match_score(need, product)
                if rule_score >= 40:
                    result = MatchResult(
                        need=need,
                        product=product,
                        score=rule_score,
                        match_percentage=rule_score,
                        reason=_generate_reason(need, product, rule_score),
                        recommended_actions=_generate_actions(need, product, rule_score),
                        status='approved'
                    )
                    results.append(result)
                    fallback_count += 1
            except Exception as e2:
                logger.error(f'❌ خطا در Fallback برای محصول {product.id}: {e2}')
    
    # ذخیره نتایج
    with transaction.atomic():
        if results:
            MatchResult.objects.bulk_create(results)
            matching_request.total_matches = len(results)
        else:
            matching_request.total_matches = 0
    
    matching_request.mark_completed()
    
    # لاگ نهایی
    logger.info(
        f'✅ تکمیل تطبیق نیاز {need.id}: '
        f'{len(results)} نتیجه, '
        f'{llm_success_count} LLM موفق, '
        f'{fallback_count} Fallback, '
        f'{llm_failed_count} LLM ناموفق'
    )


# ============================================================
# توابع کمکی
# ============================================================

def _get_llm_match_score(need, product):
    """
    دریافت امتیاز تطبیق از LLM (OpenRouter)
    """
    api_key = getattr(settings, 'OPENROUTER_API_KEY', None)
    model = getattr(settings, 'OPENROUTER_MODEL', 'openai/gpt-oss-20b:free')
    base_url = getattr(settings, 'OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
    temperature = getattr(settings, 'OPENROUTER_TEMPERATURE', 0.1)
    max_tokens = getattr(settings, 'OPENROUTER_MAX_TOKENS', 500)
    
    if not api_key:
        logger.warning('OPENROUTER_API_KEY تنظیم نشده است.')
        return None
    
    prompt = _build_llm_prompt(need, product)
    
    try:
        response = requests.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {
                        "role": "system",
                        "content": "شما یک سیستم تطبیق هوشمند برای بازار فناوری هستید. "
                                  "نیازهای صنعتی را با محصولات و خدمات تطبیق می‌دهید. "
                                  "پاسخ را به صورت JSON با کلیدهای score, reason, recommended_actions برگردانید. "
                                  "score باید عددی بین 0 تا 100 باشد."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout=30
        )
        
        if response.status_code != 200:
            logger.error(f'خطا در LLM API: {response.status_code}')
            return None
        
        data = response.json()
        content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        
        if not content:
            return None
        
        # استخراج JSON از پاسخ
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            score = float(result.get('score', 50))
            score = max(0, min(100, score))
            return {
                'score': score,
                'reason': result.get('reason', ''),
                'recommended_actions': result.get('recommended_actions', ''),
            }
        
        return None
        
    except requests.exceptions.Timeout:
        logger.error('Timeout در ارتباط با LLM API')
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f'خطا در ارتباط با LLM: {e}')
        return None
    except Exception as e:
        logger.error(f'خطای غیرمنتظره در LLM: {e}')
        return None


def _build_llm_prompt(need, product):
    """
    ساخت پرامپت برای LLM
    """
    # اطلاعات نیاز
    need_category = getattr(need, 'category', 'نامشخص')
    need_budget = str(need.budget) if hasattr(need, 'budget') and need.budget else 'نامشخص'
    need_industry = need.industry.name if need.industry else 'نامشخص'
    
    # اطلاعات محصول
    product_category = product.get_category_display() if hasattr(product, 'get_category_display') else product.category
    product_industry = product.industry.name if product.industry else 'نامشخص'
    
    prompt = f"""
    لطفاً نیاز زیر را با محصول زیر تطبیق دهید و امتیاز تطبیق را از 0 تا 100 محاسبه کنید.

    === اطلاعات نیاز ===
    عنوان: {need.title}
    توضیحات: {need.description or 'توضیحی ثبت نشده'}
    صنعت: {need_industry}
    دسته‌بندی: {need_category}
    بودجه: {need_budget} تومان
    زمان‌بندی: {getattr(need, 'timeline', 'نامشخص')}

    === اطلاعات محصول ===
    عنوان: {product.title}
    توضیحات کوتاه: {product.short_description or 'توضیحی ثبت نشده'}
    توضیحات کامل: {product.full_description or 'توضیحی ثبت نشده'}
    صنعت: {product_industry}
    دسته‌بندی: {product_category}
    قیمت: {product.price if product.price else 'نامشخص'} تومان
    سطح آمادگی فناوری (TRL): {product.trl} از 9
    سطح آمادگی بازار (MRL): {product.mrl} از 9

    لطفاً موارد زیر را بررسی کنید:
    1. تطابق صنعت (آیا صنعت محصول با صنعت نیاز همخوانی دارد)
    2. تطابق دسته‌بندی (محصول یا خدمات)
    3. تطابق بودجه (آیا قیمت محصول در محدوده بودجه است)
    4. سطح آمادگی فناوری (TRL)
    5. سطح آمادگی بازار (MRL)
    6. تطابق کلی محتوایی

    پاسخ را به صورت JSON با کلیدهای زیر برگردانید:
    - score: عدد بین 0 تا 100
    - reason: توضیح مختصر دلیل تطبیق
    - recommended_actions: اقدامات پیشنهادی

    فقط JSON را برگردانید.
    """
    return prompt


def _calculate_match_score(need, product):
    """
    محاسبه امتیاز تطبیق (Rule-Based)
    """
    score = 50  # امتیاز پایه
    
    # 1. تطابق صنعت (وزن: 25)
    if need.industry and product.industry and need.industry == product.industry:
        score += 25
    elif need.industry and product.industry:
        # اگر صنایع متفاوت هستند اما هر دو وجود دارند
        score += 10
    
    # 2. تطابق دسته‌بندی (وزن: 15)
    need_category = getattr(need, 'category', None)
    if need_category and product.category:
        if need_category == product.category:
            score += 15
        elif need_category in ['product', 'service'] and product.category in ['product', 'service']:
            score += 5
    
    # 3. سطح TRL (وزن: 10)
    if product.trl:
        if product.trl >= 8:
            score += 10
        elif product.trl >= 6:
            score += 5
    
    # 4. سطح MRL (وزن: 10)
    if product.mrl:
        if product.mrl >= 8:
            score += 10
        elif product.mrl >= 6:
            score += 5
    
    # 5. تطابق بودجه (وزن: 15)
    need_budget = getattr(need, 'budget', None)
    if need_budget and product.price:
        try:
            budget = float(str(need_budget).replace(',', ''))
            price = float(product.price)
            if price <= budget:
                score += 15
            elif price <= budget * 1.2:
                score += 10
            elif price <= budget * 1.5:
                score += 5
        except (ValueError, TypeError):
            pass
    
    # 6. تطابق محتوایی ساده (وزن: 15)
    if need.description and product.short_description:
        need_words = set(need.description.lower().split())
        product_words = set(product.short_description.lower().split())
        common_words = need_words.intersection(product_words)
        if common_words:
            ratio = len(common_words) / max(len(need_words), 1)
            score += min(15, ratio * 15)
    
    return min(100, max(0, round(score)))


def _generate_reason(need, product, score):
    """
    تولید دلیل تطبیق
    """
    reasons = []
    
    if need.industry and product.industry and need.industry == product.industry:
        reasons.append(f'تطابق صنعت ({need.industry.name})')
    elif need.industry and product.industry:
        reasons.append(f'صنعت مرتبط ({need.industry.name} ↔ {product.industry.name})')
    
    need_category = getattr(need, 'category', None)
    if need_category and product.category:
        if need_category == product.category:
            reasons.append('تطابق دسته‌بندی')
    
    if product.trl and product.trl >= 8:
        reasons.append(f'سطح آمادگی فناوری بالا (TRL {product.trl})')
    elif product.trl and product.trl >= 6:
        reasons.append(f'سطح آمادگی فناوری متوسط (TRL {product.trl})')
    
    if product.mrl and product.mrl >= 8:
        reasons.append(f'سطح آمادگی بازار بالا (MRL {product.mrl})')
    
    need_budget = getattr(need, 'budget', None)
    if need_budget and product.price:
        try:
            budget = float(str(need_budget).replace(',', ''))
            price = float(product.price)
            if price <= budget:
                reasons.append('قیمت مناسب در محدوده بودجه')
            elif price <= budget * 1.2:
                reasons.append('قیمت کمی بالاتر از بودجه')
        except (ValueError, TypeError):
            pass
    
    if not reasons:
        reasons.append('تطابق کلی بر اساس مشخصات نیاز و محصول')
    
    return f'امتیاز تطبیق: {score}% - ' + '، '.join(reasons)


def _generate_actions(need, product, score):
    """
    تولید اقدامات پیشنهادی
    """
    actions = []
    
    if score >= 80:
        actions.append('ریسک پایین - این گزینه بسیار مناسب است. پیشنهاد می‌شود مذاکره را شروع کنید.')
        actions.append('درخواست جلسه معرفی با فروشنده')
        actions.append('درخواست دمو یا نمونه اولیه')
    elif score >= 60:
        actions.append('ریسک متوسط - این گزینه مناسب است اما نیاز به بررسی بیشتر دارد.')
        actions.append('بررسی مستندات فنی و درخواست اطلاعات تکمیلی')
        actions.append('مذاکره برای شرایط بهتر')
        actions.append('درخواست جلسه پرسش و پاسخ با تیم فنی')
    else:
        actions.append('ریسک بالا - این گزینه نیاز به بررسی عمیق‌تر دارد.')
        actions.append('بررسی دقیق مشخصات فنی و تطابق با نیاز')
        actions.append('مشاوره با تیم فنی')
        actions.append('جستجوی گزینه‌های جایگزین')
    
    return ' | '.join(actions)