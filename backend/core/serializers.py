
from rest_framework import serializers
from .models import UserDocument

class UserDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDocument
        fields = '__all__'
