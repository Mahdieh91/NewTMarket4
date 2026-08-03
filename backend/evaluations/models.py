
from django.db import models
from django.conf import settings

class Evaluation(models.Model):
    DECISION_CHOICES = [
        ('approved', 'تأیید برای انتشار'),
        ('conditional', 'تأیید مشروط'),
        ('needs_info', 'نیازمند تکمیل اطلاعات'),
        ('rejected', 'رد درخواست'),
        ('referred', 'ارجاع به ارزیاب تخصصی'),
    ]
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, null=True, blank=True)
    need = models.ForeignKey('needs.Need', on_delete=models.CASCADE, null=True, blank=True)
    evaluator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='evaluations')
    comments = models.TextField(blank=True, null=True, verbose_name='یادداشت ارزیاب')
    quality_score = models.IntegerField(default=0, verbose_name='امتیاز کیفیت')
    risk_score = models.IntegerField(default=0, verbose_name='امتیاز ریسک')
    market_readiness_score = models.IntegerField(default=0, verbose_name='امتیاز آمادگی بازار')
    final_decision = models.CharField(max_length=20, choices=DECISION_CHOICES, default='needs_info', verbose_name='تصمیم نهایی')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'ارزیابی'
        verbose_name_plural = 'ارزیابی‌ها'

    def __str__(self):
        return f"ارزیابی #{self.id}"
