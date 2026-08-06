# ============================================================
# needs/urls.py (نسخه نهایی - بدون router)
# ============================================================
from django.urls import path
from .views import NeedViewSet

urlpatterns = [
    path('', NeedViewSet.as_view({'get': 'list', 'post': 'create'}), name='need-list'),
    path('<int:pk>/', NeedViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='need-detail'),
]