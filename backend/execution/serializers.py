
from rest_framework import serializers
from .models import Execution

class ExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Execution
        fields = '__all__'
