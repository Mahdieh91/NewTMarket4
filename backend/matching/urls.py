# ============================================================
# matching/urls.py
# ============================================================

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MatchResultViewSet, MatchingRequestViewSet

# ایجاد router
router = DefaultRouter()

# ثبت ViewSetها
router.register(r'results', MatchResultViewSet, basename='match-result')
router.register(r'requests', MatchingRequestViewSet, basename='matching-request')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]

# نام اپ برای namespace
app_name = 'matching'