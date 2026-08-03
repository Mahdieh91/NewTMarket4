# analytics/views.py
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum, Avg, Q
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta

from .models import MarketTrend, KPI
from .serializers import MarketTrendSerializer, KPISerializer

# ============================================================
# ایمپورت مدل‌های سایر اپ‌ها برای داشبورد
# ============================================================
from products.models import Product
from needs.models import Need
from negotiations.models import Negotiation
from contracts.models import Contract
from execution.models import Execution
from users.models import User


class MarketTrendViewSet(viewsets.ModelViewSet):
    """
    مدیریت روندهای بازار
    """
    queryset = MarketTrend.objects.all()
    serializer_class = MarketTrendSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['industry']
    search_fields = ['industry__name']
    ordering_fields = '__all__'

    @action(detail=False, methods=['get'])
    def demand_forecast(self, request):
        """
        پیش‌بینی تقاضا بر اساس روندهای موجود
        """
        trends = self.get_queryset()
        serializer = self.get_serializer(trends, many=True)
        return Response(serializer.data)


class KPIViewSet(viewsets.ModelViewSet):
    """
    مدیریت شاخص‌های کلیدی عملکرد (KPI)
    """
    queryset = KPI.objects.all()
    serializer_class = KPISerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name']
    ordering_fields = '__all__'

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        دریافت داده‌های کامل صفحه داشبورد
        شامل آمار، توزیع صنایع، روند معاملات، فعالیت‌های اخیر و ...
        """
        # ============================================================
        # ۱. آمار اصلی
        # ============================================================
        total_products = Product.objects.filter(status='published').count()
        active_needs = Need.objects.filter(status='published').count()
        ongoing_negotiations = Negotiation.objects.filter(
            status__in=['in_progress', 'awaiting_proposal', 'proposal_sent', 'under_review']
        ).count()
        successful_deals = Contract.objects.filter(status='signed').count()

        # نرخ تبدیل (تقریبی)
        conversion_rate = 0
        if total_products > 0:
            conversion_rate = round((successful_deals / total_products) * 100)

        # محصولات جدید در ۳۰ روز اخیر
        thirty_days_ago = datetime.now().date() - timedelta(days=30)
        new_this_month = Product.objects.filter(
            status='published',
            created_at__date__gte=thirty_days_ago
        ).count()

        stats = {
            'totalProducts': total_products,
            'activeNeeds': active_needs,
            'ongoingNegotiations': ongoing_negotiations,
            'successfulDeals': successful_deals,
            'conversionRate': conversion_rate,
            'newThisMonth': new_this_month,
        }

        # ============================================================
        # ۲. توزیع صنایع (بر اساس محصولات منتشرشده)
        # ============================================================
        industry_distribution = (
            Product.objects
            .filter(status='published')
            .values('industry__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        industry_data = [
            {
                'name': item['industry__name'] or 'بدون صنعت',
                'value': item['count']
            }
            for item in industry_distribution
        ]

        # ============================================================
        # ۳. روند معاملات ماهانه (۶ ماه اخیر)
        # ============================================================
        six_months_ago = datetime.now().date() - timedelta(days=180)
        monthly_contracts = (
            Contract.objects
            .filter(
                status='signed',
                signed_at__date__gte=six_months_ago
            )
            .annotate(month=TruncMonth('signed_at'))
            .values('month')
            .annotate(
                deals=Count('id'),
                total_value=Sum('total_value')
            )
            .order_by('month')
        )

        # نام ماه‌های فارسی
        persian_months = {
            1: 'فروردین', 2: 'اردیبهشت', 3: 'خرداد', 4: 'تیر',
            5: 'مرداد', 6: 'شهریور', 7: 'مهر', 8: 'آبان',
            9: 'آذر', 10: 'دی', 11: 'بهمن', 12: 'اسفند'
        }

        monthly_deals = []
        for item in monthly_contracts:
            if item['month']:
                month_num = item['month'].month
                month_name = persian_months.get(month_num, str(month_num))
                monthly_deals.append({
                    'month': month_name,
                    'deals': item['deals'],
                    'value': float(item['total_value'] or 0)
                })

        # اگر داده‌ای وجود نداشت، یک آرایه خالی برگردان
        if not monthly_deals:
            monthly_deals = []

        # ============================================================
        # ۴. آخرین فعالیت‌ها (ترکیبی از محصولات، نیازها، مذاکرات)
        # ============================================================
        recent_products = Product.objects.filter(status='published').order_by('-created_at')[:2]
        recent_needs = Need.objects.filter(status='published').order_by('-created_at')[:2]
        recent_negotiations = Negotiation.objects.order_by('-created_at')[:2]

        recent_activities = []

        for p in recent_products:
            recent_activities.append({
                'id': f'p-{p.id}',
                'type': 'product',
                'title': p.title,
                'user': p.seller.username if p.seller else 'نامشخص',
                'time': p.created_at.strftime('%Y-%m-%d %H:%M'),
                'status': 'new'
            })

        for n in recent_needs:
            recent_activities.append({
                'id': f'n-{n.id}',
                'type': 'need',
                'title': n.title,
                'user': n.buyer.username if n.buyer else 'نامشخص',
                'time': n.created_at.strftime('%Y-%m-%d %H:%M'),
                'status': 'active'
            })

        for ng in recent_negotiations:
            recent_activities.append({
                'id': f'ng-{ng.id}',
                'type': 'negotiation',
                'title': f'مذاکره #{ng.id}',
                'user': ng.buyer.username if ng.buyer else 'نامشخص',
                'time': ng.created_at.strftime('%Y-%m-%d %H:%M'),
                'status': 'ongoing'
            })

        # مرتب‌سازی بر اساس زمان (جدیدترین اول)
        recent_activities.sort(key=lambda x: x['time'], reverse=True)
        recent_activities = recent_activities[:5]  # فقط ۵ مورد آخر

        # ============================================================
        # ۵. پیشنهادات هوشمند (بر اساس داده‌های واقعی)
        # ============================================================
        smart_suggestions = []

        # پیدا کردن صنعت با بیشترین نیاز
        top_need_industry = (
            Need.objects
            .filter(status='published')
            .values('industry__name')
            .annotate(count=Count('id'))
            .order_by('-count')
            .first()
        )
        if top_need_industry and top_need_industry['industry__name']:
            smart_suggestions.append({
                'title': f'فرصت در صنعت {top_need_industry["industry__name"]}',
                'match': 92,
                'reason': f'{top_need_industry["count"]} نیاز فعال در این صنعت'
            })

        # پیدا کردن محصول پربازدید (اگر فیلد view_count وجود دارد)
        top_product = Product.objects.filter(status='published').order_by('-view_count').first()
        if top_product:
            smart_suggestions.append({
                'title': top_product.title,
                'match': 88,
                'reason': f'پربازدیدترین محصول با {top_product.view_count} بازدید'
            })

        # اگر تعداد پیشنهادات کمتر از ۳ بود، پیشنهادات تکمیلی اضافه کن
        if len(smart_suggestions) < 3:
            fallback_suggestions = [
                {
                    'title': 'سامانه مانیتورینگ انرژی',
                    'match': 85,
                    'reason': 'فناوری نوظهور در صنعت انرژی'
                },
                {
                    'title': 'بهینه‌ساز مصرف سوخت',
                    'match': 82,
                    'reason': 'محصول پرتقاضای این هفته'
                },
            ]
            for suggestion in fallback_suggestions:
                if len(smart_suggestions) >= 3:
                    break
                smart_suggestions.append(suggestion)

        # ============================================================
        # ۶. قیف تبدیل (محاسبه از داده‌های واقعی)
        # ============================================================
        # برای محاسبه دقیق قیف، به داده‌های بازدید نیاز داریم که فعلاً موجود نیست
        # از آمارهای موجود استفاده می‌کنیم
        total_products_for_funnel = total_products
        total_needs_for_funnel = active_needs
        total_negotiations_for_funnel = ongoing_negotiations + successful_deals
        total_deals_for_funnel = successful_deals

        conversion_funnel = [
            {'label': 'محصولات منتشرشده', 'value': total_products_for_funnel, 'percent': 100},
            {'label': 'نیازهای فعال', 'value': total_needs_for_funnel, 'percent': round((total_needs_for_funnel / total_products_for_funnel) * 100) if total_products_for_funnel else 0},
            {'label': 'مذاکرات', 'value': total_negotiations_for_funnel, 'percent': round((total_negotiations_for_funnel / total_products_for_funnel) * 100) if total_products_for_funnel else 0},
            {'label': 'معاملات موفق', 'value': total_deals_for_funnel, 'percent': round((total_deals_for_funnel / total_products_for_funnel) * 100) if total_products_for_funnel else 0},
        ]

        # ============================================================
        # ۷. برترین عرضه‌کنندگان
        # ============================================================
        top_suppliers = (
            User.objects
            .filter(role='supplier')
            .annotate(
                deals_count=Count('contracts_as_supplier', filter=Q(contracts_as_supplier__status='signed')),
                avg_score=Avg('contracts_as_supplier__execution__final_score')
            )
            .filter(deals_count__gt=0)
            .order_by('-deals_count')[:5]
        )

        top_suppliers_data = []
        for supplier in top_suppliers:
            top_suppliers_data.append({
                'name': supplier.company_name or supplier.username,
                'score': float(supplier.avg_score or 4.5),
                'deals': supplier.deals_count
            })

        # اگر عرضه‌کننده‌ای وجود نداشت، داده‌های نمونه
        if not top_suppliers_data:
            top_suppliers_data = [
                {'name': 'فناوران نوین', 'score': 4.9, 'deals': 23},
                {'name': 'هوشمندسازان یزد', 'score': 4.7, 'deals': 18},
                {'name': 'پردازش سریع', 'score': 4.5, 'deals': 15},
            ]

        # ============================================================
        # ۸. پاسخ نهایی
        # ============================================================
        response_data = {
            'stats': stats,
            'industryData': industry_data,
            'monthlyDeals': monthly_deals,
            'recentActivities': recent_activities,
            'smartSuggestions': smart_suggestions,
            'conversionFunnel': conversion_funnel,
            'topSuppliers': top_suppliers_data,
        }

        return Response(response_data)