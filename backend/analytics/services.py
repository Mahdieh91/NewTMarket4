# analytics/services.py
# تحلیل بازار بر اساس Product و Need (Supply فعلاً استفاده نمی‌شود)

import logging
from collections import defaultdict
from datetime import timedelta
from statistics import mean
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone

from products.models import Product

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
    from negotiations.models import Negotiation
except ImportError:
    Negotiation = None

# ============================================================
# ⚠️ Supply فعلاً در تحلیل بازار استفاده نمی‌شود.
# خط زیر کامنت شده است تا در صورت نیاز بعداً فعال شود.
# ============================================================
# try:
#     from products.models import Supply
# except ImportError:
#     Supply = None

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


# ============================================================
# Resolve industry parameter (can be id or name)
# ============================================================

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


def get_market_readiness(product, industry_products):
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
# Product Indicator
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


# ============================================================
# Competitor Dataset
# ============================================================

def build_competitor_dataset(product_indicators):
    try:
        competitors = defaultdict(list)
        for product in product_indicators:
            if product is not None:
                competitors[product["seller_id"]].append(product)

        result = []
        for seller_id, products in competitors.items():
            if not products:
                continue
            quality_values = [p["quality_indicator"] for p in products]
            risk_values = [p["maturity_risk"] for p in products]
            readiness_values = [p["market_readiness"] for p in products]
            active_products = sum(1 for p in products if p["status"] in MARKET_STATUSES)
            sample_customer_products = sum(1 for p in products if p["has_sample_customers"])
            certified_products = sum(1 for p in products if p["has_certificates"])
            total_views = sum(p["view_count"] for p in products)

            result.append({
                "seller_id": seller_id,
                "seller_name": products[0]["seller_name"],
                "product_count": len(products),
                "active_product_count": active_products,
                "total_views": total_views,
                "sample_customer_product_count": sample_customer_products,
                "certified_product_count": certified_products,
                "average_quality": round(mean(quality_values), 2) if quality_values else 0,
                "average_maturity_risk": round(mean(risk_values), 2) if risk_values else 0,
                "average_market_readiness": round(mean(readiness_values), 2) if readiness_values else 0,
                "products": [
                    {
                        "product_id": p["product_id"],
                        "title": p["title"],
                        "category": p["category"],
                        "quality_indicator": p["quality_indicator"],
                        "maturity_risk": p["maturity_risk"],
                        "market_readiness": p["market_readiness"],
                        "view_count": p["view_count"],
                        "trl": p["trl"],
                        "mrl": p["mrl"],
                        "status": p["status"],
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
    except Exception as e:
        logger.error(f"Error building competitor dataset: {e}")
        return []


# ============================================================
# Needs Dataset
# ============================================================

def build_needs_dataset(industry_id=None, category=None):
    if Need is None:
        return []
    try:
        queryset = Need.objects.select_related("buyer", "industry").exclude(status="draft")
        if industry_id:
            queryset = queryset.filter(industry_id=industry_id)
        needs = list(queryset)
    except Exception as exc:
        logger.exception("Error loading needs: %s", exc)
        return []

    result = []
    for need in needs:
        result.append({
            "id": need.id,
            "title": need.title,
            "industry": need.industry.name if need.industry else None,
            "industry_id": need.industry_id,
            "status": need.status,
            "budget": safe_float(need.budget),
            "timeline": need.timeline,
            "created_at": need.created_at.isoformat() if need.created_at else None,
        })
    return result


# ============================================================
# Monthly Trend
# ============================================================

def build_monthly_trend(industry_id=None, months=6):
    now = timezone.now()
    result = []
    for offset in range(months - 1, -1, -1):
        current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_start = (current - timedelta(days=32 * offset)).replace(day=1)
        if offset == 0:
            month_end = now
        else:
            next_month = (month_start + timedelta(days=32)).replace(day=1)
            month_end = next_month

        product_qs = Product.objects.filter(
            status__in=MARKET_STATUSES,
            created_at__gte=month_start,
            created_at__lt=month_end,
        )
        if industry_id:
            product_qs = product_qs.filter(industry_id=industry_id)
        product_count = product_qs.count()   # تعداد محصولات + خدمات در آن بازه

        demand_count = 0
        if Need is not None:
            need_qs = Need.objects.exclude(status="draft").filter(
                created_at__gte=month_start,
                created_at__lt=month_end,
            )
            if industry_id:
                need_qs = need_qs.filter(industry_id=industry_id)
            demand_count = need_qs.count()

        deals_count = 0
        if Negotiation is not None:
            deals_qs = Negotiation.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end,
                status__in=SUCCESSFUL_NEGOTIATION_STATUSES,
            )
            deals_count = deals_qs.count()

        result.append({
            "month": month_start.strftime("%Y-%m"),
            "تقاضا": demand_count,
            "عرضه": product_count,   # عرضه = تعداد محصولات منتشرشده در آن ماه
            "معاملات": deals_count,
        })
    return result


# ============================================================
# Main Market Intelligence
# ============================================================

def generate_market_intelligence(industry=None, category=None, trl_min=None, trl_max=None):
    try:
        industry_id = resolve_industry_param(industry)

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
                    "total_needs": 0,
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
                "needs": {"total": 0, "receiving_proposals": 0, "matched": 0, "evaluating": 0},
                "insights": ["داده کافی برای تحلیل وجود ندارد."],
            }

        indicators = []
        for product in products:
            ind = build_product_indicator(product, products)
            if ind is not None:
                indicators.append(ind)

        # ============================================================
        # آمارهای اصلی بر اساس Product (و دسته‌بندی product/service)
        # ============================================================
        total_products = sum(1 for p in products if p.category == "product")
        total_services = sum(1 for p in products if p.category == "service")
        total_records = len(products)  # مجموع محصولات و خدمات

        total_needs = 0
        if Need is not None:
            try:
                total_needs = Need.objects.filter(status__in=OPEN_NEED_STATUSES).count()
            except Exception:
                pass

        # ============================================================
        # published_products فقط محصولات (نه سرویس‌ها) را شامل می‌شود
        # ============================================================
        published_products = sum(
            1 for p in products
            if p.status == "published" and p.category == "product"
        )

        price_data = [p.price for p in products if p.price is not None]
        average_price = mean(price_data) if price_data else None

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

        # ============================================================
        # توزیع‌ها بر اساس total_records محاسبه می‌شوند
        # ============================================================

        # Category Distribution
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

        # Industry Distribution
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

        # TRL Distribution
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

        # MRL Distribution
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

        # Price Analysis
        prices = [safe_float(p.price) for p in products if p.price is not None]
        price_analysis = {
            "min_price": min(prices) if prices else None,
            "max_price": max(prices) if prices else None,
            "average_price": mean(prices) if prices else None,
            "median_price": sorted(prices)[len(prices)//2] if prices else None,
        }

        # Providers (بر اساس seller_name)
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

        # Needs
        needs_data = {"total": 0, "receiving_proposals": 0, "matched": 0, "evaluating": 0}
        if Need is not None:
            try:
                needs_queryset = Need.objects.exclude(status="draft")
                if industry_id:
                    needs_queryset = needs_queryset.filter(industry_id=industry_id)
                needs_data["total"] = needs_queryset.count()
                needs_data["receiving_proposals"] = needs_queryset.filter(status="receiving_proposals").count()
                needs_data["matched"] = needs_queryset.filter(status="matched").count()
                needs_data["evaluating"] = needs_queryset.filter(status="evaluating").count()
            except Exception as e:
                logger.warning("Could not fetch needs data: %s", e)

        # Insights
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
                    f"در محدوده انتخاب‌شده {needs_data['total']} نیاز فعال در سامانه ثبت شده است."
                )
            else:
                insights.append("در محدوده انتخاب‌شده نیاز فعال قابل توجهی ثبت نشده است.")

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
        }
    except Exception as e:
        logger.exception("Unexpected error in generate_market_intelligence: %s", e)
        raise


# ============================================================
# Competitor Analysis
# ============================================================

def generate_competitor_analysis(product_id, limit=20):
    try:
        product = Product.objects.select_related("industry", "seller").get(id=product_id)
    except Product.DoesNotExist:
        raise ValueError("محصول مورد نظر پیدا نشد.")

    queryset = Product.objects.select_related("industry", "seller").filter(
        status__in=MARKET_STATUSES
    ).exclude(id=product.id)

    if product.industry_id:
        queryset = queryset.filter(industry_id=product.industry_id)
    if product.category:
        queryset = queryset.filter(category=product.category)

    competitors_qs = queryset[:limit]

    competitors = []
    for comp in competitors_qs:
        quality = get_quality_indicator(comp)
        risk = get_maturity_risk(comp)
        readiness = get_market_readiness(comp, list(competitors_qs) + [product])

        competitive_score = round(
            (readiness * 0.4) +
            (quality * 0.3) +
            ((100 - risk) * 0.3),
            2
        )

        competitors.append({
            "product_id": comp.id,
            "title": comp.title,
            "provider": get_seller_name(comp.seller),
            "category": comp.category or "",
            "industry": comp.industry.name if comp.industry else None,
            "trl": comp.trl,
            "mrl": comp.mrl,
            "price": safe_float(comp.price),
            "quality_score": quality,
            "risk_score": risk,
            "market_readiness_score": readiness,
            "evaluation_count": 1 if get_latest_evaluation(comp) else 0,
            "competitive_score": competitive_score,
            "competitive_advantage": comp.competitive_advantage or "",
        })

    competitors.sort(key=lambda x: x["competitive_score"], reverse=True)

    summary = {
        "total_competitors": len(competitors),
        "average_price": None,
        "average_trl": None,
        "average_mrl": None,
        "average_quality": None,
        "average_market_readiness": None,
    }
    if competitors:
        prices = [c["price"] for c in competitors if c["price"] is not None]
        trls = [c["trl"] for c in competitors if c["trl"] is not None]
        mrls = [c["mrl"] for c in competitors if c["mrl"] is not None]
        qualities = [c["quality_score"] for c in competitors if c["quality_score"] is not None]
        readinesses = [c["market_readiness_score"] for c in competitors if c["market_readiness_score"] is not None]
        if prices:
            summary["average_price"] = round(mean(prices), 2)
        if trls:
            summary["average_trl"] = round(mean(trls), 2)
        if mrls:
            summary["average_mrl"] = round(mean(mrls), 2)
        if qualities:
            summary["average_quality"] = round(mean(qualities), 2)
        if readinesses:
            summary["average_market_readiness"] = round(mean(readinesses), 2)

    insights = []
    if competitors:
        strongest = competitors[0]
        insights.append(
            f"قوی‌ترین رقیب شناسایی‌شده «{strongest['title']}» است "
            f"با امتیاز رقابتی {strongest['competitive_score']}."
        )
        if summary["average_price"] is not None:
            insights.append(f"میانگین قیمت رقبا {summary['average_price']:,.0f} تومان است.")
        if summary["average_trl"] is not None:
            insights.append(f"میانگین TRL رقبا {summary['average_trl']:.1f} است.")
        if summary["average_quality"] is not None:
            insights.append(f"میانگین امتیاز کیفیت رقبا {summary['average_quality']:.1f} از 100 است.")
        if summary["average_market_readiness"] is not None:
            insights.append(f"میانگین آمادگی بازار رقبا {summary['average_market_readiness']:.1f} از 100 است.")
    else:
        insights.append("رقیب قابل مقایسه‌ای بر اساس صنعت و دسته محصول پیدا نشد.")

    return {
        "filters": {
            "product_id": product_id,
            "industry": product.industry.name if product.industry else None,
            "category": product.category,
        },
        "summary": summary,
        "competitors": competitors,
        "insights": insights,
    }


# ============================================================
# Dashboard
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

    ongoing_negotiations = 0
    successful_deals = 0
    recent_activities = []
    conversion_funnel = []

    if Negotiation is not None:
        try:
            user_negotiations = Negotiation.objects.filter(
                Q(buyer=user) | Q(supplier=user)
            ).select_related("buyer", "supplier", "supply").order_by("-created_at")

            ongoing_negotiations = user_negotiations.filter(status__in=ONGOING_NEGOTIATION_STATUSES).count()
            successful_deals = user_negotiations.filter(status__in=SUCCESSFUL_NEGOTIATION_STATUSES).count()

            recent_negotiations = user_negotiations[:5]
            status_labels = dict(Negotiation.STATUS_CHOICES)
            for neg in recent_negotiations:
                if neg.buyer_id == user.id:
                    other_user = neg.supplier
                else:
                    other_user = neg.buyer
                recent_activities.append({
                    "id": str(neg.id),
                    "title": neg.context_title or (neg.supply.title if neg.supply else f"مذاکره #{neg.id}"),
                    "user": get_seller_name(other_user),
                    "status": neg.status,
                    "statusLabel": status_labels.get(neg.status, neg.status),
                    "time": neg.created_at.isoformat() if neg.created_at else None,
                })

            funnel_data = user_negotiations.values("status").annotate(count=Count("id")).order_by("status")
            total_negotiations = sum(item["count"] for item in funnel_data)
            for item in funnel_data:
                percentage = (item["count"] / total_negotiations) * 100 if total_negotiations else 0
                conversion_funnel.append({
                    "label": status_labels.get(item["status"], item["status"]),
                    "status": item["status"],
                    "value": item["count"],
                    "percent": round(percentage),
                })
        except Exception as exc:
            logger.exception("Could not fetch negotiation data: %s", exc)

    monthly_deals = []
    if Negotiation is not None:
        try:
            now = timezone.now()
            for offset in range(5, -1, -1):
                current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                month_start = (current - timedelta(days=32 * offset)).replace(day=1)
                month_end = (month_start + timedelta(days=32)).replace(day=1)
                count = Negotiation.objects.filter(
                    (Q(buyer=user) | Q(supplier=user)),
                    status__in=SUCCESSFUL_NEGOTIATION_STATUSES,
                    created_at__gte=month_start,
                    created_at__lt=month_end,
                ).count()
                monthly_deals.append({
                    "month": month_start.strftime("%Y-%m"),
                    "value": count,
                })
        except Exception:
            logger.exception("Error calculating monthly deals")

    top_suppliers = []
    try:
        supplier_stats = (
            Product.objects
            .filter(status__in=MARKET_STATUSES)
            .exclude(seller=user)
            .values("seller_id", "seller__company_name", "seller__username")
            .annotate(product_count=Count("id"), total_views=Sum("view_count"))
            .order_by("-product_count", "-total_views")[:5]
        )
        for item in supplier_stats:
            name = item["seller__company_name"] or item["seller__username"] or "نامشخص"
            top_suppliers.append({
                "id": item["seller_id"],
                "name": name,
                "productCount": item["product_count"],
                "views": item["total_views"] or 0,
            })
    except Exception:
        logger.exception("Error calculating top suppliers")

    smart_suggestions = []
    if active_needs > 0 and total_products == 0:
        smart_suggestions.append({
            "title": "نیازهای فعال شما آماده بررسی هستند",
            "description": "برای نیازهای فعال، عرضه‌کنندگان و محصولات مرتبط را بررسی کنید.",
            "action": "مشاهده نیازها",
        })
    if total_products > 0 and active_needs == 0:
        smart_suggestions.append({
            "title": "برای محصولات خود بازار هدف پیدا کنید",
            "description": "ثبت نیازهای مرتبط می‌تواند فرصت‌های جدیدی ایجاد کند.",
            "action": "مشاهده بازار",
        })
    if successful_deals == 0:
        smart_suggestions.append({
            "title": "هنوز معامله موفقی ثبت نشده است",
            "description": "پیگیری مذاکرات فعال می‌تواند به افزایش نرخ تبدیل کمک کند.",
            "action": "مشاهده مذاکرات",
        })

    negotiation_insights = []
    if ongoing_negotiations > 0:
        negotiation_insights.append({
            "type": "info",
            "title": "مذاکرات فعال",
            "value": ongoing_negotiations,
            "description": "مذاکره فعال در جریان است.",
        })
    if successful_deals > 0:
        negotiation_insights.append({
            "type": "success",
            "title": "معاملات موفق",
            "value": successful_deals,
            "description": "مذاکره به پذیرش یا قرارداد رسیده است.",
        })

    return {
        "stats": {
            "totalProducts": total_products,
            "activeNeeds": active_needs,
            "ongoingNegotiations": ongoing_negotiations,
            "successfulDeals": successful_deals,
        },
        "industryData": [],
        "monthlyDeals": monthly_deals,
        "recentActivities": recent_activities,
        "smartSuggestions": smart_suggestions,
        "conversionFunnel": conversion_funnel,
        "topSuppliers": top_suppliers,
        "negotiationInsights": negotiation_insights,
    }