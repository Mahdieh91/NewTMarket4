
from django.db import models
from django.conf import settings

class PlatformSettings(models.Model):
    key = models.CharField(max_length=100, unique=True, verbose_name='کلید')
    value = models.TextField(verbose_name='مقدار')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'تنظیمات پلتفرم'
        verbose_name_plural = 'تنظیمات پلتفرم'

    def __str__(self):
        return self.key

class QualityControl(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('passed', 'تأیید شده'),
        ('failed', 'رد شده'),
    ]
    target_type = models.CharField(max_length=50, verbose_name='نوع هدف')
    target_id = models.PositiveIntegerField(verbose_name='شناسه هدف')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='وضعیت')
    notes = models.TextField(blank=True, null=True, verbose_name='یادداشت')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name='بررسی‌کننده')
    reviewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'کنترل کیفیت'
        verbose_name_plural = 'کنترل کیفیت'

    def __str__(self):
        return f"QC {self.target_type} #{self.target_id}"
