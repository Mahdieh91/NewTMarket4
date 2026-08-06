#!/usr/bin/env python
"""
اسکریپت تولید خودکار کدهای بک‌اند برای Messages و Wallet
اجرا: python generate_backend.py
"""

import os
import shutil
from pathlib import Path

# ============================================================
# تنظیمات
# ============================================================
BASE_DIR = Path(__file__).resolve().parent
APPS_DIR = BASE_DIR

# ============================================================
# محتوای فایل‌ها
# ============================================================

# ---------- Messages ----------
MESSAGES_MODELS = '''from django.db import models
from django.conf import settings

class Message(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_messages'
    )
    subject = models.CharField(max_length=200)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'پیام'
        verbose_name_plural = 'پیام‌ها'

    def __str__(self):
        return f"{self.subject} - {self.sender} -> {self.receiver}"
'''

MESSAGES_SERIALIZERS = '''from rest_framework import serializers
from .models import Message
from users.serializers import UserBasicSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender_detail = UserBasicSerializer(source='sender', read_only=True)
    receiver_detail = UserBasicSerializer(source='receiver', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'receiver', 'subject', 'content',
            'is_read', 'is_archived', 'created_at', 'updated_at',
            'sender_detail', 'receiver_detail'
        ]
        read_only_fields = ['sender', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)
'''

MESSAGES_VIEWS = '''from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Message
from .serializers import MessageSerializer

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).exclude(is_archived=True)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        if message.receiver != request.user:
            return Response(
                {'error': 'شما مجاز به این کار نیستید.'},
                status=status.HTTP_403_FORBIDDEN
            )
        message.is_read = True
        message.save()
        return Response({'status': 'marked as read'})

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        message = self.get_object()
        if message.receiver != request.user:
            return Response(
                {'error': 'شما مجاز به این کار نیستید.'},
                status=status.HTTP_403_FORBIDDEN
            )
        message.is_archived = True
        message.save()
        return Response({'status': 'archived'})
'''

MESSAGES_URLS = '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageViewSet

router = DefaultRouter()
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
]
'''

MESSAGES_ADMIN = '''from django.contrib import admin
from .models import Message

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['subject', 'sender', 'receiver', 'is_read', 'created_at']
    list_filter = ['is_read', 'is_archived']
    search_fields = ['subject', 'content', 'sender__username', 'receiver__username']
    raw_id_fields = ['sender', 'receiver']
'''

MESSAGES_INIT = '''

'''

# ---------- Wallet ----------
WALLET_MODELS = '''from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator

class Wallet(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wallet'
    )
    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"کیف پول {self.user.username} - {self.balance}"

    class Meta:
        verbose_name = 'کیف پول'
        verbose_name_plural = 'کیف پول‌ها'


class Transaction(models.Model):
    TYPE_CHOICES = [
        ('deposit', 'واریز'),
        ('withdraw', 'برداشت'),
        ('payment', 'پرداخت'),
        ('refund', 'بازگشت وجه'),
    ]
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('completed', 'انجام شده'),
        ('failed', 'شکست خورده'),
    ]

    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'تراکنش'
        verbose_name_plural = 'تراکنش‌ها'

    def __str__(self):
        return f"{self.get_type_display()} - {self.amount} - {self.status}"
'''

WALLET_SERIALIZERS = '''from rest_framework import serializers
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
'''

WALLET_VIEWS = '''from rest_framework import generics, permissions, status
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
'''

WALLET_URLS = '''from django.urls import path
from .views import WalletView, TransactionListView, DepositView

urlpatterns = [
    path('', WalletView.as_view(), name='wallet'),
    path('transactions/', TransactionListView.as_view(), name='transactions'),
    path('deposit/', DepositView.as_view(), name='deposit'),
]
'''

WALLET_ADMIN = '''from django.contrib import admin
from .models import Wallet, Transaction

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'created_at']
    raw_id_fields = ['user']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['wallet', 'amount', 'type', 'status', 'created_at']
    list_filter = ['type', 'status']
    readonly_fields = ['created_at', 'updated_at']
'''

WALLET_INIT = '''

'''

# ---------- Users (بروزرسانی) ----------
USERS_SERIALIZER_UPDATE = '''
# ============================================================
# افزودن کلاس UserBasicSerializer (قبل از class Meta)
# ============================================================
class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
'''

USERS_PROFILE_VIEW = '''from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from .serializers import UserSerializer

User = get_user_model()

class ProfileView(generics.RetrieveUpdateAPIView):
    """
    دریافت و بروزرسانی اطلاعات کاربر جاری
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
'''

# ---------- Config URL بروزرسانی ----------
CONFIG_URLS_UPDATE = '''
# ============================================================
# اضافه کردن مسیرهای جدید به urlpatterns
# ============================================================
    # Messages
    path('api/messages/', include('messages.urls')),
    # Wallet
    path('api/wallet/', include('wallet.urls')),
    # Profile (به‌جای me)
    path('api/users/profile/', include('users.urls')),  # مطمئن شوید users.urls این مسیر را دارد
'''


# ============================================================
# توابع کمکی
# ============================================================
def create_file(path, content, overwrite=False):
    """ایجاد فایل با محتوای مشخص"""
    if path.exists():
        if not overwrite:
            response = input(f"فایل {path} از قبل وجود دارد. بازنویسی شود؟ (y/n): ")
            if response.lower() != 'y':
                print(f"⏭️  پرش از {path}")
                return
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f"✅ ایجاد شد: {path}")


def update_file(path, content, marker):
    """بروزرسانی یک فایل با اضافه کردن محتوا در جای مشخص (با استفاده از مارکر)"""
    if not path.exists():
        print(f"⚠️ فایل {path} وجود ندارد. لطفاً آن را به‌صورت دستی بروزرسانی کنید.")
        return

    with open(path, 'r', encoding='utf-8') as f:
        original = f.read()

    if marker in original:
        print(f"⏭️  فایل {path} قبلاً بروزرسانی شده است.")
        return

    new_content = original + '\n' + content.strip() + '\n'
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"✅ بروزرسانی شد: {path}")


# ============================================================
# اجرای اصلی
# ============================================================
def main():
    print("=" * 60)
    print("🚀 شروع تولید کدهای بک‌اند برای Messages و Wallet")
    print("=" * 60)

    # 1. ایجاد پوشه messages
    messages_dir = APPS_DIR / 'messages'
    if messages_dir.exists():
        overwrite = input("پوشه messages از قبل وجود دارد. آیا می‌خواهید فایل‌ها را بازنویسی کنید؟ (y/n): ")
        overwrite = overwrite.lower() == 'y'
    else:
        overwrite = True

    create_file(messages_dir / '__init__.py', '', overwrite=overwrite)
    create_file(messages_dir / 'models.py', MESSAGES_MODELS, overwrite=overwrite)
    create_file(messages_dir / 'serializers.py', MESSAGES_SERIALIZERS, overwrite=overwrite)
    create_file(messages_dir / 'views.py', MESSAGES_VIEWS, overwrite=overwrite)
    create_file(messages_dir / 'urls.py', MESSAGES_URLS, overwrite=overwrite)
    create_file(messages_dir / 'admin.py', MESSAGES_ADMIN, overwrite=overwrite)

    print()

    # 2. ایجاد پوشه wallet
    wallet_dir = APPS_DIR / 'wallet'
    if wallet_dir.exists():
        overwrite = input("پوشه wallet از قبل وجود دارد. آیا می‌خواهید فایل‌ها را بازنویسی کنید؟ (y/n): ")
        overwrite = overwrite.lower() == 'y'
    else:
        overwrite = True

    create_file(wallet_dir / '__init__.py', '', overwrite=overwrite)
    create_file(wallet_dir / 'models.py', WALLET_MODELS, overwrite=overwrite)
    create_file(wallet_dir / 'serializers.py', WALLET_SERIALIZERS, overwrite=overwrite)
    create_file(wallet_dir / 'views.py', WALLET_VIEWS, overwrite=overwrite)
    create_file(wallet_dir / 'urls.py', WALLET_URLS, overwrite=overwrite)
    create_file(wallet_dir / 'admin.py', WALLET_ADMIN, overwrite=overwrite)

    print()

    # 3. بروزرسانی users/serializers.py
    users_serializer_path = APPS_DIR / 'users' / 'serializers.py'
    if users_serializer_path.exists():
        update_file(users_serializer_path, USERS_SERIALIZER_UPDATE, 'UserBasicSerializer')
    else:
        print(f"⚠️ فایل {users_serializer_path} وجود ندارد. لطفاً به‌صورت دستی کلاس UserBasicSerializer را اضافه کنید.")

    # 4. بروزرسانی users/views.py (افزودن ProfileView)
    users_views_path = APPS_DIR / 'users' / 'views.py'
    if users_views_path.exists():
        update_file(users_views_path, USERS_PROFILE_VIEW, 'ProfileView')
    else:
        print(f"⚠️ فایل {users_views_path} وجود ندارد. لطفاً به‌صورت دستی ProfileView را اضافه کنید.")

    # 5. بروزرسانی users/urls.py
    users_urls_path = APPS_DIR / 'users' / 'urls.py'
    if users_urls_path.exists():
        # بررسی اینکه آیا مسیر profile وجود دارد
        with open(users_urls_path, 'r') as f:
            content = f.read()
        if 'profile/' not in content:
            # اضافه کردن مسیر profile
            profile_url = "\nurlpatterns += [\n    path('profile/', ProfileView.as_view(), name='profile'),\n]"
            update_file(users_urls_path, profile_url, 'profile/')
        else:
            print("⏭️  مسیر profile قبلاً در users/urls.py وجود دارد.")
    else:
        print(f"⚠️ فایل {users_urls_path} وجود ندارد. لطفاً مسیر profile را به‌صورت دستی اضافه کنید.")

    # 6. بروزرسانی config/urls.py
    config_urls_path = APPS_DIR / 'config' / 'urls.py'
    if config_urls_path.exists():
        # بررسی اینکه آیا مسیرهای messages و wallet اضافه شده‌اند
        with open(config_urls_path, 'r') as f:
            content = f.read()
        need_update = False
        if 'api/messages/' not in content:
            need_update = True
        if 'api/wallet/' not in content:
            need_update = True
        if need_update:
            update_file(config_urls_path, CONFIG_URLS_UPDATE, 'api/messages/')
        else:
            print("⏭️  مسیرهای messages و wallet قبلاً در config/urls.py وجود دارند.")
    else:
        print(f"⚠️ فایل {config_urls_path} وجود ندارد. لطفاً مسیرهای جدید را به‌صورت دستی اضافه کنید.")

    print()
    print("=" * 60)
    print("✅ تولید کدها با موفقیت کامل شد!")
    print("=" * 60)
    print()
    print("📌 مراحل بعدی:")
    print("1. اطمینان از ثبت اپلیکیشن‌های 'messages' و 'wallet' در INSTALLED_APPS")
    print("2. اجرا: python manage.py makemigrations")
    print("3. اجرا: python manage.py migrate")
    print("4. راه‌اندازی مجدد سرور: python manage.py runserver")
    print()
    print("📌 توجه: برخی فایل‌ها ممکن است نیاز به تنظیمات دستی داشته باشند (نگاه کنید به پیام‌های ⚠️)")


if __name__ == '__main__':
    main()