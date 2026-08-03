
from django.db import models
from django.conf import settings

class MatchResult(models.Model):
    need = models.ForeignKey('needs.Need', on_delete=models.CASCADE, related_name='matches')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='matches')
    score = models.FloatField(default=0.0, verbose_name='درصد انطباق')
    reason = models.TextField(blank=True, null=True, verbose_name='دلیل پیشنهاد')
    recommended_actions = models.TextField(blank=True, null=True, verbose_name='اقدامات پیشنهادی')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('need', 'product')
        verbose_name = 'نتیجه تطبیق'
        verbose_name_plural = 'نتایج تطبیق'

    def __str__(self):
        return f"{self.need} ↔ {self.product} ({self.score}%)"
