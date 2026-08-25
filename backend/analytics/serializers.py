# analytics/serializers.py
# Serializerهای تحلیل بازار بر اساس Product و Service (بدون Supply)

from rest_framework import serializers


class MarketSummarySerializer(serializers.Serializer):
    total_products = serializers.IntegerField()
    total_services = serializers.IntegerField()
    total_needs = serializers.IntegerField()
    published_products = serializers.IntegerField()
    average_price = serializers.FloatField(allow_null=True)
    average_trl = serializers.FloatField(allow_null=True)
    average_mrl = serializers.FloatField(allow_null=True)


class MarketCategorySerializer(serializers.Serializer):
    category = serializers.CharField()
    count = serializers.IntegerField()
    percentage = serializers.FloatField()


class MarketIndustrySerializer(serializers.Serializer):
    industry = serializers.CharField()
    count = serializers.IntegerField()
    percentage = serializers.FloatField()


class MarketTRLSerializer(serializers.Serializer):
    trl = serializers.IntegerField()
    count = serializers.IntegerField()
    percentage = serializers.FloatField()


class MarketMRLSerializer(serializers.Serializer):
    mrl = serializers.IntegerField()
    count = serializers.IntegerField()
    percentage = serializers.FloatField()


class MarketPriceSerializer(serializers.Serializer):
    min_price = serializers.FloatField(allow_null=True)
    max_price = serializers.FloatField(allow_null=True)
    average_price = serializers.FloatField(allow_null=True)
    median_price = serializers.FloatField(allow_null=True)


class MarketProviderSerializer(serializers.Serializer):
    provider = serializers.CharField()
    product_count = serializers.IntegerField()
    average_trl = serializers.FloatField(allow_null=True)
    average_mrl = serializers.FloatField(allow_null=True)


class MarketNeedSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    receiving_proposals = serializers.IntegerField()
    matched = serializers.IntegerField()
    evaluating = serializers.IntegerField()


class MarketIntelligenceSerializer(serializers.Serializer):
    filters = serializers.DictField()
    summary = MarketSummarySerializer()
    categories = MarketCategorySerializer(many=True)
    industries = MarketIndustrySerializer(many=True)
    trl_distribution = MarketTRLSerializer(many=True)
    mrl_distribution = MarketMRLSerializer(many=True)
    price = MarketPriceSerializer()
    providers = MarketProviderSerializer(many=True)
    needs = MarketNeedSerializer()
    insights = serializers.ListField(child=serializers.CharField())


class CompetitorSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    title = serializers.CharField()
    provider = serializers.CharField()
    category = serializers.CharField(allow_blank=True)
    industry = serializers.CharField(allow_null=True)
    trl = serializers.IntegerField(allow_null=True)
    mrl = serializers.IntegerField(allow_null=True)
    price = serializers.FloatField(allow_null=True)
    quality_score = serializers.FloatField(allow_null=True)
    risk_score = serializers.FloatField(allow_null=True)
    market_readiness_score = serializers.FloatField(allow_null=True)
    evaluation_count = serializers.IntegerField()
    competitive_score = serializers.FloatField()
    competitive_advantage = serializers.CharField(allow_blank=True)


class CompetitorSummarySerializer(serializers.Serializer):
    total_competitors = serializers.IntegerField()
    average_price = serializers.FloatField(allow_null=True)
    average_trl = serializers.FloatField(allow_null=True)
    average_mrl = serializers.FloatField(allow_null=True)
    average_quality = serializers.FloatField(allow_null=True)
    average_market_readiness = serializers.FloatField(allow_null=True)


class CompetitorAnalysisSerializer(serializers.Serializer):
    filters = serializers.DictField()
    summary = CompetitorSummarySerializer()
    competitors = CompetitorSerializer(many=True)
    insights = serializers.ListField(child=serializers.CharField())


class DashboardStatsSerializer(serializers.Serializer):
    totalProducts = serializers.IntegerField()
    activeNeeds = serializers.IntegerField()
    ongoingNegotiations = serializers.IntegerField()
    successfulDeals = serializers.IntegerField()


class DashboardDataSerializer(serializers.Serializer):
    stats = DashboardStatsSerializer()
    industryData = serializers.ListField(child=serializers.JSONField(), required=False, default=list)
    monthlyDeals = serializers.ListField(required=False, default=list)
    recentActivities = serializers.ListField(required=False, default=list)
    smartSuggestions = serializers.ListField(required=False, default=list)
    conversionFunnel = serializers.ListField(required=False, default=list)
    topSuppliers = serializers.ListField(required=False, default=list)
    negotiationInsights = serializers.ListField(required=False, default=list)