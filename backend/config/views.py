# backend/config/views.py

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# داده‌های ساختگی (دقیقاً مشابه MOCK_DATA در فرانت‌اند)
MOCK_DASHBOARD_DATA = {
    "stats": {
        "totalProducts": 124,
        "activeNeeds": 87,
        "ongoingNegotiations": 34,
        "successfulDeals": 156,
    },
    "industryData": [
        {"name": "نفت و گاز", "value": 45},
        {"name": "فناوری اطلاعات", "value": 38},
        {"name": "سلامت", "value": 29},
        {"name": "کشاورزی", "value": 22},
        {"name": "خودروسازی", "value": 18},
        {"name": "سایر", "value": 33},
    ],
    "monthlyDeals": [
        {"month": "فروردین", "deals": 12},
        {"month": "اردیبهشت", "deals": 19},
        {"month": "خرداد", "deals": 15},
        {"month": "تیر", "deals": 27},
        {"month": "مرداد", "deals": 31},
        {"month": "شهریور", "deals": 25},
    ],
    "recentActivities": [
        {"id": 1, "type": "product", "title": "سامانه مدیریت انرژی هوشمند", "user": "شرکت فناوران انرژی", "time": "۲ ساعت پیش"},
        {"id": 2, "type": "need", "title": "بهینه‌سازی مصرف آب در صنایع", "user": "سازمان آب منطقه‌ای", "time": "۵ ساعت پیش"},
        {"id": 3, "type": "negotiation", "title": "مذاکره برای تأمین تجهیزات", "user": "پتروشیمی", "time": "روز گذشته"},
        {"id": 4, "type": "deal", "title": "انعقاد قرارداد همکاری", "user": "شرکت دانش‌بنیان", "time": "۲ روز پیش"},
    ],
    "smartSuggestions": [
        {"title": "همکاری با عرضه‌کننده باتری", "match": 92, "reason": "بر اساس نیازهای قبلی شما"},
        {"title": "پروژه کاهش مصرف انرژی", "match": 85, "reason": "همخوانی با صنعت شما"},
        {"title": "دوره آموزشی مدیریت ریسک", "match": 78, "reason": "توصیه شده برای نقش شما"},
    ],
    "conversionFunnel": [
        {"label": "بازدید از صفحه", "value": 2450, "percent": 100},
        {"label": "ثبت درخواست", "value": 980, "percent": 40},
        {"label": "مذاکره", "value": 340, "percent": 14},
        {"label": "انعقاد قرارداد", "value": 156, "percent": 6},
    ],
    "topSuppliers": [
        {"name": "شرکت صنایع نوین", "score": 4.9, "deals": 28},
        {"name": "تجهیزات پیشرو", "score": 4.8, "deals": 24},
        {"name": "فناوران پایدار", "score": 4.7, "deals": 22},
        {"name": "سیستم‌های هوشمند", "score": 4.6, "deals": 19},
    ],
}

@csrf_exempt  # فقط برای تست، در تولید حذف شود
def dashboard_api(request):
    """
    API موقت برای داشبورد – داده‌های ساختگی را برمی‌گرداند.
    بعداً می‌توان این ویو را با کوئری‌های واقعی جایگزین کرد.
    """
    return JsonResponse(MOCK_DASHBOARD_DATA, safe=False, json_dumps_params={'ensure_ascii': False})