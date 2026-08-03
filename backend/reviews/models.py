
from django.db import models
from django.conf import settings

class Review(models.Model):
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(default=5, verbose_name='امتیاز (۱-۵)')
    comment = models.TextField(blank=True, null=True, verbose_name='نظر')
    nps_score = models.IntegerField(null=True, blank=True, verbose_name='امتیاز NPS')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'نظر'
        verbose_name_plural = 'نظرات'

    def __str__(self):
        return f"نظر {self.user} برای {self.product}"
