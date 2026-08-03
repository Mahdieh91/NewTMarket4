
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Execution
from .serializers import ExecutionSerializer

class ExecutionViewSet(viewsets.ModelViewSet):
    queryset = Execution.objects.all()
    serializer_class = ExecutionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['contract__terms']
    ordering_fields = '__all__'
