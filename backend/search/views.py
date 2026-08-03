
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from products.models import Product
from needs.models import Need
from products.serializers import ProductSerializer
from needs.serializers import NeedSerializer

class SearchViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def all(self, request):
        query = request.query_params.get('q', '')
        industry = request.query_params.get('industry', '')
        status = request.query_params.get('status', '')
        
        products = Product.objects.all()
        needs = Need.objects.all()
        
        if query:
            products = products.filter(title__icontains=query) | products.filter(short_description__icontains=query)
            needs = needs.filter(title__icontains=query) | needs.filter(description__icontains=query)
        
        if industry:
            products = products.filter(industry__name=industry)
            needs = needs.filter(industry__name=industry)
        
        if status:
            products = products.filter(status=status)
            needs = needs.filter(status=status)
        
        product_serializer = ProductSerializer(products[:50], many=True)
        need_serializer = NeedSerializer(needs[:50], many=True)
        
        return Response({
            'products': product_serializer.data,
            'needs': need_serializer.data,
            'counts': {
                'products': products.count(),
                'needs': needs.count()
            }
        })
