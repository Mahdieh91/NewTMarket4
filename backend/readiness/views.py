
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import MarketReadiness
from .serializers import MarketReadinessSerializer

class MarketReadinessViewSet(viewsets.ModelViewSet):
    queryset = MarketReadiness.objects.all()
    serializer_class = MarketReadinessSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__title']
    ordering_fields = '__all__'
