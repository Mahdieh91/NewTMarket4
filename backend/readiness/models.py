
from django.db import models
from django.conf import settings

class MarketReadiness(models.Model):
    product = models.OneToOneField('products.Product', on_delete=models.CASCADE, related_name='readiness')
    market_readiness_score = models.FloatField(default=0.0, verbose_name='امتیاز آمادگی بازار')
    market_fit_score = models.FloatField(default=0.0, verbose_name='امتیاز تطابق بازار')
    demand_forecast = models.JSONField(default=dict, verbose_name='پیش‌بینی تقاضا')
    competitive_position = models.TextField(blank=True, null=True, verbose_name='موقعیت رقابتی')
    recommended_actions = models.TextField(blank=True, null=True, verbose_name='پیشنهاد اصلاح')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'سنجش بازارپذیری'
        verbose_name_plural = 'سنجش بازارپذیری'
