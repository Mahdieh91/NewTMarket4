# products/views.py

from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import Product, Supply, Favorite
from .serializers import ProductSerializer, SupplySerializer, FavoriteSerializer, FavoriteToggleSerializer


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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category', 'industry']
    search_fields = ['title', 'description']
    ordering_fields = '__all__'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'], url_path='increment-view')
    def increment_view(self, request, pk=None):
        supply = self.get_object()
        supply.view_count = (supply.view_count or 0) + 1
        supply.save(update_fields=['view_count'])
        return Response({'view_count': supply.view_count})


class FavoriteViewSet(viewsets.ModelViewSet):
    """
    ViewSet برای مدیریت علاقه‌مندی‌ها با رفتار Toggle:
    - POST /api/favorites/ با { "supply": 1 } یا { "product": 1 }
      اگر وجود داشت → حذف می‌کند (is_favorite: false)
      اگر وجود نداشت → ایجاد می‌کند (is_favorite: true)
    """
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = request.data.get('product')
        supply_id = request.data.get('supply')

        # بررسی وجود مورد
        if product_id:
            # اطمینان از وجود محصول
            get_object_or_404(Product, id=product_id)
            existing = Favorite.objects.filter(user=request.user, product_id=product_id).first()
            if existing:
                # اگر قبلاً وجود داشت، حذفش کن (Toggle)
                existing.delete()
                return Response(
                    {
                        'detail': 'از علاقه‌مندی‌ها حذف شد',
                        'is_favorite': False
                    },
                    status=status.HTTP_200_OK
                )

        elif supply_id:
            # اطمینان از وجود عرضه
            get_object_or_404(Supply, id=supply_id)
            existing = Favorite.objects.filter(user=request.user, supply_id=supply_id).first()
            if existing:
                # اگر قبلاً وجود داشت، حذفش کن (Toggle)
                existing.delete()
                return Response(
                    {
                        'detail': 'از علاقه‌مندی‌ها حذف شد',
                        'is_favorite': False
                    },
                    status=status.HTTP_200_OK
                )

        else:
            return Response(
                {'detail': 'ورودی نامعتبر. باید product یا supply ارسال شود.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ایجاد جدید
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'detail': 'به علاقه‌مندی‌ها اضافه شد',
                'data': serializer.data,
                'is_favorite': True
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {
                'detail': 'از علاقه‌مندی‌ها حذف شد',
                'is_favorite': False
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='toggle')
    def toggle(self, request):
        """
        اکشن جداگانه برای Toggle (اگر فرانت‌اند بخواهد مستقیماً از آن استفاده کند)
        ورودی: { "product_id": 1 } یا { "supply_id": 1 }
        """
        serializer = FavoriteToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data.get('product_id')
        supply_id = serializer.validated_data.get('supply_id')

        if product_id:
            get_object_or_404(Product, id=product_id)
            favorite = Favorite.objects.filter(user=request.user, product_id=product_id).first()
            if favorite:
                favorite.delete()
                return Response({'is_favorite': False, 'detail': 'از علاقه‌مندی‌ها حذف شد'})
            else:
                new = Favorite.objects.create(user=request.user, product_id=product_id)
                return Response({'is_favorite': True, 'detail': 'به علاقه‌مندی‌ها اضافه شد', 'id': new.id})

        elif supply_id:
            get_object_or_404(Supply, id=supply_id)
            favorite = Favorite.objects.filter(user=request.user, supply_id=supply_id).first()
            if favorite:
                favorite.delete()
                return Response({'is_favorite': False, 'detail': 'از علاقه‌مندی‌ها حذف شد'})
            else:
                new = Favorite.objects.create(user=request.user, supply_id=supply_id)
                return Response({'is_favorite': True, 'detail': 'به علاقه‌مندی‌ها اضافه شد', 'id': new.id})

        return Response({'detail': 'درخواست نامعتبر'}, status=status.HTTP_400_BAD_REQUEST)