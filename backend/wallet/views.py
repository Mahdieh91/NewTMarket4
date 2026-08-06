from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer, DepositSerializer

class WalletView(generics.RetrieveAPIView):
    serializer_class = WalletSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        wallet, _ = Wallet.objects.get_or_create(user=self.request.user)
        return wallet


class TransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        wallet, _ = Wallet.objects.get_or_create(user=self.request.user)
        return wallet.transactions.all()


class DepositView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DepositSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        amount = serializer.validated_data['amount']
        description = serializer.validated_data.get('description', 'شارژ کیف پول')

        transaction = Transaction.objects.create(
            wallet=wallet,
            amount=amount,
            type='deposit',
            description=description,
            status='completed'
        )

        wallet.balance += amount
        wallet.save()

        return Response(
            {
                'message': 'کیف پول با موفقیت شارژ شد.',
                'balance': wallet.balance,
                'transaction': TransactionSerializer(transaction).data
            },
            status=status.HTTP_200_OK
        )
