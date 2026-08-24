# analytics/services.py

import logging

from collections import defaultdict

from datetime import timedelta

from statistics import mean

from django.db.models import Q, Count, Sum

from django.utils import timezone

from products.models import Product

from evaluations.models import Evaluation


try:
    from needs.models import Need
except ImportError:
    Need = None


try:
    from negotiations.models import Negotiation
except ImportError:
    Negotiation = None


logger = logging.getLogger(__name__)


# ============================================================
# Product Statuses
# ============================================================

MARKET_STATUSES = {
    "approved",
    "published",
    "in_negotiation",
    "contracted",
    "executing",
    "completed",
}


# ============================================================
# Need Statuses
# ============================================================

ACTIVE_NEED_STATUSES = {
    "published",
    "receiving_proposals",
    "evaluating",
    "matched",
    "in_negotiation",
    "contracted",
    "executing",
}


OPEN_NEED_STATUSES = {
    "published",
    "receiving_proposals",
    "evaluating",
    "matched",
}


# ============================================================
# Negotiation Statuses
# ============================================================

ONGOING_NEGOTIATION_STATUSES = {
    "created",
    "in_progress",
    "awaiting_proposal",
    "proposal_sent",
    "under_review",
}


SUCCESSFUL_NEGOTIATION_STATUSES = {
    "accepted",
    "contracted",
}


# ============================================================
# Utility
# ============================================================

def clamp(
    value,
    minimum=0,
    maximum=100,
):

    try:
        value = float(value)

    except (TypeError, ValueError):
        value = 0

    return max(
        minimum,
        min(value, maximum),
    )


def safe_float(value):

    if value is None:
        return None

    try:
        return float(value)

    except (TypeError, ValueError):
        return None


def get_seller_name(user):

    if not user:
        return "نامشخص"

    company_name = getattr(
        user,
        "company_name",
        None,
    )

    if company_name:
        return company_name

    try:

        full_name = user.get_full_name()

        if full_name:
            return full_name

    except Exception:
        pass

    return getattr(
        user,
        "username",
        "نامشخص",
    )


# ============================================================
# Evaluation
# ============================================================

def get_latest_evaluation(product):

    prefetched = getattr(
        product,
        "_latest_evaluations",
        None,
    )

    if prefetched is not None:

        return (
            prefetched[0]
            if prefetched
            else None
        )

    return (
        Evaluation.objects
        .filter(product=product)
        .order_by(
            "-created_at",
            "-id",
        )
        .first()
    )


# ============================================================
# Quality Indicator
# ============================================================

def get_quality_indicator(product):

    evaluation = get_latest_evaluation(
        product
    )

    if evaluation is not None:

        return round(
            clamp(
                evaluation.quality_score or 0
            ),
            2,
        )

    trl = product.trl or 0

    mrl = product.mrl or 0

    trl_score = (
        ((trl - 1) / 8) * 100
        if trl
        else 0
    )

    mrl_score = (
        ((mrl - 1) / 8) * 100
        if mrl
        else 0
    )

    score = (
        trl_score * 0.6
        +
        mrl_score * 0.4
    )

    return round(
        clamp(score),
        2,
    )


# ============================================================
# Maturity Risk
# ============================================================

def get_maturity_risk(product):

    trl = product.trl or 0

    mrl = product.mrl or 0

    trl_maturity = (
        ((trl - 1) / 8) * 100
        if trl
        else 0
    )

    mrl_maturity = (
        ((mrl - 1) / 8) * 100
        if mrl
        else 0
    )

    maturity = (
        trl_maturity * 0.5
        +
        mrl_maturity * 0.5
    )

    risk = 100 - maturity

    return round(
        clamp(risk),
        2,
    )


# ============================================================
# Market Readiness
# ============================================================

def get_market_readiness(
    product,
    industry_products,
):

    evaluation = get_latest_evaluation(
        product
    )

    # --------------------------------------------------------
    # Evaluation
    # --------------------------------------------------------

    if evaluation is not None:

        evaluation_score = clamp(
            evaluation.market_readiness_score or 0
        )

    else:

        evaluation_score = None

    # --------------------------------------------------------
    # TRL
    # --------------------------------------------------------

    trl = product.trl or 0

    trl_score = (
        ((trl - 1) / 8) * 100
        if trl
        else 0
    )

    # --------------------------------------------------------
    # MRL
    # --------------------------------------------------------

    mrl = product.mrl or 0

    mrl_score = (
        ((mrl - 1) / 8) * 100
        if mrl
        else 0
    )

    # --------------------------------------------------------
    # Sample Customer
    # --------------------------------------------------------

    has_sample_customer = bool(
        product.sample_customers
        and product.sample_customers.strip()
    )

    customer_score = (
        100
        if has_sample_customer
        else 0
    )

    # --------------------------------------------------------
    # Commercial Status
    # --------------------------------------------------------

    commercial_score = (
        100
        if product.status in MARKET_STATUSES
        else 0
    )

    # --------------------------------------------------------
    # Views
    # --------------------------------------------------------

    total_views = sum(
        p.view_count or 0
        for p in industry_products
    )

    if total_views > 0:

        view_share = (
            (product.view_count or 0)
            /
            total_views
        )

        view_score = clamp(
            view_share * 100
        )

    else:

        view_score = 0

    # --------------------------------------------------------
    # With Evaluation
    # --------------------------------------------------------

    if evaluation_score is not None:

        score = (

            evaluation_score * 0.45

            +

            mrl_score * 0.20

            +

            trl_score * 0.15

            +

            customer_score * 0.10

            +

            commercial_score * 0.05

            +

            view_score * 0.05

        )

    # --------------------------------------------------------
    # Without Evaluation
    # --------------------------------------------------------

    else:

        score = (

            mrl_score * 0.30

            +

            trl_score * 0.25

            +

            customer_score * 0.20

            +

            commercial_score * 0.15

            +

            view_score * 0.10

        )

    return round(
        clamp(score),
        2,
    )


