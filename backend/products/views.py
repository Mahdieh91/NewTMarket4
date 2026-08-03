# products/views.py
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Supply
from .serializers import ProductSerializer, SupplySerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['industry', 'status', 'trl', 'mrl', 'category']
    search_fields = ['title', 'short_description', 'full_description', 'problem_solved']
    ordering_fields = '__all__'


class SupplyViewSet(viewsets.ModelViewSet):
    queryset = Supply.objects.all()
    serializer_class = SupplySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category', 'industry']
    search_fields = ['title', 'description']
    ordering_fields = '__all__'

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def create(self, request, *args, **kwargs):
        # برای پشتیبانی از آپلود چند تصویر با کلید 'uploaded_images'
        # اگر از فرمت form-data استفاده می‌شود، داده‌ها را به‌درستی پردازش می‌کنیم
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)