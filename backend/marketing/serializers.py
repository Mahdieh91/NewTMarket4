
from rest_framework import serializers
from .models import Campaign, Event, TrustBadge

class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'

class TrustBadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrustBadge
        fields = '__all__'
