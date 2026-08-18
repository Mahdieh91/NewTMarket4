# matching/services.py

"""
Petrochemical Matching Service
==============================

هسته اصلی تطبیق Need و Supply.

تمرکز فعلی سیستم:
    صنعت پتروشیمی

ویژگی‌ها:
    1. Matching مفهومی با استفاده از matching.dictionary
    2. Matching صنعت
    3. Matching نوع عرضه
    4. Matching واژگان تخصصی پتروشیمی
    5. Matching بودجه
    6. Matching زمان‌بندی
    7. Matching TRL
    8. محاسبه Match Percentage
    9. محاسبه هوشمند Risk Level به صورت Rule-Based
    10. تولید دلیل قابل فهم برای پیشنهاد
    11. بدون وابستگی به Mock Data
"""

from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation
from typing import Any

from .dictionary import (
    PETROCHEMICAL_TERMS,
    get_petrochemical_concepts,
    normalize_petrochemical_text,
)


# ============================================================
# Configuration
# ============================================================

PETROCHEMICAL_INDUSTRY_KEYWORDS = [
    "پتروشیمی",
    "صنعت پتروشیمی",
    "مجتمع پتروشیمی",
    "صنایع پتروشیمی",
    "petrochemical",
    "petrochemical industry",
    "petrochemical complex",
]


# وزن معیارهای Matching
MATCH_WEIGHTS = {
    "industry": 0.20,
    "concept": 0.30,
    "text": 0.15,
    "budget": 0.10,
    "trl": 0.08,
    "type": 0.07,
    "availability": 0.05,
    "data_quality": 0.05,
}


# ============================================================
# Generic Helpers
# ============================================================

def safe_text(value: Any) -> str:
    """
    تبدیل مقدار به متن امن.
    """

    if value is None:
        return ""

    return str(value).strip()


def normalize(value: Any) -> str:
    """
    نرمال‌سازی متن با Dictionary پتروشیمی.
    """

    return normalize_petrochemical_text(
        safe_text(value)
    )


def clamp(value: float, minimum: float = 0.0, maximum: float = 100.0) -> float:
    """
    محدود کردن عدد به بازه مشخص.
    """

    return max(minimum, min(maximum, value))


def decimal_value(value: Any) -> Decimal | None:
    """
    تبدیل امن مقدار به Decimal.
    """

    if value is None:
        return None

    if isinstance(value, Decimal):
        return value

    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


def extract_numbers(text: str) -> list[float]:
    """
    استخراج اعداد از متن.

    مثال:

        "۳ تا ۶ ماه"
        "TRL 8"
        "کاهش ۱۵ درصد"

    """

    if not text:
        return []

    # پشتیبانی از اعداد فارسی
    translation = str.maketrans(
        "۰۱۲۳۴۵۶۷۸۹",
        "0123456789",
    )

    normalized = text.translate(translation)

    values = re.findall(
        r"\d+(?:\.\d+)?",
        normalized,
    )

    return [float(v) for v in values]


# ============================================================
# Industry Matching
# ============================================================

def is_petrochemical_text(text: str) -> bool:
    """
    بررسی می‌کند آیا متن به حوزه پتروشیمی مربوط است یا خیر.
    """

    normalized_text = normalize(text)

    if not normalized_text:
        return False

    for keyword in PETROCHEMICAL_INDUSTRY_KEYWORDS:

        normalized_keyword = normalize(keyword)

        if normalized_keyword in normalized_text:
            return True

    # اگر حداقل چند مفهوم تخصصی پتروشیمی وجود داشته باشد
    concepts = get_petrochemical_concepts(normalized_text)

    return len(concepts) >= 2


