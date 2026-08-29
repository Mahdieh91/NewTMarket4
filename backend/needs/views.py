# ============================================================
# needs/views.py
# ============================================================

from rest_framework import (
    viewsets,
    permissions,
    filters,
    status,
)

from rest_framework.response import Response
from rest_framework.decorators import action

from django_filters.rest_framework import DjangoFilterBackend

from .models import Need
from .serializers import NeedSerializer


class NeedViewSet(viewsets.ModelViewSet):

    queryset = Need.objects.select_related(
        'buyer',
        'industry',
    ).all()

    serializer_class = NeedSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    http_method_names = [
        'get',
        'post',
        'put',
        'patch',
        'delete',
        'head',
        'options',
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        'status',
        'confidentiality',
        'industry',
    ]

    search_fields = [
        'title',
        'description',
        'expected_outcome',
    ]

    ordering_fields = '__all__'

    ordering = [
        '-created_at'
    ]

    # ========================================================
    # ایجاد نیاز
    # ========================================================

    def perform_create(self, serializer):

        serializer.save(
            buyer=self.request.user,
            status='draft'
        )

    # ========================================================
    # POST /api/needs/
    # ========================================================

    def create(
        self,
        request,
        *args,
        **kwargs
    ):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        self.perform_create(
            serializer
        )

        headers = self.get_success_headers(
            serializer.data
        )

        return Response(
            {
                'message': 'نیاز با موفقیت ثبت شد و در انتظار انتشار است.',
                'data': serializer.data,
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    # ========================================================
    # تغییر وضعیت
    #
    # POST /api/needs/<id>/change-status/
    # ========================================================

    @action(
        detail=True,
        methods=['post'],
        url_path='change-status'
    )
    def change_status(
        self,
        request,
        pk=None
    ):

        need = self.get_object()

        new_status = request.data.get(
            'status'
        )

        # ----------------------------------------------------
        # اعتبارسنجی
        # ----------------------------------------------------

        valid_statuses = dict(
            Need.STATUS_CHOICES
        )

        if new_status not in valid_statuses:

            return Response(
                {
                    'error': 'وضعیت نامعتبر است.',
                    'valid_statuses': list(
                        valid_statuses.keys()
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # دسترسی
        # ----------------------------------------------------

        if (
            need.buyer != request.user
            and not request.user.is_staff
        ):

            return Response(
                {
                    'error': (
                        'شما اجازه تغییر وضعیت '
                        'این نیاز را ندارید.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # ----------------------------------------------------
        # تغییر وضعیت
        # ----------------------------------------------------

        old_status = need.status

        need.status = new_status

        need.save(
            update_fields=[
                'status',
                'updated_at',
            ]
        )

        # ----------------------------------------------------
        # پاسخ
        # ----------------------------------------------------

        serializer = self.get_serializer(
            need
        )

        return Response(
            {
                'message': (
                    f'وضعیت نیاز از '
                    f'{valid_statuses.get(old_status, old_status)} '
                    f'به '
                    f'{valid_statuses.get(new_status, new_status)} '
                    f'تغییر کرد.'
                ),
                'data': serializer.data,
            },
            status=status.HTTP_200_OK
        )