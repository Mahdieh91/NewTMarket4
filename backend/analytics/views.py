# analytics/views.py

import logging

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
    get_stats,
    get_monthly_deals,
    get_recent_activities,
    get_smart_suggestions,
    get_conversion_funnel,
    get_top_suppliers,
    get_negotiation_insights,
)


logger = logging.getLogger(__name__)


# ============================================================
# Market Trends
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
        "industry",
    ]

    search_fields = [
        "industry__name",
        "trend_name",
        "description",
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
        "category",
    ]

    search_fields = [
        "name",
    ]

    ordering_fields = "__all__"


# ============================================================
# Dashboard API
# ============================================================

class DashboardAPIView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        user = request.user

        try:

            data = {
                "stats": get_stats(user),

                # حفظ برای backward compatibility
                "industryData": [],

                "monthlyDeals": get_monthly_deals(
                    user,
                    months=6,
                ),

                "recentActivities": get_recent_activities(
                    user,
                    limit=10,
                ),

                "smartSuggestions": get_smart_suggestions(
                    user,
                    limit=3,
                ),

                "conversionFunnel": get_conversion_funnel(
                    user,
                ),

                "topSuppliers": get_top_suppliers(
                    user,
                    limit=5,
                ),

                "negotiationInsights": get_negotiation_insights(
                    user,
                ),
            }

            serializer = DashboardSerializer(
                instance=data
            )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        except Exception:

            logger.exception(
                "[Dashboard] Unexpected error"
            )

            return Response(
                {
                    "detail": (
                        "خطا در دریافت اطلاعات داشبورد"
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )