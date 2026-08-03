
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Negotiation, Message
from .serializers import NegotiationSerializer, MessageSerializer

class NegotiationViewSet(viewsets.ModelViewSet):
    queryset = Negotiation.objects.all()
    serializer_class = NegotiationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['need__title', 'product__title']
    ordering_fields = '__all__'

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sender']
    search_fields = ['text']
    ordering_fields = '__all__'
