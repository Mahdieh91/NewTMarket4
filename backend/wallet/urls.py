from django.urls import path
from .views import WalletView, TransactionListView, DepositView

urlpatterns = [
    path('', WalletView.as_view(), name='wallet'),
    path('transactions/', TransactionListView.as_view(), name='transactions'),
    path('deposit/', DepositView.as_view(), name='deposit'),
]
