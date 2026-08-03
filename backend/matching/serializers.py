
from rest_framework import serializers
from .models import MatchResult

class MatchResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchResult
        fields = '__all__'
