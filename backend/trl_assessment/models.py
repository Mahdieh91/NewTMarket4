# trl_assessment/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class TRLAssessment(models.Model):
    """
    مدل ارزیابی سطح آمادگی فناوری (TRL)
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='trl_assessments'
    )
    supply = models.ForeignKey(
        'products.Supply',
        on_delete=models.CASCADE,
        related_name='trl_assessments',
        null=True,
        blank=True
    )
    answers = models.JSONField(default=dict)
    trl = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "ارزیابی TRL"
        verbose_name_plural = "ارزیابی‌های TRL"

    def __str__(self):
        supply_info = f"Supply #{self.supply_id}" if self.supply else "بدون عرضه"
        return f"TRLAssessment {self.id} - TRL {self.trl} - {self.user.username} - {supply_info}"