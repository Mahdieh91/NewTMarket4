# ============================================================
# negotiations/views.py
# ============================================================
# اصلاح‌شده برای پشتیبانی از Product و Supply
# ============================================================

from django.db.models import Q
from django.db import transaction

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import (
    PermissionDenied,
    ValidationError,
)

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Negotiation, Message
from .serializers import (
    NegotiationSerializer,
    MessageSerializer,
)

from products.models import Supply


class NegotiationViewSet(viewsets.ModelViewSet):

    serializer_class = NegotiationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            Negotiation.objects
            .filter(
                Q(buyer=user) |
                Q(supplier=user)
            )
            .select_related(
                'supply',
                'buyer',
                'supplier',
            )
            .prefetch_related(
                'messages__sender'
            )
            .order_by(
                '-updated_at'
            )
        )

    @transaction.atomic
    def create(self, request):
        """
        ایجاد مذاکره با پشتیبانی از Product و Supply
        """
        # ===== دریافت شناسه از درخواست =====
        supply_id = (
            request.data.get('supply') or
            request.data.get('supply_id') or
            request.data.get('product')   # ← پشتیبانی از product
        )

        if not supply_id:
            return Response(
                {
                    'error': 'شناسه محصول یا عرضه الزامی است.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # ===== جستجوی Supply با شناسه =====
            supply = (
                Supply.objects
                .select_related('seller')
                .get(id=supply_id)
            )
        except Supply.DoesNotExist:
            return Response(
                {
                    'error': 'محصول یا عرضه موردنظر یافت نشد.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ===== بررسی اینکه کاربر خودش نباشد =====
        if request.user.id == supply.seller_id:
            return Response(
                {
                    'error': 'شما نمی‌توانید با خودتان مذاکره کنید.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ===== بررسی مذاکره فعال قبلی =====
        existing = (
            Negotiation.objects
            .filter(
                supply=supply,
                buyer=request.user,
                supplier=supply.seller,
                is_active=True,
            )
            .exclude(
                status='rejected'
            )
            .first()
        )

        if existing:
            return Response(
                NegotiationSerializer(
                    existing,
                    context={'request': request},
                ).data,
                status=status.HTTP_200_OK,
            )

        # ===== ایجاد مذاکره جدید =====
        negotiation = Negotiation.objects.create(
            supply=supply,
            buyer=request.user,
            supplier=supply.seller,
            status='created',
            context_meta={
                'supply_id': supply.id,
            },
            context_title=supply.title,
            is_active=True,
        )

        return Response(
            NegotiationSerializer(
                negotiation,
                context={'request': request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'negotiation_{instance.id}',
            {
                'type': 'status_updated',
                'status': instance.status,
            }
        )


class MessageViewSet(viewsets.ModelViewSet):

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = (
            Message.objects
            .filter(
                Q(negotiation__buyer=user) |
                Q(negotiation__supplier=user)
            )
            .select_related(
                'negotiation',
                'sender',
            )
            .order_by(
                'timestamp',
                'id',
            )
        )

        negotiation_id = self.request.query_params.get('negotiation')
        if negotiation_id:
            queryset = queryset.filter(negotiation_id=negotiation_id)

        return queryset

    def perform_create(self, serializer):
        negotiation = serializer.validated_data['negotiation']
        user = self.request.user

        if user.id not in {negotiation.buyer_id, negotiation.supplier_id}:
            raise PermissionDenied('شما عضو این مذاکره نیستید.')

        if negotiation.status in {'rejected', 'contracted'}:
            raise ValidationError({
                'negotiation': 'این مذاکره به پایان رسیده است.'
            })

        uploaded_file = self.request.FILES.get('file')
        file_name = uploaded_file.name if uploaded_file else None

        serializer.save(
            sender=user,
            file_name=file_name,
        )

        if negotiation.status == 'created':
            negotiation.status = 'in_progress'
            negotiation.save(update_fields=['status', 'updated_at'])

        # Broadcast
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'negotiation_{negotiation.id}',
            {
                'type': 'status_updated',
                'status': negotiation.status,
            }
        )