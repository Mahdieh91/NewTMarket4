from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    DashboardDataSerializer,
    MarketIntelligenceSerializer,
)
from .services import (
    generate_market_intelligence,
    generate_dashboard_data,
)


class MarketIntelligenceAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        industry_id = request.query_params.get("industry")
        category = request.query_params.get("category")

        trl_min = request.query_params.get("trl_min")
        trl_max = request.query_params.get("trl_max")

        # --------------------------------------------------
        # TRL validation
        # --------------------------------------------------

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
                {
                    "status": "error",
                    "message": "مقدار TRL نامعتبر است.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------
        # Range validation
        # --------------------------------------------------

        if trl_min is not None and trl_max is not None:
            if trl_min > trl_max:
                return Response(
                    {
                        "status": "error",
                        "message": "TRL حداقل نمی‌تواند بیشتر از TRL حداکثر باشد.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if trl_min is not None and not 1 <= trl_min <= 9:
            return Response(
                {
                    "status": "error",
                    "message": "TRL حداقل باید بین 1 و 9 باشد.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if trl_max is not None and not 1 <= trl_max <= 9:
            return Response(
                {
                    "status": "error",
                    "message": "TRL حداکثر باید بین 1 و 9 باشد.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------
        # Generate data
        # --------------------------------------------------

        try:
            data = generate_market_intelligence(
                industry_id=industry_id,
                category=category,
                trl_min=trl_min,
                trl_max=trl_max,
            )

        except Exception:
            return Response(
                {
                    "status": "error",
                    "message": "خطا در تولید اطلاعات هوش بازار.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = MarketIntelligenceSerializer(data)

        return Response(
            {
                "status": "success",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class DashboardAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            data = generate_dashboard_data(request.user)

            serializer = DashboardDataSerializer(data)

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        except Exception:
            return Response(
                {
                    "status": "error",
                    "message": "خطا در دریافت اطلاعات داشبورد.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )