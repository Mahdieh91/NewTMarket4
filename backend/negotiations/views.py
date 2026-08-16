from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Negotiation, Message
from .serializers import NegotiationSerializer, MessageSerializer
from products.models import Product

class NegotiationViewSet(viewsets.ModelViewSet):
    queryset = Negotiation.objects.all()
    serializer_class = NegotiationSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request):
        product_id = request.data.get('product')
        if not product_id:
            return Response({'error': 'product id required'}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'product not found'}, status=404)

        if request.user == product.seller:
            return Response({'error': 'cannot negotiate with yourself'}, status=400)

        negotiation = Negotiation.objects.create(
            product=product,
            buyer=request.user,
            supplier=product.seller,
            status='created'
        )
        return Response(NegotiationSerializer(negotiation).data, status=201)


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)