# ============================================================
# backend/analytics/services.py
# ============================================================
# نسخه نهایی با پشتیبانی کامل از Dashboard، Market Intelligence، Competitor Analysis
# و بهبود بخش "آخرین فعالیت‌ها" با جمع‌آوری رویدادهای واقعی از Need, Supply, Negotiation, Contract
# ============================================================

import logging
import json
import re
from collections import defaultdict
from datetime import timedelta
from statistics import mean, median
from django.db.models import Q, Count, Sum, Avg, Max, Min
from django.utils import timezone
from django.core.cache import cache

from products.models import Product, Supply

try:
    from industries.models import IndustryCategory
except ImportError:
    IndustryCategory = None

try:
    from evaluation.models import Evaluation
except ImportError:
    Evaluation = None

try:
    from needs.models import Need
except ImportError:
    Need = None

try:
    from contract.models import Contract
except ImportError:
    Contract = None

try:
    from negotiations.models import Negotiation
except ImportError:
    Negotiation = None

try:
    from matching.models import MatchResult, MatchingRequest
except ImportError:
    MatchResult = None
    MatchingRequest = None

try:
    from core.services.llm_service import LLMService
except ImportError:
    LLMService = None

logger = logging.getLogger(__name__)


# ============================================================
# Statuses & Constants
# ============================================================

MARKET_STATUSES = {
    "approved",
    "published",
    "in_negotiation",
    "contracted",
    "executing",
    "completed",
}

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

SUCCESSFUL_CONTRACT_STATUSES = {
    "signed",
    "execution",
    "completed",
}

ONGOING_CONTRACT_STATUSES = {
    "draft",
    "legal_review",
    "valuation",
    "approved_buyer",
    "approved_supplier",
}

ONGOING_NEGOTIATION_STATUSES = {
    "created",
    "in_progress",
    "awaiting_proposal",
    "proposal_sent",
    "under_review",
}

RECENT_DAYS = 3
RECENT_LIMIT = 5


# ============================================================
# Utility Functions
# ============================================================

def clamp(value, minimum=0, maximum=100):
    try:
        value = float(value)
    except (TypeError, ValueError):
        value = 0
    return max(minimum, min(value, maximum))


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
    company_name = getattr(user, "company_name", None)
    if company_name:
        return company_name
    try:
        full_name = user.get_full_name()
        if full_name:
            return full_name
    except Exception:
        pass
    return getattr(user, "username", "نامشخص")


def resolve_industry_param(value):
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        pass
    if IndustryCategory is not None:
        try:
            industry = IndustryCategory.objects.filter(name__iexact=value).first()
            if industry:
                return industry.id
        except Exception as e:
            logger.warning(f"Error resolving industry name '{value}': {e}")
    return None


def _display_user(user):
    if not user:
        return "نامشخص"
    try:
        company_name = getattr(user, "company_name", None)
        if company_name:
            return company_name
    except Exception:
        pass
    try:
        full_name = user.get_full_name()
        if full_name:
            return full_name
    except Exception:
        pass
    return getattr(user, "username", "نامشخص")


def _safe_iso(value):
    if value is None:
        return None
    try:
        return value.isoformat()
    except Exception:
        return None


def _recent_with_fallback(queryset, recent_days=RECENT_DAYS, limit=RECENT_LIMIT):
    now = timezone.now()
    cutoff = now - timedelta(days=recent_days)

    recent_items = list(
        queryset.filter(created_at__gte=cutoff)
        .order_by("-created_at", "-id")[:limit]
    )

    if len(recent_items) >= limit:
        return recent_items

    existing_ids = {getattr(item, "id", None) for item in recent_items}
    remaining = limit - len(recent_items)

    older_items = list(
        queryset.exclude(id__in=existing_ids)
        .order_by("-created_at", "-id")[:remaining]
    )

    return recent_items + older_items


# ============================================================
# Recent Needs & Supplies (برای Dashboard)
# ============================================================

def get_recent_needs(user, limit=RECENT_LIMIT):
    if Need is None:
        return []
    try:
        queryset = (
            Need.objects
            .filter(buyer=user)
            .select_related("industry")
            .order_by("-created_at", "-id")
        )
        needs = _recent_with_fallback(queryset, recent_days=RECENT_DAYS, limit=limit)

        result = []
        for need in needs:
            industry_name = None
            try:
                if need.industry:
                    industry_name = need.industry.name
            except Exception:
                pass
            result.append({
                "id": int(need.id),
                "title": need.title or "نیاز بدون عنوان",
                "status": need.status or "",
                "created_at": _safe_iso(need.created_at),
                "industry": industry_name,
            })
        return result
    except Exception:
        logger.exception("Dashboard: error loading recent needs")
        return []


def get_recent_supplies(user, limit=RECENT_LIMIT):
    try:
        queryset = (
            Supply.objects
            .filter(seller=user)
            .order_by("-created_at", "-id")
        )
        supplies = _recent_with_fallback(queryset, recent_days=RECENT_DAYS, limit=limit)

        result = []
        for supply in supplies:
            result.append({
                "id": int(supply.id),
                "title": supply.title or "عرضه بدون عنوان",
                "status": supply.status or "",
                "created_at": _safe_iso(supply.created_at),
                "category": supply.category or None,
            })
        return result
    except Exception:
        logger.exception("Dashboard: error loading recent supplies")
        return []


# ============================================================
# دریافت آخرین فعالیت‌ها از همه مدل‌ها (اصلاح اصلی)
# ============================================================

def get_recent_activities(user, limit=RECENT_LIMIT):
    """
    جمع‌آوری آخرین فعالیت‌های کاربر از مدل‌های:
        - Need (ثبت نیاز)
        - Supply (ثبت محصول/عرضه)
        - Negotiation (شروع مذاکره)
        - Contract (ثبت قرارداد / تغییر وضعیت)
    و بازگرداندن آنها با فرمت یکسان و مرتب بر اساس زمان.
    """
    activities = []

    # 1. نیازها
    if Need is not None:
        try:
            needs = Need.objects.filter(buyer=user).order_by("-created_at")[:limit]
            for need in needs:
                activities.append({
                    "id": f"need_{need.id}",
                    "type": "need",
                    "title": f"ثبت نیاز: {need.title}",
                    "user": _display_user(user),
                    "status": need.status,
                    "amount": None,
                    "time": _safe_iso(need.created_at),
                })
        except Exception:
            logger.exception("Error fetching needs for activities")

    # 2. عرضه‌ها (محصولات)
    try:
        supplies = Supply.objects.filter(seller=user).order_by("-created_at")[:limit]
        for supply in supplies:
            activities.append({
                "id": f"supply_{supply.id}",
                "type": "supply",
                "title": f"ثبت محصول: {supply.title}",
                "user": _display_user(user),
                "status": supply.status,
                "amount": None,
                "time": _safe_iso(supply.created_at),
            })
    except Exception:
        logger.exception("Error fetching supplies for activities")

    # 3. مذاکرات
    if Negotiation is not None:
        try:
            negotiations = Negotiation.objects.filter(
                Q(buyer=user) | Q(supplier=user)
            ).order_by("-created_at")[:limit]
            for neg in negotiations:
                other = neg.supplier if neg.buyer_id == user.id else neg.buyer
                activities.append({
                    "id": f"negotiation_{neg.id}",
                    "type": "negotiation",
                    "title": f"مذاکره با {_display_user(other)}",
                    "user": _display_user(other),
                    "status": neg.status,
                    "amount": None,
                    "time": _safe_iso(neg.created_at),
                })
        except Exception:
            logger.exception("Error fetching negotiations for activities")

    # 4. قراردادها (معاملات)
    if Contract is not None:
        try:
            contracts = Contract.objects.filter(
                Q(buyer=user) | Q(supplier=user)
            ).order_by("-signed_at", "-created_at")[:limit]
            for contract in contracts:
                other = contract.supplier if contract.buyer_id == user.id else contract.buyer
                activities.append({
                    "id": f"contract_{contract.id}",
                    "type": "deal",
                    "title": f"قرارداد #{contract.id} با {_display_user(other)}",
                    "user": _display_user(other),
                    "status": contract.status,
                    "amount": f"{contract.total_value:,.0f} تومان" if contract.total_value else None,
                    "time": _safe_iso(contract.signed_at or contract.created_at),
                })
        except Exception:
            logger.exception("Error fetching contracts for activities")

    # مرتب‌سازی بر اساس زمان (نزولی) و انتخاب ۵ مورد آخر
    activities.sort(key=lambda x: x["time"] or "", reverse=True)
    return activities[:limit]