# ============================================================
# Product Indicator
# ============================================================

def build_product_indicator(
    product,
    industry_products,
):

    evaluation = get_latest_evaluation(
        product
    )

    quality = get_quality_indicator(
        product
    )

    maturity_risk = get_maturity_risk(
        product
    )

    market_readiness = get_market_readiness(
        product,
        industry_products,
    )

    return {

        "product_id":
            product.id,

        "title":
            product.title,

        "seller_id":
            product.seller_id,

        "seller_name":
            get_seller_name(
                product.seller
            ),

        "industry":
            (
                product.industry.name
                if product.industry
                else None
            ),

        "category":
            product.category,

        "trl":
            product.trl,

        "mrl":
            product.mrl,

        "quality_indicator":
            quality,

        "maturity_risk":
            maturity_risk,

        "market_readiness":
            market_readiness,

        "view_count":
            product.view_count or 0,

        "has_sample_customers":
            bool(
                product.sample_customers
                and
                product.sample_customers.strip()
            ),

        "has_certificates":
            bool(
                product.certificates
            ),

        "has_documentation":
            bool(
                product.documentation
            ),

        "price":
            safe_float(
                product.price
            ),

        "status":
            product.status,

        "evaluation_decision":
            (
                evaluation.final_decision
                if evaluation
                else None
            ),

        "created_at":
            (
                product.created_at.isoformat()
                if product.created_at
                else None
            ),
    }


# ============================================================
# Competitor Dataset
# ============================================================

def build_competitor_dataset(
    product_indicators
):

    competitors = defaultdict(list)

    for product in product_indicators:

        competitors[
            product["seller_id"]
        ].append(product)

    result = []

    for seller_id, products in competitors.items():

        if not products:
            continue

        quality_values = [
            p["quality_indicator"]
            for p in products
        ]

        risk_values = [
            p["maturity_risk"]
            for p in products
        ]

        readiness_values = [
            p["market_readiness"]
            for p in products
        ]

        active_products = sum(
            1
            for p in products
            if p["status"] in MARKET_STATUSES
        )

        sample_customer_products = sum(
            1
            for p in products
            if p["has_sample_customers"]
        )

        certified_products = sum(
            1
            for p in products
            if p["has_certificates"]
        )

        total_views = sum(
            p["view_count"]
            for p in products
        )

        result.append({

            "seller_id":
                seller_id,

            "seller_name":
                products[0]["seller_name"],

            "product_count":
                len(products),

            "active_product_count":
                active_products,

            "total_views":
                total_views,

            "sample_customer_product_count":
                sample_customer_products,

            "certified_product_count":
                certified_products,

            "average_quality":
                round(
                    mean(
                        quality_values
                    ),
                    2,
                ),

            "average_maturity_risk":
                round(
                    mean(
                        risk_values
                    ),
                    2,
                ),

            "average_market_readiness":
                round(
                    mean(
                        readiness_values
                    ),
                    2,
                ),

            "products": [

                {
                    "product_id":
                        p["product_id"],

                    "title":
                        p["title"],

                    "category":
                        p["category"],

                    "quality_indicator":
                        p["quality_indicator"],

                    "maturity_risk":
                        p["maturity_risk"],

                    "market_readiness":
                        p["market_readiness"],

                    "view_count":
                        p["view_count"],

                    "trl":
                        p["trl"],

                    "mrl":
                        p["mrl"],

                    "status":
                        p["status"],
                }

                for p in products

            ],
        })

    result.sort(
        key=lambda x: (
            x["average_market_readiness"],
            x["average_quality"],
            -x["average_maturity_risk"],
            x["total_views"],
        ),
        reverse=True,
    )

    return result


# ============================================================
# Needs Dataset
# ============================================================

def build_needs_dataset(
    industry_id=None,
    category=None,
):

    if Need is None:
        return []

    try:

        queryset = (
            Need.objects
            .select_related(
                "buyer",
                "industry",
            )
            .exclude(
                status="draft"
            )
        )

        if industry_id:

            queryset = queryset.filter(
                industry_id=industry_id
            )

        needs = list(queryset)

    except Exception as exc:

        logger.exception(
            "Error loading needs: %s",
            exc,
        )

        return []

    result = []

    for need in needs:

        result.append({

            "id":
                need.id,

            "title":
                need.title,

            "industry":
                (
                    need.industry.name
                    if need.industry
                    else None
                ),

            "industry_id":
                need.industry_id,

            "status":
                need.status,

            "budget":
                safe_float(
                    need.budget
                ),

            "timeline":
                need.timeline,

            "created_at":
                (
                    need.created_at.isoformat()
                    if need.created_at
                    else None
                ),
        })

    return result


