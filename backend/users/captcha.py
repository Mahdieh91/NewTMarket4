# ============================================================
# users/captcha.py
# CAPTCHA ساده ریاضی
# ============================================================

import random
import uuid

from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class MathCaptcha:
    """
    مدیریت تولید و اعتبارسنجی CAPTCHA ریاضی
    """

    CACHE_TIMEOUT = 120

    @staticmethod
    def generate():
        """
        تولید سؤال ریاضی
        """

        a = random.randint(1, 20)
        b = random.randint(1, 20)

        operator = random.choice(["+", "-"])

        if operator == "+":
            answer = a + b
            question = f"{a} + {b} = ?"

        else:
            # برای جلوگیری از جواب منفی
            if a < b:
                a, b = b, a

            answer = a - b
            question = f"{a} - {b} = ?"

        return question, answer

    @staticmethod
    def create_challenge(session_key):
        """
        ایجاد CAPTCHA جدید و ذخیره پاسخ در Cache
        """

        question, answer = MathCaptcha.generate()

        cache_key = f"captcha_{session_key}"

        cache.set(
            cache_key,
            str(answer),
            timeout=MathCaptcha.CACHE_TIMEOUT
        )

        return question

    @staticmethod
    def verify(session_key, user_answer):
        """
        بررسی پاسخ CAPTCHA
        """

        cache_key = f"captcha_{session_key}"

        stored_answer = cache.get(cache_key)

        if stored_answer is None:
            return False

        # CAPTCHA یک‌بارمصرف است
        cache.delete(cache_key)

        return str(user_answer).strip() == str(stored_answer).strip()


class CaptchaChallengeView(APIView):
    """
    GET:
        ایجاد CAPTCHA جدید

    URL:
        /api/users/captcha/challenge/
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        """
        تولید challenge جدید
        """

        # یک شناسه تصادفی برای این CAPTCHA
        session_key = uuid.uuid4().hex

        question = MathCaptcha.create_challenge(
            session_key
        )

        return Response(
            {
                "question": question,
                "session_key": session_key,
            },
            status=status.HTTP_200_OK
        )