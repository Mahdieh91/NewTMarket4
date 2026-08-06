from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Message
from .serializers import MessageSerializer

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).exclude(is_archived=True)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        if message.receiver != request.user:
            return Response(
                {'error': 'شما مجاز به این کار نیستید.'},
                status=status.HTTP_403_FORBIDDEN
            )
        message.is_read = True
        message.save()
        return Response({'status': 'marked as read'})

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        message = self.get_object()
        if message.receiver != request.user:
            return Response(
                {'error': 'شما مجاز به این کار نیستید.'},
                status=status.HTTP_403_FORBIDDEN
            )
        message.is_archived = True
        message.save()
        return Response({'status': 'archived'})
