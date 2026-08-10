from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Message
from .serializers import MessageSerializer


class MessageViewSet(viewsets.ModelViewSet):
    """
    مدیریت پیام‌های کاربر:
    - دریافت پیام‌ها
    - ارسال پیام‌ها
    - خوانده‌شدن
    - بایگانی
    """

    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        return (
            Message.objects
            .filter(
                Q(sender=user) | Q(receiver=user)
            )
            .exclude(is_archived=True)
            .select_related("sender", "receiver")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(
        detail=True,
        methods=["post"],
        url_path="mark_read",
        url_name="mark_read",
    )
    def mark_read(self, request, pk=None):
        """
        فقط گیرنده پیام می‌تواند آن را خوانده‌شده کند.
        """

        try:
            message = self.get_object()
        except Message.DoesNotExist:
            return Response(
                {
                    "detail": "پیام موردنظر پیدا نشد."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # فقط گیرنده
        if message.receiver_id != request.user.id:
            return Response(
                {
                    "detail": "شما گیرنده این پیام نیستید و اجازه خوانده‌شدن آن را ندارید.",
                    "message_id": message.id,
                    "receiver_id": message.receiver_id,
                    "current_user_id": request.user.id,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # اگر قبلاً خوانده شده، باز هم موفق محسوب می‌شود
        if not message.is_read:
            message.is_read = True
            message.save(
                update_fields=["is_read", "updated_at"]
            )

        return Response(
            {
                "success": True,
                "message_id": message.id,
                "is_read": True,
                "detail": "پیام با موفقیت خوانده‌شده علامت‌گذاری شد.",
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="archive",
        url_name="archive",
    )
    def archive(self, request, pk=None):
        """
        فقط گیرنده پیام می‌تواند آن را بایگانی کند.
        """

        try:
            message = self.get_object()
        except Message.DoesNotExist:
            return Response(
                {
                    "detail": "پیام موردنظر پیدا نشد."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if message.receiver_id != request.user.id:
            return Response(
                {
                    "detail": "شما گیرنده این پیام نیستید و اجازه بایگانی آن را ندارید."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        message.is_archived = True

        message.save(
            update_fields=["is_archived", "updated_at"]
        )

        return Response(
            {
                "success": True,
                "message_id": message.id,
                "is_archived": True,
                "detail": "پیام با موفقیت بایگانی شد.",
            },
            status=status.HTTP_200_OK,
        )