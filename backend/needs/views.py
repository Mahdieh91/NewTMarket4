# ============================================================
# needs/views.py (نسخه نهایی)
# ============================================================
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Need
from .serializers import NeedSerializer

class NeedViewSet(viewsets.ModelViewSet):
    queryset = Need.objects.all()
    serializer_class = NeedSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [ 'status', 'confidentiality']
    search_fields = ['title', 'description', 'expected_outcome']
    ordering_fields = '__all__'

    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {'message': 'نیاز با موفقیت ثبت شد.', 'data': serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )