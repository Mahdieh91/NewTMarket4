# analytics/serializers.py

from rest_framework import serializers

from .models import MarketTrend, KPI


# ============================================================
# Market Trend
# ============================================================

class MarketTrendSerializer(serializers.ModelSerializer):

    class Meta:
        model = MarketTrend
        fields = "__all__"


# ============================================================
# KPI
# ============================================================

class KPISerializer(serializers.ModelSerializer):

    class Meta:
        model = KPI
        fields = "__all__"


# ============================================================
# Dashboard
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

    user = serializers.CharField(
        allow_blank=True
    )

    time = serializers.CharField(
        allow_blank=True
    )


class DashboardSuggestionSerializer(serializers.Serializer):

    title = serializers.CharField()

    match = serializers.IntegerField(
        min_value=0,
        max_value=100
    )

    reason = serializers.CharField()


class DashboardFunnelSerializer(serializers.Serializer):

    label = serializers.CharField()

    value = serializers.IntegerField(
        min_value=0
    )

    percent = serializers.IntegerField(
        min_value=0,
        max_value=100
    )


class DashboardSupplierSerializer(serializers.Serializer):

    name = serializers.CharField()

    score = serializers.FloatField(
        min_value=0
    )

    deals = serializers.IntegerField(
        min_value=0
    )


class DashboardNegotiationInsightSerializer(serializers.Serializer):

    label = serializers.CharField()

    value = serializers.IntegerField(
        min_value=0
    )

    percent = serializers.IntegerField(
        min_value=0,
        max_value=100
    )


# ============================================================
# Main Dashboard serializer
# ============================================================

class DashboardSerializer(serializers.Serializer):

    stats = DashboardStatsSerializer()

    # حفظ برای backward compatibility
    industryData = DashboardIndustrySerializer(
        many=True
    )

    monthlyDeals = DashboardMonthlyDealSerializer(
        many=True
    )

    recentActivities = DashboardActivitySerializer(
        many=True
    )

    smartSuggestions = DashboardSuggestionSerializer(
        many=True
    )

    conversionFunnel = DashboardFunnelSerializer(
        many=True
    )

    topSuppliers = DashboardSupplierSerializer(
        many=True
    )

    negotiationInsights = DashboardNegotiationInsightSerializer(
        many=True
    )