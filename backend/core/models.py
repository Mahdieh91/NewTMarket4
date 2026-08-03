
from django.db import models
from django.conf import settings

class UserDocument(models.Model):
    DOCUMENT_TYPES = [
        ('id_card', 'کارت ملی'),
        ('registration', 'اسناد ثبتی'),
        ('license', 'مجوز یا پروانه'),
        ('representative', 'معرفی‌نامه نماینده'),
        ('other', 'سایر'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, default='other', verbose_name='نوع مدرک')
    title = models.CharField(max_length=200, verbose_name='عنوان')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    file = models.FileField(upload_to='documents/', verbose_name='فایل')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=False, verbose_name='تأیید شده')

    class Meta:
        verbose_name = 'مستند کاربر'
        verbose_name_plural = 'مستندات کاربران'

    def __str__(self):
        return f"{self.user} - {self.title}"
