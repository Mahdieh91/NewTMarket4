from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q

from negotiations.models import Negotiation


User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_api(request):
    user = request.user

    # ============================================================
    # مذاکرات فعال کاربر
    # ============================================================
    active_negotiations = Negotiation.objects.filter(
        Q(buyer=user) | Q(supplier=user)
    ).exclude(
        status__in=['accepted', 'rejected', 'contracted']
    ).count()

    # ============================================================
    # پیام‌های خوانده‌نشده
    #
    # مدل Message در پروژه فعلی فیلد read_at ندارد.
    # بنابراین برای جلوگیری از خطای 500، این بخش از داشبورد
    # فعلاً استفاده نمی‌شود.
    # ============================================================
    unread_messages = 0

    # ============================================================
    # تعداد کل مذاکرات کاربر
    # ============================================================
    total_negotiations = Negotiation.objects.filter(
        Q(buyer=user) | Q(supplier=user)
    ).count()

    # ============================================================
    # آخرین مذاکرات
    # ============================================================
    recent_negotiations = Negotiation.objects.filter(
        Q(buyer=user) | Q(supplier=user)
    ).order_by(
        '-updated_at'
    )[:5].values(
        'id',
        'status',
        'updated_at'
    )

    # ============================================================
    # پاسخ API
    # ============================================================
    return Response({
        'active_negotiations': active_negotiations,

        'unread_messages': unread_messages,

        'total_negotiations': total_negotiations,

        'recent_negotiations': list(recent_negotiations),

        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
    })


@api_view(['GET'])
def health_check(request):
    return Response({
        'status': 'ok',
        'message': 'سرور به درستی کار می‌کند.'
    })