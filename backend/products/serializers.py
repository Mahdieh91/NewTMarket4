# products/serializers.py

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import serializers

from .models import Product, Supply, SupplyImage


# ============================================================
# Product Serializer
# مدل مربوطه: products.models.Product
# ============================================================

class ProductSerializer(serializers.ModelSerializer):

    seller_name = serializers.CharField(
        source='seller.username',
        read_only=True,
    )

    class Meta:
        model = Product
        fields = '__all__'

        read_only_fields = (
            'id',
            'seller',
            'view_count',
            'created_at',
            'updated_at',
        )


# ============================================================
# Supply Image Serializer
# مدل مربوطه: products.models.SupplyImage
# ============================================================

class SupplyImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = SupplyImage

        fields = (
            'id',
            'image',
            'caption',
            'is_primary',
            'uploaded_at',
        )

        read_only_fields = (
            'id',
            'uploaded_at',
        )


# ============================================================
# Supply Serializer
# مدل مربوطه: products.models.Supply
#
# نکته:
# seller توسط فرانت ارسال نمی‌شود.
# seller باید در ViewSet از request.user تعیین شود.
# ============================================================

class SupplySerializer(serializers.ModelSerializer):

    # --------------------------------------------------------
    # نام فروشنده
    # --------------------------------------------------------

    seller_name = serializers.CharField(
        source='seller.username',
        read_only=True,
    )

    # --------------------------------------------------------
    # تصاویر ذخیره‌شده عرضه
    # --------------------------------------------------------

    images = SupplyImageSerializer(
        many=True,
        read_only=True,
    )

    # --------------------------------------------------------
    # تصاویر جدید
    #
    # فرانت فعلی:
    # uploaded_images
    # --------------------------------------------------------

    uploaded_images = serializers.ListField(
        child=serializers.ImageField(
            use_url=False
        ),
        write_only=True,
        required=False,
    )

    # --------------------------------------------------------
    # مستندات جدید
    #
    # فرانت فعلی:
    # uploaded_documents
    # --------------------------------------------------------

    uploaded_documents = serializers.ListField(
        child=serializers.FileField(
            use_url=False
        ),
        write_only=True,
        required=False,
    )

    # ========================================================
    # Meta
    # ========================================================

    class Meta:
        model = Supply

        fields = '__all__'

        read_only_fields = (
            'id',
            'seller',
            'created_at',
            'updated_at',
        )

    # ========================================================
    # CREATE
    # ========================================================

    def create(self, validated_data):

        # ----------------------------------------------------
        # فایل‌های آپلودی را از validated_data جدا می‌کنیم
        # ----------------------------------------------------

        uploaded_images = validated_data.pop(
            'uploaded_images',
            []
        )

        uploaded_documents = validated_data.pop(
            'uploaded_documents',
            []
        )

        # ----------------------------------------------------
        # ایجاد Supply
        #
        # seller عمداً اینجا تعیین نمی‌شود.
        # ViewSet باید serializer.save(seller=request.user)
        # را انجام دهد.
        # ----------------------------------------------------

        supply = Supply.objects.create(
            **validated_data
        )

        # ----------------------------------------------------
        # ذخیره تصاویر
        # ----------------------------------------------------

        for image in uploaded_images:

            SupplyImage.objects.create(
                supply=supply,
                image=image,
            )

        # ----------------------------------------------------
        # ذخیره مستندات
        # ----------------------------------------------------

        if uploaded_documents:

            current_documents = (
                list(supply.documents)
                if supply.documents
                else []
            )

            for document in uploaded_documents:

                path = (
                    f'supplies/documents/'
                    f'{supply.seller_id}/'
                    f'{supply.id}/'
                    f'{document.name}'
                )

                saved_path = default_storage.save(
                    path,
                    ContentFile(document.read()),
                )

                document_url = default_storage.url(
                    saved_path
                )

                current_documents.append(
                    document_url
                )

            supply.documents = current_documents

            supply.save(
                update_fields=['documents']
            )

        return supply

    # ========================================================
    # UPDATE
    # ========================================================

    def update(
        self,
        instance,
        validated_data
    ):

        # ----------------------------------------------------
        # فایل‌های جدید
        # ----------------------------------------------------

        uploaded_images = validated_data.pop(
            'uploaded_images',
            []
        )

        uploaded_documents = validated_data.pop(
            'uploaded_documents',
            []
        )

        # ----------------------------------------------------
        # بروزرسانی فیلدهای عادی
        # ----------------------------------------------------

        for attr, value in validated_data.items():

            setattr(
                instance,
                attr,
                value
            )

        instance.save()

        # ----------------------------------------------------
        # ذخیره تصاویر جدید
        # ----------------------------------------------------

        for image in uploaded_images:

            SupplyImage.objects.create(
                supply=instance,
                image=image,
            )

        # ----------------------------------------------------
        # ذخیره مستندات جدید
        # ----------------------------------------------------

        if uploaded_documents:

            current_documents = (
                list(instance.documents)
                if instance.documents
                else []
            )

            for document in uploaded_documents:

                path = (
                    f'supplies/documents/'
                    f'{instance.seller_id}/'
                    f'{instance.id}/'
                    f'{document.name}'
                )

                saved_path = default_storage.save(
                    path,
                    ContentFile(document.read()),
                )

                document_url = default_storage.url(
                    saved_path
                )

                current_documents.append(
                    document_url
                )

            instance.documents = current_documents

            instance.save(
                update_fields=['documents']
            )

        return instance