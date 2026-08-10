
from rest_framework import serializers
from .models import Product, Supply, SupplyImage
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)


# ============================================================
# Product Serializer
# ============================================================

class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = (
            'view_count',
            'created_at',
            'updated_at',
        )


# ============================================================
# Supply Image Serializer
# ============================================================

class SupplyImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = SupplyImage
        fields = (
            'id',
            'image',
            'caption',
            'uploaded_at',
        )
        read_only_fields = (
            'id',
            'uploaded_at',
        )


# ============================================================
# Supply Serializer
# ============================================================

class SupplySerializer(serializers.ModelSerializer):

    seller_name = serializers.CharField(
        source='seller.username',
        read_only=True,
    )

    images = SupplyImageSerializer(
        many=True,
        read_only=True,
    )

    # --------------------------------------------------------
    # فایل‌های تصویری که هنگام ایجاد/ویرایش عرضه آپلود می‌شوند
    # --------------------------------------------------------

    uploaded_images = serializers.ListField(
        child=serializers.ImageField(
            use_url=False
        ),
        write_only=True,
        required=False,
    )

    # --------------------------------------------------------
    # فایل‌های مستندات برای Upload
    #
    # این فیلد فقط برای دریافت فایل است.
    # خود documents از JSONField مدل خوانده می‌شود.
    # --------------------------------------------------------

    documents_files = serializers.ListField(
        child=serializers.FileField(
            use_url=False
        ),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Supply

        # بسیار مهم:
        # documents از خود ModelSerializer گرفته می‌شود
        # و در GET نیز در response قرار می‌گیرد.
        fields = '__all__'

        read_only_fields = (
            'seller',
            'created_at',
            'updated_at',
        )

    # ========================================================
    # CREATE
    # ========================================================

    def create(self, validated_data):

        # ----------------------------------------------------
        # تصاویر
        # ----------------------------------------------------

        uploaded_images = validated_data.pop(
            'uploaded_images',
            []
        )

        # ----------------------------------------------------
        # فایل‌های مستندات
        # ----------------------------------------------------

        documents_files = validated_data.pop(
            'documents_files',
            []
        )

        logger.info(
            f'📸 تعداد تصاویر دریافت‌شده: '
            f'{len(uploaded_images)}'
        )

        logger.info(
            f'📄 تعداد مستندات دریافت‌شده: '
            f'{len(documents_files)}'
        )

        # ----------------------------------------------------
        # ایجاد Supply
        # ----------------------------------------------------

        supply = Supply.objects.create(
            **validated_data
        )

        # ----------------------------------------------------
        # ذخیره تصاویر
        # ----------------------------------------------------

        for img in uploaded_images:

            SupplyImage.objects.create(
                supply=supply,
                image=img,
            )

        # ----------------------------------------------------
        # ذخیره مستندات
        # ----------------------------------------------------

        documents_urls = []

        for doc in documents_files:

            path = (
                f'supplies/documents/'
                f'{supply.seller.id}/'
                f'{supply.id}/'
                f'{doc.name}'
            )

            saved_path = default_storage.save(
                path,
                ContentFile(doc.read()),
            )

            url = default_storage.url(
                saved_path
            )

            documents_urls.append(url)

        # ----------------------------------------------------
        # ذخیره URL مستندات در JSONField
        # ----------------------------------------------------

        if documents_urls:

            supply.documents = documents_urls

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
        # تصاویر جدید
        # ----------------------------------------------------

        uploaded_images = validated_data.pop(
            'uploaded_images',
            []
        )

        # ----------------------------------------------------
        # مستندات جدید
        # ----------------------------------------------------

        documents_files = validated_data.pop(
            'documents_files',
            []
        )

        # ----------------------------------------------------
        # سایر فیلدها
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

        for img in uploaded_images:

            SupplyImage.objects.create(
                supply=instance,
                image=img,
            )

        # ----------------------------------------------------
        # ذخیره مستندات جدید
        # ----------------------------------------------------

        if documents_files:

            current_docs = (
                list(instance.documents)
                if instance.documents
                else []
            )

            for doc in documents_files:

                path = (
                    f'supplies/documents/'
                    f'{instance.seller.id}/'
                    f'{instance.id}/'
                    f'{doc.name}'
                )

                saved_path = default_storage.save(
                    path,
                    ContentFile(doc.read()),
                )

                url = default_storage.url(
                    saved_path
                )

                current_docs.append(url)

            instance.documents = current_docs

            instance.save(
                update_fields=['documents']
            )

        return instance