def industry_match(need, supply) -> tuple[float, str]:
    """
    محاسبه انطباق صنعت.

    فعلاً سیستم روی پتروشیمی متمرکز است.
    """

    need_industry = safe_text(
        getattr(
            getattr(need, "industry", None),
            "name",
            "",
        )
    )

    supply_industry = safe_text(
        getattr(
            supply,
            "industry",
            "",
        )
    )

    need_industry_normalized = normalize(need_industry)
    supply_industry_normalized = normalize(supply_industry)

    # هر دو صراحتاً پتروشیمی
    if (
        "پتروشیمی" in need_industry_normalized
        and "پتروشیمی" in supply_industry_normalized
    ):
        return 100.0, "صنعت نیاز و عرضه هر دو پتروشیمی هستند"

    # تطابق دقیق
    if (
        need_industry_normalized
        and supply_industry_normalized
        and need_industry_normalized == supply_industry_normalized
    ):
        return 100.0, "صنعت نیاز و عرضه یکسان است"

    # اگر Need پتروشیمی است ولی Supply صنعت دیگری دارد
    if "پتروشیمی" in need_industry_normalized:

        if supply_industry_normalized:
            return 0.0, "صنعت عرضه با صنعت پتروشیمی تطابق ندارد"

        return 40.0, "صنعت عرضه مشخص نشده است"

    return 50.0, "اطلاعات صنعت برای تطبیق کامل کافی نیست"


# ============================================================
# Concept Matching
# ============================================================

def build_need_text(need) -> str:
    """
    ساخت متن جامع Need.
    """

    fields = [
        getattr(need, "title", ""),
        getattr(need, "description", ""),
        getattr(need, "current_status", ""),
        getattr(need, "expected_outcome", ""),
        getattr(need, "constraints", ""),
        getattr(need, "evaluation_criteria", ""),
    ]

    industry = getattr(
        getattr(need, "industry", None),
        "name",
        "",
    )

    fields.append(industry)

    return " ".join(
        safe_text(field)
        for field in fields
        if safe_text(field)
    )


def build_supply_text(supply) -> str:
    """
    ساخت متن جامع Supply.
    """

    fields = [
        getattr(supply, "title", ""),
        getattr(supply, "category", ""),
        getattr(supply, "industry", ""),
        getattr(supply, "technology", ""),
        getattr(supply, "description", ""),
        getattr(supply, "quantity", ""),
        getattr(supply, "unit", ""),
    ]

    return " ".join(
        safe_text(field)
        for field in fields
        if safe_text(field)
    )


def concept_match(need, supply) -> tuple[float, list[str]]:
    """
    Matching مفهومی Need و Supply.

    از Dictionary پتروشیمی استفاده می‌کند.

    مثال:

        Need:
            "بهینه سازی مصرف انرژی کوره"

        Supply:
            "سامانه هوشمند پایش کوره و مصرف سوخت"

    مفاهیم مشترک:

        furnace
        energy
        monitoring

    """

    need_text = build_need_text(need)
    supply_text = build_supply_text(supply)

    need_concepts = set(
        get_petrochemical_concepts(need_text)
    )

    supply_concepts = set(
        get_petrochemical_concepts(supply_text)
    )

    if not need_concepts:
        return 0.0, []

    if not supply_concepts:
        return 0.0, []

    common = need_concepts.intersection(
        supply_concepts
    )

    if not common:
        return 0.0, []

    # ضریب Jaccard
    union = need_concepts.union(
        supply_concepts
    )

    score = (
        len(common) /
        max(len(union), 1)
    ) * 100

    return clamp(score), sorted(common)


# ============================================================
# Text Similarity
# ============================================================

def text_tokenize(text: str) -> set[str]:
    """
    توکن‌سازی ساده برای Matching متنی.
    """

    normalized = normalize(text)

    if not normalized:
        return set()

    tokens = re.findall(
        r"[a-zA-Z0-9آ-ی]+",
        normalized,
    )

    return {
        token
        for token in tokens
        if len(token) >= 2
    }


def text_similarity(need, supply) -> float:
    """
    شباهت متنی ساده.

    این بخش جایگزین Dictionary نیست.
    Dictionary وزن بیشتری دارد.
    """

    need_tokens = text_tokenize(
        build_need_text(need)
    )

    supply_tokens = text_tokenize(
        build_supply_text(supply)
    )

    if not need_tokens or not supply_tokens:
        return 0.0

    intersection = need_tokens.intersection(
        supply_tokens
    )

    if not intersection:
        return 0.0

    # برای Need محوریت بیشتری در نظر می‌گیریم
    score = (
        len(intersection) /
        len(need_tokens)
    ) * 100

    return clamp(score)


