# ============================================================
# matching/serializers.py
# ============================================================

from rest_framework import serializers
from django.db.models import Avg, Count, Q

from .models import MatchResult, MatchingRequest
from products.serializers import ProductSerializer


class MatchResultSerializer(serializers.ModelSerializer):
    """
    سریالایزر کامل برای نتایج تطبیق
    """
    
    # اطلاعات کامل محصول
    product_detail = ProductSerializer(
        source='product',
        read_only=True
    )
    
    # نام فروشنده از طریق product
    provider = serializers.SerializerMethodField()
    
    # عنوان محصول
    product_title = serializers.SerializerMethodField()
    
    # توضیحات محصول
    product_description = serializers.SerializerMethodField()
    
    # قیمت محصول
    product_price = serializers.SerializerMethodField()
    
    # TRL محصول
    product_trl = serializers.SerializerMethodField()
    
    # MRL محصول
    product_mrl = serializers.SerializerMethodField()
    
    # صنعت محصول
    product_industry = serializers.SerializerMethodField()
    
    # دسته‌بندی محصول
    product_category = serializers.SerializerMethodField()
    
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
            # فیلدهای اضافی برای فرانت
            'product_detail',
            'provider',
            'product_title',
            'product_description',
            'product_price',
            'product_trl',
            'product_mrl',
            'product_industry',
            'product_category',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'product_detail',
        ]
    
    def get_provider(self, obj):
        """دریافت نام فروشنده از محصول"""
        if obj.product and obj.product.seller:
            seller = obj.product.seller
            if seller.first_name or seller.last_name:
                return f"{seller.first_name or ''} {seller.last_name or ''}".strip()
            return seller.username or 'فروشنده'
        return 'نامشخص'
    
    def get_product_title(self, obj):
        return obj.product.title if obj.product else 'محصول نامشخص'
    
    def get_product_description(self, obj):
        if obj.product:
            return obj.product.short_description or obj.product.full_description or 'توضیحات ثبت نشده'
        return 'توضیحات ثبت نشده'
    
    def get_product_price(self, obj):
        return obj.product.price if obj.product else None
    
    def get_product_trl(self, obj):
        return obj.product.trl if obj.product else None
    
    def get_product_mrl(self, obj):
        return obj.product.mrl if obj.product else None
    
    def get_product_industry(self, obj):
        if obj.product and obj.product.industry:
            return obj.product.industry.name
        return None
    
    def get_product_category(self, obj):
        return obj.product.category if obj.product else 'product'


class MatchResultListSerializer(serializers.ModelSerializer):
    """
    سریالایزر ساده‌تر برای لیست نتایج
    """
    
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_price = serializers.DecimalField(source='product.price', read_only=True, max_digits=15, decimal_places=2)
    product_trl = serializers.IntegerField(source='product.trl', read_only=True)
    product_mrl = serializers.IntegerField(source='product.mrl', read_only=True)
    provider = serializers.SerializerMethodField()
    product_category = serializers.CharField(source='product.category', read_only=True)
    product_industry = serializers.SerializerMethodField()
    product_description = serializers.SerializerMethodField()
    
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
    
    def get_provider(self, obj):
        if obj.product and obj.product.seller:
            seller = obj.product.seller
            if seller.first_name or seller.last_name:
                return f"{seller.first_name or ''} {seller.last_name or ''}".strip()
            return seller.username or 'فروشنده'
        return 'نامشخص'
    
    def get_product_industry(self, obj):
        if obj.product and obj.product.industry:
            return obj.product.industry.name
        return None
    
    def get_product_description(self, obj):
        if obj.product:
            return obj.product.short_description or obj.product.full_description or 'توضیحات ثبت نشده'
        return 'توضیحات ثبت نشده'


class MatchResultCreateSerializer(serializers.ModelSerializer):
    """
    سریالایزر برای ایجاد نتیجه تطبیق
    """
    
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
    """
    سریالایزر آمار تطبیق
    """
    
    total_matches = serializers.IntegerField()
    average_match_percentage = serializers.FloatField()
    highest_match_percentage = serializers.FloatField()
    lowest_match_percentage = serializers.FloatField()
    high_matches_count = serializers.IntegerField()
    medium_matches_count = serializers.IntegerField()
    low_matches_count = serializers.IntegerField()


class MatchingRequestSerializer(serializers.ModelSerializer):
    """
    سریالایزر درخواست تطبیق
    """
    
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