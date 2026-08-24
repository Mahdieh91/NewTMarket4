# backend/matching/serializers.py

from rest_framework import serializers
from django.db.models import Avg, Count, Q

from .models import MatchResult, MatchingRequest
from products.serializers import ProductSerializer


class MatchResultSerializer(serializers.ModelSerializer):
    """
    سریالایزر کامل برای نتایج تطبیق با مدیریت کامل None
    """
    # فیلدهای اضافی برای فرانت
    product_title = serializers.SerializerMethodField()
    product_description = serializers.SerializerMethodField()
    product_price = serializers.SerializerMethodField()
    product_trl = serializers.SerializerMethodField()
    product_mrl = serializers.SerializerMethodField()
    product_industry = serializers.SerializerMethodField()
    product_category = serializers.SerializerMethodField()
    provider = serializers.SerializerMethodField()

    class Meta:
        model = MatchResult
        fields = [
            'id',
            'need',
            'product',
            'score',
            'match_percentage',
            'reason',
            'recommended_actions',
            'status',
            'user_rating',
            'created_at',
            'updated_at',
            # فیلدهای اضافی
            'product_title',
            'product_description',
            'product_price',
            'product_trl',
            'product_mrl',
            'product_industry',
            'product_category',
            'provider',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]

    def get_product_title(self, obj):
        try:
            return obj.product.title if obj.product else 'محصول نامشخص'
        except AttributeError:
            return 'محصول نامشخص'

    def get_product_description(self, obj):
        try:
            if obj.product:
                return obj.product.short_description or obj.product.full_description or 'توضیحات ثبت نشده'
            return 'توضیحات ثبت نشده'
        except AttributeError:
            return 'توضیحات ثبت نشده'

    def get_product_price(self, obj):
        try:
            return obj.product.price if obj.product else None
        except AttributeError:
            return None

    def get_product_trl(self, obj):
        try:
            return obj.product.trl if obj.product else None
        except AttributeError:
            return None

    def get_product_mrl(self, obj):
        try:
            return obj.product.mrl if obj.product else None
        except AttributeError:
            return None

    def get_product_industry(self, obj):
        try:
            if obj.product and obj.product.industry:
                return obj.product.industry.name
            return None
        except AttributeError:
            return None

    def get_product_category(self, obj):
        try:
            return obj.product.category if obj.product else 'product'
        except AttributeError:
            return 'product'

    def get_provider(self, obj):
        try:
            if obj.product and obj.product.seller:
                seller = obj.product.seller
                if seller.first_name or seller.last_name:
                    return f"{seller.first_name or ''} {seller.last_name or ''}".strip()
                return seller.username or 'فروشنده'
            return 'نامشخص'
        except AttributeError:
            return 'نامشخص'


class MatchResultListSerializer(serializers.ModelSerializer):
    """
    سریالایزر ساده‌تر برای لیست نتایج با مدیریت کامل None
    """
    product_title = serializers.SerializerMethodField()
    product_description = serializers.SerializerMethodField()
    product_price = serializers.SerializerMethodField()
    product_trl = serializers.SerializerMethodField()
    product_mrl = serializers.SerializerMethodField()
    product_industry = serializers.SerializerMethodField()
    product_category = serializers.SerializerMethodField()
    provider = serializers.SerializerMethodField()

    class Meta:
        model = MatchResult
        fields = [
            'id',
            'need',
            'product',
            'score',
            'match_percentage',
            'reason',
            'recommended_actions',
            'status',
            'created_at',
            'product_title',
            'product_description',
            'product_price',
            'product_trl',
            'product_mrl',
            'product_category',
            'product_industry',
            'provider',
        ]

    def get_product_title(self, obj):
        try:
            return obj.product.title if obj.product else 'محصول نامشخص'
        except AttributeError:
            return 'محصول نامشخص'

    def get_product_description(self, obj):
        try:
            if obj.product:
                return obj.product.short_description or obj.product.full_description or 'توضیحات ثبت نشده'
            return 'توضیحات ثبت نشده'
        except AttributeError:
            return 'توضیحات ثبت نشده'

    def get_product_price(self, obj):
        try:
            return obj.product.price if obj.product else None
        except AttributeError:
            return None

    def get_product_trl(self, obj):
        try:
            return obj.product.trl if obj.product else None
        except AttributeError:
            return None

    def get_product_mrl(self, obj):
        try:
            return obj.product.mrl if obj.product else None
        except AttributeError:
            return None

    def get_product_industry(self, obj):
        try:
            if obj.product and obj.product.industry:
                return obj.product.industry.name
            return None
        except AttributeError:
            return None

    def get_product_category(self, obj):
        try:
            return obj.product.category if obj.product else 'product'
        except AttributeError:
            return 'product'

    def get_provider(self, obj):
        try:
            if obj.product and obj.product.seller:
                seller = obj.product.seller
                if seller.first_name or seller.last_name:
                    return f"{seller.first_name or ''} {seller.last_name or ''}".strip()
                return seller.username or 'فروشنده'
            return 'نامشخص'
        except AttributeError:
            return 'نامشخص'


class MatchResultCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchResult
        fields = [
            'need',
            'product',
            'score',
            'match_percentage',
            'reason',
            'recommended_actions',
        ]


class MatchResultStatsSerializer(serializers.Serializer):
    total_matches = serializers.IntegerField()
    average_match_percentage = serializers.FloatField()
    highest_match_percentage = serializers.FloatField()
    lowest_match_percentage = serializers.FloatField()
    high_matches_count = serializers.IntegerField()
    medium_matches_count = serializers.IntegerField()
    low_matches_count = serializers.IntegerField()


class MatchingRequestSerializer(serializers.ModelSerializer):
    need_title = serializers.CharField(source='need.title', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = MatchingRequest
        fields = [
            'id',
            'need',
            'need_title',
            'user',
            'user_name',
            'status',
            'priority',
            'total_matches',
            'error_message',
            'created_at',
            'updated_at',
            'completed_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'created_at',
            'updated_at',
            'completed_at',
        ]

    def get_user_name(self, obj):
        if obj.user:
            if obj.user.first_name or obj.user.last_name:
                return f"{obj.user.first_name or ''} {obj.user.last_name or ''}".strip()
            return obj.user.username
        return 'کاربر نامشخص'