# ============================================================
# Supply Type Matching
# ============================================================

def type_match(need, supply) -> float:
    """
    بررسی نوع عرضه.

    Supply:
        product
        service

    Need مدل فعلی نوع مستقیم ندارد.
    بنابراین از متن Need استنباط می‌شود.
    """

    need_text = normalize(
        build_need_text(need)
    )

    supply_type = normalize(
        getattr(
            supply,
            "supply_type",
            "",
        )
    )

    if not supply_type:
        return 50.0

    service_keywords = [
        "مشاوره",
        "خدمات",
        "خدمت",
        "consulting",
        "consultancy",
        "service",
    ]

    product_keywords = [
        "سامانه",
        "سیستم",
        "تجهیزات",
        "دستگاه",
        "محصول",
        "تجهیز",
        "system",
        "equipment",
        "device",
        "product",
    ]

    need_is_service = any(
        normalize(keyword) in need_text
        for keyword in service_keywords
    )

    need_is_product = any(
        normalize(keyword) in need_text
        for keyword in product_keywords
    )

    if supply_type == "service":
        if need_is_service:
            return 100.0

        if need_is_product:
            return 40.0

        return 70.0

    if supply_type == "product":
        if need_is_product:
            return 100.0

        if need_is_service:
            return 40.0

        return 70.0

    return 50.0


# ============================================================
# Budget Matching
# ============================================================

def budget_match(need, supply) -> tuple[float, str]:
    """
    بررسی سازگاری قیمت عرضه با بودجه Need.

    Need:
        budget

    Supply:
        price
    """

    budget = decimal_value(
        getattr(
            need,
            "budget",
            None,
        )
    )

    price = decimal_value(
        getattr(
            supply,
            "price",
            None,
        )
    )

    if budget is None or budget <= 0:
        return 60.0, "بودجه نیاز مشخص نشده است"

    if price is None:
        return 50.0, "قیمت عرضه مشخص نشده است"

    # قیمت کمتر یا مساوی بودجه
    if price <= budget:
        return 100.0, "قیمت عرضه در محدوده بودجه نیاز است"

    # درصد تجاوز از بودجه
    excess_ratio = float(
        (price - budget) / budget
    )

    if excess_ratio <= 0.10:
        return 85.0, "قیمت کمی بالاتر از بودجه نیاز است"

    if excess_ratio <= 0.25:
        return 65.0, "قیمت عرضه حدود ۱۰ تا ۲۵ درصد بالاتر از بودجه است"

    if excess_ratio <= 0.50:
        return 40.0, "قیمت عرضه به‌طور محسوسی بالاتر از بودجه است"

    return 15.0, "قیمت عرضه بسیار بالاتر از بودجه نیاز است"


# ============================================================
# TRL Matching
# ============================================================

def trl_match(need, supply) -> tuple[float, str]:
    """
    تطبیق TRL عرضه.

    Need فعلاً TRL ندارد.
    بنابراین برای پتروشیمی، TRL بالاتر
    به‌عنوان ریسک کمتر در نظر گرفته می‌شود.
    """

    trl_raw = getattr(
        supply,
        "trl",
        None,
    )

    if trl_raw is None:
        return 50.0, "TRL عرضه مشخص نشده است"

    try:
        trl = int(
            str(trl_raw).strip()
        )
    except (ValueError, TypeError):
        return 50.0, "TRL عرضه قابل تشخیص نیست"

    if trl >= 9:
        return 100.0, "فناوری در بالاترین سطح آمادگی قرار دارد"

    if trl == 8:
        return 95.0, "فناوری در سطح بالای آمادگی قرار دارد"

    if trl == 7:
        return 85.0, "فناوری برای کاربرد صنعتی مناسب است"

    if trl == 6:
        return 70.0, "فناوری در مرحله نزدیک به کاربرد صنعتی است"

    if trl == 5:
        return 50.0, "فناوری هنوز به بلوغ صنعتی کامل نرسیده است"

    return 30.0, "TRL پایین است و ریسک بلوغ فناوری بالاتر است"


# ============================================================
# Supply Availability / Status
# ============================================================

