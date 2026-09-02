# trl_assessment/serializers.py
from rest_framework import serializers
from .models import TRLAssessment


class TRLAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TRLAssessment
        fields = ['id', 'answers', 'trl', 'status', 'supply', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']


class TRLAssessmentCreateSerializer(serializers.Serializer):
    answers = serializers.DictField(child=serializers.DictField())
    supply_id = serializers.IntegerField(required=False, allow_null=True)