# proposals/models.py
import os
from django.db import models
from django.conf import settings
from needs.models import Need
from products.models import Supply


def proposal_file_path(instance, filename):
    # مسیر ذخیره فایل: proposals/user_id/need_id/filename
    ext = filename.split('.')[-1]
    # تغییر نام فایل برای جلوگیری از تداخل
    new_filename = f'proposal_{instance.need.id}_{instance.sender.id}.{ext}'
    return f'proposals/{instance.sender.id}/{instance.need.id}/{new_filename}'


class Proposal(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('sent', 'ارسال شده'),
        ('under_review', 'در حال بررسی'),
        ('accepted', 'پذیرفته شده'),
        ('rejected', 'رد شده'),
    ]

    # فیلدهای اصلی
    need = models.ForeignKey(Need, on_delete=models.CASCADE, related_name='proposals', verbose_name='نیاز')
    supply = models.ForeignKey(Supply, on_delete=models.CASCADE, related_name='proposals', null=True, blank=True, verbose_name='عرضه')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_proposals', verbose_name='فرستنده')

    # اطلاعات پیشنهاد
    title = models.CharField(max_length=200, verbose_name='عنوان پیشنهاد')
    technical_description = models.TextField(verbose_name='شرح فنی')
    price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='قیمت (تومان)')
    delivery_time = models.CharField(max_length=100, verbose_name='زمان تحویل')
    terms = models.TextField(blank=True, verbose_name='شرایط و ضوابط')

    # فایل پروپوزال (پشتیبانی از ورد، PDF، لاتکس)
    file = models.FileField(
        upload_to=proposal_file_path,
        blank=True,
        null=True,
        verbose_name='فایل پروپوزال',
        help_text='فرمت‌های مجاز: .docx, .pdf, .tex'
    )

    # وضعیت
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='وضعیت')

    # زمان‌بندی
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ بروزرسانی')

    class Meta:
        verbose_name = 'پروپوزال'
        verbose_name_plural = 'پروپوزال‌ها'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['need', 'status']),
            models.Index(fields=['sender']),
        ]

    def __str__(self):
        return f'پروپوزال #{self.id} - {self.title}'

    def file_extension(self):
        if self.file:
            return os.path.splitext(self.file.name)[1].lower()
        return None

    def is_word(self):
        return self.file_extension() in ['.docx', '.doc']

    def is_pdf(self):
        return self.file_extension() == '.pdf'

    def is_latex(self):
        return self.file_extension() == '.tex'

    def file_size_mb(self):
        if self.file and self.file.size:
            return round(self.file.size / (1024 * 1024), 2)
        return 0