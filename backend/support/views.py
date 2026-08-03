
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Ticket, TicketMessage
from .serializers import TicketSerializer, TicketMessageSerializer

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority']
    search_fields = ['subject', 'description']
    ordering_fields = '__all__'

class TicketMessageViewSet(viewsets.ModelViewSet):
    queryset = TicketMessage.objects.all()
    serializer_class = TicketMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sender']
    search_fields = ['text']
    ordering_fields = '__all__'
