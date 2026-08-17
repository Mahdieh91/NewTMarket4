# analytics/services.py

import logging
from collections import Counter, defaultdict
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone


logger = logging.getLogger(__name__)

User = get_user_model()


# ============================================================
# Dashboard constants
# ============================================================

COMPLETED_CONTRACT_STATUS = "completed"

NEGOTIATION_STATUS_LABELS = {
    "created": "ایجاد شده",
    "in_progress": "در حال مذاکره",
    "awaiting_proposal": "در انتظار پیشنهاد",
    "proposal_sent": "پیشنهاد ارسال شده",
    "under_review": "در حال بررسی",
    "accepted": "پذیرفته شده",
    "rejected": "رد شده",
    "contracted": "تبدیل به قرارداد",
}


JALALI_MONTH_NAMES = {
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
# Gregorian -> Jalali
# ============================================================

def gregorian_to_jalali(gy, gm, gd):
    """
    تبدیل دقیق تاریخ میلادی به تاریخ شمسی.

    نکته مهم:
    این تابع صرفاً برای تبدیل تاریخ واقعی استفاده می‌شود.
    هیچ نگاشت مصنوعی January -> فروردین وجود ندارد.
    """

    g_days_in_month = [
        31, 28, 31, 30, 31, 30,
        31, 31, 30, 31, 30, 31,
    ]

    j_days_in_month = [
        31, 31, 31, 31, 31, 31,
        30, 30, 30, 30, 30, 29,
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
# User-specific QuerySets
# ============================================================

def get_user_negotiations(user):
    """
    فقط مذاکراتی که کاربر جاری یکی از طرفین آن است.

    buyer = current user
    یا
    supplier = current user

    هیچ مذاکره‌ای از کاربران دیگر وارد نمی‌شود.
    """

    from negotiations.models import Negotiation

    return Negotiation.objects.filter(
        Q(buyer_id=user.id)
        | Q(supplier_id=user.id)
    )


def get_user_contracts(user):
    """
    فقط قراردادهایی که کاربر جاری خریدار یا عرضه‌کننده آن است.
    """

    from contracts.models import Contract

    return Contract.objects.filter(
        Q(buyer_id=user.id)
        | Q(supplier_id=user.id)
    )


# ============================================================
# User Statistics
# ============================================================

def get_stats(user):
    """
    KPIهای شخصی Dashboard.

    محصولات فعال:
        عرضه‌هایی که متعلق به کاربر جاری هستند.

    نیازهای فعال:
        نیازهایی که متعلق به کاربر جاری هستند.

    مذاکرات جاری:
        فقط مذاکرات خود کاربر.

    معاملات موفق:
        فقط قراردادهای تکمیل‌شده خود کاربر.
    """

    from products.models import Supply
    from needs.models import Need

    stats = {
        "totalProducts": (
            Supply.objects
            .filter(
                seller_id=user.id,
                status="published",
            )
            .count()
        ),

        "activeNeeds": (
            Need.objects
            .filter(
                buyer_id=user.id,
                status="published",
            )
            .count()
        ),

        "ongoingNegotiations": (
            get_user_negotiations(user)
            .filter(
                is_active=True,
            )
            .count()
        ),

        "successfulDeals": (
            get_user_contracts(user)
            .filter(
                status=COMPLETED_CONTRACT_STATUS,
            )
            .count()
        ),
    }

    return stats


# ============================================================
# Monthly Deals
# ============================================================

def get_monthly_deals(user, months=6):
    """
    تعداد معاملات موفق کاربر در ماه‌های اخیر.

    تاریخ از signed_at واقعی قرارداد خوانده می‌شود.

    برای نام ماه:
        ابتدا تاریخ میلادی واقعی خوانده می‌شود
        سپس به تاریخ شمسی تبدیل می‌شود.

    بنابراین:
        January هرگز به‌صورت ساده January -> فروردین نگاشت نمی‌شود.
    """

    from contracts.models import Contract

    now = timezone.now()

    start_date = now - timedelta(
        days=30 * months
    )

    contracts = (
        Contract.objects
        .filter(
            Q(buyer_id=user.id)
            | Q(supplier_id=user.id),
            status=COMPLETED_CONTRACT_STATUS,
            signed_at__isnull=False,
            signed_at__gte=start_date,
        )
        .values_list(
            "signed_at",
        )
        .order_by(
            "signed_at",
        )
    )

    grouped = defaultdict(int)

    for signed_at in contracts:

        if not signed_at:
            continue

        if timezone.is_aware(signed_at):
            signed_at = timezone.localtime(
                signed_at
            )

        jy, jm, jd = gregorian_to_jalali(
            signed_at.year,
            signed_at.month,
            signed_at.day,
        )

        grouped[(jy, jm)] += 1

    if not grouped:
        return []

    ordered_keys = sorted(
        grouped.keys()
    )

    selected_keys = ordered_keys[-months:]

    return [
        {
            "month": JALALI_MONTH_NAMES[
                month
            ],
            "deals": grouped[
                (year, month)
            ],
        }
        for year, month in selected_keys
    ]


# ============================================================
# Recent Activities
# ============================================================

def get_recent_activities(user, limit=10):
    """
    آخرین مذاکرات مربوط به کاربر جاری.

    این بخش عمداً فقط Negotiation است.

    بنابراین:
        عرضه‌های کاربران دیگر
        نیازهای کاربران دیگر
        قراردادهای کاربران دیگر

    وارد این بخش نمی‌شوند.
    """

    from negotiations.models import Negotiation

    negotiations = (
        get_user_negotiations(user)
        .select_related(
            "buyer",
            "supplier",
        )
        .order_by(
            "-updated_at",
            "-created_at",
        )[:limit]
    )

    activities = []

    for negotiation in negotiations:

        if (
            negotiation.buyer_id
            == user.id
        ):
            other_user = (
                negotiation.supplier
            )
        else:
            other_user = (
                negotiation.buyer
            )

        if other_user is None:
            other_user_name = (
                "طرف مذاکره"
            )
        else:
            other_user_name = (
                getattr(
                    other_user,
                    "company_name",
                    None,
                )
                or other_user.get_full_name()
                or other_user.username
            )

        activity_time = (
            negotiation.updated_at
            or negotiation.created_at
        )

        activities.append({
            "id": f"negotiation_{negotiation.id}",
            "type": "negotiation",
            "title": (
                f"مذاکره #{negotiation.id}"
            ),
            "user": (
                f"طرف مذاکره: "
                f"{other_user_name}"
            ),
            "time": (
                activity_time.isoformat()
                if activity_time
                else ""
            ),
        })

    return activities


# ============================================================
# Smart Negotiation Insights
# ============================================================

def get_negotiation_insights(user):
    """
    تحلیل هوشمند وضعیت واقعی مذاکرات کاربر.

    این بخش Fake نیست.

    هیچ درصد یا عدد ثابت در آن وجود ندارد.

    درصدها از تعداد واقعی مذاکرات کاربر محاسبه می‌شوند.
    """

    negotiations = (
        get_user_negotiations(user)
        .values_list(
            "status",
            flat=True,
        )
    )

    statuses = list(
        negotiations
    )

    total = len(statuses)

    if total == 0:
        return []

    counts = Counter(
        statuses
    )

    result = []

    for status, count in counts.most_common():

        percent = round(
            (count / total) * 100
        )

        label = (
            NEGOTIATION_STATUS_LABELS.get(
                status,
                status,
            )
        )

        result.append({
            "label": label,
            "value": count,
            "percent": percent,
        })

    return result


# ============================================================
# Smart Suggestions
# ============================================================

def get_smart_suggestions(user, limit=3):
    """
    پیشنهادهای هوشمند فقط بر اساس داده واقعی کاربر.

    اگر داده کافی وجود نداشته باشد:
        []

    برگردانده می‌شود.

    هیچ متن Fake تولید نمی‌شود.
    """

    from needs.models import Need

    suggestions = []

    user_need_industries = (
        Need.objects
        .filter(
            buyer_id=user.id,
            industry__isnull=False,
        )
        .values(
            "industry_id",
            "industry__name",
        )
        .annotate(
            count=Count("id")
        )
        .order_by(
            "-count"
        )
    )

    for item in user_need_industries[:limit]:

        industry_name = (
            item.get(
                "industry__name"
            )
        )

        if not industry_name:
            continue

        count = int(
            item.get("count") or 0
        )

        suggestions.append({
            "title": (
                f"تمرکز شما در حوزه "
                f"{industry_name}"
            ),
            "match": min(
                100,
                50 + count * 10,
            ),
            "reason": (
                f"بر اساس {count} "
                f"نیاز ثبت‌شده شما"
            ),
        })

    return suggestions[:limit]


# ============================================================
# Conversion Funnel
# ============================================================

def get_conversion_funnel(user):
    """
    قیف شخصی کاربر بر اساس مذاکرات واقعی.

    مبنا:
        کل مذاکرات
        مذاکرات فعال
        مذاکرات پذیرفته‌شده / قراردادی
        قراردادهای تکمیل‌شده
    """

    from contracts.models import Contract

    user_negotiations_qs = (
        get_user_negotiations(user)
    )

    total_negotiations = (
        user_negotiations_qs.count()
    )

    active_negotiations = (
        user_negotiations_qs
        .filter(
            is_active=True
        )
        .count()
    )

    accepted_negotiations = (
        user_negotiations_qs
        .filter(
            status__in=[
                "accepted",
                "contracted",
            ]
        )
        .count()
    )

    completed_contracts = (
        Contract.objects
        .filter(
            Q(buyer_id=user.id)
            | Q(supplier_id=user.id),
            status=COMPLETED_CONTRACT_STATUS,
        )
        .count()
    )

    if total_negotiations == 0:
        return []

    def percentage(value):
        return round(
            (value / total_negotiations)
            * 100
        )

    return [
        {
            "label": "کل مذاکرات",
            "value": total_negotiations,
            "percent": 100,
        },
        {
            "label": "مذاکرات فعال",
            "value": active_negotiations,
            "percent": percentage(
                active_negotiations
            ),
        },
        {
            "label": "مذاکرات پذیرفته‌شده",
            "value": accepted_negotiations,
            "percent": percentage(
                accepted_negotiations
            ),
        },
        {
            "label": "قراردادهای تکمیل‌شده",
            "value": completed_contracts,
            "percent": percentage(
                completed_contracts
            ),
        },
    ]


# ============================================================
# Top Counterparties
# ============================================================

def get_top_suppliers(user, limit=5):
    """
    برای حفظ سازگاری API نام تابع همان get_top_suppliers است.

    اما داده کاملاً شخصی است.

    اگر کاربر خریدار باشد:
        طرف‌های معامله = supplier

    اگر کاربر supplier باشد:
        طرف‌های معامله = buyer

    بنابراین اطلاعات کاربران دیگر به‌صورت عمومی نمایش داده نمی‌شود.
    """

    from contracts.models import Contract

    contracts = (
        get_user_contracts(user)
        .filter(
            status=COMPLETED_CONTRACT_STATUS
        )
        .select_related(
            "buyer",
            "supplier",
        )
    )

    counterparties = Counter()

    names = {}

    for contract in contracts:

        if (
            contract.buyer_id
            == user.id
        ):
            counterparty = (
                contract.supplier
            )
        else:
            counterparty = (
                contract.buyer
            )

        if counterparty is None:
            continue

        counterparties[
            counterparty.id
        ] += 1

        names[
            counterparty.id
        ] = (
            getattr(
                counterparty,
                "company_name",
                None,
            )
            or counterparty.get_full_name()
            or counterparty.username
        )

    result = []

    for user_id, deals in counterparties.most_common(
        limit
    ):

        result.append({
            "name": names.get(
                user_id,
                "طرف معامله",
            ),
            "score": 0.0,
            "deals": deals,
        })

    return result