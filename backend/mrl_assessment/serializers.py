# mrl_assessment/serializers.py
from rest_framework import serializers
from .models import MRLAssessment


class MRLAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MRLAssessment
        fields = ['id', 'answers', 'mrl', 'status', 'supply', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']


class MRLAssessmentCreateSerializer(serializers.Serializer):
    answers = serializers.DictField(child=serializers.DictField())
    supply_id = serializers.IntegerField(required=False, allow_null=True)