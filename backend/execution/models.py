
from django.db import models
from django.conf import settings

class Execution(models.Model):
    STATUS_CHOICES = [
        ('not_started', 'شروع نشده'),
        ('in_progress', 'در حال انجام'),
        ('awaiting_approval', 'در انتظار تأیید'),
        ('needs_revision', 'نیازمند اصلاح'),
        ('completed', 'تکمیل شده'),
        ('suspended', 'متوقف شده'),
        ('disputed', 'وارد اختلاف شده'),
    ]
    contract = models.OneToOneField('contracts.Contract', on_delete=models.CASCADE, related_name='execution')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started', verbose_name='وضعیت')
    progress_percent = models.IntegerField(default=0, verbose_name='درصد پیشرفت')
    start_date = models.DateField(null=True, blank=True, verbose_name='تاریخ شروع')
    expected_end_date = models.DateField(null=True, blank=True, verbose_name='تاریخ پایان پیش‌بینی شده')
    actual_end_date = models.DateField(null=True, blank=True, verbose_name='تاریخ پایان واقعی')
    final_score = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True, verbose_name='امتیاز نهایی')
    notes = models.TextField(blank=True, null=True, verbose_name='یادداشت‌ها')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'اجرا'
        verbose_name_plural = 'اجراها'

    def __str__(self):
        return f"اجرا #{self.id} - {self.contract}"
