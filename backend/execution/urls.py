# backend/execution/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ExecutionViewSet


router = DefaultRouter()

router.register(
    r'execution',
    ExecutionViewSet,
    basename='execution',
)


urlpatterns = [
    path(
        '',
        include(router.urls),
    ),
]