# analytics/views.py

import logging

from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import (
    filters,
    permissions,
    status,
    viewsets,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MarketTrend, KPI
from .serializers import (
    MarketTrendSerializer,
    KPISerializer,
    DashboardSerializer,
)

from .services import (
    has_real_dashboard_data,
    get_stats,
    get_industry_distribution,
    get_monthly_deals,
    get_recent_activities,
    get_smart_suggestions,
    get_conversion_funnel,
    get_top_suppliers,
    DEMO_INDUSTRY_DATA,
    DEMO_MONTHLY_DEALS,
    DEMO_RECENT_ACTIVITIES,
    DEMO_SMART_SUGGESTIONS,
    DEMO_CONVERSION_FUNNEL,
    DEMO_TOP_SUPPLIERS,
)


logger = logging.getLogger(__name__)


# ============================================================
# MARKET TRENDS
# ============================================================

class MarketTrendViewSet(viewsets.ModelViewSet):

    queryset = MarketTrend.objects.all()

    serializer_class = MarketTrendSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "industry"
    ]

    search_fields = [
        "industry__name"
    ]

    ordering_fields = "__all__"


# ============================================================
# KPI
# ============================================================

class KPIViewSet(viewsets.ModelViewSet):

    queryset = KPI.objects.all()

    serializer_class = KPISerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "category"
    ]

    search_fields = [
        "name"
    ]

    ordering_fields = "__all__"


# ============================================================
# DASHBOARD
# ============================================================

class DashboardAPIView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    @method_decorator(
        cache_page(60 * 5)
    )
    def get(self, request):

        try:

            # ==================================================
            # وضعیت Database
            # ==================================================

            has_real_data = has_real_dashboard_data()

            # ==================================================
            # KPI
            #
            # همیشه واقعی
            # ==================================================

            stats = get_stats(
                request.user
            )

            # ==================================================
            # REAL DATA MODE
            # ==================================================

            if has_real_data:

                data_source = "database"

                industry_data = (
                    get_industry_distribution()
                )

                monthly_deals = (
                    get_monthly_deals(
                        months=6
                    )
                )

                recent_activities = (
                    get_recent_activities(
                        limit=10
                    )
                )

                smart_suggestions = (
                    get_smart_suggestions(
                        request.user,
                        limit=3
                    )
                )

                conversion_funnel = (
                    get_conversion_funnel()
                )

                top_suppliers = (
                    get_top_suppliers(
                        limit=5
                    )
                )

            # ==================================================
            # DEMO MODE
            #
            # Backend سالم است
            # ولی Database کاملاً خالی است
            # ==================================================

            else:

                data_source = "demo"

                industry_data = (
                    DEMO_INDUSTRY_DATA
                )

                monthly_deals = (
                    DEMO_MONTHLY_DEALS
                )

                recent_activities = (
                    DEMO_RECENT_ACTIVITIES
                )

                smart_suggestions = (
                    DEMO_SMART_SUGGESTIONS
                )

                conversion_funnel = (
                    DEMO_CONVERSION_FUNNEL
                )

                top_suppliers = (
                    DEMO_TOP_SUPPLIERS
                )

            # ==================================================
            # Response Data
            # ==================================================

            data = {
                "stats": stats,

                "industryData": industry_data,

                "monthlyDeals": monthly_deals,

                "recentActivities": recent_activities,

                "smartSuggestions": smart_suggestions,

                "conversionFunnel": conversion_funnel,

                "topSuppliers": top_suppliers,
            }

            # ==================================================
            # بسیار مهم
            #
            # اینجا دیگر data= استفاده نمی‌کنیم.
            #
            # Dashboard خروجی است، نه ورودی کاربر.
            # ==================================================

            serializer = DashboardSerializer(
                instance=data
            )

            response_data = dict(
                serializer.data
            )

            # ==================================================
            # Metadata
            #
            # این فیلدها قرارداد قبلی Frontend را خراب نمی‌کنند.
            # ==================================================

            response_data["dataSource"] = (
                data_source
            )

            response_data["isDemo"] = (
                data_source == "demo"
            )

            return Response(
                response_data,
                status=status.HTTP_200_OK,
            )

        except Exception as exc:

            logger.exception(
                "Unhandled error in DashboardAPIView"
            )

            # ==================================================
            # در صورت خطای واقعی:
            #
            # Demo Data برنمی‌گردانیم.
            # ==================================================

            if settings.DEBUG:

                return Response(
                    {
                        "detail": str(exc),
                        "error": "dashboard_error",
                    },
                    status=(
                        status.HTTP_500_INTERNAL_SERVER_ERROR
                    ),
                )

            return Response(
                {
                    "detail":
                        "خطا در دریافت اطلاعات داشبورد",
                    "error":
                        "dashboard_error",
                },
                status=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
            )