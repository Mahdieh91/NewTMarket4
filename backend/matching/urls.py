# ============================================================
# matching/urls.py
# ============================================================

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MatchResultViewSet, MatchingRequestViewSet, NeedMatchingViewSet

router = DefaultRouter()
router.register(r'results', MatchResultViewSet, basename='match-result')
router.register(r'requests', MatchingRequestViewSet, basename='matching-request')
router.register(r'needs', NeedMatchingViewSet, basename='need-matching')  # جدید

urlpatterns = [
    path('', include(router.urls)),
]