from django.shortcuts import get_object_or_404

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import MatchResult
from .serializers import MatchResultSerializer
from .services import match_need_with_supplies

from needs.models import Need
from products.models import Product, Supply


class MatchResultViewSet(
    viewsets.ReadOnlyModelViewSet
):
    """
    مشاهده نتایج ذخیره‌شده تطبیق.

    پشتیبانی از:
    - MatchResultهای قدیمی مبتنی بر Product
    - MatchResultهای جدید مبتنی بر Supply
    """

    serializer_class = MatchResultSerializer
    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        return (
            MatchResult.objects
            .filter(
                need__buyer=self.request.user
            )
            .select_related(
                'need',
                'product',
                'product__seller',
                'product__industry',
                'supply',
                'supply__seller',
            )
            .order_by(
                '-score',
                '-created_at',
            )
        )


class NeedMatchViewSet(
    viewsets.GenericViewSet
):
    """
    تطبیق یک Need با Supplyهای واقعی Marketplace.

    مسیر:

    /api/matching/needs/<need_id>/
    """

    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = MatchResultSerializer

    def retrieve(
        self,
        request,
        pk=None,
    ):

        # ====================================================
        # Need
        # ====================================================

        need = get_object_or_404(
            Need.objects.select_related(
                'industry',
                'buyer',
            ),
            pk=pk,
            buyer=request.user,
        )

        # ====================================================
        # Supply
        # ====================================================
        #
        # Supply همان داده‌ای است که در:
        #
        # /admin/products/supply/
        #
        # وجود دارد.
        #
        # فقط عرضه‌های معتبر Marketplace وارد
        # موتور تطبیق می‌شوند.
        #
        # approved و published
        # ====================================================

        supplies = (
            Supply.objects
            .select_related(
                'seller',
            )
            .filter(
                status__in=[
                    'approved',
                    'published',
                ]
            )
            .exclude(
                seller=request.user
            )
            .order_by(
                '-created_at'
            )
        )

        # ====================================================
        # Matching
        # ====================================================

        results = match_need_with_supplies(
            need=need,
            supplies=supplies,
            limit=20,
            petrochemical_only=False,
        )

        # ====================================================
        # Save MatchResult
        # ====================================================

        match_objects = []

        for result in results:

            supply_id = result.get(
                'supply_id'
            )

            if not supply_id:
                continue

            match, created = (
                MatchResult.objects.update_or_create(
                    need=need,
                    supply_id=supply_id,
                    defaults={
                        'score': result.get(
                            'match_percentage',
                            0,
                        ),
                        'reason': result.get(
                            'match_reason',
                            '',
                        ),
                        'recommended_actions': (
                            '\n'.join(
                                result.get(
                                    'recommended_actions',
                                    [],
                                )
                            )
                        ),
                        'product': None,
                    },
                )
            )

            match_objects.append(
                match
            )

        # ====================================================
        # Serialize
        # ====================================================

        serializer = self.get_serializer(
            match_objects,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )