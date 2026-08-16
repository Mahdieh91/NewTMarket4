# products/models.py

from django.db import models
from django.conf import settings
from ckeditor.fields import RichTextField


# ============================================================
# Product
# ============================================================

class Product(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('submitted', 'ارسال برای بررسی'),
        ('evaluating', 'در حال ارزیابی'),
        ('needs_revision', 'نیازمند اصلاح'),
        ('approved', 'تأیید شده'),
        ('published', 'منتشر شده'),
        ('suspended', 'تعلیق شده'),
        ('in_negotiation', 'در حال مذاکره'),
        ('contracted', 'دارای قرارداد'),
        ('executing', 'در حال اجرا'),
        ('completed', 'تکمیل شده'),
    ]

    CATEGORY_CHOICES = [
        ('product', 'محصول'),
        ('service', 'خدمت'),
    ]

    TRL_CHOICES = [
        (i, f'TRL {i}')
        for i in range(1, 10)
    ]

    MRL_CHOICES = [
        (i, f'MRL {i}')
        for i in range(1, 10)
    ]

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products'
    )

    title = models.CharField(
        max_length=200,
        verbose_name='عنوان'
    )

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='product',
        verbose_name='نوع'
    )

    industry = models.ForeignKey(
        'industries.IndustryCategory',
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='صنعت'
    )

    short_description = models.TextField(
        verbose_name='توضیح کوتاه'
    )

    full_description = RichTextField(
        blank=True,
        null=True,
        verbose_name='توضیح کامل'
    )

    problem_solved = models.TextField(
        blank=True,
        null=True,
        verbose_name='مسئله حل شده'
    )

    competitive_advantage = models.TextField(
        blank=True,
        null=True,
        verbose_name='مزیت رقابتی'
    )

    technical_specs = models.TextField(
        blank=True,
        null=True,
        verbose_name='مشخصات فنی'
    )

    trl = models.IntegerField(
        choices=TRL_CHOICES,
        default=1,
        verbose_name='سطح آمادگی فناوری'
    )

    mrl = models.IntegerField(
        choices=MRL_CHOICES,
        default=1,
        verbose_name='سطح آمادگی بازار'
    )

    pricing_model = models.TextField(
        blank=True,
        null=True,
        verbose_name='مدل قیمت‌گذاری'
    )

    price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='قیمت (تومان)'
    )

    ip_status = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='وضعیت مالکیت فکری'
    )

    documentation = models.FileField(
        upload_to='products/docs/',
        blank=True,
        null=True,
        verbose_name='مستندات'
    )

    image = models.ImageField(
        upload_to='products/images/',
        blank=True,
        null=True,
        verbose_name='تصویر'
    )

    video = models.URLField(
        blank=True,
        null=True,
        verbose_name='ویدیو معرفی'
    )

    certificates = models.FileField(
        upload_to='products/certs/',
        blank=True,
        null=True,
        verbose_name='گواهی‌ها'
    )

    sample_customers = models.TextField(
        blank=True,
        null=True,
        verbose_name='نمونه مشتریان'
    )

    capacity = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='ظرفیت ارائه'
    )

    collaboration_terms = models.TextField(
        blank=True,
        null=True,
        verbose_name='شرایط همکاری'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name='وضعیت'
    )

    view_count = models.IntegerField(
        default=0,
        verbose_name='تعداد بازدید'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        verbose_name = 'محصول'
        verbose_name_plural = 'محصولات'

    def __str__(self):
        return self.title


# ============================================================
# Supply
# ============================================================

class Supply(models.Model):

    SUPPLY_TYPE_CHOICES = [
        ('product', 'محصول'),
        ('service', 'خدمت'),
    ]

    STATUS_CHOICES = [
        ('pending', 'در انتظار بررسی'),
        ('approved', 'تأیید شده'),
        ('rejected', 'رد شده'),
        ('draft', 'پیش‌نویس'),
        ('submitted', 'ارسال برای بررسی'),
        ('evaluating', 'در حال ارزیابی'),
        ('needs_revision', 'نیازمند اصلاح'),
        ('published', 'منتشر شده'),
        ('suspended', 'تعلیق شده'),
    ]

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='supplies',
        verbose_name='فروشنده'
    )

    title = models.CharField(
        max_length=200,
        verbose_name='عنوان'
    )

    supply_type = models.CharField(
        max_length=20,
        choices=SUPPLY_TYPE_CHOICES,
        default='product',
        verbose_name='نوع عرضه'
    )

    category = models.CharField(
        max_length=100,
        verbose_name='دسته‌بندی'
    )

    industry = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='صنعت'
    )

    technology = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='فناوری'
    )

    city = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='شهر'
    )

    description = models.TextField(
        verbose_name='توضیحات'
    )

    quantity = models.CharField(
        max_length=50,
        verbose_name='مقدار'
    )

    unit = models.CharField(
        max_length=50,
        verbose_name='واحد'
    )

    price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name='قیمت (تومان)'
    )

    trl = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='سطح آمادگی فناوری'
    )

    documents = models.JSONField(
        default=list,
        blank=True,
        verbose_name='مستندات'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='وضعیت'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        verbose_name = 'عرضه'
        verbose_name_plural = 'عرضه‌ها'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


# ============================================================
# Supply Image
# ============================================================

def supply_image_path(instance, filename):
    return (
        f'supplies/images/'
        f'{instance.supply.seller.id}/'
        f'{instance.supply.id}/'
        f'{filename}'
    )


class SupplyImage(models.Model):

    supply = models.ForeignKey(
        Supply,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='عرضه'
    )

    image = models.ImageField(
        upload_to=supply_image_path,
        verbose_name='تصویر'
    )

    caption = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='عنوان تصویر'
    )

    is_primary = models.BooleanField(
        default=False,
        verbose_name='تصویر اصلی'
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاریخ آپلود'
    )

    class Meta:
        verbose_name = 'تصویر عرضه'
        verbose_name_plural = 'تصاویر عرضه'
        ordering = ['-is_primary', 'uploaded_at']

    def __str__(self):
        return f'تصویر {self.supply.title} #{self.id}'