# ============================================================
# LLM Reasoning
# ============================================================

def generate_llm_reasoning(
    industry_name,
    competitor_data,
):

    if not competitor_data:

        return (
            "داده کافی برای تحلیل رقبا "
            "در این صنعت وجود ندارد."
        )

    competitors_text = "\n\n".join(

        [

            (
                f"رقیب: {item['seller_name']}\n"
                f"تعداد محصولات: {item['product_count']}\n"
                f"محصولات فعال: {item['active_product_count']}\n"
                f"بازدید کل: {item['total_views']}\n"
                f"میانگین کیفیت: {item['average_quality']}\n"
                f"میانگین ریسک بلوغ: "
                f"{item['average_maturity_risk']}\n"
                f"میانگین آمادگی بازار: "
                f"{item['average_market_readiness']}\n"
                f"محصول دارای مشتری نمونه: "
                f"{item['sample_customer_product_count']}\n"
                f"محصول دارای گواهی: "
                f"{item['certified_product_count']}"
            )

            for item in competitor_data

        ]

    )

    prompt = f"""
شما تحلیلگر Market Intelligence هستید.

صنعت:
{industry_name}

داده‌های زیر قبلاً توسط سیستم و با
Rule-Based Logic محاسبه شده‌اند.

مهم:

- هیچ عدد جدیدی محاسبه نکن.
- هیچ Match Score تولید نکن.
- داده‌ای که در ورودی نیست فرض نکن.
- فقط از شواهد موجود استفاده کن.
- اگر داده کافی نیست صریحاً بگو:
  «داده کافی وجود ندارد».

تحلیل:

1. رقبای قوی‌تر
2. نقاط قوت اصلی
3. نقاط ضعف قابل مشاهده
4. تفاوت جایگاه رقبا
5. فرصت‌های قابل مشاهده
6. پیشنهاد اقدام

داده‌ها:

{competitors_text}
"""

    try:

        from django.conf import settings

        import requests

        api_key = getattr(
            settings,
            "OPENROUTER_API_KEY",
            None,
        )

        if not api_key:

            return (
                "LLM فعال نیست. "
                "داده ساختاریافته رقبا در دسترس است."
            )

        base_url = getattr(
            settings,
            "OPENROUTER_BASE_URL",
            "https://openrouter.ai/api/v1",
        )

        model = getattr(
            settings,
            "OPENROUTER_MODEL",
            "openai/gpt-oss-20b:free",
        )

        max_tokens = getattr(
            settings,
            "OPENROUTER_MAX_TOKENS",
            500,
        )

        temperature = getattr(
            settings,
            "OPENROUTER_TEMPERATURE",
            0.1,
        )

        response = requests.post(

            f"{base_url}/chat/completions",

            headers={

                "Authorization":
                    f"Bearer {api_key}",

                "Content-Type":
                    "application/json",
            },

            json={

                "model":
                    model,

                "messages": [

                    {
                        "role":
                            "system",

                        "content":
                            "You are a market intelligence analyst.",
                    },

                    {
                        "role":
                            "user",

                        "content":
                            prompt,
                    },

                ],

                "temperature":
                    temperature,

                "max_tokens":
                    max_tokens,
            },

            timeout=60,
        )

        response.raise_for_status()

        data = response.json()

        return (
            data
            .get(
                "choices",
                [{}]
            )[0]
            .get(
                "message",
                {}
            )
            .get(
                "content",
                ""
            )
            .strip()
        )

    except Exception as exc:

        logger.exception(
            "Market Intelligence LLM error: %s",
            exc,
        )

        return (
            "تحلیل LLM در دسترس نبود. "
            "داده‌های عددی و ساختاریافته "
            "همچنان معتبر هستند."
        )


# ============================================================
# Monthly Trend
# ============================================================

def build_monthly_trend(
    industry_id=None,
    months=6,
):

    now = timezone.now()

    result = []

    for offset in range(
        months - 1,
        -1,
        -1,
    ):

        current = now.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        month_start = (
            current
            -
            timedelta(
                days=32 * offset
            )
        ).replace(
            day=1
        )

        if offset == 0:

            month_end = now

        else:

            next_month = (
                month_start
                +
                timedelta(days=32)
            ).replace(
                day=1
            )

            month_end = next_month

        # ----------------------------------------------------
        # Supply
        # ----------------------------------------------------

        product_qs = (
            Product.objects
            .filter(
                status__in=MARKET_STATUSES,
                created_at__gte=month_start,
                created_at__lt=month_end,
            )
        )

        if industry_id:

            product_qs = product_qs.filter(
                industry_id=industry_id
            )

        supply_count = (
            product_qs.count()
        )

        # ----------------------------------------------------
        # Demand
        # ----------------------------------------------------

        demand_count = 0

        if Need is not None:

            need_qs = (
                Need.objects
                .exclude(
                    status="draft"
                )
                .filter(
                    created_at__gte=month_start,
                    created_at__lt=month_end,
                )
            )

            if industry_id:

                need_qs = need_qs.filter(
                    industry_id=industry_id
                )

            demand_count = (
                need_qs.count()
            )

        # ----------------------------------------------------
        # Deals
        # ----------------------------------------------------

        deals_count = 0

        if Negotiation is not None:

            deals_qs = (
                Negotiation.objects
                .filter(
                    created_at__gte=month_start,
                    created_at__lt=month_end,
                    status__in=
                        SUCCESSFUL_NEGOTIATION_STATUSES,
                )
            )

            deals_count = (
                deals_qs.count()
            )

        # ----------------------------------------------------
        # Label
        # ----------------------------------------------------

        month_label = (
            month_start.strftime("%Y-%m")
        )

        result.append({

            "month":
                month_label,

            "تقاضا":
                demand_count,

            "عرضه":
                supply_count,

            "معاملات":
                deals_count,
        })

    return result


