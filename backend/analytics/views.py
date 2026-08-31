# ============================================================
# analytics/views.py
# ============================================================
# نسخه نهایی با پشتیبانی از Dashboard، Market Intelligence و Competitor Analysis
# ============================================================

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    DashboardDataSerializer,
    MarketIntelligenceSerializer,
    CompetitorAnalysisSerializer,
)
from .services import (
    generate_market_intelligence,
    generate_dashboard_data,
    generate_competitor_analysis,
)
import logging

logger = logging.getLogger(__name__)


class MarketIntelligenceAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        industry = request.query_params.get("industry")
        category = request.query_params.get("category")

        trl_min = request.query_params.get("trl_min")
        trl_max = request.query_params.get("trl_max")

        try:
            if trl_min not in (None, ""):
                trl_min = int(trl_min)
            else:
                trl_min = None

            if trl_max not in (None, ""):
                trl_max = int(trl_max)
            else:
                trl_max = None
        except (TypeError, ValueError):
            return Response(
                {"status": "error", "message": "مقدار TRL نامعتبر است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if trl_min is not None and trl_max is not None and trl_min > trl_max:
            return Response(
                {"status": "error", "message": "TRL حداقل نمی‌تواند بیشتر از TRL حداکثر باشد."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if trl_min is not None and not 1 <= trl_min <= 9:
            return Response(
                {"status": "error", "message": "TRL حداقل باید بین 1 و 9 باشد."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if trl_max is not None and not 1 <= trl_max <= 9:
            return Response(
                {"status": "error", "message": "TRL حداکثر باید بین 1 و 9 باشد."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data = generate_market_intelligence(
                industry=industry,
                category=category,
                trl_min=trl_min,
                trl_max=trl_max,
            )
        except Exception as e:
            logger.exception("Market Intelligence generation failed: %s", e)
            return Response(
                {"status": "error", "message": "خطا در تولید اطلاعات هوش بازار."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = MarketIntelligenceSerializer(data)
        return Response(
            {"status": "success", "data": serializer.data},
            status=status.HTTP_200_OK,
        )


class CompetitorAnalysisAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        product_id = request.query_params.get("product")
        if not product_id:
            return Response(
                {"status": "error", "message": "شناسه محصول الزامی است."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            product_id = int(product_id)
        except ValueError:
            return Response(
                {"status": "error", "message": "شناسه محصول نامعتبر است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        limit = request.query_params.get("limit", 20)
        try:
            limit = int(limit)
        except ValueError:
            limit = 20
        limit = max(1, min(limit, 50))

        try:
            data = generate_competitor_analysis(product_id=product_id, limit=limit)
        except ValueError as exc:
            return Response(
                {"status": "error", "message": str(exc)},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.exception("Competitor analysis failed: %s", e)
            return Response(
                {"status": "error", "message": "خطا در تحلیل رقبا."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = CompetitorAnalysisSerializer(data)
        return Response(
            {"status": "success", "data": serializer.data},
            status=status.HTTP_200_OK,
        )


class DashboardAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            data = generate_dashboard_data(request.user)
            serializer = DashboardDataSerializer(data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Dashboard generation failed: %s", e)
            return Response(
                {"status": "error", "message": "خطا در دریافت اطلاعات داشبورد."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )