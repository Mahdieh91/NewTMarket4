# matching/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import MatchResultViewSet, NeedMatchViewSet

router = DefaultRouter()

router.register(r'results', MatchResultViewSet, basename='match-result')
router.register(r'needs', NeedMatchViewSet, basename='need-match')

urlpatterns = [
    path('', include(router.urls)),
]