# ============================================================
# Evaluation Helpers
# ============================================================

def get_latest_evaluation(product):
    if Evaluation is None:
        return None
    try:
        prefetched = getattr(product, "_latest_evaluations", None)
        if prefetched is not None:
            return prefetched[0] if prefetched else None
        return Evaluation.objects.filter(product=product).order_by("-created_at", "-id").first()
    except Exception as e:
        logger.warning(f"Error getting evaluation for product {product.id}: {e}")
        return None


def get_quality_indicator(product):
    try:
        evaluation = get_latest_evaluation(product)
        if evaluation is not None:
            return round(clamp(evaluation.quality_score or 0), 2)
        trl = product.trl or 0
        mrl = product.mrl or 0
        trl_score = ((trl - 1) / 8) * 100 if trl else 0
        mrl_score = ((mrl - 1) / 8) * 100 if mrl else 0
        score = trl_score * 0.6 + mrl_score * 0.4
        return round(clamp(score), 2)
    except Exception as e:
        logger.warning(f"Error calculating quality for product {product.id}: {e}")
        return 0.0


def get_maturity_risk(product):
    try:
        trl = product.trl or 0
        mrl = product.mrl or 0
        trl_maturity = ((trl - 1) / 8) * 100 if trl else 0
        mrl_maturity = ((mrl - 1) / 8) * 100 if mrl else 0
        maturity = trl_maturity * 0.5 + mrl_maturity * 0.5
        risk = 100 - maturity
        return round(clamp(risk), 2)
    except Exception as e:
        logger.warning(f"Error calculating risk for product {product.id}: {e}")
        return 50.0


def get_market_readiness(product, industry_products=None):
    try:
        evaluation = get_latest_evaluation(product)
        if evaluation is not None:
            evaluation_score = clamp(evaluation.market_readiness_score or 0)
        else:
            evaluation_score = None

        trl = product.trl or 0
        trl_score = ((trl - 1) / 8) * 100 if trl else 0

        mrl = product.mrl or 0
        mrl_score = ((mrl - 1) / 8) * 100 if mrl else 0

        has_sample_customer = bool(product.sample_customers and product.sample_customers.strip())
        customer_score = 100 if has_sample_customer else 0

        commercial_score = 100 if product.status in MARKET_STATUSES else 0

        if industry_products is None:
            industry_products = []

        total_views = sum(p.view_count or 0 for p in industry_products)
        if total_views > 0:
            view_share = (product.view_count or 0) / total_views
            view_score = clamp(view_share * 100)
        else:
            view_score = 0

        if evaluation_score is not None:
            score = (
                evaluation_score * 0.45
                + mrl_score * 0.20
                + trl_score * 0.15
                + customer_score * 0.10
                + commercial_score * 0.05
                + view_score * 0.05
            )
        else:
            score = (
                mrl_score * 0.30
                + trl_score * 0.25
                + customer_score * 0.20
                + commercial_score * 0.15
                + view_score * 0.10
            )
        return round(clamp(score), 2)
    except Exception as e:
        logger.warning(f"Error calculating market readiness for product {product.id}: {e}")
        return 0.0


# ============================================================
# Match Helpers
# ============================================================

def get_match_stats_for_product(product_id):
    if MatchResult is None:
        return {
            "total_matches": 0,
            "average_match_percentage": 0,
            "high_match_count": 0,
            "high_match_rate": 0,
            "approved_count": 0,
            "pending_count": 0,
            "needs_list": [],
            "match_distribution": [],
        }

    try:
        match_qs = MatchResult.objects.filter(
            product_id=product_id,
            status__in=['approved', 'pending']
        )

        total = match_qs.count()
        if total == 0:
            return {
                "total_matches": 0,
                "average_match_percentage": 0,
                "high_match_count": 0,
                "high_match_rate": 0,
                "approved_count": 0,
                "pending_count": 0,
                "needs_list": [],
                "match_distribution": [],
            }

        avg = match_qs.aggregate(Avg('match_percentage'))['match_percentage__avg'] or 0
        high_count = match_qs.filter(match_percentage__gte=80).count()
        approved_count = match_qs.filter(status='approved').count()
        pending_count = match_qs.filter(status='pending').count()

        needs = list(match_qs.values_list('need_id', flat=True).distinct()[:20])

        distribution = match_qs.values('match_percentage').annotate(count=Count('id')).order_by('-match_percentage')[:10]

        return {
            "total_matches": total,
            "average_match_percentage": round(avg, 2),
            "high_match_count": high_count,
            "high_match_rate": round((high_count / total) * 100, 2) if total > 0 else 0,
            "approved_count": approved_count,
            "pending_count": pending_count,
            "needs_list": needs,
            "match_distribution": list(distribution),
        }
    except Exception as e:
        logger.error(f"Error getting match stats for product {product_id}: {e}")
        return {
            "total_matches": 0,
            "average_match_percentage": 0,
            "high_match_count": 0,
            "high_match_rate": 0,
            "approved_count": 0,
            "pending_count": 0,
            "needs_list": [],
            "match_distribution": [],
        }


def get_provider_match_stats(seller_id, product_ids=None):
    if MatchResult is None:
        return {
            "total_matches": 0,
            "average_match_percentage": 0,
            "high_match_count": 0,
            "high_match_rate": 0,
            "unique_needs": 0,
            "products_with_matches": 0,
            "best_match_product": None,
        }

    try:
        qs = MatchResult.objects.filter(
            product__seller_id=seller_id,
            status__in=['approved', 'pending']
        )

        if product_ids:
            qs = qs.filter(product_id__in=product_ids)

        total = qs.count()
        if total == 0:
            return {
                "total_matches": 0,
                "average_match_percentage": 0,
                "high_match_count": 0,
                "high_match_rate": 0,
                "unique_needs": 0,
                "products_with_matches": 0,
                "best_match_product": None,
            }

        avg = qs.aggregate(Avg('match_percentage'))['match_percentage__avg'] or 0
        high_count = qs.filter(match_percentage__gte=80).count()
        unique_needs = qs.values('need_id').distinct().count()
        products_with_matches = qs.values('product_id').distinct().count()

        best = qs.values('product_id').annotate(
            avg_match=Avg('match_percentage'),
            total=Count('id')
        ).order_by('-avg_match', '-total').first()

        best_product = None
        if best:
            try:
                p = Product.objects.get(id=best['product_id'])
                best_product = {
                    "id": p.id,
                    "title": p.title,
                    "avg_match": round(best['avg_match'], 2),
                    "match_count": best['total'],
                }
            except Product.DoesNotExist:
                pass

        return {
            "total_matches": total,
            "average_match_percentage": round(avg, 2),
            "high_match_count": high_count,
            "high_match_rate": round((high_count / total) * 100, 2) if total > 0 else 0,
            "unique_needs": unique_needs,
            "products_with_matches": products_with_matches,
            "best_match_product": best_product,
        }
    except Exception as e:
        logger.error(f"Error getting provider match stats: {e}")
        return {
            "total_matches": 0,
            "average_match_percentage": 0,
            "high_match_count": 0,
            "high_match_rate": 0,
            "unique_needs": 0,
            "products_with_matches": 0,
            "best_match_product": None,
        }


