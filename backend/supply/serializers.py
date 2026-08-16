# supply/serializers.py

from rest_framework import serializers
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import logging

from products.models import Supply, SupplyImage


logger = logging.getLogger(__name__)


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
            'is_primary',
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

    # --------------------------------------------------------
    # Seller
    # --------------------------------------------------------

    seller_name = serializers.CharField(
        source='seller.username',
        read_only=True,
    )

    # --------------------------------------------------------
    # Existing images
    # --------------------------------------------------------

    images = SupplyImageSerializer(
        many=True,
        read_only=True,
    )

    # --------------------------------------------------------
    # New images
    # --------------------------------------------------------

    uploaded_images = serializers.ListField(
        child=serializers.ImageField(
            use_url=False
        ),
        write_only=True,
        required=False,
    )

    # --------------------------------------------------------
    # New documents
    # --------------------------------------------------------

    documents_files = serializers.ListField(
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

        fields = (
            'id',

            # seller
            'seller',
            'seller_name',

            # main information
            'title',
            'supply_type',
            'category',
            'industry',
            'technology',
            'city',
            'description',

            # quantity / price
            'quantity',
            'unit',
            'price',

            # technology
            'trl',

            # documents
            'documents',

            # status
            'status',

            # timestamps
            'created_at',
            'updated_at',

            # images
            'images',
            'uploaded_images',

            # document uploads
            'documents_files',
        )

        read_only_fields = (
            'id',
            'seller',
            'seller_name',
            'created_at',
            'updated_at',
            'images',
        )

    # ========================================================
    # CREATE
    # ========================================================

    def create(self, validated_data):

        uploaded_images = validated_data.pop(
            'uploaded_images',
            []
        )

        documents_files = validated_data.pop(
            'documents_files',
            []
        )

        logger.info(
            'Creating Supply | images=%s | documents=%s',
            len(uploaded_images),
            len(documents_files),
        )

        # ----------------------------------------------------
        # Create Supply
        # ----------------------------------------------------

        supply = Supply.objects.create(
            **validated_data
        )

        # ----------------------------------------------------
        # Save images
        # ----------------------------------------------------

        for img in uploaded_images:

            SupplyImage.objects.create(
                supply=supply,
                image=img,
            )

        # ----------------------------------------------------
        # Save documents
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
        # Save document URLs
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

        uploaded_images = validated_data.pop(
            'uploaded_images',
            []
        )

        documents_files = validated_data.pop(
            'documents_files',
            []
        )

        # ----------------------------------------------------
        # Update normal fields
        # ----------------------------------------------------

        for attr, value in validated_data.items():

            setattr(
                instance,
                attr,
                value
            )

        instance.save()

        # ----------------------------------------------------
        # Save new images
        # ----------------------------------------------------

        for img in uploaded_images:

            SupplyImage.objects.create(
                supply=instance,
                image=img,
            )

        # ----------------------------------------------------
        # Save new documents
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