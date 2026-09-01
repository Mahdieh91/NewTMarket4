# ============================================================
# matching/models.py
# ============================================================

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class MatchResult(models.Model):
    """
    مدل ذخیره نتایج تطبیق بین نیاز و عرضه (Supply)
    """
    
    STATUS_CHOICES = [
        ('pending', 'در انتظار بررسی'),
        ('approved', 'تأیید شده'),
        ('rejected', 'رد شده'),
        ('expired', 'منقضی شده'),
    ]
    
    need = models.ForeignKey(
        'needs.Need',
        on_delete=models.CASCADE,
        related_name='match_results',
        verbose_name='نیاز'
    )
    
    product = models.ForeignKey(
        'products.Supply',
        on_delete=models.CASCADE,
        related_name='match_results',
        verbose_name='عرضه'
    )
    
    score = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0,
        verbose_name='امتیاز تطبیق'
    )
    
    match_percentage = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0,
        verbose_name='درصد تطبیق'
    )
    
    reason = models.TextField(
        blank=True,
        null=True,
        verbose_name='دلیل تطبیق'
    )
    
    recommended_actions = models.TextField(
        blank=True,
        null=True,
        verbose_name='اقدامات پیشنهادی'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='وضعیت'
    )
    
    user_rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='امتیاز کاربر'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاریخ ایجاد'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='تاریخ بروزرسانی'
    )
    
    class Meta:
        verbose_name = 'نتیجه تطبیق'
        verbose_name_plural = 'نتایج تطبیق'
        ordering = ['-match_percentage', '-score']
        unique_together = ['need', 'product']
        
    def __str__(self):
        return f'تطبیق {self.need.title} - {self.product.title} ({self.match_percentage}%)'
    
    @property
    def is_high_match(self):
        return self.match_percentage >= 80
    
    @property
    def is_medium_match(self):
        return 60 <= self.match_percentage < 80
    
    @property
    def is_low_match(self):
        return self.match_percentage < 60


class MatchingRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار پردازش'),
        ('processing', 'در حال پردازش'),
        ('completed', 'تکمیل شده'),
        ('failed', 'ناموفق'),
        ('partial', 'تأمین ناقص'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'کم'),
        ('medium', 'متوسط'),
        ('high', 'زیاد'),
        ('urgent', 'فوری'),
    ]
    
    need = models.ForeignKey(
        'needs.Need',
        on_delete=models.CASCADE,
        related_name='matching_requests',
        verbose_name='نیاز'
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='matching_requests',
        verbose_name='کاربر درخواست‌کننده'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='وضعیت'
    )
    
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name='اولویت'
    )
    
    total_matches = models.PositiveIntegerField(
        default=0,
        verbose_name='تعداد کل تطبیق‌ها'
    )
    
    error_message = models.TextField(
        blank=True,
        null=True,
        verbose_name='پیام خطا'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاریخ ایجاد'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='تاریخ بروزرسانی'
    )
    
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='تاریخ تکمیل'
    )
    
    class Meta:
        verbose_name = 'درخواست تطبیق'
        verbose_name_plural = 'درخواست‌های تطبیق'
        ordering = ['-created_at']
        
    def __str__(self):
        return f'درخواست تطبیق #{self.id} - {self.need.title}'
    
    def mark_completed(self):
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])
    
    def mark_failed(self, error_message=None):
        self.status = 'failed'
        if error_message:
            self.error_message = error_message
        self.save(update_fields=['status', 'error_message'])