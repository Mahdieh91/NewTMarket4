
from rest_framework import serializers
from .models import MarketReadiness

class MarketReadinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketReadiness
        fields = '__all__'
