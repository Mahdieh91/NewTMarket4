from django.db import models
from django.conf import settings


class Negotiation(models.Model):
    STATUS_CHOICES = [
        ('created', 'ایجاد شده'),
        ('in_progress', 'در حال مکاتبه'),
        ('awaiting_proposal', 'در انتظار پیشنهاد'),
        ('proposal_sent', 'پیشنهاد ارسال شده'),
        ('under_review', 'در حال بررسی'),
        ('accepted', 'پذیرفته شده'),
        ('rejected', 'رد شده'),
        ('contracted', 'ورود به قرارداد'),
    ]

    supply = models.ForeignKey(
        'products.Supply',
        on_delete=models.CASCADE,
        related_name='negotiations',
    )

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='negotiations_as_buyer',
    )

    supplier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='negotiations_as_supplier',
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='created',
    )

    context_meta = models.JSONField(default=dict)

    context_title = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    expired_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    @property
    def product(self):
        return self.supply

    def __str__(self):
        return (
            self.context_title
            or self.supply.title
            or f"مذاکره #{self.id}"
        )


class Message(models.Model):

    negotiation = models.ForeignKey(
        Negotiation,
        on_delete=models.CASCADE,
        related_name='messages',
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='negotiation_messages',
    )

    text = models.TextField(
        blank=True,
        default='',
    )

    file = models.FileField(
        upload_to='negotiation_files/%Y/%m/',
        null=True,
        blank=True,
    )

    file_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    timestamp = models.DateTimeField(auto_now_add=True)

    read_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replies',
    )

    class Meta:
        db_table = 'negotiations_negotiationmessage'
        ordering = ['timestamp', 'id']

    def __str__(self):
        return f"پیام #{self.id}"