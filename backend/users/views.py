# ============================================================
# users/views.py
# کلیه Viewهای مربوط به کاربران + CAPTCHA + بررسی approval_status
# ============================================================

import logging
from rest_framework import viewsets, generics, permissions, filters, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django_filters.rest_framework import DjangoFilterBackend
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from .captcha import MathCaptcha

logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'kyc_status', 'is_legal']
    search_fields = ['username', 'email', 'company_name', 'expertise']
    ordering_fields = '__all__'


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ============================================================
# CAPTCHA Viewها
# ============================================================

class CaptchaChallengeView(APIView):
    """
    GET /api/users/captcha/challenge/
    ایجاد چالش جدید کپچا و بازگرداندن سؤال
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.session.session_key:
            request.session.create()
        session_key = request.session.session_key
        question = MathCaptcha.create_challenge(session_key)
        return Response({
            'question': question,
        })


# ============================================================
# سریالایزر توکن با کپچا و بررسی تأیید ادمین
# ============================================================
class CaptchaTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    سریالایزر توکن با اعتبارسنجی کپچا و تأیید ادمین
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['captcha_answer'] = serializers.CharField(
            write_only=True,
            required=True,
            help_text="پاسخ کپچا"
        )

    def validate(self, attrs):
        request = self.context.get('request')

        # ۱. بررسی Session کپچا
        if not request or not request.session.session_key:
            raise serializers.ValidationError(
                {"captcha_answer": "نشست معتبر برای کپچا وجود ندارد."}
            )

        session_key = request.session.session_key
        captcha_answer = attrs.pop('captcha_answer', '')

        # ۲. بررسی CAPTCHA
        if not MathCaptcha.verify(session_key, captcha_answer):
            raise serializers.ValidationError(
                {"captcha_answer": "پاسخ کپچا اشتباه است. لطفاً دوباره تلاش کنید."}
            )

        # ۳. احراز هویت معمولی (بررسی username/password)
        data = super().validate(attrs)
        user = self.user

        # ۴. بررسی تأیید ادمین (جدید)
        if user.approval_status == 'pending':
            raise serializers.ValidationError({
                "code": "pending_approval",
                "detail": (
                    "ثبت‌نام شما با موفقیت انجام شده است، "
                    "اما هنوز توسط مدیر سامانه تأیید نشده است. "
                    "پس از تأیید مدیر، می‌توانید وارد سامانه شوید."
                )
            })

        if user.approval_status == 'rejected':
            raise serializers.ValidationError({
                "code": "rejected_approval",
                "detail": (
                    "ثبت‌نام شما توسط مدیر سامانه تأیید نشده است. "
                    "لطفاً با پشتیبانی تماس بگیرید."
                )
            })

        # ۵. فقط کاربران با approval_status='approved' اجازه دریافت JWT دارند
        return data


class CaptchaTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/users/token/
    دریافت توکن با اعتبارسنجی کپچا و تأیید ادمین
    """
    serializer_class = CaptchaTokenObtainPairSerializer