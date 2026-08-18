from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import MatchResult
from .serializers import MatchResultSerializer


class MatchResultViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MatchResultSerializer
    permission_classes = [IsAuthenticated]

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
            )
            .order_by('-score', '-created_at')
        )