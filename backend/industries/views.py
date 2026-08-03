
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import IndustryCategory
from .serializers import IndustryCategorySerializer

class IndustryCategoryViewSet(viewsets.ModelViewSet):
    queryset = IndustryCategory.objects.all()
    serializer_class = IndustryCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['parent']
    search_fields = ['name', 'keywords', 'description']
