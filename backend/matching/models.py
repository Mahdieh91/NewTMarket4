from django.db import models
from django.db.models import Q


class MatchResult(models.Model):
    need = models.ForeignKey(
        'needs.Need',
        on_delete=models.CASCADE,
        related_name='matches',
        verbose_name='نیاز',
    )

    # --------------------------------------------------------
    # Legacy / Product matching
    # --------------------------------------------------------

    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='matches',
        null=True,
        blank=True,
        verbose_name='محصول',
    )

    # --------------------------------------------------------
    # Current marketplace matching
    # --------------------------------------------------------

    supply = models.ForeignKey(
        'products.Supply',
        on_delete=models.CASCADE,
        related_name='match_results',
        null=True,
        blank=True,
        verbose_name='عرضه',
    )

    score = models.FloatField(
        default=0.0,
        verbose_name='درصد انطباق',
    )

    reason = models.TextField(
        blank=True,
        null=True,
        verbose_name='دلیل پیشنهاد',
    )

    recommended_actions = models.TextField(
        blank=True,
        null=True,
        verbose_name='اقدامات پیشنهادی',
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        verbose_name = 'نتیجه تطبیق'
        verbose_name_plural = 'نتایج تطبیق'

        constraints = [
            models.UniqueConstraint(
                fields=['need', 'product'],
                condition=Q(product__isnull=False),
                name='unique_need_product_match',
            ),
            models.UniqueConstraint(
                fields=['need', 'supply'],
                condition=Q(supply__isnull=False),
                name='unique_need_supply_match',
            ),
        ]

    def __str__(self):
        target = self.supply or self.product or 'Unknown'
        return f"{self.need} ↔ {target} ({self.score}%)"