def availability_match(supply) -> tuple[float, str]:
    """
    بررسی وضعیت عرضه.
    """

    status = safe_text(
        getattr(
            supply,
            "status",
            "",
        )
    )

    status = status.lower()

    if status == "published":
        return 100.0, "عرضه منتشر شده و آماده ارائه است"

    if status == "approved":
        return 95.0, "عرضه تأیید شده است"

    if status == "submitted":
        return 75.0, "عرضه برای بررسی ارسال شده است"

    if status == "evaluating":
        return 60.0, "عرضه در حال ارزیابی است"

    if status == "pending":
        return 50.0, "عرضه هنوز در انتظار بررسی است"

    if status == "draft":
        return 25.0, "عرضه هنوز در وضعیت پیش‌نویس است"

    if status == "suspended":
        return 10.0, "عرضه در وضعیت تعلیق قرار دارد"

    if status == "rejected":
        return 0.0, "عرضه رد شده است"

    return 50.0, "وضعیت عرضه مشخص نیست"


# ============================================================
# Data Quality
# ============================================================

def data_quality_score(supply) -> tuple[float, list[str]]:
    """
    ارزیابی کیفیت اطلاعات Supply.

    اطلاعات کامل‌تر باعث کاهش عدم قطعیت Matching می‌شود.
    """

    fields = {
        "title": getattr(supply, "title", None),
        "category": getattr(supply, "category", None),
        "industry": getattr(supply, "industry", None),
        "technology": getattr(supply, "technology", None),
        "description": getattr(supply, "description", None),
        "quantity": getattr(supply, "quantity", None),
        "unit": getattr(supply, "unit", None),
        "price": getattr(supply, "price", None),
        "trl": getattr(supply, "trl", None),
    }

    important_fields = [
        "title",
        "category",
        "industry",
        "description",
        "price",
        "trl",
    ]

    filled = 0
    missing = []

    for field in important_fields:

        value = fields.get(field)

        if value is not None and safe_text(value):
            filled += 1
        else:
            missing.append(field)

    score = (
        filled /
        len(important_fields)
    ) * 100

    return clamp(score), missing


# ============================================================
# Risk Calculation
# ============================================================

def calculate_risk_level(
    match_percentage: float,
    budget_score: float,
    trl_score: float,
    availability_score: float,
    data_quality: float,
    industry_score: float,
    concept_score: float,
) -> tuple[str, list[str]]:
    """
    محاسبه Rule-Based Risk.

    خروجی:

        low
        medium
        high

    علاوه بر سطح ریسک، دلایل ریسک نیز برگردانده می‌شود.
    """

    risk_points = 0
    reasons = []

    # --------------------------------------------------------
    # Overall Match
    # --------------------------------------------------------

    if match_percentage < 45:
        risk_points += 4
        reasons.append(
            "درصد انطباق کلی پایین است"
        )

    elif match_percentage < 60:
        risk_points += 2
        reasons.append(
            "درصد انطباق کلی متوسط رو به پایین است"
        )

    elif match_percentage < 75:
        risk_points += 1

    # --------------------------------------------------------
    # Industry
    # --------------------------------------------------------

    if industry_score < 50:
        risk_points += 4
        reasons.append(
            "عدم تطابق مناسب صنعت"
        )

    elif industry_score < 80:
        risk_points += 2
        reasons.append(
            "اطلاعات صنعت نیاز و عرضه کاملاً هم‌راستا نیست"
        )

    # --------------------------------------------------------
    # Concept
    # --------------------------------------------------------

    if concept_score < 30:
        risk_points += 3
        reasons.append(
            "مفاهیم تخصصی مشترک کمی شناسایی شده است"
        )

    elif concept_score < 50:
        risk_points += 1
        reasons.append(
            "تطابق مفهومی متوسط است"
        )

    # --------------------------------------------------------
    # Budget
    # --------------------------------------------------------

    if budget_score < 30:
        risk_points += 3
        reasons.append(
            "قیمت عرضه فاصله زیادی با بودجه دارد"
        )

    elif budget_score < 60:
        risk_points += 2
        reasons.append(
            "قیمت عرضه با بودجه کاملاً سازگار نیست"
        )

    elif budget_score < 80:
        risk_points += 1

    # --------------------------------------------------------
    # TRL
    # --------------------------------------------------------

    if trl_score < 40:
        risk_points += 3
        reasons.append(
            "TRL پایین است"
        )

    elif trl_score < 60:
        risk_points += 2
        reasons.append(
            "بلوغ فناوری هنوز محدود است"
        )

    elif trl_score < 80:
        risk_points += 1

    # --------------------------------------------------------
    # Availability
    # --------------------------------------------------------

    if availability_score < 30:
        risk_points += 3
        reasons.append(
            "وضعیت عرضه برای شروع همکاری مناسب نیست"
        )

    elif availability_score < 60:
        risk_points += 1
        reasons.append(
            "وضعیت عرضه هنوز کاملاً قطعی نیست"
        )

    # --------------------------------------------------------
    # Data Quality
    # --------------------------------------------------------

    if data_quality < 40:
        risk_points += 3
        reasons.append(
            "اطلاعات عرضه ناقص است"
        )

    elif data_quality < 65:
        risk_points += 1
        reasons.append(
            "برخی اطلاعات مهم عرضه ثبت نشده است"
        )

    # --------------------------------------------------------
    # Final Decision
    # --------------------------------------------------------

    if risk_points >= 8:
        return "high", reasons

    if risk_points >= 4:
        return "medium", reasons

    return "low", reasons


