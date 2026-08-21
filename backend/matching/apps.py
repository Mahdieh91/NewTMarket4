# ============================================================
# matching/apps.py
# ============================================================

from django.apps import AppConfig


class MatchingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'matching'
    verbose_name = 'سیستم تطبیق'
    
    def ready(self):
        # ایمپورت signals در صورت نیاز
        pass