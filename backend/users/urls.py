# ============================================================
# users/urls.py
# نسخه نهایی
# ============================================================

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    UserViewSet,
    MeView,
    RegisterView,
    ProfileView,
    CaptchaTokenObtainPairView,
)

from .captcha import CaptchaChallengeView


# ============================================================
# Router
# ============================================================

router = DefaultRouter()

router.register(
    r"users",
    UserViewSet
)


# ============================================================
# URL Patterns
# ============================================================

urlpatterns = [

    # --------------------------------------------------------
    # User
    # --------------------------------------------------------

    path(
        "me/",
        MeView.as_view(),
        name="me"
    ),

    path(
        "register/",
        RegisterView.as_view(),
        name="register"
    ),

    path(
        "profile/",
        ProfileView.as_view(),
        name="profile"
    ),

    # --------------------------------------------------------
    # CAPTCHA
    # --------------------------------------------------------

    path(
        "captcha/challenge/",
        CaptchaChallengeView.as_view(),
        name="captcha-challenge"
    ),

    # --------------------------------------------------------
    # Login with CAPTCHA
    # --------------------------------------------------------

    path(
        "token/",
        CaptchaTokenObtainPairView.as_view(),
        name="token-obtain-pair-captcha"
    ),
]


# ============================================================
# Router URLs
# ============================================================

urlpatterns += router.urls