from rest_framework import serializers
from .models import Message
from users.serializers import UserBasicSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender_detail = UserBasicSerializer(source='sender', read_only=True)
    receiver_detail = UserBasicSerializer(source='receiver', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'receiver', 'subject', 'content',
            'is_read', 'is_archived', 'created_at', 'updated_at',
            'sender_detail', 'receiver_detail'
        ]
        read_only_fields = ['sender', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)
