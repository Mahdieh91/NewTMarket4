
from django.db import models
from django.conf import settings

class CustomerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='crm_profile')
    loyalty_points = models.IntegerField(default=0, verbose_name='امتیاز وفاداری')
    total_purchases = models.IntegerField(default=0, verbose_name='تعداد خریدها')
    tags = models.JSONField(default=list, blank=True, verbose_name='برچسب‌ها')
    notes = models.TextField(blank=True, null=True, verbose_name='یادداشت‌ها')
    last_contact = models.DateTimeField(null=True, blank=True, verbose_name='آخرین تماس')

    class Meta:
        verbose_name = 'پروفایل مشتری'
        verbose_name_plural = 'پروفایل‌های مشتریان'

    def __str__(self):
        return f"پروفایل {self.user}"

class Interaction(models.Model):
    TYPE_CHOICES = [
        ('call', 'تماس'),
        ('email', 'ایمیل'),
        ('meeting', 'جلسه'),
        ('note', 'یادداشت'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interactions')
    interaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='نوع تعامل')
    details = models.TextField(verbose_name='جزئیات')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'تعامل'
        verbose_name_plural = 'تعاملات'

    def __str__(self):
        return f"تعامل #{self.id}"
