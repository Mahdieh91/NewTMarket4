
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Need
from .serializers import NeedSerializer

class NeedViewSet(viewsets.ModelViewSet):
    queryset = Need.objects.all()
    serializer_class = NeedSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['industry', 'status', 'confidentiality']
    search_fields = ['title', 'description', 'expected_outcome']
    ordering_fields = '__all__'
