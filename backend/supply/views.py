from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Supply
from .serializers import SupplySerializer


class SupplyViewSet(viewsets.ModelViewSet):
    """
    ViewSet برای مدیریت عرضه‌ها (Supply)

    - مشاهده لیست و جزئیات: عمومی (بدون نیاز به لاگین)
    - ایجاد، ویرایش، حذف: فقط کاربر احراز هویت‌شده
    - فروشنده (seller) به‌صورت خودکار از کاربر جاری گرفته می‌شود
    """
    queryset = Supply.objects.all()
    serializer_class = SupplySerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        'supply_type',   # product / service
        'status',
        'category',
        'industry',
        'city',
    ]

    search_fields = [
        'title',
        'description',
    ]

    ordering_fields = [
        'price',
        'created_at',
        'updated_at',
    ]

    def get_permissions(self):
        """
        - لیست و جزئیات: عمومی (AllowAny)
        - سایر عملیات: نیاز به احراز هویت (IsAuthenticated)
        """
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        """
        فروشنده (seller) به‌صورت خودکار از کاربر جاری گرفته می‌شود.
        """
        serializer.save(seller=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        ایجاد عرضه جدید با پشتیبانی از multipart/form-data
        و تصاویر (در صورت وجود)
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )