from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('buyer', 'خریدار محصول فناورانه'),
        ('buyer_service', 'خریدار خدمت نوآورانه'),
        ('supplier', 'عرضه‌کننده محصول'),
        ('supplier_service', 'عرضه‌کننده خدمت'),
        ('need_registerer', 'ثبت‌کننده نیاز فناورانه'),
        ('investor', 'سرمایه‌گذار'),
        ('consultant', 'مشاور / ارزیاب'),
        ('broker', 'کارگزار / کارشناس رسمی'),
        ('partner', 'سازمان همکار'),
        ('admin', 'مدیر پلتفرم'),
    ]
    KYC_STATUS = [
        ('draft', 'پیش‌نویس'),
        ('pending', 'در انتظار بررسی'),
        ('approved', 'تأیید شده'),
        ('rejected', 'رد شده'),
        ('suspended', 'تعلیق شده'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='buyer')
    is_legal = models.BooleanField(default=False)
    company_name = models.CharField(max_length=200, blank=True, null=True)
    national_id = models.CharField(max_length=50, blank=True, null=True)
    registration_number = models.CharField(max_length=50, blank=True, null=True)
    economic_code = models.CharField(max_length=50, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    representative_name = models.CharField(max_length=100, blank=True, null=True)
    expertise = models.TextField(blank=True, null=True)
    activity_domain = models.TextField(blank=True, null=True)
    experience_summary = models.TextField(blank=True, null=True)
    kyc_status = models.CharField(max_length=20, choices=KYC_STATUS, default='draft')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    # ========== فیلد جدید ==========
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'در انتظار تأیید'),
        ('approved', 'تأیید شده'),
        ('rejected', 'رد شده'),
    ]
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default='pending',
        verbose_name='وضعیت تأیید ثبت‌نام'
    )
    # ================================

    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'

    def __str__(self):
        return self.username