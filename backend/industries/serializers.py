
from rest_framework import serializers
from .models import IndustryCategory

class IndustryCategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = IndustryCategory
        fields = '__all__'

    def get_children(self, obj):
        return IndustryCategorySerializer(obj.children.all(), many=True).data
