# products/serializers.py

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import serializers
from .models import Product, Supply, SupplyImage, Favorite


# ============================================================
# Product Serializer (کامل)
# ============================================================

class ProductSerializer(serializers.ModelSerializer):
    seller_name = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('id', 'seller', 'view_count', 'created_at', 'updated_at')

    def get_seller_name(self, obj):
        return obj.seller.username if obj.seller else None


# ============================================================
# Product Brief Serializer (برای نمایش مختصر در علاقه‌مندی‌ها)
# ============================================================

class ProductBriefSerializer(serializers.ModelSerializer):
    industry_name = serializers.CharField(source='industry.name', read_only=True, allow_null=True)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'short_description', 'price', 'category',
            'industry', 'industry_name', 'trl', 'view_count', 'image',
            'status'
        ]


# ============================================================
# Supply Image Serializer
# ============================================================

class SupplyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplyImage
        fields = ('id', 'image', 'caption', 'is_primary', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')


# ============================================================
# Supply Brief Serializer (برای نمایش مختصر در علاقه‌مندی‌ها)
# ============================================================

class SupplyBriefSerializer(serializers.ModelSerializer):
    images = SupplyImageSerializer(many=True, read_only=True)

    class Meta:
        model = Supply
        fields = [
            'id', 'title', 'description', 'price', 'category',
            'industry', 'technology', 'city', 'view_count', 'images',
            'status', 'created_at'
        ]


# ============================================================
# Supply Serializer (کامل)
# ============================================================

class SupplySerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    images = SupplyImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(use_url=False),
        write_only=True,
        required=False,
    )
    uploaded_documents = serializers.ListField(
        child=serializers.FileField(use_url=False),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Supply
        fields = '__all__'
        read_only_fields = ('id', 'seller', 'created_at', 'updated_at')

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        uploaded_documents = validated_data.pop('uploaded_documents', [])
        supply = Supply.objects.create(**validated_data)

        for image in uploaded_images:
            SupplyImage.objects.create(supply=supply, image=image)

        if uploaded_documents:
            current_documents = list(supply.documents) if supply.documents else []
            for document in uploaded_documents:
                path = f'supplies/documents/{supply.seller_id}/{supply.id}/{document.name}'
                saved_path = default_storage.save(path, ContentFile(document.read()))
                document_url = default_storage.url(saved_path)
                current_documents.append(document_url)
            supply.documents = current_documents
            supply.save(update_fields=['documents'])

        return supply

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        uploaded_documents = validated_data.pop('uploaded_documents', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        for image in uploaded_images:
            SupplyImage.objects.create(supply=instance, image=image)

        if uploaded_documents:
            current_documents = list(instance.documents) if instance.documents else []
            for document in uploaded_documents:
                path = f'supplies/documents/{instance.seller_id}/{instance.id}/{document.name}'
                saved_path = default_storage.save(path, ContentFile(document.read()))
                document_url = default_storage.url(saved_path)
                current_documents.append(document_url)
            instance.documents = current_documents
            instance.save(update_fields=['documents'])

        return instance


# ============================================================
# Favorite Serializer (اصلاح‌شده با ورودی PrimaryKey و خروجی Nested)
# ============================================================

class FavoriteSerializer(serializers.ModelSerializer):
    """
    سریالایزر برای مدل Favorite
    - ورودی: product یا supply را به‌صورت ID می‌پذیرد
    - خروجی: product یا supply را به‌صورت کامل (با تمام فیلدها) برمی‌گرداند
    """
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        required=False,
        allow_null=True
    )
    supply = serializers.PrimaryKeyRelatedField(
        queryset=Supply.objects.all(),
        required=False,
        allow_null=True
    )
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Favorite
        fields = [
            'id', 'user', 'user_email',
            'product', 'supply', 'created_at'
        ]
        read_only_fields = ['user', 'created_at']
        extra_kwargs = {
            'product': {'required': False, 'allow_null': True},
            'supply': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        product = data.get('product')
        supply = data.get('supply')
        if not product and not supply:
            raise serializers.ValidationError(
                'حداقل یکی از فیلدهای product یا supply باید مقدار داشته باشد.'
            )
        if product and supply:
            raise serializers.ValidationError(
                'نمی‌توان همزمان product و supply را مقداردهی کرد.'
            )
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)

    def to_representation(self, instance):
        """
        جایگزین کردن product و supply با اطلاعات کامل (nested)
        """
        data = super().to_representation(instance)
        
        # product را با اطلاعات کامل جایگزین کن
        if instance.product:
            data['product'] = ProductBriefSerializer(instance.product).data
        else:
            data['product'] = None
            
        # supply را با اطلاعات کامل جایگزین کن
        if instance.supply:
            data['supply'] = SupplyBriefSerializer(instance.supply).data
        else:
            data['supply'] = None
            
        return data


# ============================================================
# Favorite Toggle Serializer
# ============================================================

class FavoriteToggleSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=False, allow_null=True)
    supply_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, data):
        product_id = data.get('product_id')
        supply_id = data.get('supply_id')
        if not product_id and not supply_id:
            raise serializers.ValidationError(
                'حداقل یکی از product_id یا supply_id باید ارسال شود.'
            )
        if product_id and supply_id:
            raise serializers.ValidationError(
                'نمی‌توان همزمان هر دو را ارسال کرد.'
            )
        return data