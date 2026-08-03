
from django.db import models
from django.conf import settings

class Negotiation(models.Model):
    STATUS_CHOICES = [
        ('created', 'ایجاد شده'),
        ('in_progress', 'در حال مکاتبه'),
        ('awaiting_proposal', 'در انتظار پیشنهاد'),
        ('proposal_sent', 'پیشنهاد ارسال شده'),
        ('under_review', 'در حال بررسی'),
        ('accepted', 'پذیرفته شده'),
        ('rejected', 'رد شده'),
        ('contracted', 'ورود به قرارداد'),
    ]
    need = models.ForeignKey('needs.Need', on_delete=models.SET_NULL, null=True)
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True)
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='negotiations_as_buyer')
    supplier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='negotiations_as_supplier')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created', verbose_name='وضعیت')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'مذاکره'
        verbose_name_plural = 'مذاکرات'

    def __str__(self):
        return f"مذاکره #{self.id}"

class Message(models.Model):
    negotiation = models.ForeignKey(Negotiation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(verbose_name='متن پیام')
    file = models.FileField(upload_to='negotiations/files/', blank=True, null=True, verbose_name='فایل ضمیمه')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'پیام'
        verbose_name_plural = 'پیام‌ها'

    def __str__(self):
        return f"پیام #{self.id}"