# ============================================================
# Core Competitor Analysis Functions
# ============================================================

def calculate_market_fit_score(match_stats, product_count=1):
    if not match_stats or match_stats.get('total_matches', 0) == 0:
        return 0.0

    avg_match = clamp(match_stats.get('average_match_percentage', 0))
    high_rate = clamp(match_stats.get('high_match_rate', 0))
    unique_needs = match_stats.get('unique_needs', 0)
    products_with_matches = match_stats.get('products_with_matches', 0)

    need_score = clamp((unique_needs / 20) * 100)
    coverage_score = clamp((products_with_matches / max(product_count, 1)) * 100)

    score = (
        avg_match * 0.40
        + high_rate * 0.25
        + need_score * 0.20
        + coverage_score * 0.15
    )

    return round(clamp(score), 2)


def calculate_quality_score_from_evaluations(product_ids, seller_id=None):
    if Evaluation is None:
        return {"score": 0, "confidence": 0, "evaluation_count": 0}

    try:
        qs = Evaluation.objects.filter(
            product_id__in=product_ids,
            status='approved'
        )

        if seller_id:
            qs = qs.filter(product__seller_id=seller_id)

        count = qs.count()
        if count == 0:
            return {"score": 0, "confidence": 0, "evaluation_count": 0}

        avg_quality = qs.aggregate(Avg('quality_score'))['quality_score__avg'] or 0
        avg_quality = clamp(avg_quality, 0, 100)

        confidence = min(count / 50, 1.0) * 100

        return {
            "score": round(avg_quality, 2),
            "confidence": round(confidence, 2),
            "evaluation_count": count,
        }
    except Exception as e:
        logger.error(f"Error calculating quality score: {e}")
        return {"score": 0, "confidence": 0, "evaluation_count": 0}


def calculate_product_maturity(products):
    if not products:
        return {"trl": 0, "mrl": 0, "score": 0, "count": 0}

    trl_values = [p.trl for p in products if p.trl is not None]
    mrl_values = [p.mrl for p in products if p.mrl is not None]

    avg_trl = mean(trl_values) if trl_values else 0
    avg_mrl = mean(mrl_values) if mrl_values else 0

    trl_score = ((avg_trl - 1) / 8) * 100 if avg_trl else 0
    mrl_score = ((avg_mrl - 1) / 8) * 100 if avg_mrl else 0

    maturity_score = (trl_score * 0.6 + mrl_score * 0.4)

    return {
        "trl": round(avg_trl, 2),
        "mrl": round(avg_mrl, 2),
        "score": round(clamp(maturity_score), 2),
        "count": len(products),
    }


def calculate_price_position_for_company(company_avg_price, market_avg_price):
    if company_avg_price is None or market_avg_price is None or market_avg_price == 0:
        return {
            "position": 0,
            "is_cheaper": False,
            "comparison": "قیمت نامشخص",
            "average_price": company_avg_price,
            "market_average": market_avg_price,
        }

    position = ((company_avg_price - market_avg_price) / market_avg_price) * 100
    position = round(position, 2)

    if position < -10:
        comparison = f"ارزان‌تر از میانگین بازار ({abs(int(position))}%)"
    elif position > 10:
        comparison = f"گران‌تر از میانگین بازار ({int(position)}%)"
    else:
        comparison = "در محدوده قیمت بازار"

    return {
        "position": position,
        "is_cheaper": position < 0,
        "comparison": comparison,
        "average_price": company_avg_price,
        "market_average": market_avg_price,
    }


def calculate_competitive_score(metrics, weights=None):
    if weights is None:
        weights = {
            "market_fit": 0.25,
            "quality": 0.20,
            "market_readiness": 0.15,
            "product_maturity": 0.15,
            "price": 0.10,
            "activity": 0.10,
            "evaluation_confidence": 0.05,
        }

    score = 0
    details = {}

    for key, weight in weights.items():
        value = metrics.get(key, 0)
        if value is None:
            value = 0
        score += value * weight
        details[key] = round(value * weight, 2)

    return {
        "total": round(clamp(score), 2),
        "details": details,
        "weights": weights,
    }


