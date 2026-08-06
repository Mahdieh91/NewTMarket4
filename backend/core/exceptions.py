# core/exceptions.py
import logging
from django.conf import settings
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError as DRFValidationError,
)
from django.core.exceptions import ValidationError as DjangoValidationError

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Exception handler سفارشی برای DRF با ساختار مرحله‌ای:
    1. خطاهای احراز هویت (Authentication) – بدون تغییر (سازگاری با JWT)
    2. خطاهای اعتبارسنجی (Validation) – با جزئیات کامل
    3. سایر خطاهای DRF (404, 405, ...) – با پیام استاندارد
    4. خطاهای غیرمنتظره (500) – با لاگ‌گیری و عدم نمایش جزئیات در Production
    """
    # ============================================================
    # مرحله ۱: دریافت پاسخ استاندارد DRF
    # ============================================================
    response = drf_exception_handler(exc, context)

    # ============================================================
    # مرحله ۲: خطاهای احراز هویت (سازگاری با JWT)
    # ============================================================
    if isinstance(exc, (AuthenticationFailed, NotAuthenticated, PermissionDenied)):
        # اگر response وجود دارد، آن را بدون تغییر برگردان
        if response is not None:
            return response
        # اگر به هر دلیلی response None بود، یک پاسخ 401/403 استاندارد بساز
        # (این حالت نادر است، اما برای ایمنی)
        status_code = status.HTTP_401_UNAUTHORIZED
        if isinstance(exc, PermissionDenied):
            status_code = status.HTTP_403_FORBIDDEN
        return Response(
            {'detail': str(exc)},
            status=status_code,
        )

    # ============================================================
    # مرحله ۳: خطاهای اعتبارسنجی (ValidationError)
    # ============================================================
    if isinstance(exc, (DRFValidationError, DjangoValidationError)):
        # اگر response وجود دارد (معمولاً این‌گونه است)
        if response is not None:
            # استخراج خطاها با ایمنی کامل
            if isinstance(response.data, dict):
                errors = response.data
            else:
                errors = {'non_field_errors': response.data}

            response.data = {
                'status': 'error',
                'message': 'خطاهای اعتبارسنجی',
                'errors': errors,
                'status_code': response.status_code,
            }
            return response

        # اگر به هر دلیلی response وجود نداشت (فقط برای ایمنی)
        # استخراج خطا از خود Exception
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                errors = exc.detail
            elif isinstance(exc.detail, list):
                errors = {'non_field_errors': exc.detail}
            else:
                errors = {'detail': exc.detail}
        else:
            errors = {'detail': str(exc)}

        return Response(
            {
                'status': 'error',
                'message': 'خطاهای اعتبارسنجی',
                'errors': errors,
                'status_code': status.HTTP_400_BAD_REQUEST,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ============================================================
    # مرحله ۴: سایر خطاهای DRF که پاسخ دارند (404, 405, ...)
    # ============================================================
    if response is not None:
        # استخراج پیام خطا
        if isinstance(response.data, dict):
            error_message = response.data.get('detail')
            if not error_message:
                error_message = response.data.get('message', 'خطا')
        else:
            error_message = str(response.data)

        response.data = {
            'status': 'error',
            'message': error_message,
            'errors': {},
            'status_code': response.status_code,
        }
        return response

    # ============================================================
    # مرحله ۵: خطاهای غیرمنتظره (500) - بدون پاسخ از DRF
    # ============================================================
    # ثبت کامل خطا در لاگ
    logger.exception(exc)

    # در Production جزئیات خطا را به کاربر نشان نمی‌دهیم
    if settings.DEBUG:
        message = str(exc)
    else:
        message = 'خطای داخلی سرور. لطفاً بعداً تلاش کنید.'

    return Response(
        {
            'status': 'error',
            'message': message,
            'errors': {},
            'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )