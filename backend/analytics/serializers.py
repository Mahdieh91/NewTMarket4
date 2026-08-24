from rest_framework import serializers


# ============================================================
# Market Intelligence
# ============================================================

class MarketIntelligenceSerializer(serializers.Serializer):

    market_overview = serializers.DictField()

    top_products = serializers.ListField()

    readiness_analysis = serializers.DictField()

    competitors = serializers.ListField()

    competitor_reasoning = serializers.CharField(
        allow_blank=True,
        required=False,
    )

    trends = serializers.ListField()

    needs = serializers.ListField(
        required=False,
        default=list,
    )

    recommendations = serializers.ListField()


# ============================================================
# Dashboard
# ============================================================

class DashboardStatsSerializer(serializers.Serializer):

    totalProducts = serializers.IntegerField()

    activeNeeds = serializers.IntegerField()

    ongoingNegotiations = serializers.IntegerField()

    successfulDeals = serializers.IntegerField()


class DashboardDataSerializer(serializers.Serializer):

    stats = DashboardStatsSerializer()

    industryData = serializers.ListField(
        child=serializers.JSONField(),
        required=False,
        default=list,
    )

    monthlyDeals = serializers.ListField(
        required=False,
        default=list,
    )

    recentActivities = serializers.ListField(
        required=False,
        default=list,
    )

    smartSuggestions = serializers.ListField(
        required=False,
        default=list,
    )

    conversionFunnel = serializers.ListField(
        required=False,
        default=list,
    )

    topSuppliers = serializers.ListField(
        required=False,
        default=list,
    )

    negotiationInsights = serializers.ListField(
        required=False,
        default=list,
    )