# backend/execution/views.py

from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import Execution
from .serializers import ExecutionSerializer


class ExecutionViewSet(viewsets.ModelViewSet):
    queryset = Execution.objects.select_related(
        'contract',
        'contract__buyer',
        'contract__supplier',
    ).prefetch_related(
        'contract__milestones',
    ).all()

    serializer_class = ExecutionSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        'status',
        'contract',
    ]

    search_fields = [
        'contract__terms',
    ]

    ordering_fields = '__all__'

    ordering = [
        '-created_at',
    ]

    def get_queryset(self):
        """
        فقط Executionهایی را برمی‌گرداند که کاربر فعلی
        در قرارداد مربوط به آن‌ها خریدار یا فروشنده است.

        این محدودیت باعث می‌شود اطلاعات قراردادهای سایر
        کاربران از طریق API قابل مشاهده نباشد.
        """

        user = self.request.user

        return (
            Execution.objects
            .select_related(
                'contract',
                'contract__buyer',
                'contract__supplier',
            )
            .prefetch_related(
                'contract__milestones',
            )
            .filter(
                contract__buyer=user
            )
            |
            Execution.objects
            .select_related(
                'contract',
                'contract__buyer',
                'contract__supplier',
            )
            .prefetch_related(
                'contract__milestones',
            )
            .filter(
                contract__supplier=user
            )
        ).distinct()