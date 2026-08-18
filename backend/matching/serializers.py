from rest_framework import serializers

from .models import MatchResult


class MatchResultSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(
        source='product.title',
        read_only=True
    )

    product_description = serializers.SerializerMethodField()

    provider = serializers.CharField(
        source='product.seller.username',
        read_only=True
    )

    product_price = serializers.DecimalField(
        source='product.price',
        max_digits=15,
        decimal_places=2,
        read_only=True,
        allow_null=True
    )

    product_trl = serializers.IntegerField(
        source='product.trl',
        read_only=True
    )

    product_mrl = serializers.IntegerField(
        source='product.mrl',
        read_only=True
    )

    product_industry = serializers.CharField(
        source='product.industry.name',
        read_only=True,
        allow_null=True
    )

    product_category = serializers.CharField(
        source='product.category',
        read_only=True
    )

    match_percentage = serializers.SerializerMethodField()

    class Meta:
        model = MatchResult
        fields = [
            'id',
            'need',
            'product',

            'product_title',
            'product_description',
            'provider',
            'product_price',
            'product_trl',
            'product_mrl',
            'product_industry',
            'product_category',

            'score',
            'match_percentage',
            'reason',
            'recommended_actions',
            'created_at',
        ]

    def get_product_description(self, obj):
        product = obj.product

        return (
            product.short_description
            or product.full_description
            or product.problem_solved
            or ''
        )

    def get_match_percentage(self, obj):
        return round(float(obj.score) * 100)