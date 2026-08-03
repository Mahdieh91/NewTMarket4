
from django.db import models

class Campaign(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('active', 'فعال'),
        ('finished', 'پایان یافته'),
    ]
    title = models.CharField(max_length=200, verbose_name='عنوان')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    target_audience = models.CharField(max_length=100, blank=True, null=True, verbose_name='مخاطب هدف')
    start_date = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ شروع')
    end_date = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ پایان')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='وضعیت')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'کمپین'
        verbose_name_plural = 'کمپین‌ها'

    def __str__(self):
        return self.title

class Event(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'پیش رو'),
        ('live', 'در حال برگزاری'),
        ('past', 'برگزار شده'),
    ]
    title = models.CharField(max_length=200, verbose_name='عنوان')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    event_date = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ رویداد')
    link = models.URLField(blank=True, null=True, verbose_name='لینک')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming', verbose_name='وضعیت')

    class Meta:
        verbose_name = 'رویداد'
        verbose_name_plural = 'رویدادها'

    def __str__(self):
        return self.title

class TrustBadge(models.Model):
    name = models.CharField(max_length=100, verbose_name='نام نشان')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    image = models.ImageField(upload_to='badges/', blank=True, null=True, verbose_name='تصویر')

    class Meta:
        verbose_name = 'نشان اعتبار'
        verbose_name_plural = 'نشان‌های اعتبار'

    def __str__(self):
        return self.name
