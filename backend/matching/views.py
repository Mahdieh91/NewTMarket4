
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import MatchResult
from .serializers import MatchResultSerializer
from needs.models import Need
from products.models import Product
from .utils import SmartMatcher

class MatchResultViewSet(viewsets.ModelViewSet):
    queryset = MatchResult.objects.all()
    serializer_class = MatchResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['need', 'product']
    search_fields = ['need__title', 'product__title']
    ordering_fields = '__all__'

    @action(detail=False, methods=['post'])
    def run_matching(self, request):
        need_id = request.data.get('need_id')
        if not need_id:
            return Response({'error': 'need_id is required'}, status=400)
        try:
            need = Need.objects.get(id=need_id)
            results = SmartMatcher.match_need_to_products(need_id)
            return Response({'need': need.title, 'results': results[:20]}, status=200)
        except Need.DoesNotExist:
            return Response({'error': 'Need not found'}, status=404)