# ============================================================
# Match Reason
# ============================================================

def concept_label(concept: str) -> str:
    """
    تبدیل Concept استاندارد به نام فارسی قابل نمایش.
    """

    labels = {
        "distillation": "تقطیر",
        "fractionation": "تفکیک",
        "separation": "جداسازی",
        "furnace": "کوره",
        "heat_exchanger": "مبدل حرارتی",
        "compressor": "کمپرسور",
        "pump": "پمپ",
        "reactor": "راکتور",
        "boiler": "بویلر",
        "cooling_system": "سیستم خنک‌کننده",
        "refinery": "پالایشگاه",
        "petrochemical": "پتروشیمی",
        "process_unit": "واحد فرآیندی",
        "production_line": "خط تولید",
        "energy": "انرژی",
        "combustion": "احتراق",
        "steam": "بخار",
        "process_control": "کنترل فرآیند",
        "instrumentation": "ابزار دقیق",
        "monitoring": "پایش",
        "ai": "هوش مصنوعی",
        "digital_twin": "دوقلوی دیجیتال",
        "digitalization": "دیجیتالی‌سازی",
        "predictive_maintenance": "نگهداری پیش‌بینانه",
        "fault_detection": "تشخیص خرابی",
        "optimization": "بهینه‌سازی",
        "emission": "آلایندگی",
        "carbon": "کربن",
        "safety": "ایمنی",
        "hazard": "خطر",
        "maintenance": "نگهداری و تعمیرات",
        "equipment": "تجهیزات",
        "polymer": "پلیمر",
        "ethylene": "اتیلن",
        "propylene": "پروپیلن",
        "methanol": "متانول",
        "ammonia": "آمونیاک",
        "production": "تولید",
        "efficiency": "راندمان",
        "capacity": "ظرفیت",
    }

    return labels.get(
        concept,
        concept.replace("_", " "),
    )


def generate_match_reason(
    concepts: list[str],
    industry_score: float,
    budget_reason: str,
    trl_reason: str,
    availability_reason: str,
) -> str:
    """
    تولید دلیل قابل فهم برای نمایش در Frontend.
    """

    reasons = []

    if concepts:
        labels = [
            concept_label(concept)
            for concept in concepts[:5]
        ]

        reasons.append(
            "تطابق مفهومی در حوزه "
            + "، ".join(labels)
        )

    if industry_score >= 90:
        reasons.append(
            "هم‌خوانی کامل با صنعت پتروشیمی"
        )

    if budget_reason:
        reasons.append(
            budget_reason
        )

    if trl_reason:
        reasons.append(
            trl_reason
        )

    if availability_reason:
        reasons.append(
            availability_reason
        )

    return "، ".join(reasons)


# ============================================================
# Main Matching Function
# ============================================================

