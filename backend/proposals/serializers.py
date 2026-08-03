# proposals/serializers.py
from rest_framework import serializers
from .models import Proposal
from needs.models import Need
from products.models import Supply


class ProposalSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    need_title = serializers.CharField(source='need.title', read_only=True)
    supply_title = serializers.CharField(source='supply.title', read_only=True, allow_null=True)
    file_url = serializers.SerializerMethodField()
    file_extension = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = '__all__'
        read_only_fields = ('sender', 'created_at', 'updated_at')

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_file_extension(self, obj):
        return obj.file_extension()

    def get_file_size(self, obj):
        return obj.file_size_mb()

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)