
from django.db import models
from django.conf import settings

class Invoice(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار پرداخت'),
        ('paid', 'پرداخت شده'),
        ('cancelled', 'لغو شده'),
    ]
    contract = models.ForeignKey('contracts.Contract', on_delete=models.CASCADE, related_name='invoices')
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='مبلغ')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='وضعیت')
    payment_method = models.CharField(max_length=50, blank=True, null=True, verbose_name='روش پرداخت')
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ پرداخت')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'فاکتور'
        verbose_name_plural = 'فاکتورها'

    def __str__(self):
        return f"فاکتور #{self.id}"

class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('completed', 'تکمیل شده'),
        ('failed', 'ناموفق'),
    ]
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='مبلغ')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='وضعیت')
    transaction_id = models.CharField(max_length=100, blank=True, null=True, verbose_name='شناسه تراکنش')
    gateway = models.CharField(max_length=50, blank=True, null=True, verbose_name='درگاه پرداخت')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'پرداخت'
        verbose_name_plural = 'پرداخت‌ها'

    def __str__(self):
        return f"پرداخت #{self.id}"
