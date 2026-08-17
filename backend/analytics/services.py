# analytics/services.py

import logging
from collections import defaultdict
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone

logger = logging.getLogger(__name__)

User = get_user_model()


# ============================================================
# CONSTANTS
# ============================================================

PUBLISHED_SUPPLY_STATUS = "published"
PUBLISHED_NEED_STATUS = "published"

NEGOTIATION_ACTIVE_STATUSES = [
    "in_progress",
    "awaiting_proposal",
    "proposal_sent",
    "under_review",
]

CONTRACT_SUCCESS_STATUSES = [
    "signed",
    "execution",
    "completed",
]

PERSIAN_MONTHS = {
    1: "فروردین",
    2: "اردیبهشت",
    3: "خرداد",
    4: "تیر",
    5: "مرداد",
    6: "شهریور",
    7: "مهر",
    8: "آبان",
    9: "آذر",
    10: "دی",
    11: "بهمن",
    12: "اسفند",
}


# ============================================================
# GREGORIAN -> JALALI
# ============================================================

def gregorian_to_jalali(gy, gm, gd):
    """
    تبدیل دقیق تاریخ میلادی به شمسی.

    این تابع از TruncMonth برای تعیین نام ماه استفاده نمی‌کند.
    بنابراین مشکل January -> فروردین وجود نخواهد داشت.
    """

    g_days_in_month = [
        31, 28, 31, 30, 31, 30,
        31, 31, 30, 31, 30, 31
    ]

    j_days_in_month = [
        31, 31, 31, 31, 31, 31,
        30, 30, 30, 30, 30, 29
    ]

    gy2 = gy - 1600
    gm2 = gm - 1
    gd2 = gd - 1

    g_day_no = (
        365 * gy2
        + (gy2 + 3) // 4
        - (gy2 + 99) // 100
        + (gy2 + 399) // 400
    )

    for i in range(gm2):
        g_day_no += g_days_in_month[i]

    if (
        gm2 > 1
        and gy % 4 == 0
        and (gy % 100 != 0 or gy % 400 == 0)
    ):
        g_day_no += 1

    g_day_no += gd2

    j_day_no = g_day_no - 79

    j_np = j_day_no // 12053
    j_day_no %= 12053

    jy = 979 + 33 * j_np + 4 * (j_day_no // 1461)

    j_day_no %= 1461

    if j_day_no >= 366:
        jy += (j_day_no - 1) // 365
        j_day_no = (j_day_no - 1) % 365

    i = 0

    while (
        i < 11
        and j_day_no >= j_days_in_month[i]
    ):
        j_day_no -= j_days_in_month[i]
        i += 1

    jm = i + 1
    jd = j_day_no + 1

    return jy, jm, jd


# ============================================================
# DATABASE EMPTY CHECK
# ============================================================

def has_real_dashboard_data():
    """
    مشخص می‌کند آیا دیتابیس برای Dashboard داده عملیاتی دارد یا خیر.

    این تابع عمداً Exception را قورت نمی‌دهد.
    اگر Database خراب باشد، باید خطای واقعی به View برسد
    و نباید اشتباهاً Demo Mode فعال شود.
    """

    from products.models import Supply
    from needs.models import Need
    from negotiations.models import Negotiation
    from contracts.models import Contract

    return (
        Supply.objects.exists()
        or Need.objects.exists()
        or Negotiation.objects.exists()
        or Contract.objects.exists()
    )


# ============================================================
# REAL STATS
# ============================================================

def get_stats(user=None):
    """
    KPIهای اصلی Dashboard.

    این اعداد همیشه از Database می‌آیند.
    """

    from products.models import Supply
    from needs.models import Need
    from negotiations.models import Negotiation
    from contracts.models import Contract

    return {
        "totalProducts": Supply.objects.filter(
            status=PUBLISHED_SUPPLY_STATUS
        ).count(),

        "activeNeeds": Need.objects.filter(
            status=PUBLISHED_NEED_STATUS
        ).count(),

        "ongoingNegotiations": Negotiation.objects.filter(
            status__in=NEGOTIATION_ACTIVE_STATUSES
        ).count(),

        "successfulDeals": Contract.objects.filter(
            status__in=CONTRACT_SUCCESS_STATUSES
        ).count(),
    }


# ============================================================
# REAL INDUSTRY DATA
# ============================================================

def get_industry_distribution():
    """
    توزیع واقعی صنایع بر اساس Supplyهای منتشرشده.
    """

    from products.models import Supply

    queryset = (
        Supply.objects
        .filter(status=PUBLISHED_SUPPLY_STATUS)
        .exclude(industry="")
        .values("industry")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    result = []

    for item in queryset:
        industry = item.get("industry") or "سایر"
        count = int(item.get("count") or 0)

        if count > 0:
            result.append({
                "name": industry,
                "value": count,
            })

    return result[:10]


# ============================================================
# REAL MONTHLY DEALS
# ============================================================

def get_monthly_deals(months=6):
    """
    روند واقعی معاملات.

    نکته مهم:

    TruncMonth فقط برای گروه‌بندی میلادی مناسب است.
    نمی‌توان ماه میلادی را مستقیماً با نام ماه شمسی جایگزین کرد.

    بنابراین تاریخ هر قرارداد ابتدا از Gregorian
    به Jalali تبدیل می‌شود و سپس بر اساس سال و ماه شمسی
    گروه‌بندی می‌شود.
    """

    from contracts.models import Contract

    now = timezone.now()

    start_date = now - timedelta(days=30 * months)

    contracts = (
        Contract.objects
        .filter(
            status__in=CONTRACT_SUCCESS_STATUSES,
            created_at__gte=start_date,
        )
        .values_list(
            "id",
            "created_at",
            "signed_at",
        )
    )

    grouped = defaultdict(int)

    for contract_id, created_at, signed_at in contracts:

        # برای معامله موفق، اگر تاریخ امضا موجود باشد
        # همان تاریخ مبنا قرار می‌گیرد.
        date_value = signed_at or created_at

        if not date_value:
            continue

        if timezone.is_aware(date_value):
            date_value = timezone.localtime(date_value)

        jy, jm, jd = gregorian_to_jalali(
            date_value.year,
            date_value.month,
            date_value.day,
        )

        grouped[(jy, jm)] += 1

    if not grouped:
        return []

    sorted_items = sorted(
        grouped.items(),
        key=lambda item: item[0],
    )

    selected = sorted_items[-months:]

    result = []

    for (jy, jm), count in selected:
        result.append({
            "month": PERSIAN_MONTHS[jm],
            "deals": int(count),
        })

    return result


# ============================================================
# REAL RECENT ACTIVITIES
# ============================================================

def get_recent_activities(limit=10):
    """
    آخرین فعالیت‌های واقعی سامانه.

    ساختار خروجی دقیقاً با DashboardActivitySerializer
    سازگار است.
    """

    from products.models import Supply
    from needs.models import Need
    from negotiations.models import Negotiation
    from contracts.models import Contract

    activities = []

    # --------------------------------------------------------
    # Supplies
    # --------------------------------------------------------

    supply_items = (
        Supply.objects
        .filter(status=PUBLISHED_SUPPLY_STATUS)
        .select_related("seller")
        .order_by("-created_at")[:limit]
    )

    for supply in supply_items:

        seller = supply.seller

        user_name = (
            seller.get_full_name()
            or getattr(seller, "company_name", "")
            or seller.username
        )

        activities.append({
            "id": f"s_{supply.id}",
            "type": "supply",
            "title": supply.title,
            "user": user_name,
            "time": supply.created_at.isoformat(),
            "_timestamp": supply.created_at,
        })

    # --------------------------------------------------------
    # Needs
    # --------------------------------------------------------

    need_items = (
        Need.objects
        .filter(status=PUBLISHED_NEED_STATUS)
        .select_related("buyer")
        .order_by("-created_at")[:limit]
    )

    for need in need_items:

        buyer = need.buyer

        user_name = (
            buyer.get_full_name()
            or getattr(buyer, "company_name", "")
            or buyer.username
        )

        activities.append({
            "id": f"n_{need.id}",
            "type": "need",
            "title": need.title,
            "user": user_name,
            "time": need.created_at.isoformat(),
            "_timestamp": need.created_at,
        })

    # --------------------------------------------------------
    # Negotiations
    # --------------------------------------------------------

    negotiation_items = (
        Negotiation.objects
        .select_related("buyer")
        .order_by("-created_at")[:limit]
    )

    for negotiation in negotiation_items:

        buyer = negotiation.buyer

        user_name = (
            buyer.get_full_name()
            or getattr(buyer, "company_name", "")
            or buyer.username
        )

        activities.append({
            "id": f"ng_{negotiation.id}",
            "type": "negotiation",
            "title": f"مذاکره #{negotiation.id}",
            "user": user_name,
            "time": negotiation.created_at.isoformat(),
            "_timestamp": negotiation.created_at,
        })

    # --------------------------------------------------------
    # Contracts
    # --------------------------------------------------------

    contract_items = (
        Contract.objects
        .filter(status__in=CONTRACT_SUCCESS_STATUSES)
        .select_related("buyer", "supplier")
        .order_by("-created_at")[:limit]
    )

    for contract in contract_items:

        buyer = contract.buyer

        user_name = (
            buyer.get_full_name()
            or getattr(buyer, "company_name", "")
            or buyer.username
        )

        date_value = contract.signed_at or contract.created_at

        activities.append({
            "id": f"c_{contract.id}",
            "type": "deal",
            "title": f"قرارداد #{contract.id}",
            "user": user_name,
            "time": date_value.isoformat(),
            "_timestamp": date_value,
        })

    # --------------------------------------------------------
    # Sort
    # --------------------------------------------------------

    activities.sort(
        key=lambda item: item["_timestamp"],
        reverse=True,
    )

    # فیلد داخلی _timestamp برای Serializer ارسال نمی‌شود
    result = []

    for activity in activities[:limit]:
        result.append({
            "id": activity["id"],
            "type": activity["type"],
            "title": activity["title"],
            "user": activity["user"],
            "time": activity["time"],
        })

    return result


# ============================================================
# SMART SUGGESTIONS
# ============================================================

def get_smart_suggestions(user=None, limit=3):
    """
    پیشنهادهای مبتنی بر داده واقعی.

    اگر داده واقعی کافی وجود نداشته باشد،
    خروجی خالی است.

    Demo Data در View و فقط در حالت Database Empty
    اضافه خواهد شد.
    """

    from needs.models import Need
    from products.models import Supply
    from analytics.models import MarketTrend

    suggestions = []

    # --------------------------------------------------------
    # Needs
    # --------------------------------------------------------

    try:
        top_need = (
            Need.objects
            .filter(
                status=PUBLISHED_NEED_STATUS,
                industry__isnull=False,
            )
            .values("industry__name")
            .annotate(count=Count("id"))
            .order_by("-count")
            .first()
        )

        if top_need and top_need.get("industry__name"):
            suggestions.append({
                "title": f"فرصت در صنعت {top_need['industry__name']}",
                "match": 92,
                "reason": f"{top_need['count']} نیاز فعال در این صنعت",
            })

    except Exception:
        logger.exception("Error generating need-based suggestion")

    # --------------------------------------------------------
    # Supply
    # --------------------------------------------------------

    if len(suggestions) < limit:

        try:
            supply = (
                Supply.objects
                .filter(status=PUBLISHED_SUPPLY_STATUS)
                .order_by("-created_at")
                .first()
            )

            if supply:
                suggestions.append({
                    "title": supply.title,
                    "match": 88,
                    "reason": (
                        f"جدیدترین عرضه در حوزه "
                        f"{supply.industry or 'عمومی'}"
                    ),
                })

        except Exception:
            logger.exception("Error generating supply suggestion")

    # --------------------------------------------------------
    # Market Trend
    # --------------------------------------------------------

    if len(suggestions) < limit:

        try:
            trend = (
                MarketTrend.objects
                .order_by("-created_at")
                .first()
            )

            if trend:
                suggestions.append({
                    "title": trend.trend_name,
                    "match": 80,
                    "reason": (
                        trend.description[:80]
                        if trend.description
                        else "روند جدید بازار"
                    ),
                })

        except Exception:
            logger.exception(
                "Error generating market trend suggestion"
            )

    return suggestions[:limit]


# ============================================================
# CONVERSION FUNNEL
# ============================================================

def get_conversion_funnel():
    """
    قیف تبدیل واقعی.

    اگر هیچ عرضه‌ای وجود نداشته باشد،
    denominator صفر نمی‌شود.
    """

    from products.models import Supply
    from needs.models import Need
    from negotiations.models import Negotiation
    from contracts.models import Contract

    total_supplies = Supply.objects.filter(
        status=PUBLISHED_SUPPLY_STATUS
    ).count()

    total_needs = Need.objects.filter(
        status=PUBLISHED_NEED_STATUS
    ).count()

    total_negotiations = Negotiation.objects.count()

    total_contracts = Contract.objects.filter(
        status__in=CONTRACT_SUCCESS_STATUSES
    ).count()

    if total_supplies > 0:
        base = total_supplies
    else:
        base = max(
            total_needs,
            total_negotiations,
            total_contracts,
            1,
        )

    return [
        {
            "label": "عرضه‌های منتشرشده",
            "value": total_supplies,
            "percent": 100 if total_supplies > 0 else 0,
        },
        {
            "label": "نیازهای فعال",
            "value": total_needs,
            "percent": round(
                total_needs / base * 100
            ),
        },
        {
            "label": "مذاکرات",
            "value": total_negotiations,
            "percent": round(
                total_negotiations / base * 100
            ),
        },
        {
            "label": "معاملات موفق",
            "value": total_contracts,
            "percent": round(
                total_contracts / base * 100
            ),
        },
    ]


# ============================================================
# TOP SUPPLIERS
# ============================================================

def get_top_suppliers(limit=5):
    """
    تأمین‌کنندگان واقعی بر اساس تعداد قراردادهای موفق.
    """

    queryset = (
        User.objects
        .filter(
            contracts_as_supplier__status__in=CONTRACT_SUCCESS_STATUSES
        )
        .annotate(
            deals_count=Count(
                "contracts_as_supplier",
                filter=Q(
                    contracts_as_supplier__status__in=
                    CONTRACT_SUCCESS_STATUSES
                ),
            )
        )
        .filter(
            deals_count__gt=0
        )
        .order_by("-deals_count")
        .distinct()[:limit]
    )

    result = []

    for user in queryset:

        deals = int(user.deals_count)

        if deals >= 10:
            score = 4.9
        elif deals >= 6:
            score = 4.7
        elif deals >= 3:
            score = 4.5
        else:
            score = 4.2

        name = (
            getattr(user, "company_name", "")
            or user.get_full_name()
            or user.username
        )

        result.append({
            "name": name,
            "score": score,
            "deals": deals,
        })

    return result


# ============================================================
# DEMO DATA
# ============================================================

# این داده‌ها فقط زمانی استفاده می‌شوند که تمام موجودیت‌های
# عملیاتی Dashboard در Database صفر باشند.
#
# KPIهای اصلی هرگز از این بخش استفاده نمی‌کنند.

DEMO_INDUSTRY_DATA = [
    {
        "name": "نفت و گاز",
        "value": 45,
    },
    {
        "name": "فناوری اطلاعات",
        "value": 38,
    },
    {
        "name": "سلامت",
        "value": 29,
    },
    {
        "name": "کشاورزی",
        "value": 22,
    },
    {
        "name": "خودروسازی",
        "value": 18,
    },
    {
        "name": "سایر",
        "value": 33,
    },
]


DEMO_MONTHLY_DEALS = [
    {
        "month": "فروردین",
        "deals": 12,
    },
    {
        "month": "اردیبهشت",
        "deals": 19,
    },
    {
        "month": "خرداد",
        "deals": 15,
    },
    {
        "month": "تیر",
        "deals": 27,
    },
    {
        "month": "مرداد",
        "deals": 31,
    },
    {
        "month": "شهریور",
        "deals": 25,
    },
]


DEMO_RECENT_ACTIVITIES = [
    {
        "id": "demo_1",
        "type": "supply",
        "title": "سامانه مدیریت انرژی هوشمند",
        "user": "شرکت فناوران انرژی",
        "time": "نمونه",
    },
    {
        "id": "demo_2",
        "type": "need",
        "title": "بهینه‌سازی مصرف آب در صنایع",
        "user": "سازمان آب منطقه‌ای",
        "time": "نمونه",
    },
    {
        "id": "demo_3",
        "type": "negotiation",
        "title": "مذاکره برای تأمین تجهیزات",
        "user": "پتروشیمی",
        "time": "نمونه",
    },
    {
        "id": "demo_4",
        "type": "deal",
        "title": "انعقاد قرارداد همکاری",
        "user": "شرکت دانش‌بنیان",
        "time": "نمونه",
    },
]


DEMO_SMART_SUGGESTIONS = [
    {
        "title": "همکاری با عرضه‌کننده باتری",
        "match": 92,
        "reason": "داده نمونه برای نمایش داشبورد",
    },
    {
        "title": "پروژه کاهش مصرف انرژی",
        "match": 85,
        "reason": "داده نمونه برای نمایش داشبورد",
    },
    {
        "title": "دوره آموزشی مدیریت ریسک",
        "match": 78,
        "reason": "داده نمونه برای نمایش داشبورد",
    },
]


DEMO_CONVERSION_FUNNEL = [
    {
        "label": "بازدید از صفحه",
        "value": 2450,
        "percent": 100,
    },
    {
        "label": "ثبت درخواست",
        "value": 980,
        "percent": 40,
    },
    {
        "label": "مذاکره",
        "value": 340,
        "percent": 14,
    },
    {
        "label": "انعقاد قرارداد",
        "value": 156,
        "percent": 6,
    },
]


DEMO_TOP_SUPPLIERS = [
    {
        "name": "شرکت صنایع نوین",
        "score": 4.9,
        "deals": 28,
    },
    {
        "name": "تجهیزات پیشرو",
        "score": 4.8,
        "deals": 24,
    },
    {
        "name": "فناوران پایدار",
        "score": 4.7,
        "deals": 22,
    },
    {
        "name": "سیستم‌های هوشمند",
        "score": 4.6,
        "deals": 19,
    },
]