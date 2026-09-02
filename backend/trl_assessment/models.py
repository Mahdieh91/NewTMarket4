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
    answers = models.JSONField(default=dict)  # {question_id: {'value': 'yes', 'evidence': '...'}}
    trl = models.PositiveSmallIntegerField()  # عدد 1 تا 9
    status = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        supply_info = f"Supply #{self.supply_id}" if self.supply else "بدون عرضه"
        return f"TRLAssessment {self.id} - TRL {self.trl} - {self.user.username} - {supply_info}"