def get_top_products_for_company(products, all_products, limit=3):
    """
    انتخاب بهترین محصولات یک شرکت بر اساس market_readiness, quality, view_count
    و بازگشت دیکشنری با فیلدهای مورد نیاز serializer (شامل status)
    """
    if not products:
        return []

    scored = []
    for p in products:
        readiness = get_market_readiness(p, all_products)
        quality = get_quality_indicator(p)
        views = p.view_count or 0
        score = readiness * 0.5 + quality * 0.3 + min(views / 100, 1) * 20
        scored.append((p, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    top = [item[0] for item in scored[:limit]]

    return [
        {
            "id": p.id,
            "title": p.title,
            "category": p.category,
            "trl": p.trl,
            "mrl": p.mrl,
            "price": safe_float(p.price),
            "status": p.status or "unknown",
            "view_count": p.view_count or 0,
            "quality_indicator": get_quality_indicator(p),
            "market_readiness": get_market_readiness(p, all_products),
        }
        for p in top
    ]


# ============================================================
# Market-Level Competitor Analysis (حالت تحلیل کل بازار)
# ============================================================

def analyze_market_competitors(industry_id=None, category=None, region=None, tech=None, limit=10):
    """
    تحلیل رقبا در سطح بازار (بدون محصول هدف)
    بازگشت لیست شرکت‌های برتر بر اساس امتیاز رقابتی
    """
    product_qs = Product.objects.select_related('seller', 'industry').filter(
        status__in=MARKET_STATUSES
    )

    if industry_id is not None:
        product_qs = product_qs.filter(industry_id=industry_id)

    if category:
        product_qs = product_qs.filter(category=category)

    products = list(product_qs)

    if not products:
        return {
            "competitors": [],
            "summary": {
                "total_competitors": 0,
                "total_products": 0,
                "average_competitive_score": 0,
            },
            "insights": ["هیچ محصولی در این محدوده یافت نشد."],
        }

    seller_products = defaultdict(list)
    for product in products:
        seller_products[product.seller_id].append(product)

    company_avg_prices = []
    for seller_id, prods in seller_products.items():
        prices = [float(p.price) for p in prods if p.price is not None]
        if prices:
            company_avg_prices.append(mean(prices))
    market_avg_price = mean(company_avg_prices) if company_avg_prices else None

    competitor_data = []

    for seller_id, prods in seller_products.items():
        seller = prods[0].seller
        seller_name = get_seller_name(seller)

        product_ids = [p.id for p in prods]
        match_stats = get_provider_match_stats(seller_id, product_ids)

        market_fit_score = calculate_market_fit_score(match_stats, len(prods))

        quality_result = calculate_quality_score_from_evaluations(product_ids, seller_id)

        readiness_scores = [get_market_readiness(p, products) for p in prods]
        avg_readiness = mean(readiness_scores) if readiness_scores else 0

        maturity = calculate_product_maturity(prods)

        company_prices = [float(p.price) for p in prods if p.price is not None]
        company_avg_price = mean(company_prices) if company_prices else None
        price_pos = calculate_price_position_for_company(company_avg_price, market_avg_price)

        total_views = sum(p.view_count or 0 for p in prods)
        activity_score = clamp(
            (len(prods) / 20) * 100 +
            (total_views / 1000) * 50
        )

        eval_confidence = quality_result.get('confidence', 0)

        price_score = clamp(100 - max(0, price_pos.get('position', 0)))

        metrics = {
            "market_fit": market_fit_score,
            "quality": quality_result.get('score', 0),
            "market_readiness": avg_readiness,
            "product_maturity": maturity.get('score', 0),
            "price": price_score,
            "activity": activity_score,
            "evaluation_confidence": eval_confidence,
        }

        comp_score = calculate_competitive_score(metrics)

        top_products = get_top_products_for_company(prods, products, limit=3)

        competitor_data.append({
            "seller_id": seller_id,
            "seller_name": seller_name,
            "product_count": len(prods),
            "competitive_score": comp_score["total"],
            "score_details": comp_score["details"],
            "market_fit_score": market_fit_score,
            "quality_score": quality_result.get("score", 0),
            "quality_confidence": quality_result.get("confidence", 0),
            "market_readiness_score": round(avg_readiness, 2),
            "maturity_score": maturity.get("score", 0),
            "average_trl": maturity.get("trl", 0),
            "average_mrl": maturity.get("mrl", 0),
            "price_position": price_pos.get("position", 0),
            "price_comparison": price_pos.get("comparison", ""),
            "company_avg_price": company_avg_price,
            "market_avg_price": market_avg_price,
            "match_stats": match_stats,
            "top_products": top_products,
        })

    competitor_data.sort(key=lambda x: x["competitive_score"], reverse=True)
    top_competitors = competitor_data[:limit]

    llm_analysis = {}
    if LLMService is not None and top_competitors:
        try:
            top_list = "\n".join([
                f"- {c['seller_name']}: امتیاز {c['competitive_score']} ({c['product_count']} محصول)"
                for c in top_competitors[:5]
            ])
            prompt = f"""
            شما تحلیلگر بازار هستید. بر اساس لیست رقبای برتر زیر، خلاصه‌ای از وضعیت رقابت در بازار ارائه دهید:

            {top_list}

            پاسخ را به صورت JSON با کلیدهای زیر برگردانید:
            {{
                "summary": "خلاصه وضعیت رقابت (۳-۴ خط)",
                "key_players": ["نام شرکت‌های کلیدی", ...],
                "market_characteristics": ["ویژگی‌های بازار", ...]
            }}
            """
            llm_response = LLMService.generate_text(prompt)
            json_match = re.search(r'\{[\s\S]*\}', llm_response)
            if json_match:
                try:
                    llm_analysis = json.loads(json_match.group())
                except:
                    llm_analysis = {"summary": "تحلیل LLM در دسترس نیست."}
            else:
                llm_analysis = {"summary": "تحلیل LLM در دسترس نیست."}
        except Exception as e:
            logger.error(f"LLM market analysis failed: {e}")

    return {
        "competitors": top_competitors,
        "summary": {
            "total_competitors": len(competitor_data),
            "total_products": len(products),
            "average_competitive_score": round(mean(c["competitive_score"] for c in competitor_data), 2) if competitor_data else 0,
        },
        "llm_analysis": llm_analysis,
        "insights": [
            f"تعداد {len(competitor_data)} شرکت در این بازار فعال هستند.",
            f"میانگین امتیاز رقابتی: {round(mean(c['competitive_score'] for c in competitor_data), 2) if competitor_data else 0}",
            f"قوی‌ترین رقیب: {top_competitors[0]['seller_name'] if top_competitors else 'نامشخص'}",
        ],
    }


# ============================================================
# Product-Centric Competitor Analysis (حالت محصول خاص)
# ============================================================

def analyze_competitors_for_product(product_id, limit=10, include_indirect=True):
    try:
        target_product = Product.objects.select_related('seller', 'industry').get(id=product_id)
    except Product.DoesNotExist:
        raise ValueError("محصول مورد نظر پیدا نشد.")

    direct_query = Product.objects.select_related('seller', 'industry').filter(
        status__in=MARKET_STATUSES,
        industry=target_product.industry,
        category=target_product.category,
    ).exclude(id=product_id)

    indirect_query = Product.objects.select_related('seller', 'industry').filter(
        status__in=MARKET_STATUSES,
    ).exclude(id=product_id)

    if include_indirect:
        indirect_query = indirect_query.filter(
            Q(industry=target_product.industry) | Q(category=target_product.category)
        ).exclude(
            Q(industry=target_product.industry) & Q(category=target_product.category)
        )
    else:
        indirect_query = Product.objects.none()

    direct_products = list(direct_query)
    indirect_products = list(indirect_query) if include_indirect else []
    all_competitor_products = direct_products + indirect_products

    if not all_competitor_products:
        return {
            "target_product": {
                "id": target_product.id,
                "title": target_product.title,
                "seller": get_seller_name(target_product.seller),
                "industry": target_product.industry.name if target_product.industry else None,
                "category": target_product.category,
            },
            "competitors": [],
            "summary": {
                "total_competitors": 0,
                "direct_count": 0,
                "indirect_count": 0,
                "average_competitive_score": 0,
            },
            "gap_analysis": [],
            "llm_analysis": {},
            "insights": ["هیچ رقیبی برای این محصول یافت نشد."],
        }

    seller_products = defaultdict(list)
    for product in all_competitor_products:
        seller_products[product.seller_id].append(product)

    company_avg_prices = []
    for seller_id, prods in seller_products.items():
        prices = [float(p.price) for p in prods if p.price is not None]
        if prices:
            company_avg_prices.append(mean(prices))
    market_avg_price = mean(company_avg_prices) if company_avg_prices else None

    competitor_data = []

    for seller_id, prods in seller_products.items():
        seller = prods[0].seller
        seller_name = get_seller_name(seller)

        product_ids = [p.id for p in prods]
        match_stats = get_provider_match_stats(seller_id, product_ids)

        market_fit_score = calculate_market_fit_score(match_stats, len(prods))

        quality_result = calculate_quality_score_from_evaluations(product_ids, seller_id)

        readiness_scores = [get_market_readiness(p, all_competitor_products) for p in prods]
        avg_readiness = mean(readiness_scores) if readiness_scores else 0

        maturity = calculate_product_maturity(prods)

        company_prices = [float(p.price) for p in prods if p.price is not None]
        company_avg_price = mean(company_prices) if company_prices else None
        price_pos = calculate_price_position_for_company(company_avg_price, market_avg_price)

        total_views = sum(p.view_count or 0 for p in prods)
        activity_score = clamp(
            (len(prods) / 20) * 100 +
            (total_views / 1000) * 50
        )

        eval_confidence = quality_result.get('confidence', 0)
        price_score = clamp(100 - max(0, price_pos.get('position', 0)))

        metrics = {
            "market_fit": market_fit_score,
            "quality": quality_result.get('score', 0),
            "market_readiness": avg_readiness,
            "product_maturity": maturity.get('score', 0),
            "price": price_score,
            "activity": activity_score,
            "evaluation_confidence": eval_confidence,
        }

        comp_score = calculate_competitive_score(metrics)

        direct_count = sum(1 for p in prods if p.industry_id == target_product.industry_id and p.category == target_product.category)
        is_direct = direct_count > 0

        top_products = get_top_products_for_company(prods, all_competitor_products, limit=3)

        competitor_data.append({
            "seller_id": seller_id,
            "seller_name": seller_name,
            "product_count": len(prods),
            "direct_product_count": direct_count,
            "is_direct": is_direct,
            "products": [
                {
                    "id": p.id,
                    "title": p.title,
                    "category": p.category,
                    "trl": p.trl,
                    "mrl": p.mrl,
                    "price": safe_float(p.price),
                    "status": p.status or "unknown",
                    "view_count": p.view_count or 0,
                    "quality_indicator": get_quality_indicator(p),
                    "market_readiness": get_market_readiness(p, all_competitor_products),
                }
                for p in prods
            ],
            "metrics": {
                "market_fit_score": market_fit_score,
                "quality_score": quality_result.get('score', 0),
                "quality_confidence": quality_result.get('confidence', 0),
                "evaluation_count": quality_result.get('evaluation_count', 0),
                "market_readiness_score": round(avg_readiness, 2),
                "maturity_score": maturity.get('score', 0),
                "average_trl": maturity.get('trl', 0),
                "average_mrl": maturity.get('mrl', 0),
                "price_position": price_pos.get('position', 0),
                "price_comparison": price_pos.get('comparison', ''),
                "company_avg_price": company_avg_price,
                "market_avg_price": market_avg_price,
                "activity_score": round(activity_score, 2),
                "match_stats": match_stats,
            },
            "competitive_score": comp_score,
            "market_fit_score": market_fit_score,
            "top_product": max(prods, key=lambda p: get_market_readiness(p, all_competitor_products)) if prods else None,
            "top_products": top_products,
        })

    competitor_data.sort(key=lambda x: x["competitive_score"]["total"], reverse=True)
    top_competitors = competitor_data[:limit]

    llm_analysis = {}
    if LLMService is not None and top_competitors:
        try:
            target_info = {
                "title": target_product.title,
                "seller": get_seller_name(target_product.seller),
                "industry": target_product.industry.name if target_product.industry else None,
                "category": target_product.category,
                "trl": target_product.trl,
                "mrl": target_product.mrl,
                "price": safe_float(target_product.price),
            }

            competitors_for_llm = []
            for comp in top_competitors[:5]:
                competitors_for_llm.append({
                    "name": comp["seller_name"],
                    "product_count": comp["product_count"],
                    "competitive_score": comp["competitive_score"]["total"],
                    "market_fit": comp["metrics"]["market_fit_score"],
                    "quality": comp["metrics"]["quality_score"],
                    "market_readiness": comp["metrics"]["market_readiness_score"],
                    "avg_trl": comp["metrics"]["average_trl"],
                    "avg_mrl": comp["metrics"]["average_mrl"],
                    "price_position": comp["metrics"]["price_position"],
                    "match_count": comp["metrics"]["match_stats"].get("total_matches", 0),
                    "avg_match_percentage": comp["metrics"]["match_stats"].get("average_match_percentage", 0),
                })

            prompt = f"""
            شما یک تحلیلگر بازار هستید. بر اساس داده‌های زیر، تحلیل رقابتی انجام دهید.

            ===== محصول هدف =====
            نام: {target_info['title']}
            فروشنده: {target_info['seller']}
            صنعت: {target_info['industry']}
            دسته: {target_info['category']}
            TRL: {target_info['trl']}
            MRL: {target_info['mrl']}
            قیمت: {target_info['price']:,.0f} تومان

            ===== رقبای برتر =====
            {json.dumps(competitors_for_llm, ensure_ascii=False, indent=2)}

            لطفاً تحلیل زیر را به صورت JSON با کلیدهای دقیقاً زیر برگردانید:

            {{
                "top_competitor": "نام قوی‌ترین رقیب",
                "strengths": ["نقاط قوت محصول هدف نسبت به رقبا", ...],
                "weaknesses": ["نقاط ضعف محصول هدف نسبت به رقبا", ...],
                "opportunities": ["فرصت‌های بازار", ...],
                "threats": ["تهدیدهای رقابتی", ...],
                "competitive_advantage": "مزیت رقابتی اصلی محصول هدف",
                "summary": "خلاصه تحلیل رقابتی (۳-۴ خط)"
            }}

            پاسخ را فقط به صورت JSON معتبر برگردانید.
            """

            llm_response = LLMService.generate_text(prompt)

            json_match = re.search(r'\{[\s\S]*\}', llm_response)
            if json_match:
                try:
                    llm_analysis = json.loads(json_match.group())
                except json.JSONDecodeError:
                    llm_analysis = {
                        "top_competitor": competitors_for_llm[0]["name"] if competitors_for_llm else "",
                        "strengths": ["تحلیل LLM در دسترس نیست"],
                        "weaknesses": [],
                        "opportunities": [],
                        "threats": [],
                        "competitive_advantage": "",
                        "summary": "تحلیل کامل با LLM امکان‌پذیر نبود."
                    }
            else:
                llm_analysis = {
                    "top_competitor": "",
                    "strengths": [],
                    "weaknesses": [],
                    "opportunities": [],
                    "threats": [],
                    "competitive_advantage": "",
                    "summary": "تحلیل LLM در دسترس نیست."
                }

        except Exception as e:
            logger.error(f"LLM analysis failed: {e}")
            llm_analysis = {
                "top_competitor": "",
                "strengths": [],
                "weaknesses": [],
                "opportunities": [],
                "threats": [],
                "competitive_advantage": "",
                "summary": "تحلیل LLM در دسترس نیست."
            }

    # Gap Analysis
    target_match_stats = get_provider_match_stats(target_product.seller_id, [target_product.id])
    target_market_fit = calculate_market_fit_score(target_match_stats, 1)
    target_quality = calculate_quality_score_from_evaluations([target_product.id], target_product.seller_id)
    target_readiness = get_market_readiness(target_product, all_competitor_products)
    target_maturity = calculate_product_maturity([target_product])
    target_price = safe_float(target_product.price)

    gaps = []
    if top_competitors:
        avg_market_fit = mean(c["market_fit_score"] for c in top_competitors)
        avg_quality = mean(c["metrics"]["quality_score"] for c in top_competitors)
        avg_readiness = mean(c["metrics"]["market_readiness_score"] for c in top_competitors)
        avg_maturity = mean(c["metrics"]["maturity_score"] for c in top_competitors)

        gap_market_fit = target_market_fit - avg_market_fit
        gap_quality = target_quality.get("score", 0) - avg_quality
        gap_readiness = target_readiness - avg_readiness
        gap_maturity = target_maturity.get("score", 0) - avg_maturity

        gaps = [
            {"metric": "Market Fit", "target": round(target_market_fit, 2), "average": round(avg_market_fit, 2), "gap": round(gap_market_fit, 2), "is_advantage": gap_market_fit > 0},
            {"metric": "Quality", "target": round(target_quality.get("score", 0), 2), "average": round(avg_quality, 2), "gap": round(gap_quality, 2), "is_advantage": gap_quality > 0},
            {"metric": "Market Readiness", "target": round(target_readiness, 2), "average": round(avg_readiness, 2), "gap": round(gap_readiness, 2), "is_advantage": gap_readiness > 0},
            {"metric": "Product Maturity", "target": round(target_maturity.get("score", 0), 2), "average": round(avg_maturity, 2), "gap": round(gap_maturity, 2), "is_advantage": gap_maturity > 0},
        ]

        avg_company_prices = [
            c["metrics"].get("company_avg_price")
            for c in top_competitors
            if c["metrics"].get("company_avg_price") is not None
        ]
        if avg_company_prices:
            avg_competitor_price = mean(avg_company_prices)
            price_gap = (target_price or 0) - avg_competitor_price
            is_price_advantage = price_gap < 0
            gaps.append({
                "metric": "Price",
                "target": target_price or 0,
                "average": round(avg_competitor_price, 2),
                "gap": round(price_gap, 2),
                "is_advantage": is_price_advantage,
            })
        else:
            gaps.append({
                "metric": "Price",
                "target": target_price or 0,
                "average": 0,
                "gap": 0,
                "is_advantage": False,
            })

        gaps.sort(key=lambda x: x["gap"])

    target_rank = next((idx + 1 for idx, c in enumerate(competitor_data) if c["seller_id"] == target_product.seller_id), None)

    return {
        "target_product": {
            "id": target_product.id,
            "title": target_product.title,
            "seller": get_seller_name(target_product.seller),
            "industry": target_product.industry.name if target_product.industry else None,
            "category": target_product.category,
            "trl": target_product.trl,
            "mrl": target_product.mrl,
            "price": safe_float(target_product.price),
            "market_readiness": target_readiness,
            "quality_score": target_quality.get("score", 0),
            "evaluation_count": target_quality.get("evaluation_count", 0),
            "market_fit_score": target_market_fit,
            "maturity_score": target_maturity.get("score", 0),
        },
        "competitors": [
            {
                "rank": idx + 1,
                "seller_id": comp["seller_id"],
                "seller_name": comp["seller_name"],
                "product_count": comp["product_count"],
                "is_direct": comp["is_direct"],
                "direct_product_count": comp.get("direct_product_count", 0),
                "competitive_score": comp["competitive_score"]["total"],
                "score_details": comp["competitive_score"]["details"],
                "market_fit_score": comp["market_fit_score"],
                "quality_score": comp["metrics"]["quality_score"],
                "quality_confidence": comp["metrics"]["quality_confidence"],
                "market_readiness_score": comp["metrics"]["market_readiness_score"],
                "maturity_score": comp["metrics"]["maturity_score"],
                "average_trl": comp["metrics"]["average_trl"],
                "average_mrl": comp["metrics"]["average_mrl"],
                "price_position": comp["metrics"]["price_position"],
                "price_comparison": comp["metrics"]["price_comparison"],
                "company_avg_price": comp["metrics"]["company_avg_price"],
                "market_avg_price": comp["metrics"]["market_avg_price"],
                "match_stats": comp["metrics"]["match_stats"],
                "top_products": comp["top_products"],
            }
            for idx, comp in enumerate(top_competitors)
        ],
        "summary": {
            "total_competitors": len(competitor_data),
            "direct_count": sum(1 for c in competitor_data if c["is_direct"]),
            "indirect_count": sum(1 for c in competitor_data if not c["is_direct"]),
            "average_competitive_score": round(mean(c["competitive_score"]["total"] for c in competitor_data), 2) if competitor_data else 0,
            "top_competitor": top_competitors[0]["seller_name"] if top_competitors else None,
            "target_rank": target_rank,
        },
        "gap_analysis": gaps,
        "llm_analysis": llm_analysis,
        "insights": [
            f"تعداد {len(competitor_data)} رقیب شناسایی شد که {sum(1 for c in competitor_data if c['is_direct'])} رقیب مستقیم هستند.",
            f"قوی‌ترین رقیب: {top_competitors[0]['seller_name'] if top_competitors else 'نامشخص'} با امتیاز {top_competitors[0]['competitive_score']['total'] if top_competitors else 0}.",
            f"محصول شما در جایگاه {target_rank if target_rank else 'نامشخص'} قرار دارد." if target_rank else "",
        ],
    }


# ============================================================
# API Wrapper - پشتیبانی از هر دو حالت
# ============================================================

def generate_competitor_analysis(
    product_id=None,
    limit=10,
    include_indirect=True,
    industry=None,
    category=None,
    region=None,
    tech=None,
):
    """
    Wrapper برای تحلیل رقبا
    اگر product_id داده شود → تحلیل محصول-محور
    در غیر این صورت → تحلیل کل بازار بر اساس فیلترها
    """
    try:
        if product_id is not None:
            data = analyze_competitors_for_product(product_id, limit, include_indirect)
            data['filters'] = {
                'product_id': product_id,
                'limit': limit,
                'include_indirect': include_indirect,
                'analysis_type': 'product_centric',
            }
        else:
            industry_id = resolve_industry_param(industry)
            data = analyze_market_competitors(
                industry_id=industry_id,
                category=category,
                region=region,
                tech=tech,
                limit=limit,
            )
            data['filters'] = {
                'industry': industry,
                'category': category,
                'region': region,
                'tech': tech,
                'limit': limit,
                'analysis_type': 'market_level',
            }
            data['target_product'] = None
            data['gap_analysis'] = []
        return data
    except ValueError as e:
        raise e
    except Exception as e:
        logger.exception(f"Competitor analysis failed: {e}")
        raise RuntimeError("خطا در تحلیل رقبا.")


# ============================================================
# Market Intelligence
# ============================================================

def build_product_indicator(product, industry_products):
    try:
        evaluation = get_latest_evaluation(product)
        quality = get_quality_indicator(product)
        maturity_risk = get_maturity_risk(product)
        market_readiness = get_market_readiness(product, industry_products)

        return {
            "product_id": product.id,
            "title": product.title,
            "seller_id": product.seller_id,
            "seller_name": get_seller_name(product.seller),
            "industry": product.industry.name if product.industry else None,
            "category": product.category,
            "trl": product.trl,
            "mrl": product.mrl,
            "quality_indicator": quality,
            "maturity_risk": maturity_risk,
            "market_readiness": market_readiness,
            "view_count": product.view_count or 0,
            "has_sample_customers": bool(product.sample_customers and product.sample_customers.strip()),
            "has_certificates": bool(product.certificates),
            "has_documentation": bool(product.documentation),
            "price": safe_float(product.price),
            "status": product.status,
            "evaluation_decision": evaluation.final_decision if evaluation else None,
            "created_at": product.created_at.isoformat() if product.created_at else None,
        }
    except Exception as e:
        logger.error(f"Error building product indicator for product {product.id}: {e}")
        return None


def build_monthly_trend(
    industry_id=None,
    category=None,
    trl_min=None,
    trl_max=None,
    months=12,
):
    now = timezone.now()
    result = []

    logger.info(f"Building monthly trend for {months} months, "
                f"industry_id={industry_id}, category={category}, "
                f"trl_min={trl_min}, trl_max={trl_max}")

    for offset in range(months - 1, -1, -1):
        current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_start = (current - timedelta(days=32 * offset)).replace(day=1)

        if offset == 0:
            month_end = now
        else:
            next_month = (month_start + timedelta(days=32)).replace(day=1)
            month_end = next_month

        month_label = month_start.strftime("%Y-%m")
        logger.debug(f"Processing month: {month_label}")

        product_qs = Product.objects.filter(
            status__in=MARKET_STATUSES,
            created_at__gte=month_start,
            created_at__lt=month_end,
        )

        if industry_id is not None:
            product_qs = product_qs.filter(industry_id=industry_id)

        if category:
            product_qs = product_qs.filter(category=category)

        if trl_min is not None:
            product_qs = product_qs.filter(trl__gte=trl_min)

        if trl_max is not None:
            product_qs = product_qs.filter(trl__lte=trl_max)

        supply_count = product_qs.count()

        demand_count = 0
        if Need is not None:
            try:
                need_qs = Need.objects.filter(
                    status__in=OPEN_NEED_STATUSES,
                    created_at__gte=month_start,
                    created_at__lt=month_end,
                )
                if industry_id is not None:
                    need_qs = need_qs.filter(industry_id=industry_id)

                demand_count = need_qs.count()
                logger.debug(f"Month {month_label}: Needs (open) = {demand_count}")
            except Exception as e:
                logger.error(f"Error counting needs for trend: {e}")

        deals_count = 0
        if Contract is not None:
            try:
                deals_qs = Contract.objects.filter(
                    status__in=SUCCESSFUL_CONTRACT_STATUSES,
                    signed_at__gte=month_start,
                    signed_at__lt=month_end,
                )
                deals_count = deals_qs.count()
                logger.debug(f"Month {month_label}: Deals (signed contracts) = {deals_count}")
            except Exception as e:
                logger.error(f"Error counting contracts for trend: {e}")

        result.append({
            "month": month_label,
            "تقاضا": demand_count,
            "عرضه": supply_count,
            "معاملات": deals_count,
        })

    total_demand = sum(item["تقاضا"] for item in result)
    total_supply = sum(item["عرضه"] for item in result)
    total_deals = sum(item["معاملات"] for item in result)
    logger.info(f"Monthly trend summary: Total demand (open needs)={total_demand}, "
                f"Total supply={total_supply}, Total deals={total_deals}, Months={len(result)}")

    return result


def generate_market_intelligence(industry=None, category=None, trl_min=None, trl_max=None):
    try:
        industry_id = resolve_industry_param(industry)

        total_needs = 0
        needs_data = {"total": 0, "receiving_proposals": 0, "matched": 0, "evaluating": 0}
        if Need is not None:
            try:
                need_qs = Need.objects.filter(status__in=OPEN_NEED_STATUSES)
                if industry_id is not None:
                    need_qs = need_qs.filter(industry_id=industry_id)

                total_needs = need_qs.count()
                needs_data["total"] = total_needs
                needs_data["receiving_proposals"] = need_qs.filter(status="receiving_proposals").count()
                needs_data["matched"] = need_qs.filter(status="matched").count()
                needs_data["evaluating"] = need_qs.filter(status="evaluating").count()
                logger.info(f"Total needs (open) in market: {total_needs}")
            except Exception as e:
                logger.warning(f"Could not fetch total needs: {e}")

        product_queryset = Product.objects.select_related("seller", "industry").filter(status__in=MARKET_STATUSES)

        if industry_id is not None:
            product_queryset = product_queryset.filter(industry_id=industry_id)

        if category:
            product_queryset = product_queryset.filter(category=category)

        if trl_min is not None:
            product_queryset = product_queryset.filter(trl__gte=trl_min)

        if trl_max is not None:
            product_queryset = product_queryset.filter(trl__lte=trl_max)

        products = list(product_queryset)

        if not products:
            logger.info("No products found, but returning needs data and empty fields.")
            return {
                "filters": {
                    "industry": industry,
                    "category": category,
                    "trl_min": trl_min,
                    "trl_max": trl_max,
                },
                "summary": {
                    "total_products": 0,
                    "total_services": 0,
                    "total_needs": total_needs,
                    "published_products": 0,
                    "average_price": None,
                    "average_trl": None,
                    "average_mrl": None,
                },
                "categories": [],
                "industries": [],
                "trl_distribution": [],
                "mrl_distribution": [],
                "price": {"min_price": None, "max_price": None, "average_price": None, "median_price": None},
                "providers": [],
                "needs": needs_data,
                "insights": ["داده کافی برای تحلیل وجود ندارد."],
                "trends": build_monthly_trend(
                    industry_id=industry_id,
                    category=category,
                    trl_min=trl_min,
                    trl_max=trl_max,
                    months=12,
                ),
                "top_products": [],
            }

        indicators = []
        for product in products:
            ind = build_product_indicator(product, products)
            if ind is not None:
                indicators.append(ind)

        total_products = sum(1 for p in products if p.category == "product")
        total_services = sum(1 for p in products if p.category == "service")
        total_records = len(products)

        published_products = sum(
            1 for p in products
            if p.status == "published" and p.category == "product"
        )

        price_data = [p.price for p in products if p.price is not None]
        average_price = mean(price_data) if price_data else None
        median_price = median(price_data) if price_data else None

        trl_data = [p.trl for p in products if p.trl is not None]
        average_trl = mean(trl_data) if trl_data else None

        mrl_data = [p.mrl for p in products if p.mrl is not None]
        average_mrl = mean(mrl_data) if mrl_data else None

        summary = {
            "total_products": total_products,
            "total_services": total_services,
            "total_needs": total_needs,
            "published_products": published_products,
            "average_price": safe_float(average_price),
            "average_trl": safe_float(average_trl),
            "average_mrl": safe_float(average_mrl),
        }

        categories = []
        category_counts = {}
        for p in products:
            cat = p.category or "نامشخص"
            category_counts[cat] = category_counts.get(cat, 0) + 1
        for cat, count in category_counts.items():
            categories.append({
                "category": cat,
                "count": count,
                "percentage": round((count / total_records) * 100, 2) if total_records else 0
            })
        categories.sort(key=lambda x: x["count"], reverse=True)

        industries = []
        industry_counts = {}
        for p in products:
            ind = p.industry.name if p.industry else "بدون صنعت"
            industry_counts[ind] = industry_counts.get(ind, 0) + 1
        for ind, count in industry_counts.items():
            industries.append({
                "industry": ind,
                "count": count,
                "percentage": round((count / total_records) * 100, 2) if total_records else 0
            })
        industries.sort(key=lambda x: x["count"], reverse=True)

        trl_distribution = []
        trl_counts = {}
        for p in products:
            trl = p.trl or 0
            trl_counts[trl] = trl_counts.get(trl, 0) + 1
        for trl, count in sorted(trl_counts.items()):
            trl_distribution.append({
                "trl": trl,
                "count": count,
                "percentage": round((count / total_records) * 100, 2) if total_records else 0
            })

        mrl_distribution = []
        mrl_counts = {}
        for p in products:
            mrl = p.mrl or 0
            mrl_counts[mrl] = mrl_counts.get(mrl, 0) + 1
        for mrl, count in sorted(mrl_counts.items()):
            mrl_distribution.append({
                "mrl": mrl,
                "count": count,
                "percentage": round((count / total_records) * 100, 2) if total_records else 0
            })

        price_analysis = {
            "min_price": min(price_data) if price_data else None,
            "max_price": max(price_data) if price_data else None,
            "average_price": average_price,
            "median_price": median_price,
        }

        providers = []
        provider_data = {}
        for p in indicators:
            seller = p["seller_name"]
            if seller not in provider_data:
                provider_data[seller] = {
                    "provider": seller,
                    "product_count": 0,
                    "average_trl": [],
                    "average_mrl": [],
                }
            provider_data[seller]["product_count"] += 1
            if p["trl"] is not None:
                provider_data[seller]["average_trl"].append(p["trl"])
            if p["mrl"] is not None:
                provider_data[seller]["average_mrl"].append(p["mrl"])
        for data in provider_data.values():
            providers.append({
                "provider": data["provider"],
                "product_count": data["product_count"],
                "average_trl": round(mean(data["average_trl"]), 2) if data["average_trl"] else None,
                "average_mrl": round(mean(data["average_mrl"]), 2) if data["average_mrl"] else None,
            })
        providers.sort(key=lambda x: x["product_count"], reverse=True)

        insights = []
        if total_records == 0:
            insights.append("در این محدوده فیلتری، محصولی یافت نشد.")
        else:
            if average_trl is not None and average_trl >= 7:
                insights.append("سطح آمادگی فناوری غالب در بازار نسبتاً بالا است.")
            elif average_trl is not None and average_trl >= 5:
                insights.append("بازار ترکیبی از فناوری‌های در حال بلوغ و آماده بهره‌برداری دارد.")
            elif average_trl is not None:
                insights.append("بخش قابل توجهی از فناوری‌های بازار هنوز در مراحل پایین آمادگی قرار دارند.")

            if categories:
                top_cat = categories[0]
                insights.append(
                    f"بیشترین تمرکز بازار در دسته «{top_cat['category']}» است "
                    f"با {top_cat['percentage']} درصد از محصولات."
                )

            if industries:
                top_ind = industries[0]
                insights.append(
                    f"بیشترین حضور عرضه‌کنندگان مربوط به صنعت «{top_ind['industry']}» است."
                )

            if price_analysis["average_price"] is not None:
                insights.append(
                    f"میانگین قیمت محصولات در این بازار {price_analysis['average_price']:,.0f} تومان است."
                )

            if needs_data["total"] > 0:
                insights.append(
                    f"در محدوده انتخاب‌شده {needs_data['total']} نیاز باز در سامانه ثبت شده است."
                )
            else:
                insights.append("در محدوده انتخاب‌شده نیاز باز قابل توجهی ثبت نشده است.")

        trends = build_monthly_trend(
            industry_id=industry_id,
            category=category,
            trl_min=trl_min,
            trl_max=trl_max,
            months=12,
        )

        top_products = sorted(
            indicators,
            key=lambda x: (x.get("market_readiness", 0), x.get("quality_indicator", 0), x.get("view_count", 0)),
            reverse=True
        )[:10]

        return {
            "filters": {
                "industry": industry,
                "category": category,
                "trl_min": trl_min,
                "trl_max": trl_max,
            },
            "summary": summary,
            "categories": categories,
            "industries": industries,
            "trl_distribution": trl_distribution,
            "mrl_distribution": mrl_distribution,
            "price": price_analysis,
            "providers": providers,
            "needs": needs_data,
            "insights": insights,
            "trends": trends,
            "top_products": top_products,
        }
    except Exception as e:
        logger.exception("Unexpected error in generate_market_intelligence: %s", e)
        raise


# ============================================================
# Conversion Funnel (اصلاح‌شده بر اساس Supply, Need, Negotiation, Contract)
# ============================================================

def get_conversion_funnel(user):
    """
    قیف مذاکرات بر اساس مراحل واقعی:
        1. Supplyهای منتشرشده کاربر
        2. Needهای فعال کاربر
        3. کل Negotiation‌های کاربر
        4. Contractهای موفق کاربر
    """
    supplies = 0
    needs = 0
    negotiations = 0
    successful_contracts = 0

    try:
        from products.models import Supply
        supplies = Supply.objects.filter(seller=user, status="published").count()
    except Exception:
        logger.exception("Error counting supplies for funnel")

    try:
        from needs.models import Need
        needs = Need.objects.filter(buyer=user, status__in=ACTIVE_NEED_STATUSES).count()
    except Exception:
        logger.exception("Error counting needs for funnel")

    try:
        from negotiations.models import Negotiation
        negotiations = Negotiation.objects.filter(Q(buyer=user) | Q(supplier=user)).count()
    except Exception:
        logger.exception("Error counting negotiations for funnel")

    try:
        from contract.models import Contract
        successful_contracts = Contract.objects.filter(
            Q(buyer=user) | Q(supplier=user),
            status__in=SUCCESSFUL_CONTRACT_STATUSES
        ).count()
    except Exception:
        logger.exception("Error counting successful contracts for funnel")

    base = max(supplies + needs, 1)

    return [
        {
            "label": "محصولات و عرضه‌های فعال",
            "value": supplies,
            "percent": round((supplies / base) * 100) if supplies > 0 else 0,
        },
        {
            "label": "نیازهای فعال",
            "value": needs,
            "percent": round((needs / base) * 100) if needs > 0 else 0,
        },
        {
            "label": "مذاکرات",
            "value": negotiations,
            "percent": round((negotiations / base) * 100) if negotiations > 0 else 0,
        },
        {
            "label": "معاملات موفق",
            "value": successful_contracts,
            "percent": round((successful_contracts / base) * 100) if successful_contracts > 0 else 0,
        },
    ]


# ============================================================
# Dashboard Data (نسخه نهایی با recentActivities اصلاح‌شده)
# ============================================================

def generate_dashboard_data(user):
    try:
        total_products = Product.objects.filter(seller=user, status__in=MARKET_STATUSES).count()
    except Exception:
        total_products = 0
        logger.exception("Error counting products")

    active_needs = 0
    if Need is not None:
        try:
            active_needs = Need.objects.filter(buyer=user, status__in=ACTIVE_NEED_STATUSES).count()
        except Exception:
            logger.exception("Error counting needs")

    ongoing_contracts = 0
    if Contract is not None:
        try:
            ongoing_contracts = Contract.objects.filter(
                Q(buyer=user) | Q(supplier=user),
                status__in=ONGOING_CONTRACT_STATUSES,
            ).count()
        except Exception:
            logger.exception("Error counting ongoing contracts")

    successful_deals = 0
    if Contract is not None:
        try:
            successful_deals = Contract.objects.filter(
                Q(buyer=user) | Q(supplier=user),
                status__in=SUCCESSFUL_CONTRACT_STATUSES,
            ).count()
        except Exception:
            logger.exception("Error counting successful deals")

    # ===== استفاده از تابع جدید برای فعالیت‌ها =====
    recent_activities = get_recent_activities(user, limit=RECENT_LIMIT)

    # نیازهای اخیر و عرضه‌های اخیر
    recent_needs = get_recent_needs(user, limit=RECENT_LIMIT)
    recent_supplies = get_recent_supplies(user, limit=RECENT_LIMIT)

    # قیف مذاکرات
    conversion_funnel = get_conversion_funnel(user)

    # روند معاملات ماهانه
    monthly_deals = []
    if Contract is not None:
        try:
            now = timezone.now()
            for offset in range(5, -1, -1):
                current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                month_start = (current - timedelta(days=32 * offset)).replace(day=1)
                month_end = (month_start + timedelta(days=32)).replace(day=1)

                count = Contract.objects.filter(
                    Q(buyer=user) | Q(supplier=user),
                    status__in=SUCCESSFUL_CONTRACT_STATUSES,
                    signed_at__gte=month_start,
                    signed_at__lt=month_end,
                ).count()

                monthly_deals.append({
                    "month": month_start.strftime("%Y-%m"),
                    "deals": count,
                })
        except Exception:
            logger.exception("Error calculating monthly deals")

    # برترین طرف‌های معامله
    top_suppliers = []
    if Contract is not None:
        try:
            supplier_stats = (
                Contract.objects
                .filter(Q(buyer=user), status__in=SUCCESSFUL_CONTRACT_STATUSES)
                .values("supplier_id", "supplier__company_name", "supplier__username")
                .annotate(deal_count=Count("id"), total_value=Sum("total_value"))
                .order_by("-deal_count", "-total_value")[:5]
            )
            for item in supplier_stats:
                name = item["supplier__company_name"] or item["supplier__username"] or "نامشخص"
                top_suppliers.append({
                    "id": item["supplier_id"],
                    "name": name,
                    "deals": item["deal_count"],
                    "score": round(item["total_value"] or 0, 0),
                })
        except Exception:
            logger.exception("Error calculating top suppliers")

    # پیشنهادات هوشمند
    smart_suggestions = []
    if active_needs > 0 and total_products == 0:
        smart_suggestions.append({
            "title": "نیازهای فعال شما آماده بررسی هستند",
            "match": 85,
            "reason": "برای نیازهای فعال، عرضه‌کنندگان و محصولات مرتبط را بررسی کنید.",
            "type": "need"
        })
    if total_products > 0 and active_needs == 0:
        smart_suggestions.append({
            "title": "برای محصولات خود بازار هدف پیدا کنید",
            "match": 70,
            "reason": "ثبت نیازهای مرتبط می‌تواند فرصت‌های جدیدی ایجاد کند.",
            "type": "supply"
        })
    if successful_deals == 0:
        smart_suggestions.append({
            "title": "هنوز معامله موفقی ثبت نشده است",
            "match": 60,
            "reason": "با پیگیری قراردادها و تبدیل آن‌ها به معامله موفق، عملکرد خود را بهبود دهید.",
            "type": "opportunity"
        })

    negotiation_insights = []
    if ongoing_contracts > 0:
        negotiation_insights.append({
            "label": "قراردادهای در جریان",
            "value": ongoing_contracts,
            "percent": 50,
        })
    if successful_deals > 0:
        negotiation_insights.append({
            "label": "معاملات موفق",
            "value": successful_deals,
            "percent": 100,
        })

    return {
        "stats": {
            "totalProducts": total_products,
            "activeNeeds": active_needs,
            "ongoingNegotiations": ongoing_contracts,
            "successfulDeals": successful_deals,
        },
        "industryData": [],
        "monthlyDeals": monthly_deals,
        "recentActivities": recent_activities,
        "smartSuggestions": smart_suggestions,
        "conversionFunnel": conversion_funnel,
        "topSuppliers": top_suppliers,
        "negotiationInsights": negotiation_insights,
        "recentNeeds": recent_needs,
        "recentSupplies": recent_supplies,
    }