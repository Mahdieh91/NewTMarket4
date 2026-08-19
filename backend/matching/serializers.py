from rest_framework import serializers

from .models import MatchResult


class MatchResultSerializer(serializers.ModelSerializer):

    # ========================================================
    # Product
    # ========================================================

    product_title = serializers.SerializerMethodField()

    product_description = serializers.SerializerMethodField()

    product_price = serializers.SerializerMethodField()

    product_trl = serializers.SerializerMethodField()

    product_mrl = serializers.SerializerMethodField()

    product_industry = serializers.SerializerMethodField()

    product_category = serializers.SerializerMethodField()

    # ========================================================
    # Supply
    # ========================================================

    supply_title = serializers.SerializerMethodField()

    supply_description = serializers.SerializerMethodField()

    supply_price = serializers.SerializerMethodField()

    supply_trl = serializers.SerializerMethodField()

    supply_industry = serializers.SerializerMethodField()

    supply_category = serializers.SerializerMethodField()

    # ========================================================
    # Provider
    # ========================================================

    provider = serializers.SerializerMethodField()

    # ========================================================
    # Unified score
    # ========================================================

    match_percentage = serializers.FloatField(
        source='score',
        read_only=True,
    )

    class Meta:
        model = MatchResult

        fields = [
            'id',
            'need',

            # Legacy Product
            'product',
            'product_title',
            'product_description',
            'product_price',
            'product_trl',
            'product_mrl',
            'product_industry',
            'product_category',

            # Current Supply
            'supply',
            'supply_title',
            'supply_description',
            'supply_price',
            'supply_trl',
            'supply_industry',
            'supply_category',

            # Common
            'provider',
            'score',
            'match_percentage',
            'reason',
            'recommended_actions',
            'created_at',
        ]

        read_only_fields = fields

    # ========================================================
    # Target helpers
    # ========================================================

    def _target(self, obj):
        if obj.supply is not None:
            return obj.supply

        if obj.product is not None:
            return obj.product

        return None

    # ========================================================
    # Product
    # ========================================================

    def get_product_title(self, obj):
        if obj.product:
            return obj.product.title

        return None

    def get_product_description(self, obj):
        if obj.product:
            return (
                obj.product.full_description
                or obj.product.short_description
                or obj.product.problem_solved
                or ''
            )

        return None

    def get_product_price(self, obj):
        if obj.product:
            return obj.product.price

        return None

    def get_product_trl(self, obj):
        if obj.product:
            return obj.product.trl

        return None

    def get_product_mrl(self, obj):
        if obj.product:
            return obj.product.mrl

        return None

    def get_product_industry(self, obj):
        if obj.product and obj.product.industry:
            return obj.product.industry.name

        return None

    def get_product_category(self, obj):
        if obj.product:
            return obj.product.category

        return None

    # ========================================================
    # Supply
    # ========================================================

    def get_supply_title(self, obj):
        if obj.supply:
            return obj.supply.title

        return None

    def get_supply_description(self, obj):
        if obj.supply:
            return obj.supply.description

        return None

    def get_supply_price(self, obj):
        if obj.supply:
            return obj.supply.price

        return None

    def get_supply_trl(self, obj):
        if obj.supply:
            return obj.supply.trl

        return None

    def get_supply_industry(self, obj):
        if obj.supply:
            return obj.supply.industry

        return None

    def get_supply_category(self, obj):
        if obj.supply:
            return obj.supply.category

        return None

    # ========================================================
    # Provider
    # ========================================================

    def get_provider(self, obj):
        target = self._target(obj)

        if target is None:
            return ''

        seller = getattr(
            target,
            'seller',
            None,
        )

        if seller is None:
            return ''

        return (
            getattr(
                seller,
                'company_name',
                None,
            )
            or getattr(
                seller,
                'full_name',
                None,
            )
            or getattr(
                seller,
                'username',
                None,
            )
            or str(seller)
        )