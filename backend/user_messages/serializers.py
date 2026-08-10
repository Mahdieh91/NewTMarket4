from rest_framework import serializers

from .models import Message
from users.serializers import UserBasicSerializer


class MessageSerializer(serializers.ModelSerializer):

    sender_detail = UserBasicSerializer(
        source="sender",
        read_only=True
    )

    receiver_detail = UserBasicSerializer(
        source="receiver",
        read_only=True
    )

    is_sent = serializers.SerializerMethodField()
    is_received = serializers.SerializerMethodField()

    class Meta:
        model = Message

        fields = [
            "id",
            "sender",
            "sender_detail",
            "receiver",
            "receiver_detail",
            "subject",
            "content",
            "is_read",
            "is_archived",
            "is_sent",
            "is_received",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "sender",
            "sender_detail",
            "receiver_detail",
            "is_sent",
            "is_received",
            "is_read",
            "is_archived",
            "created_at",
            "updated_at",
        ]

    def get_is_sent(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return False

        return obj.sender_id == request.user.id

    def get_is_received(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return False

        return obj.receiver_id == request.user.id