# analytics/serializers.py
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


# ============================================================
# سریالایزرهای اختصاصی پاسخ داشبورد
# ============================================================

class DashboardStatsSerializer(serializers.Serializer):
    totalProducts = serializers.IntegerField()
    activeNeeds = serializers.IntegerField()
    ongoingNegotiations = serializers.IntegerField()
    successfulDeals = serializers.IntegerField()


class DashboardIndustrySerializer(serializers.Serializer):
    name = serializers.CharField()
    value = serializers.IntegerField()


class DashboardMonthlyDealSerializer(serializers.Serializer):
    month = serializers.CharField()
    deals = serializers.IntegerField()


class DashboardActivitySerializer(serializers.Serializer):
    id = serializers.CharField()
    type = serializers.CharField()
    title = serializers.CharField()
    user = serializers.CharField()
    time = serializers.CharField()


class DashboardSuggestionSerializer(serializers.Serializer):
    title = serializers.CharField()
    match = serializers.IntegerField()
    reason = serializers.CharField()


class DashboardFunnelSerializer(serializers.Serializer):
    label = serializers.CharField()
    value = serializers.IntegerField()
    percent = serializers.IntegerField()


class DashboardSupplierSerializer(serializers.Serializer):
    name = serializers.CharField()
    score = serializers.FloatField()
    deals = serializers.IntegerField()


class DashboardSerializer(serializers.Serializer):
    stats = DashboardStatsSerializer()
    industryData = DashboardIndustrySerializer(many=True)
    monthlyDeals = DashboardMonthlyDealSerializer(many=True)
    recentActivities = DashboardActivitySerializer(many=True)
    smartSuggestions = DashboardSuggestionSerializer(many=True)
    conversionFunnel = DashboardFunnelSerializer(many=True)
    topSuppliers = DashboardSupplierSerializer(many=True)