# ============================================================
# Main Market Intelligence
# ============================================================

def generate_market_intelligence(
    industry_id=None,
    category=None,
    trl_min=None,
    trl_max=None,
):

    # ========================================================
    # Product Query
    # ========================================================

    product_queryset = (

        Product.objects

        .select_related(
            "seller",
            "industry",
        )

        .filter(
            status__in=MARKET_STATUSES
        )

    )

    if industry_id:

        product_queryset = (
            product_queryset
            .filter(
                industry_id=industry_id
            )
        )

    if category:

        product_queryset = (
            product_queryset
            .filter(
                category=category
            )
        )

    if trl_min is not None:

        product_queryset = (
            product_queryset
            .filter(
                trl__gte=trl_min
            )
        )

    if trl_max is not None:

        product_queryset = (
            product_queryset
            .filter(
                trl__lte=trl_max
            )
        )

    products = list(
        product_queryset
    )

    # ========================================================
    # Empty
    # ========================================================

    if not products:

        return {

            "market_overview": {

                "industry":
                    None,

                "product_count":
                    0,

                "seller_count":
                    0,

                "total_views":
                    0,

                "average_quality":
                    0,

                "average_maturity_risk":
                    0,

                "average_market_readiness":
                    0,

                "need_count":
                    0,

                "open_need_count":
                    0,

                "negotiation_count":
                    0,

                "successful_deal_count":
                    0,
            },

            "top_products":
                [],

            "readiness_analysis":
                {},

            "competitors":
                [],

            "competitor_reasoning":
                "داده کافی برای تحلیل وجود ندارد.",

            "trends":
                build_monthly_trend(
                    industry_id=industry_id
                ),

            "needs":
                [],

            "recommendations":
                [],
        }

    # ========================================================
    # Indicators
    # ========================================================

    indicators = [

        build_product_indicator(
            product,
            products,
        )

        for product in products

    ]

    # ========================================================
    # Competitors
    # ========================================================

    competitors = (
        build_competitor_dataset(
            indicators
        )
    )

    # ========================================================
    # Industry
    # ========================================================

    industry_names = {

        p["industry"]

        for p in indicators

        if p["industry"]

    }

    if len(industry_names) == 1:

        industry_name = next(
            iter(industry_names)
        )

    elif industry_names:

        industry_name = "چند صنعت"

    else:

        industry_name = "نامشخص"

    # ========================================================
    # Needs
    # ========================================================

    needs = build_needs_dataset(
        industry_id=industry_id,
        category=category,
    )

    need_count = len(needs)

    open_need_count = sum(

        1

        for n in needs

        if n["status"]
        in OPEN_NEED_STATUSES

    )

    # ========================================================
    # Negotiations
    # ========================================================

    negotiation_count = 0

    successful_deal_count = 0

    if Negotiation is not None:

        try:

            negotiation_queryset = (
                Negotiation.objects.all()
            )

            # ------------------------------------------------
            # Important:
            #
            # supply.industry is currently a CharField
            # according to the supplied model information.
            #
            # Therefore we DO NOT pretend that
            # industry_id can be applied to it.
            #
            # If later the exact mapping between
            # Supply.industry and Industry is known,
            # this filter can be implemented.
            # ------------------------------------------------

            negotiation_count = (
                negotiation_queryset.count()
            )

            successful_deal_count = (

                negotiation_queryset

                .filter(
                    status__in=
                        SUCCESSFUL_NEGOTIATION_STATUSES
                )

                .count()

            )

        except Exception as exc:

            logger.warning(

                "Could not calculate negotiations: %s",

                exc,

            )

    # ========================================================
    # Quality / Readiness / Risk
    # ========================================================

    readiness_values = [

        p["market_readiness"]

        for p in indicators

    ]

    quality_values = [

        p["quality_indicator"]

        for p in indicators

    ]

    risk_values = [

        p["maturity_risk"]

        for p in indicators

    ]

    average_readiness = round(
        mean(readiness_values),
        2,
    )

    average_quality = round(
        mean(quality_values),
        2,
    )

    average_risk = round(
        mean(risk_values),
        2,
    )

    # ========================================================
    # Top Products
    # ========================================================

    top_products = sorted(

        indicators,

        key=lambda p: (

            p["market_readiness"],

            p["quality_indicator"],

            -p["maturity_risk"],

            p["view_count"],

        ),

        reverse=True,

    )[:10]

    # ========================================================
    # Readiness Analysis
    # ========================================================

    readiness_analysis = {

        "average":
            average_readiness,

        "high_readiness_count":
            sum(

                1

                for p in indicators

                if p["market_readiness"] >= 70

            ),

        "medium_readiness_count":
            sum(

                1

                for p in indicators

                if 40 <= p["market_readiness"] < 70

            ),

        "low_readiness_count":
            sum(

                1

                for p in indicators

                if p["market_readiness"] < 40

            ),
    }

    # ========================================================
    # Recommendations
    # ========================================================

    recommendations = []

    if average_readiness < 40:

        recommendations.append(

            "آمادگی بازار محصولات پایین است. "
            "اعتبارسنجی تقاضا، جذب مشتری اولیه "
            "و تکمیل شواهد بازار پیشنهاد می‌شود."

        )

    if average_quality < 50:

        recommendations.append(

            "میانگین شاخص کیفیت پایین است. "
            "تمرکز بر ارتقای کیفیت و بلوغ فناوری "
            "و تولید پیشنهاد می‌شود."

        )

    if average_risk > 60:

        recommendations.append(

            "ریسک بلوغ فناوری و بازار نسبتاً بالا است. "
            "کاهش شکاف TRL و MRL پیشنهاد می‌شود."

        )

    if open_need_count > len(products):

        recommendations.append(

            "تعداد نیازهای باز از تعداد محصولات "
            "بیشتر است. این وضعیت می‌تواند نشان‌دهنده "
            "فرصت توسعه عرضه در بازار باشد."

        )

    if successful_deal_count > 0:

        recommendations.append(

            "در داده‌های ثبت‌شده معاملات موفق وجود دارد. "
            "شناسایی الگوهای محصولات و عرضه‌کنندگان "
            "موفق برای توسعه بازار پیشنهاد می‌شود."

        )

    if not recommendations:

        recommendations.append(

            "شاخص‌های فعلی وضعیت نسبتاً مناسبی دارند. "
            "تمرکز بر توسعه بازار، افزایش تعامل "
            "و تبدیل نیازهای باز به معامله پیشنهاد می‌شود."

        )

    # ========================================================
    # LLM
    # ========================================================

    competitor_reasoning = (
        generate_llm_reasoning(
            industry_name,
            competitors,
        )
    )

    # ========================================================
    # Trends
    # ========================================================

    trends = build_monthly_trend(
        industry_id=industry_id,
    )

    # ========================================================
    # Return
    # ========================================================

    return {

        "market_overview": {

            "industry":
                industry_name,

            "product_count":
                len(products),

            "seller_count":
                len(competitors),

            "total_views":
                sum(
                    p["view_count"]
                    for p in indicators
                ),

            "average_quality":
                average_quality,

            "average_maturity_risk":
                average_risk,

            "average_market_readiness":
                average_readiness,

            "need_count":
                need_count,

            "open_need_count":
                open_need_count,

            "negotiation_count":
                negotiation_count,

            "successful_deal_count":
                successful_deal_count,
        },

        "top_products":
            top_products,

        "readiness_analysis":
            readiness_analysis,

        "competitors":
            competitors,

        "competitor_reasoning":
            competitor_reasoning,

        "trends":
            trends,

        "needs":
            needs,

        "recommendations":
            recommendations,
    }


