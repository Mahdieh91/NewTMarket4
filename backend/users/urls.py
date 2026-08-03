# users/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, MeView, RegisterView

# ============================================================
# ثبت ViewSetها با DefaultRouter
# ============================================================
router = DefaultRouter()
router.register(r'users', UserViewSet)   # مسیر: /api/users/users/

# ============================================================
# مسیرهای اضافی (غیر از ViewSetها)
# ============================================================
urlpatterns = [
    path('me/', MeView.as_view(), name='me'),              # /api/users/me/
    path('register/', RegisterView.as_view(), name='register'),  # /api/users/register/
]

# ============================================================
# ترکیب مسیرها
# ============================================================
urlpatterns += router.urls