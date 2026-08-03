
from django.db import models
from django.conf import settings

class Ticket(models.Model):
    STATUS_CHOICES = [
        ('new', 'جدید'),
        ('in_progress', 'در حال بررسی'),
        ('answered', 'پاسخ داده شده'),
        ('referred', 'ارجاع شده'),
        ('needs_seller_action', 'نیازمند اقدام فروشنده'),
        ('closed', 'بسته شده'),
        ('disputed', 'وارد داوری شده'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'کم'),
        ('medium', 'متوسط'),
        ('high', 'زیاد'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tickets')
    subject = models.CharField(max_length=200, verbose_name='موضوع')
    description = models.TextField(verbose_name='شرح')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', verbose_name='وضعیت')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium', verbose_name='اولویت')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'تیکت'
        verbose_name_plural = 'تیکت‌ها'

    def __str__(self):
        return f"تیکت #{self.id} - {self.subject}"

class TicketMessage(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(verbose_name='متن')
    file = models.FileField(upload_to='tickets/files/', blank=True, null=True, verbose_name='فایل ضمیمه')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'پیام تیکت'
        verbose_name_plural = 'پیام‌های تیکت'

    def __str__(self):
        return f"پیام تیکت #{self.id}"
