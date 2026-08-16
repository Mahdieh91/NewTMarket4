from rest_framework import serializers
from .models import Negotiation, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['sender', 'timestamp']


class NegotiationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Negotiation
        fields = ['id', 'product', 'buyer', 'supplier', 'status', 'created_at', 'updated_at', 'messages']
        read_only_fields = ['buyer', 'supplier', 'created_at', 'updated_at']