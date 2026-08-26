# analytics/serializers.py
# نسخه نهایی با تمام فیلدهای مورد نیاز CompetitorAnalysisSerializer

from rest_framework import serializers


# ============================================================
# Serializerهای Market Intelligence
# ============================================================

class TrendPointSerializer(serializers.Serializer):
    month = serializers.CharField()
    تقاضا = serializers.IntegerField()
    عرضه = serializers.IntegerField()
    معاملات = serializers.IntegerField()


class TopProductSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    title = serializers.CharField()
    seller_name = serializers.CharField()
    industry = serializers.CharField(allow_null=True)
    category = serializers.CharField()
    trl = serializers.IntegerField(allow_null=True)
    mrl = serializers.IntegerField(allow_null=True)
    quality_indicator = serializers.FloatField()
    market_readiness = serializers.FloatField()
    view_count = serializers.IntegerField()
    created_at = serializers.CharField(allow_null=True)


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
    trends = TrendPointSerializer(many=True, required=False, default=list)
    top_products = TopProductSerializer(many=True, required=False, default=list)


# ============================================================
# Serializerهای تحلیل رقبا (با تمام فیلدهای مورد نیاز)
# ============================================================

class CompetitorMatchStatsSerializer(serializers.Serializer):
    total_matches = serializers.IntegerField()
    average_match_percentage = serializers.FloatField()
    high_match_count = serializers.IntegerField()
    high_match_rate = serializers.FloatField()
    unique_needs = serializers.IntegerField()
    products_with_matches = serializers.IntegerField()


class CompetitorProductSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    category = serializers.CharField()
    trl = serializers.IntegerField(allow_null=True)
    mrl = serializers.IntegerField(allow_null=True)
    price = serializers.FloatField(allow_null=True)
    status = serializers.CharField()  # این فیلد باید حتماً وجود داشته باشد
    view_count = serializers.IntegerField()
    quality_indicator = serializers.FloatField()
    market_readiness = serializers.FloatField()


class CompetitorItemSerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    seller_id = serializers.IntegerField()
    seller_name = serializers.CharField()
    product_count = serializers.IntegerField()
    is_direct = serializers.BooleanField()
    direct_product_count = serializers.IntegerField()
    competitive_score = serializers.FloatField()
    score_details = serializers.DictField()
    market_fit_score = serializers.FloatField()
    quality_score = serializers.FloatField()
    quality_confidence = serializers.FloatField()
    market_readiness_score = serializers.FloatField()
    maturity_score = serializers.FloatField()
    average_trl = serializers.FloatField()
    average_mrl = serializers.FloatField()
    price_position = serializers.FloatField()
    price_comparison = serializers.CharField()
    company_avg_price = serializers.FloatField(allow_null=True)
    market_avg_price = serializers.FloatField(allow_null=True)
    match_stats = CompetitorMatchStatsSerializer()
    top_products = CompetitorProductSummarySerializer(many=True)


class CompetitorSummarySerializer(serializers.Serializer):
    total_competitors = serializers.IntegerField()
    direct_count = serializers.IntegerField()
    indirect_count = serializers.IntegerField()
    average_competitive_score = serializers.FloatField()
    top_competitor = serializers.CharField(allow_null=True)
    target_rank = serializers.IntegerField(allow_null=True)


class TargetProductSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    seller = serializers.CharField()
    industry = serializers.CharField(allow_null=True)
    category = serializers.CharField()
    trl = serializers.IntegerField(allow_null=True)
    mrl = serializers.IntegerField(allow_null=True)
    price = serializers.FloatField(allow_null=True)
    market_readiness = serializers.FloatField()
    quality_score = serializers.FloatField()
    evaluation_count = serializers.IntegerField()
    market_fit_score = serializers.FloatField()
    maturity_score = serializers.FloatField()


class GapItemSerializer(serializers.Serializer):
    metric = serializers.CharField()
    target = serializers.FloatField()
    average = serializers.FloatField()
    gap = serializers.FloatField()
    is_advantage = serializers.BooleanField()


class LLMAnalysisSerializer(serializers.Serializer):
    top_competitor = serializers.CharField(allow_null=True, required=False)
    strengths = serializers.ListField(child=serializers.CharField(), required=False)
    weaknesses = serializers.ListField(child=serializers.CharField(), required=False)
    opportunities = serializers.ListField(child=serializers.CharField(), required=False)
    threats = serializers.ListField(child=serializers.CharField(), required=False)
    competitive_advantage = serializers.CharField(allow_null=True, required=False)
    summary = serializers.CharField(allow_null=True, required=False)


class CompetitorAnalysisSerializer(serializers.Serializer):
    filters = serializers.DictField()
    target_product = TargetProductSerializer(allow_null=True)
    competitors = CompetitorItemSerializer(many=True)
    summary = CompetitorSummarySerializer()
    gap_analysis = GapItemSerializer(many=True)
    llm_analysis = LLMAnalysisSerializer(required=False, default=dict)
    insights = serializers.ListField(child=serializers.CharField())


# ============================================================
# Serializerهای Dashboard
# ============================================================

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