
from rest_framework import serializers
from .models import Contract, Milestone

class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = '__all__'

class ContractSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, read_only=True)

    class Meta:
        model = Contract
        fields = '__all__'