def calculate_match(need, supply) -> dict:
    """
    محاسبه کامل Matching بین یک Need و یک Supply.

    خروجی:

    {
        "match_percentage": 84,
        "match_reason": "...",
        "risk_level": "low",
        "risk_reasons": [...],
        "concepts": [...],
        "scores": {...}
    }
    """

    # --------------------------------------------------------
    # Industry
    # --------------------------------------------------------

    industry_score, industry_reason = industry_match(
        need,
        supply,
    )

    # --------------------------------------------------------
    # Concepts
    # --------------------------------------------------------

    concept_score, concepts = concept_match(
        need,
        supply,
    )

    # --------------------------------------------------------
    # Text
    # --------------------------------------------------------

    text_score = text_similarity(
        need,
        supply,
    )

    # --------------------------------------------------------
    # Type
    # --------------------------------------------------------

    type_score = type_match(
        need,
        supply,
    )

    # --------------------------------------------------------
    # Budget
    # --------------------------------------------------------

    budget_score, budget_reason = budget_match(
        need,
        supply,
    )

    # --------------------------------------------------------
    # TRL
    # --------------------------------------------------------

    trl_score, trl_reason = trl_match(
        need,
        supply,
    )

    # --------------------------------------------------------
    # Availability
    # --------------------------------------------------------

    availability_score, availability_reason = (
        availability_match(supply)
    )

    # --------------------------------------------------------
    # Data Quality
    # --------------------------------------------------------

    quality_score, missing_fields = (
        data_quality_score(supply)
    )

    # --------------------------------------------------------
    # Weighted Score
    # --------------------------------------------------------

    score = (
        industry_score
        * MATCH_WEIGHTS["industry"]
        +
        concept_score
        * MATCH_WEIGHTS["concept"]
        +
        text_score
        * MATCH_WEIGHTS["text"]
        +
        budget_score
        * MATCH_WEIGHTS["budget"]
        +
        trl_score
        * MATCH_WEIGHTS["trl"]
        +
        type_score
        * MATCH_WEIGHTS["type"]
        +
        availability_score
        * MATCH_WEIGHTS["availability"]
        +
        quality_score
        * MATCH_WEIGHTS["data_quality"]
    )

    score = round(
        clamp(score),
        2,
    )

    # --------------------------------------------------------
    # Risk
    # --------------------------------------------------------

    risk_level, risk_reasons = calculate_risk_level(
        match_percentage=score,
        budget_score=budget_score,
        trl_score=trl_score,
        availability_score=availability_score,
        data_quality=quality_score,
        industry_score=industry_score,
        concept_score=concept_score,
    )

    # --------------------------------------------------------
    # Reason
    # --------------------------------------------------------

    match_reason = generate_match_reason(
        concepts=concepts,
        industry_score=industry_score,
        budget_reason=budget_reason,
        trl_reason=trl_reason,
        availability_reason=availability_reason,
    )

    return {
        "match_percentage": score,

        "match_reason": match_reason,

        "risk_level": risk_level,

        "risk_reasons": risk_reasons,

        "concepts": concepts,

        "concept_labels": [
            concept_label(concept)
            for concept in concepts
        ],

        "scores": {
            "industry": round(
                industry_score,
                2,
            ),
            "concept": round(
                concept_score,
                2,
            ),
            "text": round(
                text_score,
                2,
            ),
            "budget": round(
                budget_score,
                2,
            ),
            "trl": round(
                trl_score,
                2,
            ),
            "type": round(
                type_score,
                2,
            ),
            "availability": round(
                availability_score,
                2,
            ),
            "data_quality": round(
                quality_score,
                2,
            ),
        },

        "details": {
            "industry_reason": industry_reason,
            "budget_reason": budget_reason,
            "trl_reason": trl_reason,
            "availability_reason": availability_reason,
            "missing_fields": missing_fields,
        },
    }


# ============================================================
# Petrochemical Filtering
# ============================================================

def is_petrochemical_supply(supply) -> bool:
    """
    تشخیص اینکه Supply مربوط به پتروشیمی است یا خیر.
    """

    industry = safe_text(
        getattr(
            supply,
            "industry",
            "",
        )
    )

    text = build_supply_text(
        supply
    )

    if is_petrochemical_text(
        industry
    ):
        return True

    if is_petrochemical_text(text):
        return True

    return False


