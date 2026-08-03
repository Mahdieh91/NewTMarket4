# products/serializers.py
from rest_framework import serializers
from .models import Product, Supply, SupplyImage


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('view_count', 'created_at', 'updated_at')


# ============================================================
# سریالایزر برای تصاویر عرضه
# ============================================================
class SupplyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplyImage
        fields = ('id', 'image', 'caption', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')


# ============================================================
# سریالایزر برای عرضه (با قابلیت دریافت تصاویر)
# ============================================================
class SupplySerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    images = SupplyImageSerializer(many=True, read_only=True)  # برای نمایش
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=True, use_url=False),
        write_only=True,
        required=False,
        help_text='لیست فایل‌های تصویر برای آپلود'
    )

    class Meta:
        model = Supply
        fields = '__all__'
        read_only_fields = ('seller', 'created_at', 'updated_at')

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        supply = Supply.objects.create(**validated_data)
        for image in uploaded_images:
            SupplyImage.objects.create(supply=supply, image=image)
        return supply

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        for image in uploaded_images:
            SupplyImage.objects.create(supply=instance, image=image)
        return instance