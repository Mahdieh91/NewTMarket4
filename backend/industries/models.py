
from django.db import models

class IndustryCategory(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='نام صنعت')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children', verbose_name='دسته والد')
    keywords = models.TextField(blank=True, null=True, verbose_name='کلیدواژه‌ها')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    icon = models.ImageField(upload_to='industries/icons/', blank=True, null=True, verbose_name='آیکون')

    class Meta:
        verbose_name = 'دسته صنعت'
        verbose_name_plural = 'دسته‌های صنعت'

    def __str__(self):
        return self.name
