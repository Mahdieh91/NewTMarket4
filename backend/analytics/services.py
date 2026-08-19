# analytics/services.py

import logging
import re

from collections import Counter, defaultdict
from datetime import timedelta
from decimal import Decimal

from django.db.models import Q
from django.utils import timezone


logger = logging.getLogger(__name__)


# ============================================================
# Dashboard constants
# ============================================================

COMPLETED_CONTRACT_STATUS = "completed"

PUBLISHED_SUPPLY_STATUS = "published"

NEGOTIATION_STATUS_LABELS = {
    "created": "ایجاد شده",
    "in_progress": "در حال مکاتبه",
    "awaiting_proposal": "در انتظار پیشنهاد",
    "proposal_sent": "پیشنهاد ارسال شده",
    "under_review": "در حال بررسی",
    "accepted": "پذیرفته شده",
    "rejected": "رد شده",
    "contracted": "ورود به قرارداد",
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
    تبدیل تاریخ میلادی به شمسی.
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
        and (
            gy % 100 != 0
            or gy % 400 == 0
        )
    ):
        g_day_no += 1

    g_day_no += gd2

    j_day_no = g_day_no - 79

    j_np = j_day_no // 12053
    j_day_no %= 12053

    jy = (
        979
        + 33 * j_np
        + 4 * (j_day_no // 1461)
    )

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
    """

    from negotiations.models import Negotiation

    return (
        Negotiation.objects
        .filter(
            Q(buyer_id=user.id)
            | Q(supplier_id=user.id)
        )
    )


def get_user_contracts(user):
    """
    فقط قراردادهایی که کاربر جاری یکی از طرفین آن است.
    """

    from contracts.models import Contract

    return (
        Contract.objects
        .filter(
            Q(buyer_id=user.id)
            | Q(supplier_id=user.id)
        )
    )


# ============================================================
# User Statistics
# ============================================================

def get_stats(user):
    """
    آمار اختصاصی کاربر جاری.
    """

    from products.models import Supply
    from needs.models import Need

    return {
        "totalProducts": (
            Supply.objects
            .filter(
                seller_id=user.id,
                status=PUBLISHED_SUPPLY_STATUS,
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


# ============================================================
# Monthly Deals
# ============================================================

def get_monthly_deals(user, months=6):
    """
    تعداد قراردادهای تکمیل‌شده کاربر در ماه‌های اخیر.

    مبنا:
        Contract.signed_at
    """

    from contracts.models import Contract

    if not isinstance(months, int) or months <= 0:
        return []

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
            flat=True,
        )
        .order_by("signed_at")
    )

    grouped = defaultdict(int)

    for signed_at in contracts:

        if signed_at is None:
            continue

        if timezone.is_aware(signed_at):
            signed_at = timezone.localtime(
                signed_at
            )

        jy, jm, _ = gregorian_to_jalali(
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
            "month": JALALI_MONTH_NAMES.get(
                month,
                str(month),
            ),
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
    """

    if not isinstance(limit, int) or limit <= 0:
        return []

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

        if negotiation.buyer_id == user.id:
            other_user = negotiation.supplier
        else:
            other_user = negotiation.buyer

        if other_user is None:
            other_user_name = "طرف مذاکره"
        else:
            full_name = ""

            if hasattr(
                other_user,
                "get_full_name",
            ):
                full_name = (
                    other_user.get_full_name()
                    or ""
                )

            other_user_name = (
                getattr(
                    other_user,
                    "company_name",
                    None,
                )
                or full_name
                or getattr(
                    other_user,
                    "username",
                    None,
                )
                or "طرف مذاکره"
            )

        activity_time = (
            negotiation.updated_at
            or negotiation.created_at
        )

        activities.append({
            "id": (
                f"negotiation_"
                f"{negotiation.id}"
            ),

            "type": "negotiation",

            "title": (
                f"مذاکره #"
                f"{negotiation.id}"
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
    توزیع واقعی وضعیت مذاکرات کاربر.
    """

    statuses = list(
        get_user_negotiations(user)
        .values_list(
            "status",
            flat=True,
        )
    )

    total = len(statuses)

    if total == 0:
        return []

    counts = Counter(statuses)

    result = []

    for negotiation_status, count in counts.most_common():

        percent = round(
            (count / total) * 100
        )

        label = (
            NEGOTIATION_STATUS_LABELS.get(
                negotiation_status,
                negotiation_status,
            )
        )

        result.append({
            "label": label,
            "value": count,
            "percent": percent,
        })

    return result


# ============================================================
# Text normalization helpers
# ============================================================

def _normalize_text(value):
    """
    نرمال‌سازی متن فارسی و انگلیسی برای Matching.

    بدون وابستگی خارجی.
    """

    if value is None:
        return ""

    text = str(value)

    # حذف HTML
    text = re.sub(
        r"<[^>]+>",
        " ",
        text,
    )

    # یکسان‌سازی حروف عربی/فارسی
    replacements = {
        "ي": "ی",
        "ى": "ی",
        "ك": "ک",
        "ة": "ه",
        "ۀ": "ه",
        "ؤ": "و",
        "إ": "ا",
        "أ": "ا",
        "ٱ": "ا",
        "ـ": "",
    }

    for source, target in replacements.items():
        text = text.replace(
            source,
            target,
        )

    # حذف نیم‌فاصله
    text = text.replace(
        "\u200c",
        " ",
    )

    # تبدیل علائم به فاصله
    text = re.sub(
        r"[^\w\sآ-ی]",
        " ",
        text,
        flags=re.UNICODE,
    )

    # حذف فاصله‌های اضافه
    text = re.sub(
        r"\s+",
        " ",
        text,
    ).strip().lower()

    return text


def _tokenize(value):
    """
    تبدیل متن به مجموعه‌ای از کلمات.
    """

    normalized = _normalize_text(
        value
    )

    if not normalized:
        return set()

    tokens = normalized.split()

    # حذف توکن‌های بسیار کوتاه
    return {
        token
        for token in tokens
        if len(token) >= 2
    }


def _text_similarity(text_a, text_b):
    """
    شباهت متنی مبتنی بر اشتراک واژه‌ها.

    خروجی:
        عدد بین 0 و 1
    """

    tokens_a = _tokenize(text_a)
    tokens_b = _tokenize(text_b)

    if not tokens_a or not tokens_b:
        return 0.0

    intersection = (
        tokens_a.intersection(
            tokens_b
        )
    )

    union = (
        tokens_a.union(
            tokens_b
        )
    )

    if not union:
        return 0.0

    return (
        len(intersection)
        / len(union)
    )


# ============================================================
# Budget Matching
# ============================================================

def _budget_match(need_budget, supply_price):
    """
    تطبیق بودجه Need با قیمت Supply.

    خروجی بین 0 و 1.

    اگر یکی از مقادیر وجود نداشته باشد،
    در محاسبه نهایی از این معیار صرف‌نظر می‌شود.
    """

    if (
        need_budget is None
        or supply_price is None
    ):
        return None

    try:
        need_budget = Decimal(
            str(need_budget)
        )

        supply_price = Decimal(
            str(supply_price)
        )
    except (
        TypeError,
        ValueError,
        ArithmeticError,
    ):
        return None

    if need_budget <= 0 or supply_price < 0:
        return None

    if supply_price == 0:
        return 1.0

    difference = abs(
        need_budget
        - supply_price
    )

    relative_difference = (
        difference
        / need_budget
    )

    # تطبیق کامل
    if relative_difference == 0:
        return 1.0

    # قیمت در محدوده 20 درصد بودجه
    if relative_difference <= Decimal("0.20"):
        return 0.9

    # محدوده 50 درصد
    if relative_difference <= Decimal("0.50"):
        return 0.7

    # محدوده 100 درصد
    if relative_difference <= Decimal("1.00"):
        return 0.4

    return 0.0


# ============================================================
# Industry Matching
# ============================================================

def _industry_match(need, supply):
    """
    تطبیق صنعت Need و Supply.

    Need.industry:
        ForeignKey

    Supply.industry:
        CharField

    بنابراین تطبیق بر اساس نام واقعی صنعت انجام می‌شود.
    """

    if need.industry is None:
        return None

    need_industry_name = (
        getattr(
            need.industry,
            "name",
            None,
        )
        or str(need.industry)
    )

    supply_industry = (
        getattr(
            supply,
            "industry",
            None,
        )
        or ""
    )

    need_industry_name = _normalize_text(
        need_industry_name
    )

    supply_industry = _normalize_text(
        supply_industry
    )

    if not need_industry_name:
        return None

    if not supply_industry:
        return None

    if (
        need_industry_name
        == supply_industry
    ):
        return 1.0

    need_tokens = _tokenize(
        need_industry_name
    )

    supply_tokens = _tokenize(
        supply_industry
    )

    if not need_tokens or not supply_tokens:
        return 0.0

    intersection = (
        need_tokens.intersection(
            supply_tokens
        )
    )

    if not intersection:
        return 0.0

    return (
        len(intersection)
        / max(
            len(need_tokens),
            len(supply_tokens),
        )
    )


# ============================================================
# Intelligent Supply Matching
# ============================================================

def _calculate_supply_match(need, supply):
    """
    محاسبه امتیاز تطبیق Need و Supply.

    معیارها:

    صنعت:
        45 درصد

    بودجه:
        30 درصد

    شباهت متنی:
        25 درصد

    نکته:
        معیارهایی که داده واقعی ندارند
        از وزن نهایی حذف می‌شوند و وزن
        معیارهای موجود مجدداً نرمال می‌شود.

    خروجی:
        integer بین 0 و 100
    """

    industry_score = _industry_match(
        need,
        supply,
    )

    budget_score = _budget_match(
        getattr(
            need,
            "budget",
            None,
        ),
        getattr(
            supply,
            "price",
            None,
        ),
    )

    need_text = " ".join([
        str(
            getattr(
                need,
                "title",
                None,
            )
            or ""
        ),
        str(
            getattr(
                need,
                "description",
                None,
            )
            or ""
        ),
        str(
            getattr(
                need,
                "expected_outcome",
                None,
            )
            or ""
        ),
    ])

    supply_text = " ".join([
        str(
            getattr(
                supply,
                "title",
                None,
            )
            or ""
        ),
        str(
            getattr(
                supply,
                "description",
                None,
            )
            or ""
        ),
    ])

    text_score = _text_similarity(
        need_text,
        supply_text,
    )

    criteria = []

    if industry_score is not None:
        criteria.append(
            (
                industry_score,
                45,
            )
        )

    if budget_score is not None:
        criteria.append(
            (
                budget_score,
                30,
            )
        )

    if text_score > 0:
        criteria.append(
            (
                text_score,
                25,
            )
        )

    if not criteria:
        return 0

    weighted_sum = sum(
        score * weight
        for score, weight in criteria
    )

    total_weight = sum(
        weight
        for _, weight in criteria
    )

    if total_weight <= 0:
        return 0

    normalized_score = (
        weighted_sum
        / total_weight
    )

    return max(
        0,
        min(
            100,
            round(
                normalized_score * 100
            ),
        ),
    )


# ============================================================
# Smart Suggestion Reason
# ============================================================

def _build_match_reason(
    need,
    supply,
    match_score,
):
    """
    تولید توضیح قابل فهم برای امتیاز Matching.
    """

    reasons = []

    industry_score = _industry_match(
        need,
        supply,
    )

    if (
        industry_score is not None
        and industry_score >= 0.8
    ):
        reasons.append(
            "صنعت منطبق"
        )
    elif (
        industry_score is not None
        and industry_score > 0
    ):
        reasons.append(
            "شباهت در حوزه صنعت"
        )

    budget_score = _budget_match(
        getattr(
            need,
            "budget",
            None,
        ),
        getattr(
            supply,
            "price",
            None,
        ),
    )

    if (
        budget_score is not None
        and budget_score >= 0.9
    ):
        reasons.append(
            "قیمت نزدیک به بودجه نیاز"
        )
    elif (
        budget_score is not None
        and budget_score >= 0.7
    ):
        reasons.append(
            "قیمت در محدوده قابل قبول بودجه"
        )

    text_score = _text_similarity(
        " ".join([
            str(
                getattr(
                    need,
                    "title",
                    None,
                )
                or ""
            ),
            str(
                getattr(
                    need,
                    "description",
                    None,
                )
                or ""
            ),
            str(
                getattr(
                    need,
                    "expected_outcome",
                    None,
                )
                or ""
            ),
        ]),
        " ".join([
            str(
                getattr(
                    supply,
                    "title",
                    None,
                )
                or ""
            ),
            str(
                getattr(
                    supply,
                    "description",
                    None,
                )
                or ""
            ),
        ]),
    )

    if text_score >= 0.25:
        reasons.append(
            "شباهت محتوایی قابل توجه"
        )
    elif text_score > 0:
        reasons.append(
            "شباهت محتوایی"
        )

    if not reasons:
        reasons.append(
            "بیشترین امتیاز تطبیق در داده‌های موجود"
        )

    return (
        f"امتیاز تطبیق {match_score} درصد، "
        + "، ".join(reasons)
    )


# ============================================================
# Smart Suggestions
# ============================================================

def get_smart_suggestions(user, limit=3):
    """
    پیشنهادهای هوشمند واقعی بر اساس Needهای کاربر
    و Supplyهای منتشرشده موجود در سیستم.

    این تابع از داده فیک استفاده نمی‌کند.

    API خروجی عمداً همان ساختار قبلی است:

        title
        match
        reason

    تا frontend فعلی نشکند.
    """

    from needs.models import Need
    from products.models import Supply

    if not isinstance(limit, int) or limit <= 0:
        return []

    needs = list(
        Need.objects
        .filter(
            buyer_id=user.id,
        )
        .select_related(
            "industry",
        )
        .order_by(
            "-updated_at",
            "-created_at",
        )[:20]
    )

    if not needs:
        return []

    supplies = list(
        Supply.objects
        .filter(
            status=PUBLISHED_SUPPLY_STATUS,
        )
        .select_related(
            "seller",
        )
        .exclude(
            seller_id=user.id,
        )
        .order_by(
            "-updated_at",
            "-created_at",
        )[:300]
    )

    if not supplies:
        return []

    candidates = []

    for need in needs:

        for supply in supplies:

            match_score = (
                _calculate_supply_match(
                    need,
                    supply,
                )
            )

            if match_score <= 0:
                continue

            candidates.append({
                "need_id": need.id,
                "supply_id": supply.id,
                "title": supply.title,
                "match": match_score,
                "reason": _build_match_reason(
                    need,
                    supply,
                    match_score,
                ),
            })

    if not candidates:
        return []

    # بهترین تطبیق‌ها در ابتدا
    candidates.sort(
        key=lambda item: (
            item["match"],
            -item["supply_id"],
        ),
        reverse=True,
    )

    # یک Supply تکراری در پیشنهادها نمایش داده نشود
    selected = []

    seen_supplies = set()

    for candidate in candidates:

        supply_id = candidate[
            "supply_id"
        ]

        if supply_id in seen_supplies:
            continue

        seen_supplies.add(
            supply_id
        )

        selected.append({
            "title": candidate["title"],
            "match": candidate["match"],
            "reason": candidate["reason"],
        })

        if len(selected) >= limit:
            break

    return selected


# ============================================================
# Conversion Funnel
# ============================================================

def get_conversion_funnel(user):
    """
    قیف تبدیل اختصاصی کاربر.
    """

    from contracts.models import Contract

    user_negotiations = (
        get_user_negotiations(user)
    )

    total_negotiations = (
        user_negotiations.count()
    )

    if total_negotiations == 0:
        return []

    active_negotiations = (
        user_negotiations
        .filter(
            is_active=True
        )
        .count()
    )

    accepted_negotiations = (
        user_negotiations
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

    def percentage(value):
        return min(
            100,
            max(
                0,
                round(
                    (
                        value
                        / total_negotiations
                    ) * 100
                ),
            ),
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
# Execution-based Counterparty Score
# ============================================================

def _get_execution_score(execution):
    """
    دریافت امتیاز واقعی Execution.

    Execution.final_score در مدل فعلی:
        DecimalField(max_digits=3, decimal_places=1)

    بنابراین مقدار آن حداکثر 99.9 است.

    خروجی:
        float بین 0 و 100
    """

    if execution is None:
        return None

    final_score = getattr(
        execution,
        "final_score",
        None,
    )

    if final_score is None:
        return None

    try:
        score = float(
            final_score
        )
    except (
        TypeError,
        ValueError,
    ):
        return None

    return max(
        0.0,
        min(
            100.0,
            score,
        ),
    )


# ============================================================
# Top Counterparties
# ============================================================

def get_top_suppliers(user, limit=5):
    """
    طرف‌های معامله بر اساس قراردادهای تکمیل‌شده.

    امتیاز طرف معامله از Execution.final_score
    قراردادهای واقعی او محاسبه می‌شود.

    هیچ امتیاز ساختگی تولید نمی‌شود.
    """

    from contracts.models import Contract

    if not isinstance(limit, int) or limit <= 0:
        return []

    contracts = (
        get_user_contracts(user)
        .filter(
            status=COMPLETED_CONTRACT_STATUS
        )
        .select_related(
            "buyer",
            "supplier",
            "execution",
        )
        .order_by(
            "-signed_at",
            "-created_at",
        )
    )

    counterparties = Counter()

    names = {}

    execution_scores = defaultdict(
        list
    )

    for contract in contracts:

        if contract.buyer_id == user.id:
            counterparty = contract.supplier
        else:
            counterparty = contract.buyer

        if counterparty is None:
            continue

        counterparty_id = (
            counterparty.id
        )

        counterparties[
            counterparty_id
        ] += 1

        full_name = ""

        if hasattr(
            counterparty,
            "get_full_name",
        ):
            full_name = (
                counterparty.get_full_name()
                or ""
            )

        names[
            counterparty_id
        ] = (
            getattr(
                counterparty,
                "company_name",
                None,
            )
            or full_name
            or getattr(
                counterparty,
                "username",
                None,
            )
            or "طرف معامله"
        )

        execution_score = (
            _get_execution_score(
                getattr(
                    contract,
                    "execution",
                    None,
                )
            )
        )

        if execution_score is not None:
            execution_scores[
                counterparty_id
            ].append(
                execution_score
            )

    result = []

    for user_id, deals in counterparties.most_common(
        limit
    ):

        scores = execution_scores.get(
            user_id,
            [],
        )

        if scores:
            score = round(
                sum(scores)
                / len(scores),
                1,
            )
        else:
            # نبود امتیاز ارزیابی‌شده
            # با امتیاز جعلی جایگزین نمی‌شود.
            score = 0.0

        result.append({
            "name": names.get(
                user_id,
                "طرف معامله",
            ),

            "score": score,

            "deals": deals,
        })

    return result