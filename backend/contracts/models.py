
from django.db import models
from django.conf import settings
from ckeditor.fields import RichTextField

class Contract(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس قرارداد'),
        ('legal_review', 'بررسی حقوقی'),
        ('valuation', 'ارزش‌گذاری'),
        ('approved_buyer', 'تأیید خریدار'),
        ('approved_supplier', 'تأیید فروشنده'),
        ('signed', 'امضا شده'),
        ('execution', 'در حال اجرا'),
        ('completed', 'تکمیل شده'),
        ('disputed', 'وارد اختلاف شده'),
    ]
    negotiation = models.OneToOneField('negotiations.Negotiation', on_delete=models.SET_NULL, null=True)
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='contracts_as_buyer')
    supplier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='contracts_as_supplier')
    terms = RichTextField(verbose_name='شرایط قرارداد')
    total_value = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='مبلغ قرارداد')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='وضعیت')
    contract_file = models.FileField(upload_to='contracts/', blank=True, null=True, verbose_name='فایل قرارداد')
    signed_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ امضا')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'قرارداد'
        verbose_name_plural = 'قراردادها'

    def __str__(self):
        return f"قرارداد #{self.id}"

class Milestone(models.Model):
    STATUS_CHOICES = [
        ('not_started', 'شروع نشده'),
        ('in_progress', 'در حال انجام'),
        ('awaiting_approval', 'در انتظار تأیید'),
        ('needs_revision', 'نیازمند اصلاح'),
        ('completed', 'تکمیل شده'),
    ]
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200, verbose_name='عنوان فاز')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    due_date = models.DateField(null=True, blank=True, verbose_name='تاریخ سررسید')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started', verbose_name='وضعیت')
    deliverables = models.FileField(upload_to='deliverables/', blank=True, null=True, verbose_name='خروجی‌ها')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ تکمیل')

    class Meta:
        verbose_name = 'نقطه عطف'
        verbose_name_plural = 'نقاط عطف'

    def __str__(self):
        return self.title
