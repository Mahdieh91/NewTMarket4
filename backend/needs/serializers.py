
from rest_framework import serializers

from .models import Need


class NeedSerializer(serializers.ModelSerializer):

    class Meta:

        model = Need

        fields = '__all__'

        read_only_fields = (
            'buyer',
            'created_at',
            'updated_at',
        )