def is_petrochemical_need(need) -> bool:
    """
    تشخیص اینکه Need مربوط به پتروشیمی است یا خیر.
    """

    industry = safe_text(
        getattr(
            getattr(
                need,
                "industry",
                None,
            ),
            "name",
            "",
        )
    )

    text = build_need_text(
        need
    )

    if is_petrochemical_text(
        industry
    ):
        return True

    if is_petrochemical_text(text):
        return True

    return False


# ============================================================
# Match One Need Against Supplies
# ============================================================

def match_need_with_supplies(
    need,
    supplies,
    limit: int = 20,
    petrochemical_only: bool = True,
) -> list[dict]:
    """
    تطبیق یک Need با مجموعه‌ای از Supplyها.

    نتیجه بر اساس Match Percentage
    از بیشترین به کمترین مرتب می‌شود.
    """

    results = []

    for supply in supplies:

        # ----------------------------------------------------
        # تمرکز فعلی روی پتروشیمی
        # ----------------------------------------------------

        if petrochemical_only:

            if not is_petrochemical_need(need):
                continue

            if not is_petrochemical_supply(supply):
                continue

        # ----------------------------------------------------
        # Calculate Match
        # ----------------------------------------------------

        result = calculate_match(
            need,
            supply,
        )

        result["need_id"] = getattr(
            need,
            "id",
            None,
        )

        result["supply_id"] = getattr(
            supply,
            "id",
            None,
        )

        result["type"] = getattr(
            supply,
            "supply_type",
            "product",
        )

        result["title"] = getattr(
            supply,
            "title",
            "",
        )

        seller = getattr(
            supply,
            "seller",
            None,
        )

        if seller is not None:

            provider_name = (
                getattr(
                    seller,
                    "company_name",
                    None,
                )
                or getattr(
                    seller,
                    "full_name",
                    None,
                )
                or getattr(
                    seller,
                    "username",
                    None,
                )
                or str(seller)
            )

        else:
            provider_name = ""

        result["provider"] = provider_name

        result["price"] = getattr(
            supply,
            "price",
            None,
        )

        result["trl"] = getattr(
            supply,
            "trl",
            None,
        )

        result["industry"] = getattr(
            supply,
            "industry",
            "",
        )

        result["description"] = getattr(
            supply,
            "description",
            "",
        )

        result["delivery_time"] = ""

        results.append(
            result
        )

    # --------------------------------------------------------
    # Sort
    # --------------------------------------------------------

    results.sort(
        key=lambda item: (
            item.get(
                "match_percentage",
                0,
            ),
            -(
                item.get(
                    "scores",
                    {},
                ).get(
                    "risk_level",
                    0,
                )
                if isinstance(
                    item.get(
                        "scores",
                        {},
                    ),
                    dict,
                )
                else 0
            ),
        ),
        reverse=True,
    )

    return results[:limit]


# ============================================================
# Get Best Matches
# ============================================================

def get_best_matches(
    need,
    supplies,
    limit: int = 10,
) -> list[dict]:
    """
    API-friendly wrapper.

    فقط بهترین Matchهای پتروشیمی را برمی‌گرداند.
    """

    return match_need_with_supplies(
        need=need,
        supplies=supplies,
        limit=limit,
        petrochemical_only=True,
    )


# ============================================================
# MatchResult Payload
# ============================================================

def build_match_result_payload(
    need,
    supply,
) -> dict:
    """
    ساخت Payload مناسب برای ایجاد MatchResult.

    نکته:
    این تابع عمداً save نمی‌کند.
    چون ساختار دقیق مدل MatchResult باید مستقل
    از موتور Matching باقی بماند.
    """

    result = calculate_match(
        need,
        supply,
    )

    return {
        "need_id": getattr(
            need,
            "id",
            None,
        ),

        "supply_id": getattr(
            supply,
            "id",
            None,
        ),

        "match_percentage": result[
            "match_percentage"
        ],

        "match_reason": result[
            "match_reason"
        ],

        "risk_level": result[
            "risk_level"
        ],

        "risk_reasons": result[
            "risk_reasons"
        ],

        "concepts": result[
            "concepts"
        ],

        "scores": result[
            "scores"
        ],
    }