from django.db.models import Q
from django.db import transaction

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import (
    PermissionDenied,
    ValidationError,
)

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

        # -------------------------------------------------
        # supply canonical است.
        #
        # برای backward compatibility:
        # supply / supply_id / product
        # پذیرفته می‌شوند.
        # -------------------------------------------------

        supply_id = (
            request.data.get('supply')
            or request.data.get('supply_id')
            or request.data.get('product')
        )

        if not supply_id:
            return Response(
                {
                    'error':
                        'supply id required'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            supply = (
                Supply.objects
                .select_related('seller')
                .get(id=supply_id)
            )

        except Supply.DoesNotExist:
            return Response(
                {
                    'error':
                        'supply not found'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # -------------------------------------------------
        # جلوگیری از مذاکره با خود
        # -------------------------------------------------

        if request.user.id == supply.seller_id:
            return Response(
                {
                    'error':
                        'cannot negotiate with yourself'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------------------------------
        # مذاکره فعال موجود؟
        # -------------------------------------------------

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
                    context={
                        'request': request
                    },
                ).data,
                status=status.HTTP_200_OK,
            )

        # -------------------------------------------------
        # Create
        # -------------------------------------------------

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
                context={
                    'request': request
                },
            ).data,
            status=status.HTTP_201_CREATED,
        )


class MessageViewSet(viewsets.ModelViewSet):

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        return (
            Message.objects
            .filter(
                Q(
                    negotiation__buyer=user
                )
                |
                Q(
                    negotiation__supplier=user
                )
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

    def perform_create(self, serializer):

        negotiation = (
            serializer.validated_data[
                'negotiation'
            ]
        )

        user = self.request.user

        # -------------------------------------------------
        # Access
        # -------------------------------------------------

        if user.id not in {
            negotiation.buyer_id,
            negotiation.supplier_id,
        }:
            raise PermissionDenied(
                'شما عضو این مذاکره نیستید.'
            )

        # -------------------------------------------------
        # Closed negotiations
        # -------------------------------------------------

        if negotiation.status in {
            'rejected',
            'contracted',
        }:
            raise ValidationError({
                'negotiation':
                    'این مذاکره به پایان رسیده است.'
            })

        # -------------------------------------------------
        # File name
        # -------------------------------------------------

        uploaded_file = (
            self.request.FILES.get(
                'file'
            )
        )

        file_name = (
            uploaded_file.name
            if uploaded_file
            else None
        )

        serializer.save(
            sender=user,
            file_name=file_name,
        )

        # -------------------------------------------------
        # First message
        # -------------------------------------------------

        if negotiation.status == 'created':
            negotiation.status = 'in_progress'

            negotiation.save(
                update_fields=[
                    'status',
                    'updated_at',
                ]
            )