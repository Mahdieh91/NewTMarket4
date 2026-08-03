
from rest_framework import serializers
from .models import PlatformSettings, QualityControl

class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = '__all__'

class QualityControlSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityControl
        fields = '__all__'
