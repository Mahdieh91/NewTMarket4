# ============================================================
# matching/views.py
# ============================================================
# استفاده از Supply به عنوان منبع اصلی
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
from products.models import Supply  # ← استفاده از Supply
from needs.models import Need
from .services import match_need_with_supplies

logger = logging.getLogger(__name__)


class MatchResultViewSet(viewsets.ModelViewSet):
    queryset = MatchResult.objects.select_related(
        'need', 'product', 'product__seller'
    )
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
    ]

    search_fields = [
        'need__title',
        'need__description',
        'product__title',
        'product__description',
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
            queryset = queryset.filter(need__buyer=user)
        return queryset

    @action(detail=False, methods=['get'], url_path='needs/(?P<need_id>[^/.]+)')
    def by_need(self, request, need_id=None):
        try:
            need = get_object_or_404(Need, id=need_id)
            if request.user != need.buyer and not request.user.is_staff:
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
        except Exception as e:
            logger.error(f"Error in by_need for need_id={need_id}: {str(e)}", exc_info=True)
            return Response(
                {'detail': f'خطا در دریافت نتایج: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        user = request.user
        queryset = MatchResult.objects.filter(need__buyer=user)
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


class MatchingRequestViewSet(viewsets.ModelViewSet):
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
        need = get_object_or_404(Need, id=need_id)
        if request.user != need.buyer and not request.user.is_staff:
            return Response(
                {'detail': 'شما به این نیاز دسترسی ندارید.'},
                status=status.HTTP_403_FORBIDDEN
            )
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
        matching_request = MatchingRequest.objects.create(
            need=need,
            user=request.user,
            status='pending'
        )
        try:
            from .tasks import process_matching_task
            process_matching_task.delay(matching_request.id)
            logger.info(f'✅ Task Celery برای نیاز {need.id} ارسال شد (request_id: {matching_request.id})')
        except ImportError:
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
        matching_request = self.get_object()
        if request.user != matching_request.user and not request.user.is_staff:
            return Response(
                {'detail': 'شما به این درخواست دسترسی ندارید.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(matching_request)
        response_data = serializer.data
        if matching_request.status == 'completed':
            results_count = MatchResult.objects.filter(need=matching_request.need).count()
            response_data['results_count'] = results_count
        return Response(response_data)


class NeedMatchingViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='matches')
    def get_matches(self, request, pk=None):
        try:
            need = get_object_or_404(Need, pk=pk)
            if request.user != need.buyer and not request.user.is_staff:
                return Response(
                    {'detail': 'شما به این نیاز دسترسی ندارید.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            # ===== استفاده از Supply با فیلترهای یکسان =====
            supplies = Supply.objects.filter(
                status__in=['approved', 'published']
            )
            results = match_need_with_supplies(
                need=need,
                supplies=supplies,
                limit=20,
                petrochemical_only=True
            )
            serialized = []
            for item in results:
                actions = item.get('recommended_actions', [])
                if isinstance(actions, list):
                    actions_str = ' | '.join(actions)
                else:
                    actions_str = str(actions) if actions else ''
                serialized.append({
                    'id': item.get('product_id'),
                    'need': need.id,
                    'product': item.get('product_id'),
                    'score': item.get('match_percentage', 0),
                    'match_percentage': item.get('match_percentage', 0),
                    'reason': item.get('match_reason', ''),
                    'recommended_actions': actions_str,
                    'product_title': item.get('title', ''),
                    'product_description': item.get('description', ''),
                    'product_price': item.get('price'),
                    'product_trl': item.get('trl'),
                    'product_mrl': None,
                    'product_industry': item.get('industry', ''),
                    'product_category': item.get('type', 'product'),
                    'provider': item.get('provider', ''),
                    'status': 'approved',
                    'created_at': None,
                    'updated_at': None,
                })
            return Response(serialized)
        except Exception as e:
            logger.error(f"Error in get_matches for need_id={pk}: {str(e)}", exc_info=True)
            return Response(
                {'detail': f'خطا در دریافت نتایج تطبیق: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================================
# process_matching_sync (استفاده از Supply)
# ============================================================

def process_matching_sync(matching_request_id):
    matching_request = MatchingRequest.objects.get(id=matching_request_id)
    need = matching_request.need
    logger.info(f'🔄 شروع پردازش تطبیق برای نیاز {need.id} (request: {matching_request_id})')
    matching_request.status = 'processing'
    matching_request.save(update_fields=['status'])
    MatchResult.objects.filter(need=need).delete()
    supplies = Supply.objects.filter(status__in=['approved', 'published'])
    logger.info(f'📦 تعداد کل عرضه‌ها: {supplies.count()}')
    if not supplies.exists():
        matching_request.total_matches = 0
        matching_request.mark_completed()
        logger.info(f'⚠️ هیچ عرضه‌ای برای نیاز {need.id} یافت نشد.')
        return
    results = []
    llm_success_count = 0
    fallback_count = 0
    llm_failed_count = 0
    use_llm = bool(getattr(settings, 'OPENROUTER_API_KEY', None))
    for supply in supplies:
        try:
            llm_score = None
            llm_reason = None
            llm_actions = None
            llm_success = False
            if use_llm:
                try:
                    llm_result = _get_llm_match_score(need, supply)
                    if llm_result is not None:
                        llm_score = llm_result.get('score', 50)
                        llm_reason = llm_result.get('reason', '')
                        llm_actions = llm_result.get('recommended_actions', '')
                        llm_success = True
                        llm_success_count += 1
                        logger.debug(f'✅ LLM موفق برای عرضه {supply.id}: score={llm_score}')
                    else:
                        llm_failed_count += 1
                except Exception as e:
                    llm_failed_count += 1
                    logger.error(f'❌ خطا در LLM برای عرضه {supply.id}: {e}')
            rule_score = _calculate_match_score(need, supply)
            if llm_success and llm_score is not None:
                final_score = (rule_score * 0.4) + (llm_score * 0.6)
                final_score = round(final_score, 1)
                reason = llm_reason or _generate_reason(need, supply, rule_score)
                actions = llm_actions or _generate_actions(need, supply, final_score)
            else:
                final_score = rule_score
                reason = _generate_reason(need, supply, rule_score)
                actions = _generate_actions(need, supply, rule_score)
                fallback_count += 1
            if final_score >= 40:
                result = MatchResult(
                    need=need,
                    product=supply,
                    score=final_score,
                    match_percentage=final_score,
                    reason=reason,
                    recommended_actions=actions,
                    status='approved'
                )
                results.append(result)
        except Exception as e:
            logger.error(f'❌ خطا در پردازش عرضه {supply.id}: {e}')
            try:
                rule_score = _calculate_match_score(need, supply)
                if rule_score >= 40:
                    result = MatchResult(
                        need=need,
                        product=supply,
                        score=rule_score,
                        match_percentage=rule_score,
                        reason=_generate_reason(need, supply, rule_score),
                        recommended_actions=_generate_actions(need, supply, rule_score),
                        status='approved'
                    )
                    results.append(result)
                    fallback_count += 1
            except Exception as e2:
                logger.error(f'❌ خطا در Fallback برای عرضه {supply.id}: {e2}')
    with transaction.atomic():
        if results:
            MatchResult.objects.bulk_create(results)
            matching_request.total_matches = len(results)
        else:
            matching_request.total_matches = 0
    matching_request.mark_completed()
    logger.info(
        f'✅ تکمیل تطبیق نیاز {need.id}: '
        f'{len(results)} نتیجه, '
        f'{llm_success_count} LLM موفق, '
        f'{fallback_count} Fallback, '
        f'{llm_failed_count} LLM ناموفق'
    )


# ============================================================
# توابع کمکی (با پشتیبانی از Supply)
# ============================================================

def _get_llm_match_score(need, supply):
    api_key = getattr(settings, 'OPENROUTER_API_KEY', None)
    model = getattr(settings, 'OPENROUTER_MODEL', 'openai/gpt-oss-20b:free')
    base_url = getattr(settings, 'OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
    temperature = getattr(settings, 'OPENROUTER_TEMPERATURE', 0.1)
    max_tokens = getattr(settings, 'OPENROUTER_MAX_TOKENS', 500)
    if not api_key:
        logger.warning('OPENROUTER_API_KEY تنظیم نشده است.')
        return None
    prompt = _build_llm_prompt(need, supply)
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


def _build_llm_prompt(need, supply):
    need_category = getattr(need, 'category', 'نامشخص')
    need_budget = str(need.budget) if hasattr(need, 'budget') and need.budget else 'نامشخص'
    need_industry = need.industry.name if need.industry else 'نامشخص'
    supply_category = getattr(supply, 'category', 'نامشخص')
    supply_industry = getattr(supply, 'industry', 'نامشخص')
    supply_trl = getattr(supply, 'trl', 'نامشخص')
    prompt = f"""
    لطفاً نیاز زیر را با عرضه (Supply) زیر تطبیق دهید و امتیاز تطبیق را از 0 تا 100 محاسبه کنید.

    === اطلاعات نیاز ===
    عنوان: {need.title}
    توضیحات: {need.description or 'توضیحی ثبت نشده'}
    صنعت: {need_industry}
    دسته‌بندی: {need_category}
    بودجه: {need_budget} تومان
    زمان‌بندی: {getattr(need, 'timeline', 'نامشخص')}

    === اطلاعات عرضه ===
    عنوان: {supply.title}
    توضیحات: {supply.description or 'توضیحی ثبت نشده'}
    صنعت: {supply_industry}
    دسته‌بندی: {supply_category}
    قیمت: {supply.price if supply.price else 'نامشخص'} تومان
    سطح آمادگی فناوری (TRL): {supply_trl}

    لطفاً موارد زیر را بررسی کنید:
    1. تطابق صنعت
    2. تطابق دسته‌بندی
    3. تطابق بودجه
    4. سطح آمادگی فناوری (TRL)
    5. تطابق کلی محتوایی

    پاسخ را به صورت JSON با کلیدهای زیر برگردانید:
    - score: عدد بین 0 تا 100
    - reason: توضیح مختصر دلیل تطبیق
    - recommended_actions: اقدامات پیشنهادی

    فقط JSON را برگردانید.
    """
    return prompt


def _calculate_match_score(need, supply):
    score = 50
    need_industry = need.industry.name if need.industry else None
    supply_industry = getattr(supply, 'industry', None)
    if need_industry and supply_industry and need_industry == supply_industry:
        score += 25
    elif need_industry and supply_industry:
        score += 10
    need_category = getattr(need, 'category', None)
    supply_category = getattr(supply, 'category', None)
    if need_category and supply_category:
        if need_category == supply_category:
            score += 15
        elif need_category in ['product', 'service'] and supply_category in ['product', 'service']:
            score += 5
    supply_trl = getattr(supply, 'trl', None)
    if supply_trl:
        try:
            trl = int(supply_trl)
            if trl >= 8:
                score += 10
            elif trl >= 6:
                score += 5
        except (ValueError, TypeError):
            pass
    need_budget = getattr(need, 'budget', None)
    supply_price = getattr(supply, 'price', None)
    if need_budget and supply_price:
        try:
            budget = float(str(need_budget).replace(',', ''))
            price = float(supply_price)
            if price <= budget:
                score += 15
            elif price <= budget * 1.2:
                score += 10
            elif price <= budget * 1.5:
                score += 5
        except (ValueError, TypeError):
            pass
    need_desc = need.description or ''
    supply_desc = getattr(supply, 'description', '')
    if need_desc and supply_desc:
        need_words = set(need_desc.lower().split())
        supply_words = set(supply_desc.lower().split())
        common_words = need_words.intersection(supply_words)
        if common_words:
            ratio = len(common_words) / max(len(need_words), 1)
            score += min(15, ratio * 15)
    return min(100, max(0, round(score)))


def _generate_reason(need, supply, score):
    reasons = []
    need_industry = need.industry.name if need.industry else None
    supply_industry = getattr(supply, 'industry', None)
    if need_industry and supply_industry and need_industry == supply_industry:
        reasons.append(f'تطابق صنعت ({need_industry})')
    elif need_industry and supply_industry:
        reasons.append(f'صنعت مرتبط ({need_industry} ↔ {supply_industry})')
    need_category = getattr(need, 'category', None)
    supply_category = getattr(supply, 'category', None)
    if need_category and supply_category and need_category == supply_category:
        reasons.append('تطابق دسته‌بندی')
    supply_trl = getattr(supply, 'trl', None)
    if supply_trl:
        try:
            trl = int(supply_trl)
            if trl >= 8:
                reasons.append(f'سطح آمادگی فناوری بالا (TRL {trl})')
            elif trl >= 6:
                reasons.append(f'سطح آمادگی فناوری متوسط (TRL {trl})')
        except (ValueError, TypeError):
            pass
    need_budget = getattr(need, 'budget', None)
    supply_price = getattr(supply, 'price', None)
    if need_budget and supply_price:
        try:
            budget = float(str(need_budget).replace(',', ''))
            price = float(supply_price)
            if price <= budget:
                reasons.append('قیمت مناسب در محدوده بودجه')
            elif price <= budget * 1.2:
                reasons.append('قیمت کمی بالاتر از بودجه')
        except (ValueError, TypeError):
            pass
    if not reasons:
        reasons.append('تطابق کلی بر اساس مشخصات نیاز و عرضه')
    return f'امتیاز تطبیق: {score}% - ' + '، '.join(reasons)


def _generate_actions(need, supply, score):
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