# products/models.py
from django.db import models
from django.conf import settings
from ckeditor.fields import RichTextField


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
    CATEGORY_CHOICES = [('product', 'محصول'), ('service', 'خدمت')]
    TRL_CHOICES = [(i, f'TRL {i}') for i in range(1, 10)]
    MRL_CHOICES = [(i, f'MRL {i}') for i in range(1, 10)]

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='products')
    title = models.CharField(max_length=200, verbose_name='عنوان')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='product', verbose_name='نوع')
    industry = models.ForeignKey('industries.IndustryCategory', on_delete=models.SET_NULL, null=True, verbose_name='صنعت')
    short_description = models.TextField(verbose_name='توضیح کوتاه')
    full_description = RichTextField(blank=True, null=True, verbose_name='توضیح کامل')
    problem_solved = models.TextField(blank=True, null=True, verbose_name='مسئله حل شده')
    competitive_advantage = models.TextField(blank=True, null=True, verbose_name='مزیت رقابتی')
    technical_specs = models.TextField(blank=True, null=True, verbose_name='مشخصات فنی')
    trl = models.IntegerField(choices=TRL_CHOICES, default=1, verbose_name='سطح آمادگی فناوری')
    mrl = models.IntegerField(choices=MRL_CHOICES, default=1, verbose_name='سطح آمادگی بازار')
    pricing_model = models.TextField(blank=True, null=True, verbose_name='مدل قیمت‌گذاری')
    price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name='قیمت (تومان)')
    ip_status = models.CharField(max_length=100, blank=True, null=True, verbose_name='وضعیت مالکیت فکری')
    documentation = models.FileField(upload_to='products/docs/', blank=True, null=True, verbose_name='مستندات')
    image = models.ImageField(upload_to='products/images/', blank=True, null=True, verbose_name='تصویر')
    video = models.URLField(blank=True, null=True, verbose_name='ویدیو معرفی')
    certificates = models.FileField(upload_to='products/certs/', blank=True, null=True, verbose_name='گواهی‌ها')
    sample_customers = models.TextField(blank=True, null=True, verbose_name='نمونه مشتریان')
    capacity = models.CharField(max_length=100, blank=True, null=True, verbose_name='ظرفیت ارائه')
    collaboration_terms = models.TextField(blank=True, null=True, verbose_name='شرایط همکاری')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='وضعیت')
    view_count = models.IntegerField(default=0, verbose_name='تعداد بازدید')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'محصول'
        verbose_name_plural = 'محصولات'

    def __str__(self):
        return self.title


# ============================================================
# مدل عرضه (Supply) – برای ثبت درخواست‌های فروش
# ============================================================
class Supply(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار تأیید'),   # جدید
        ('approved', 'تأیید شده'),        # جدید
        ('rejected', 'رد شده'),           # جدید
        ('draft', 'پیش‌نویس'),
        ('submitted', 'ارسال برای بررسی'),
        ('evaluating', 'در حال ارزیابی'),
        ('needs_revision', 'نیازمند اصلاح'),
        ('published', 'منتشر شده'),
        ('suspended', 'تعلیق شده'),
        # ... بقیه وضعیت‌ها
    ]

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='supplies')
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    industry = models.CharField(max_length=100, blank=True)
    technology = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    quantity = models.CharField(max_length=50)
    unit = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name='قیمت (تومان)')
    trl = models.CharField(max_length=10, blank=True)
    documents = models.JSONField(default=list, blank=True)  # لیست آدرس‌های مستندات
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'عرضه'
        verbose_name_plural = 'عرضه‌ها'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


# ============================================================
# مدل تصاویر عرضه (SupplyImage) – برای آپلود واقعی
# ============================================================
def supply_image_path(instance, filename):
    # مسیر ذخیره: supplies/images/user_id/supply_id/filename
    return f'supplies/images/{instance.supply.seller.id}/{instance.supply.id}/{filename}'


class SupplyImage(models.Model):
    supply = models.ForeignKey(Supply, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=supply_image_path, verbose_name='تصویر')
    caption = models.CharField(max_length=200, blank=True, null=True, verbose_name='عنوان')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'تصویر عرضه'
        verbose_name_plural = 'تصاویر عرضه'
        ordering = ['uploaded_at']

    def __str__(self):
        return f'تصویر {self.supply.title} #{self.id}'# products/models.py
