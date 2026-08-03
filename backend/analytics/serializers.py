
from rest_framework import serializers
from .models import MarketTrend, KPI

class MarketTrendSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketTrend
        fields = '__all__'

class KPISerializer(serializers.ModelSerializer):
    class Meta:
        model = KPI
        fields = '__all__'
