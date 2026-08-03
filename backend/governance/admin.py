from django.contrib import admin
from .models import PlatformSettings
from .models import QualityControl

admin.site.register(PlatformSettings)
admin.site.register(QualityControl)