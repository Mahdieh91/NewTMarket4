
from django.db import models
from django.conf import settings

class MarketTrend(models.Model):
    industry = models.ForeignKey('industries.IndustryCategory', on_delete=models.CASCADE, verbose_name='صنعت')
    trend_name = models.CharField(max_length=200, verbose_name='نام روند')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    data_points = models.JSONField(default=list, verbose_name='نقاط داده')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'روند بازار'
        verbose_name_plural = 'روندهای بازار'

    def __str__(self):
        return f"{self.industry} - {self.trend_name}"

class KPI(models.Model):
    CATEGORY_CHOICES = [
        ('conversion', 'نرخ تبدیل'),
        ('retention', 'ماندگاری'),
        ('revenue', 'درآمد'),
        ('satisfaction', 'رضایت'),
        ('matching', 'موفقیت تطبیق'),
    ]
    name = models.CharField(max_length=200, verbose_name='نام شاخص')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name='دسته‌بندی')
    value = models.FloatField(verbose_name='مقدار')
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'شاخص کلیدی'
        verbose_name_plural = 'شاخص‌های کلیدی'

    def __str__(self):
        return f"{self.name}: {self.value}"
