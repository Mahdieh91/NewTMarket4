
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import PlatformSettings, QualityControl
from .serializers import PlatformSettingsSerializer, QualityControlSerializer

class PlatformSettingsViewSet(viewsets.ModelViewSet):
    queryset = PlatformSettings.objects.all()
    serializer_class = PlatformSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['key', 'value']
    ordering_fields = '__all__'

class QualityControlViewSet(viewsets.ModelViewSet):
    queryset = QualityControl.objects.all()
    serializer_class = QualityControlSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['target_type']
    ordering_fields = '__all__'