from django.db import models
from django.conf import settings
from ckeditor.fields import RichTextField


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
    CATEGORY_CHOICES = [('product', 'محصول'), ('service', 'خدمت')]
    TRL_CHOICES = [(i, f'TRL {i}') for i in range(1, 10)]
    MRL_CHOICES = [(i, f'MRL {i}') for i in range(1, 10)]

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='products')
    title = models.CharField(max_length=200, verbose_name='عنوان')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='product', verbose_name='نوع')
    industry = models.ForeignKey('industries.IndustryCategory', on_delete=models.SET_NULL, null=True, verbose_name='صنعت')
    short_description = models.TextField(verbose_name='توضیح کوتاه')
    full_description = RichTextField(blank=True, null=True, verbose_name='توضیح کامل')
    problem_solved = models.TextField(blank=True, null=True, verbose_name='مسئله حل شده')
    competitive_advantage = models.TextField(blank=True, null=True, verbose_name='مزیت رقابتی')
    technical_specs = models.TextField(blank=True, null=True, verbose_name='مشخصات فنی')
    trl = models.IntegerField(choices=TRL_CHOICES, default=1, verbose_name='سطح آمادگی فناوری')
    mrl = models.IntegerField(choices=MRL_CHOICES, default=1, verbose_name='سطح آمادگی بازار')
    pricing_model = models.TextField(blank=True, null=True, verbose_name='مدل قیمت‌گذاری')
    price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name='قیمت (تومان)')
    ip_status = models.CharField(max_length=100, blank=True, null=True, verbose_name='وضعیت مالکیت فکری')
    documentation = models.FileField(upload_to='products/docs/', blank=True, null=True, verbose_name='مستندات')
    image = models.ImageField(upload_to='products/images/', blank=True, null=True, verbose_name='تصویر')
    video = models.URLField(blank=True, null=True, verbose_name='ویدیو معرفی')
    certificates = models.FileField(upload_to='products/certs/', blank=True, null=True, verbose_name='گواهی‌ها')
    sample_customers = models.TextField(blank=True, null=True, verbose_name='نمونه مشتریان')
    capacity = models.CharField(max_length=100, blank=True, null=True, verbose_name='ظرفیت ارائه')
    collaboration_terms = models.TextField(blank=True, null=True, verbose_name='شرایط همکاری')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='وضعیت')
    view_count = models.IntegerField(default=0, verbose_name='تعداد بازدید')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'محصول'
        verbose_name_plural = 'محصولات'

    def __str__(self):
        return self.title


# ============================================================
# مدل عرضه (Supply) – برای ثبت درخواست‌های فروش با وضعیت‌های اصلاح‌شده
# ============================================================
class Supply(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار بررسی'),      # عرضه جدید
        ('approved', 'تأیید شده'),           # تأیید توسط مدیر
        ('rejected', 'رد شده'),              # رد توسط مدیر
        ('draft', 'پیش‌نویس'),               # ویرایش توسط فروشنده
        ('submitted', 'ارسال برای بررسی'),   # ارسال مجدد
        ('evaluating', 'در حال ارزیابی'),    # بررسی کارشناس
        ('needs_revision', 'نیازمند اصلاح'), # نیاز به اصلاح
        ('published', 'منتشر شده'),          # نهایی و منتشر شده
        ('suspended', 'تعلیق شده'),          # تعلیق موقت
    ]

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='supplies')
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    industry = models.CharField(max_length=100, blank=True)
    technology = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    quantity = models.CharField(max_length=50)
    unit = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name='قیمت (تومان)')
    trl = models.CharField(max_length=10, blank=True)
    documents = models.JSONField(default=list, blank=True)  # لیست آدرس‌های مستندات
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'عرضه'
        verbose_name_plural = 'عرضه‌ها'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


# ============================================================
# مدل تصاویر عرضه (SupplyImage) – برای آپلود واقعی
# ============================================================
def supply_image_path(instance, filename):
    return f'supplies/images/{instance.supply.seller.id}/{instance.supply.id}/{filename}'


class SupplyImage(models.Model):
    supply = models.ForeignKey(Supply, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=supply_image_path, verbose_name='تصویر')
    caption = models.CharField(max_length=200, blank=True, null=True, verbose_name='عنوان')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'تصویر عرضه'
        verbose_name_plural = 'تصاویر عرضه'
        ordering = ['uploaded_at']

    def __str__(self):
        return f'تصویر {self.supply.title} #{self.id}'