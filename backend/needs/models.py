# ============================================================
# needs/models.py
# ============================================================

from django.db import models
from django.conf import settings
from ckeditor.fields import RichTextField


class Need(models.Model):

    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('published', 'منتشر شده'),
        ('private', 'خصوصی'),
        ('receiving_proposals', 'در حال دریافت پیشنهاد'),
        ('evaluating', 'در حال ارزیابی'),
        ('matched', 'تطبیق داده شده'),
        ('in_negotiation', 'در حال مذاکره'),
        ('contracted', 'تبدیل به قرارداد'),
        ('executing', 'در حال اجرا'),
        ('closed', 'بسته شده'),
    ]

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='needs',
        verbose_name='ثبت‌کننده'
    )

    title = models.CharField(
        max_length=200,
        verbose_name='عنوان نیاز'
    )

    description = RichTextField(
        verbose_name='شرح مسئله'
    )

    industry = models.ForeignKey(
        'industries.IndustryCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='صنعت'
    )

    current_status = models.TextField(
        blank=True,
        null=True,
        verbose_name='وضعیت فعلی'
    )

    expected_outcome = models.TextField(
        blank=True,
        null=True,
        verbose_name='خروجی مورد انتظار'
    )

    constraints = models.TextField(
        blank=True,
        null=True,
        verbose_name='محدودیت‌ها'
    )

    budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='بودجه (تومان)'
    )

    timeline = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='زمان‌بندی'
    )

    confidentiality = models.CharField(
        max_length=20,
        choices=[
            ('public', 'عمومی'),
            ('private', 'خصوصی'),
        ],
        default='public',
        verbose_name='سطح محرمانگی'
    )

    evaluation_criteria = models.TextField(
        blank=True,
        null=True,
        verbose_name='معیارهای ارزیابی'
    )

    attachments = models.FileField(
        upload_to='needs/attachments/',
        blank=True,
        null=True,
        verbose_name='فایل‌های پیوست'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name='وضعیت'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاریخ ایجاد'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='آخرین ویرایش'
    )

    class Meta:
        verbose_name = 'نیاز'
        verbose_name_plural = 'نیازها'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def is_active(self):
        """
        آیا نیاز در وضعیت فعال/قابل مشاهده عمومی است؟
        """
        return self.status in [
            'published',
            'receiving_proposals',
            'evaluating',
            'matched',
            'in_negotiation',
            'contracted',
            'executing',
        ]