# ============================================================
# Transform Market Intelligence For Frontend
# ============================================================

def transform_market_intelligence_for_frontend(
    raw_data
):

    overview = raw_data.get(
        "market_overview",
        {},
    )

    readiness = raw_data.get(
        "readiness_analysis",
        {},
    )

    competitors = raw_data.get(
        "competitors",
        [],
    )

    needs = raw_data.get(
        "needs",
        [],
    )

    # ========================================================
    # KPI
    # ========================================================

    kpi_data = [

        {
            "label":
                "محصولات فعال",

            "value":
                str(
                    overview.get(
                        "product_count",
                        0,
                    )
                ),

            "change":
                (
                    f"{overview.get('average_quality', 0):.1f}٪ کیفیت"
                ),

            "icon":
                "Package",

            "color":
                "bg-blue-50 text-blue-600",
        },

        {
            "label":
                "عرضه‌کنندگان",

            "value":
                str(
                    overview.get(
                        "seller_count",
                        0,
                    )
                ),

            "change":
                (
                    f"{overview.get('average_market_readiness', 0):.1f}٪ آمادگی"
                ),

            "icon":
                "Users",

            "color":
                "bg-emerald-50 text-emerald-600",
        },

        {
            "label":
                "آمادگی بازار",

            "value":
                (
                    f"{readiness.get('average', 0):.1f}٪"
                ),

            "change":
                (
                    f"{readiness.get('high_readiness_count', 0)} محصول پیشرو"
                ),

            "icon":
                "CheckCircle",

            "color":
                "bg-amber-50 text-amber-600",
        },

        {
            "label":
                "نیازهای باز",

            "value":
                str(
                    overview.get(
                        "open_need_count",
                        0,
                    )
                ),

            "change":
                (
                    f"{overview.get('need_count', 0)} نیاز ثبت‌شده"
                ),

            "icon":
                "Target",

            "color":
                "bg-purple-50 text-purple-600",
        },

    ]

    # ========================================================
    # Trend
    # ========================================================

    trend_data = raw_data.get(
        "trends",
        [],
    )

    # ========================================================
    # Heatmap
    # ========================================================

    heatmap_data = []

    for comp in competitors[:10]:

        readiness_score = comp.get(
            "average_market_readiness",
            0,
        )

        if readiness_score >= 70:

            activity_level = "hot"

        elif readiness_score >= 40:

            activity_level = "warm"

        else:

            activity_level = "cold"

        heatmap_data.append({

            "industry":
                overview.get(
                    "industry",
                    "نامشخص",
                ),

            "region":
                "نامشخص",

            "tech":
                "نامشخص",

            "supplier":
                comp.get(
                    "seller_name",
                    "نامشخص",
                ),

            # داده واقعی نداریم
            "demandGrowth":
                None,

            "supplyCount":
                comp.get(
                    "product_count",
                    0,
                ),

            # داده واقعی نداریم
            "dealValue":
                None,

            "activityLevel":
                activity_level,

            # داده زمانی واقعی برای این supplier
            # نداریم، پس trend جعل نمی‌شود.
            "trend":
                None,
        })

    # ========================================================
    # Competitors
    # ========================================================

    competitor_list = []

    for comp in competitors:

        strengths = []

        weaknesses = []

        rating_reasons = []

        quality = comp.get(
            "average_quality",
            0,
        )

        readiness_score = comp.get(
            "average_market_readiness",
            0,
        )

        risk = comp.get(
            "average_maturity_risk",
            0,
        )

        if quality >= 70:

            strengths.append(
                "کیفیت بالا"
            )

            rating_reasons.append(
                "کیفیت بالا"
            )

        if readiness_score >= 70:

            strengths.append(
                "آمادگی بازار مناسب"
            )

            rating_reasons.append(
                "آمادگی بازار"
            )

        if risk < 30:

            strengths.append(
                "ریسک بلوغ پایین"
            )

            rating_reasons.append(
                "ریسک پایین"
            )

        if quality < 50:

            weaknesses.append(
                "کیفیت پایین"
            )

        if readiness_score < 40:

            weaknesses.append(
                "آمادگی بازار پایین"
            )

        if risk > 60:

            weaknesses.append(
                "ریسک بلوغ بالا"
            )

        if not strengths:

            strengths.append(
                "عملکرد متوسط"
            )

            rating_reasons.append(
                "عملکرد متوسط"
            )

        competitor_list.append({

            "name":
                comp.get(
                    "seller_name",
                    "نامشخص",
                ),

            "products":
                comp.get(
                    "product_count",
                    0,
                ),

            "marketShare":
                0,

            "avgRating":
                round(
                    quality / 100 * 5,
                    1,
                ),

            "strengths":
                strengths[:3],

            "weaknesses":
                weaknesses[:3],

            "industries": [

                overview.get(
                    "industry",
                    "نامشخص",
                )

            ],

            "regions": [
                "نامشخص"
            ],

            "techs": [
                "نامشخص"
            ],

            "ratingReasons":
                rating_reasons[:3],

            "averageQuality":
                quality,

            "averageRisk":
                risk,

            "averageMarketReadiness":
                readiness_score,
        })

    # ========================================================
    # Product Share
    # ========================================================

    total_product_count = sum(

        item["products"]

        for item in competitor_list

    )

    for item in competitor_list:

        if total_product_count > 0:

            item["marketShare"] = round(

                (
                    item["products"]
                    /
                    total_product_count
                )
                * 100,

                2,

            )

    # ========================================================
    # Emerging Technologies
    # ========================================================

    # Product فعلاً technology ندارد.
    emerging_techs = []

    # ========================================================
    # Top Needs
    # ========================================================

    top_needs = []

    for need in needs[:10]:

        top_needs.append({

            "title":
                need.get(
                    "title",
                    "بدون عنوان",
                ),

            "count":
                1,

            # رشد واقعی نداریم
            "growth":
                None,

            "industry":
                need.get(
                    "industry",
                    "نامشخص",
                ),

            "tech":
                "نامشخص",

            "status":
                need.get(
                    "status"
                ),

            "budget":
                need.get(
                    "budget"
                ),
        })

    # ========================================================
    # Top Products
    # ========================================================

    top_products_raw = raw_data.get(
        "top_products",
        [],
    )

    top_products = []

    for product in top_products_raw[:10]:

        top_products.append({

            "title":
                product.get(
                    "title",
                    "بدون عنوان",
                ),

            "rating":
                round(
                    product.get(
                        "quality_indicator",
                        0,
                    )
                    /
                    100
                    *
                    5,
                    1,
                ),

            "views":
                product.get(
                    "view_count",
                    0,
                ),

            "industry":
                product.get(
                    "industry",
                    "نامشخص",
                ),

            "tech":
                "نامشخص",

            "trl":
                product.get(
                    "trl"
                ),

            "mrl":
                product.get(
                    "mrl"
                ),
        })

    # ========================================================
    # Product Share
    # ========================================================

    market_share = [

        {
            "name":
                item["name"],

            "value":
                item["marketShare"],
        }

        for item in competitor_list[:10]

    ]

    # ========================================================
    # Recommendations
    # ========================================================

    recommendations = []

    for idx, rec in enumerate(

        raw_data.get(
            "recommendations",
            [],
        )

    ):

        recommendations.append({

            "id":
                idx + 1,

            "title":
                rec[:60],

            "description":
                rec,

            "action":
                "بررسی",

            "priority":
                (
                    "high"
                    if idx == 0
                    else "medium"
                ),

            "impact":
                (
                    "بالا"
                    if idx == 0
                    else "متوسط"
                ),

            "icon":
                (
                    "Lightbulb"
                    if idx == 0
                    else "Zap"
                ),
        })

    # ========================================================
    # Gap Analysis
    # ========================================================

    gap_analysis = []

    industry_product_count = overview.get(
        "product_count",
        0,
    )

    industry_need_count = overview.get(
        "need_count",
        0,
    )

    if (
        industry_need_count
        >
        industry_product_count
    ):

        gap_type = "شکاف عرضه"

    elif (
        industry_product_count
        >
        industry_need_count
    ):

        gap_type = "شکاف تقاضا"

    else:

        gap_type = "متوازن"

    gap_analysis.append({

        "industry":
            overview.get(
                "industry",
                "نامشخص",
            ),

        # Growth واقعی موجود نیست
        "demandGrowth":
            None,

        # تعداد واقعی نیاز
        "needCount":
            industry_need_count,

        "supplyCount":
            industry_product_count,

        "gap":
            gap_type,
    })

    # ========================================================
    # Final
    # ========================================================

    return {

        "kpiData":
            kpi_data,

        "trendData":
            trend_data,

        "heatmapData":
            heatmap_data,

        "competitors":
            competitor_list,

        "emergingTechs":
            emerging_techs,

        "topNeeds":
            top_needs,

        "topProducts":
            top_products,

        "marketShare":
            market_share,

        "recommendations":
            recommendations,

        "gapAnalysis":
            gap_analysis,

        "marketOverview":
            overview,

        "competitorReasoning":
            raw_data.get(
                "competitor_reasoning",
                "",
            ),
    }


