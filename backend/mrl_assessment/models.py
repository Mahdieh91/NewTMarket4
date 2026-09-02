# mrl_assessment/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class MRLAssessment(models.Model):
    """
    مدل ارزیابی سطح آمادگی تولید (MRL)
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mrl_assessments'
    )
    supply = models.ForeignKey(
        'products.Supply',
        on_delete=models.CASCADE,
        related_name='mrl_assessments',
        null=True,
        blank=True
    )
    answers = models.JSONField(default=dict)  # {question_id: {'value': 'yes', 'evidence': '...'}}
    mrl = models.PositiveSmallIntegerField()  # عدد 1 تا 10
    status = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        supply_info = f"Supply #{self.supply_id}" if self.supply else "بدون عرضه"
        return f"MRLAssessment {self.id} - MRL {self.mrl} - {self.user.username} - {supply_info}"