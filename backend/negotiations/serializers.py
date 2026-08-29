# negotiations/serializers.py
from rest_framework import serializers

from .models import Negotiation, Message
from .services.message_filter import (
    validate_negotiation_message,
)


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = Message

        fields = [
            'id',
            'negotiation',
            'sender',
            'sender_name',
            'text',
            'file',
            'file_name',
            'read_at',
            'parent',
            'timestamp',
        ]

        read_only_fields = [
            'id',
            'sender',
            'sender_name',
            'file_name',
            'timestamp',
        ]

    def validate_text(self, value):
        """
        منطق تشخیص اطلاعات تماس در این Serializer نیست.
        این متد فقط validator مرکزی موجود در
        services/message_filter.py را فراخوانی می‌کند.

        پیام بدون متن، مثلاً پیام فقط فایل، مجاز است.
        """

        if not value or not value.strip():
            return value

        result = validate_negotiation_message(value)

        if not result.allowed:
            raise serializers.ValidationError(
                result.reason
            )

        return value

    def get_sender_name(self, obj):
        return (
            obj.sender.get_full_name()
            or getattr(obj.sender, 'username', None)
            or str(obj.sender)
        )


class NegotiationSerializer(
    serializers.ModelSerializer
):
    messages = MessageSerializer(
        many=True,
        read_only=True,
    )

    buyer_name = serializers.SerializerMethodField()
    supplier_name = serializers.SerializerMethodField()
    supply_title = serializers.SerializerMethodField()

    # فقط برای سازگاری با بخش‌های قدیمی پروژه
    # موجودیت اصلی مذاکره همچنان Supply است.
    product = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Negotiation

        fields = [
            'id',

            'supply',
            'supply_title',

            'product',

            'buyer',
            'buyer_name',

            'supplier',
            'supplier_name',

            'status',

            'context_meta',
            'context_title',
            'expired_at',
            'is_active',

            'created_at',
            'updated_at',

            'messages',
        ]

        read_only_fields = [
            'id',

            'buyer',
            'buyer_name',

            'supplier',
            'supplier_name',

            'supply_title',

            'created_at',
            'updated_at',

            'messages',
        ]

    def get_buyer_name(self, obj):
        return (
            obj.buyer.get_full_name()
            or getattr(obj.buyer, 'username', None)
            or str(obj.buyer)
        )

    def get_supplier_name(self, obj):
        return (
            obj.supplier.get_full_name()
            or getattr(obj.supplier, 'username', None)
            or str(obj.supplier)
        )

    def get_supply_title(self, obj):
        if not obj.supply:
            return ''

        return obj.supply.title