# ============================================================
# Dashboard
# ============================================================

def generate_dashboard_data(user):

    # ========================================================
    # Products
    # ========================================================

    try:

        total_products = (

            Product.objects

            .filter(
                seller=user,
                status__in=MARKET_STATUSES,
            )

            .count()

        )

    except Exception:

        total_products = 0

        logger.exception(
            "Error counting products"
        )

    # ========================================================
    # Needs
    # ========================================================

    active_needs = 0

    if Need is not None:

        try:

            active_needs = (

                Need.objects

                .filter(
                    buyer=user,
                    status__in=
                        ACTIVE_NEED_STATUSES,
                )

                .count()

            )

        except Exception:

            logger.exception(
                "Error counting needs"
            )

    # ========================================================
    # Negotiations
    # ========================================================

    ongoing_negotiations = 0

    successful_deals = 0

    recent_activities = []

    conversion_funnel = []

    if Negotiation is not None:

        try:

            user_negotiations = (

                Negotiation.objects

                .filter(

                    Q(buyer=user)
                    |
                    Q(supplier=user)

                )

                .select_related(

                    "buyer",

                    "supplier",

                    "supply",

                )

                .order_by(
                    "-created_at"
                )

            )

            # ------------------------------------------------
            # Ongoing
            # ------------------------------------------------

            ongoing_negotiations = (

                user_negotiations

                .filter(
                    status__in=
                        ONGOING_NEGOTIATION_STATUSES
                )

                .count()

            )

            # ------------------------------------------------
            # Successful
            # ------------------------------------------------

            successful_deals = (

                user_negotiations

                .filter(
                    status__in=
                        SUCCESSFUL_NEGOTIATION_STATUSES
                )

                .count()

            )

            # ------------------------------------------------
            # Recent Activities
            # ------------------------------------------------

            recent_negotiations = (
                user_negotiations[:5]
            )

            status_labels = dict(
                Negotiation.STATUS_CHOICES
            )

            for neg in recent_negotiations:

                if neg.buyer_id == user.id:

                    other_user = neg.supplier

                else:

                    other_user = neg.buyer

                recent_activities.append({

                    "id":
                        str(neg.id),

                    "title":
                        (
                            neg.context_title
                            or
                            (
                                neg.supply.title
                                if neg.supply
                                else
                                f"مذاکره #{neg.id}"
                            )
                        ),

                    "user":
                        get_seller_name(
                            other_user
                        ),

                    "status":
                        neg.status,

                    "statusLabel":
                        status_labels.get(
                            neg.status,
                            neg.status,
                        ),

                    "time":
                        (
                            neg.created_at.isoformat()
                            if neg.created_at
                            else None
                        ),
                })

            # ------------------------------------------------
            # Conversion Funnel
            # ------------------------------------------------

            funnel_data = (

                user_negotiations

                .values(
                    "status"
                )

                .annotate(
                    count=Count("id")
                )

                .order_by(
                    "status"
                )

            )

            total_negotiations = sum(

                item["count"]

                for item in funnel_data

            )

            for item in funnel_data:

                percentage = (

                    (
                        item["count"]
                        /
                        total_negotiations
                    )
                    * 100

                    if total_negotiations

                    else 0

                )

                conversion_funnel.append({

                    "label":
                        status_labels.get(
                            item["status"],
                            item["status"],
                        ),

                    "status":
                        item["status"],

                    "value":
                        item["count"],

                    "percent":
                        round(
                            percentage
                        ),
                })

        except Exception as exc:

            logger.exception(

                "Could not fetch negotiation data: %s",

                exc,

            )

    # ========================================================
    # Monthly Deals
    # ========================================================

    monthly_deals = []

    if Negotiation is not None:

        try:

            now = timezone.now()

            for offset in range(
                5,
                -1,
                -1,
            ):

                current = now.replace(

                    day=1,

                    hour=0,

                    minute=0,

                    second=0,

                    microsecond=0,

                )

                month_start = (

                    current

                    -
                    timedelta(
                        days=32 * offset
                    )

                ).replace(
                    day=1
                )

                month_end = (

                    month_start

                    +
                    timedelta(
                        days=32
                    )

                ).replace(
                    day=1
                )

                count = (

                    Negotiation.objects

                    .filter(

                        (
                            Q(buyer=user)
                            |
                            Q(supplier=user)
                        ),

                        status__in=
                            SUCCESSFUL_NEGOTIATION_STATUSES,

                        created_at__gte=
                            month_start,

                        created_at__lt=
                            month_end,

                    )

                    .count()

                )

                monthly_deals.append({

                    "month":
                        month_start.strftime(
                            "%Y-%m"
                        ),

                    "value":
                        count,
                })

        except Exception:

            logger.exception(
                "Error calculating monthly deals"
            )

    # ========================================================
    # Top Suppliers
    # ========================================================

    top_suppliers = []

    try:

        supplier_stats = (

            Product.objects

            .filter(
                status__in=
                    MARKET_STATUSES
            )

            .exclude(
                seller=user
            )

            .values(

                "seller_id",

                "seller__company_name",

                "seller__username",

            )

            .annotate(

                product_count=
                    Count("id"),

                total_views=
                    Sum("view_count"),

            )

            .order_by(

                "-product_count",

                "-total_views",

            )[:5]

        )

        for item in supplier_stats:

            name = (

                item[
                    "seller__company_name"
                ]

                or

                item[
                    "seller__username"
                ]

                or

                "نامشخص"

            )

            top_suppliers.append({

                "id":
                    item["seller_id"],

                "name":
                    name,

                "productCount":
                    item["product_count"],

                "views":
                    item["total_views"] or 0,
            })

    except Exception:

        logger.exception(
            "Error calculating top suppliers"
        )

    # ========================================================
    # Smart Suggestions
    # ========================================================

    smart_suggestions = []

    if (
        active_needs > 0
        and
        total_products == 0
    ):

        smart_suggestions.append({

            "title":
                "نیازهای فعال شما آماده بررسی هستند",

            "description":
                "برای نیازهای فعال، عرضه‌کنندگان "
                "و محصولات مرتبط را بررسی کنید.",

            "action":
                "مشاهده نیازها",
        })

    if (
        total_products > 0
        and
        active_needs == 0
    ):

        smart_suggestions.append({

            "title":
                "برای محصولات خود بازار هدف پیدا کنید",

            "description":
                "ثبت نیازهای مرتبط می‌تواند "
                "فرصت‌های جدیدی ایجاد کند.",

            "action":
                "مشاهده بازار",
        })

    if successful_deals == 0:

        smart_suggestions.append({

            "title":
                "هنوز معامله موفقی ثبت نشده است",

            "description":
                "پیگیری مذاکرات فعال می‌تواند "
                "به افزایش نرخ تبدیل کمک کند.",

            "action":
                "مشاهده مذاکرات",
        })

    # ========================================================
    # Negotiation Insights
    # ========================================================

    negotiation_insights = []

    if ongoing_negotiations > 0:

        negotiation_insights.append({

            "type":
                "info",

            "title":
                "مذاکرات فعال",

            "value":
                ongoing_negotiations,

            "description":
                "مذاکره فعال در جریان است.",
        })

    if successful_deals > 0:

        negotiation_insights.append({

            "type":
                "success",

            "title":
                "معاملات موفق",

            "value":
                successful_deals,

            "description":
                "مذاکره به پذیرش یا قرارداد رسیده است.",
        })

    # ========================================================
    # Final Dashboard
    # ========================================================

    return {

        "stats": {

            "totalProducts":
                total_products,

            "activeNeeds":
                active_needs,

            "ongoingNegotiations":
                ongoing_negotiations,

            "successfulDeals":
                successful_deals,
        },

        "industryData":
            [],

        "monthlyDeals":
            monthly_deals,

        "recentActivities":
            recent_activities,

        "smartSuggestions":
            smart_suggestions,

        "conversionFunnel":
            conversion_funnel,

        "topSuppliers":
            top_suppliers,

        "negotiationInsights":
            negotiation_insights,
    }