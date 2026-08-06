from rest_framework import serializers
from .models import Wallet, Transaction

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['id', 'user', 'balance', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id', 'wallet', 'amount', 'type', 'description',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['wallet', 'status', 'created_at', 'updated_at']


class DepositSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=1000)
    description = serializers.CharField(max_length=255, required=False, default='شارژ کیف پول')
