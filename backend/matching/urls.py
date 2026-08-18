# matching/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import MatchResultViewSet


router = DefaultRouter()

router.register(
    r'results',
    MatchResultViewSet,
    basename='match-result',
)

urlpatterns = [
    path('', include(router.urls)),
]