# ============================================================
# matching/services.py
# ============================================================

from __future__ import annotations

import json
import logging
import re
from decimal import Decimal, InvalidOperation
from typing import Any, Optional
from collections import Counter

from django.conf import settings

from .dictionary import (
    get_petrochemical_concepts,
    normalize_petrochemical_text,
)

logger = logging.getLogger(__name__)


# ============================================================
# Configuration
# ============================================================

MATCH_WEIGHTS = {
    "industry": 0.25,
    "concept": 0.25,
    "text": 0.20,
    "budget": 0.15,
    "trl": 0.10,
    "availability": 0.05,
}

MIN_MATCH_SCORE = 55

OPENROUTER_API_KEY = getattr(settings, "OPENROUTER_API_KEY", None)
OPENROUTER_BASE_URL = getattr(settings, "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_MODEL = getattr(settings, "OPENROUTER_MODEL", "deepseek/deepseek-v3.2")
OPENROUTER_MAX_TOKENS = getattr(settings, "OPENROUTER_MAX_TOKENS", 800)
OPENROUTER_TEMPERATURE = getattr(settings, "OPENROUTER_TEMPERATURE", 0.2)


# ============================================================
# Helpers
# ============================================================

def safe_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()

def normalize(value: Any) -> str:
    return normalize_petrochemical_text(safe_text(value))

def clamp(value: float, minimum: float = 0.0, maximum: float = 100.0) -> float:
    try:
        value = float(value)
    except (TypeError, ValueError):
        return minimum
    return max(minimum, min(maximum, value))

def decimal_value(value: Any) -> Optional[Decimal]:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return value
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None

def safe_int(value: Any) -> Optional[int]:
    try:
        if value is None:
            return None
        return int(value)
    except (TypeError, ValueError):
        return None

def get_industry_name(obj) -> str:
    industry = getattr(obj, "industry", None)
    if industry is None:
        return ""
    if hasattr(industry, "name"):
        return safe_text(industry.name)
    return safe_text(industry)

def get_description(obj) -> str:
    description = getattr(obj, "description", None)
    if description:
        return safe_text(description)
    fields = [
        getattr(obj, "short_description", ""),
        getattr(obj, "full_description", ""),
        getattr(obj, "problem_solved", ""),
        getattr(obj, "technical_specs", ""),
        getattr(obj, "competitive_advantage", ""),
    ]
    return " ".join(safe_text(value) for value in fields if safe_text(value))

def get_category(obj) -> str:
    return safe_text(getattr(obj, "category", ""))

def get_trl(obj) -> Optional[int]:
    value = getattr(obj, "trl", None)
    if value is None:
        return None
    return safe_int(value)


# ============================================================
# LLM Client
# ============================================================

class OpenRouterLLM:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._initialized = True
        self._available = False
        self._openai = None
        self._check_availability()

    def _check_availability(self):
        if not OPENROUTER_API_KEY:
            logger.warning("OPENROUTER_API_KEY is not configured.")
            return
        try:
            import openai
            self._openai = openai
            self._available = True
            logger.info(f"OpenRouter LLM initialized. model={OPENROUTER_MODEL}")
        except ImportError:
            logger.exception("openai package is not installed.")

    def is_available(self) -> bool:
        return self._available and bool(OPENROUTER_API_KEY)

    def generate(self, prompt: str) -> Optional[str]:
        if not self.is_available():
            return None
        try:
            client = self._openai.OpenAI(
                api_key=OPENROUTER_API_KEY,
                base_url=OPENROUTER_BASE_URL,
                timeout=30.0,
            )
            response = client.chat.completions.create(
                model=OPENROUTER_MODEL,
                messages=[
                    {"role": "system", "content": "You are a strict matching engine. Return valid JSON only. Do not use markdown."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=OPENROUTER_MAX_TOKENS,
                temperature=OPENROUTER_TEMPERATURE,
            )
            if not response.choices:
                return None
            content = response.choices[0].message.content
            return content.strip() if content else None
        except Exception as exc:
            logger.exception("OpenRouter request failed: %s", exc)
            return None

_llm_client = None

def get_llm_client():
    global _llm_client
    if _llm_client is None:
        _llm_client = OpenRouterLLM()
    return _llm_client


# ============================================================
# Build Texts
# ============================================================

def build_need_text(need) -> str:
    fields = [
        getattr(need, "title", ""),
        getattr(need, "description", ""),
        getattr(need, "current_status", ""),
        getattr(need, "expected_outcome", ""),
        getattr(need, "constraints", ""),
        getattr(need, "evaluation_criteria", ""),
        getattr(need, "timeline", ""),
    ]
    industry = get_industry_name(need)
    if industry:
        fields.append(industry)
    return " ".join(safe_text(value) for value in fields if safe_text(value))

def build_supply_text(product) -> str:
    fields = [
        getattr(product, "title", ""),
        get_category(product),
        get_industry_name(product),
        getattr(product, "technology", ""),
        get_description(product),
        getattr(product, "quantity", ""),
        getattr(product, "unit", ""),
        getattr(product, "capacity", ""),
        getattr(product, "pricing_model", ""),
        getattr(product, "collaboration_terms", ""),
        getattr(product, "ip_status", ""),
    ]
    return " ".join(safe_text(value) for value in fields if safe_text(value))


# ============================================================
# Rule-Based Scores
# ============================================================

def calculate_industry_score(need, product) -> float:
    need_industry = normalize(get_industry_name(need))
    product_industry = normalize(get_industry_name(product))
    if not need_industry or not product_industry:
        return 50.0
    if need_industry == product_industry:
        return 100.0
    need_words = set(need_industry.split())
    product_words = set(product_industry.split())
    if need_words.issubset(product_words) or product_words.issubset(need_words):
        return 80.0
    overlap = need_words.intersection(product_words)
    if overlap:
        return 60.0
    return 30.0

def calculate_budget_score(need, product) -> float:
    budget = decimal_value(getattr(need, "budget", None))
    price = decimal_value(getattr(product, "price", None))
    if budget is None or price is None:
        return 50.0
    if budget <= 0:
        return 50.0
    if price <= budget:
        return 100.0
    excess = float((price - budget) / budget)
    if excess <= 0.10:
        return 85.0
    if excess <= 0.25:
        return 65.0
    if excess <= 0.50:
        return 40.0
    if excess <= 1.0:
        return 20.0
    return 5.0

def calculate_trl_score(product) -> float:
    trl = get_trl(product)
    if trl is None:
        return 50.0
    if trl >= 9:
        return 100.0
    if trl >= 8:
        return 90.0
    if trl >= 7:
        return 75.0
    if trl >= 6:
        return 60.0
    if trl >= 5:
        return 50.0
    if trl >= 4:
        return 35.0
    if trl >= 3:
        return 20.0
    return 10.0

def calculate_availability_score(product) -> float:
    status = normalize(getattr(product, "status", ""))
    if not status:
        return 50.0
    available_terms = ["available", "published", "approved", "active", "موجود", "فعال", "منتشر", "تایید شده", "تأیید شده", "آماده"]
    for term in available_terms:
        if normalize(term) in status:
            return 100.0
    unavailable_terms = ["unavailable", "inactive", "draft", "rejected", "suspended", "ناموجود", "غیرفعال", "پیش نویس", "رد شده", "تعلیق"]
    for term in unavailable_terms:
        if normalize(term) in status:
            return 10.0
    return 50.0

def calculate_text_score(need_text: str, product_text: str) -> float:
    need_words = normalize(need_text).split()
    product_words = normalize(product_text).split()
    if not need_words or not product_words:
        return 0.0

    # لیست سیاه کلمات عمومی و بی‌معنی
    stop_words = {
        "و", "با", "از", "به", "برای", "در", "را", "این", "آن", "یک", "دو",
        "ها", "های", "شده", "می", "است", "که", "نه", "بر", "هم", "چون",
        "بسیار", "خیلی", "بیشتر", "کمتر", "نسبت", "مثل", "مانند", "طبق",
        "جهت", "بابت", "بعد", "قبل", "حین", "زمان", "حال", "چه", "هر",
        "سامانه", "سیستم", "راهکار", "محصول", "خدمات", "نیاز", "کاربر",
    }
    need_words = [w for w in need_words if len(w) > 2 and w not in stop_words]
    product_words = [w for w in product_words if len(w) > 2 and w not in stop_words]

    if not need_words or not product_words:
        return 40.0

    need_counter = Counter(need_words)
    product_counter = Counter(product_words)

    common_words = set(need_counter.keys()) & set(product_counter.keys())
    if not common_words:
        return 10.0

    # وزن‌دهی بر اساس طول کلمه (کلمات بلندتر خاص‌ترند)
    def word_weight(word: str) -> float:
        return len(word) ** 1.5  # توان ۱.۵ برای تاکید روی کلمات بلند

    total_need_weight = sum(need_counter[w] * word_weight(w) for w in need_counter)
    total_product_weight = sum(product_counter[w] * word_weight(w) for w in product_counter)

    common_weight = 0.0
    for word in common_words:
        need_w = (need_counter[word] * word_weight(word)) / total_need_weight
        product_w = (product_counter[word] * word_weight(word)) / total_product_weight
        common_weight += (need_w + product_w) / 2

    score = min(100, common_weight * 100)
    return clamp(score)

def calculate_concept_score(need_text: str, product_text: str) -> float:
    need_concepts = set(get_petrochemical_concepts(need_text))
    product_concepts = set(get_petrochemical_concepts(product_text))
    if not need_concepts or not product_concepts:
        return 40.0
    common = need_concepts.intersection(product_concepts)
    if not common:
        return 10.0
    ratio = len(common) / max(len(need_concepts), 1)
    return clamp(ratio * 100)


# ============================================================
# LLM Prompt & Analysis
# ============================================================

def build_llm_prompt(need_text: str, product_text: str) -> str:
    return f"""
Analyze compatibility between a BUYER NEED and a PRODUCT/SUPPLY.

Your task is to determine how well the product/supply meets the buyer's need.
Return a JSON with:
- "score": 0-100 (higher = better match)
- "reason": a short, specific Persian explanation (max 100 characters) that clearly explains WHY this product is suitable or not suitable for THIS NEED. Mention specific terms from both the need and the product.

Example reasons:
- "نیاز به سیستم مدیریت انرژی با راهکار هوشمند پتروشیمی همخوانی دارد و فناوری آن با نیاز مطابقت دارد."
- "این محصول در حوزه هوش مصنوعی است در حالی که نیاز در حوزه اتوماسیون صنعتی است، تطابق محدودی دارند."

Do NOT use generic phrases like "تطابق خوب صنعت" or "قیمت مناسب". Be specific.

Buyer Need:
{need_text[:2000]}

Product/Supply:
{product_text[:2000]}

Return JSON only.
"""

def extract_json(response: str) -> Optional[dict]:
    if not response:
        return None
    text = response.strip()
    text = re.sub(r"```(?:json)?", "", text, flags=re.IGNORECASE)
    text = text.replace("```", "").strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        return None
    candidate = text[start:end+1]
    try:
        data = json.loads(candidate)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    candidate = re.sub(r",\s*([}\]])", r"\1", candidate)
    try:
        data = json.loads(candidate)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        return None
    return None

def llm_analyze_match(need_text: str, product_text: str) -> Optional[dict]:
    client = get_llm_client()
    if not client.is_available():
        logger.warning("LLM unavailable.")
        return None
    prompt = build_llm_prompt(need_text, product_text)
    logger.info(f"Sending matching request to OpenRouter.")
    response = client.generate(prompt)
    if not response:
        logger.warning("LLM returned no response.")
        return None
    data = extract_json(response)
    if not data:
        logger.warning("Could not parse LLM JSON.")
        return None
    return {
        "score": clamp(data.get("score", 50)),
        "reason": safe_text(data.get("reason", "دلیل خاصی از سمت مدل ارائه نشد.")),
    }


# ============================================================
# Generate Specific Reason (Rule-Based + هوشمند)
# ============================================================

def extract_keywords(text: str, top_n: int = 5) -> list:
    """استخراج کلمات کلیدی با وزن (تکرار و طول کلمه)"""
    words = normalize(text).split()
    stopwords = {
        "و", "با", "از", "به", "برای", "در", "را", "این", "آن", "یک", "دو",
        "ها", "های", "شده", "می", "است", "که", "نه", "بر", "هم", "چون",
        "بسیار", "خیلی", "بیشتر", "کمتر", "نسبت", "مثل", "مانند", "طبق",
        "جهت", "بابت", "بعد", "قبل", "حین", "زمان", "حال", "چه", "هر",
        "سامانه", "سیستم", "راهکار", "محصول", "خدمات", "نیاز", "کاربر",
    }
    filtered = [w for w in words if len(w) > 2 and w not in stopwords]
    if not filtered:
        return []
    # وزن‌دهی با طول کلمه
    weighted = Counter()
    for w in filtered:
        weighted[w] += len(w)  # کلمات بلندتر وزن بیشتری می‌گیرن
    most_common = weighted.most_common(top_n)
    return [word for word, _ in most_common]

def generate_specific_reason(need, product, scores: dict) -> str:
    """
    تولید دلیل اختصاصی و هوشمند با استفاده از کلمات کلیدی وزنی و امتیازها.
    فقط در صورت وجود اطلاعات معتبر به موارد اشاره می‌کند.
    """
    need_title = safe_text(getattr(need, "title", ""))
    product_title = safe_text(getattr(product, "title", ""))
    need_desc = safe_text(getattr(need, "description", ""))
    product_desc = safe_text(getattr(product, "description", ""))

    # استخراج کلمات کلیدی
    need_keywords = extract_keywords(need_title + " " + need_desc, top_n=5)
    product_keywords = extract_keywords(product_title + " " + product_desc, top_n=5)
    common_keywords = [w for w in need_keywords if w in product_keywords]

    parts = []

    # ۱. صنعت (فقط اگر مقدار معتبر داشته باشه)
    industry_score = scores.get("industry", 0)
    need_industry = get_industry_name(need)
    product_industry = get_industry_name(product)
    if need_industry and product_industry:
        if industry_score >= 80:
            parts.append(f"تطابق عالی در صنعت «{need_industry}» با «{product_industry}»")
        elif industry_score >= 60:
            parts.append(f"تطابق نسبی در صنعت «{need_industry}» با «{product_industry}»")
        elif industry_score < 40:
            parts.append(f"صنعت نیاز ({need_industry}) با صنعت محصول ({product_industry}) تفاوت دارد")

    # ۲. بودجه (فقط اگر هر دو مقدار معتبر داشته باشن)
    budget_score = scores.get("budget", 0)
    budget = decimal_value(getattr(need, "budget", None))
    price = decimal_value(getattr(product, "price", None))
    if budget is not None and price is not None and budget > 0:
        if budget_score >= 80:
            parts.append("قیمت در محدوده بودجه است")
        elif budget_score >= 60:
            parts.append("قیمت کمی بالاتر از بودجه است (تا ۲۰٪)")
        elif budget_score >= 40:
            parts.append("قیمت بالاتر از بودجه است (تا ۵۰٪)")
        elif budget_score < 40:
            parts.append("قیمت بسیار بالاتر از بودجه است")

    # ۳. TRL (فقط اگر محصول TRL داشته باشه)
    trl_score = scores.get("trl", 0)
    product_trl = get_trl(product)
    if product_trl is not None:
        if trl_score >= 80:
            parts.append(f"سطح آمادگی فناوری بالا (TRL {product_trl})")
        elif trl_score >= 60:
            parts.append(f"سطح آمادگی فناوری متوسط (TRL {product_trl})")
        elif trl_score < 40:
            parts.append(f"سطح آمادگی فناوری پایین (TRL {product_trl})")

    # ۴. کلمات کلیدی مشترک (فقط اگر کلمات خاص و معنادار باشن)
    if common_keywords:
        # فیلتر کلمات بسیار کوتاه (کمتر از ۳ حرف) که قبلاً حذف شدن
        top_words = common_keywords[:3]
        parts.append(f"کلمات کلیدی مشترک: {', '.join(top_words)}")

    # ۵. اگر هیچ بخشی پر نشد، از امتیاز متنی استفاده کن
    if not parts:
        text_score = scores.get("text", 0)
        if text_score >= 70:
            parts.append("تطابق محتوایی قابل توجهی بین نیاز و محصول وجود دارد")
        elif text_score >= 40:
            parts.append("تطابق محتوایی متوسطی بین نیاز و محصول وجود دارد")
        else:
            parts.append("تطابق محتوایی کمی بین نیاز و محصول وجود دارد")

    return " - ".join(parts[:4])


# ============================================================
# Main Matching
# ============================================================

def calculate_match(need, product) -> dict:
    need_text = build_need_text(need)
    product_text = build_supply_text(product)

    industry_score = calculate_industry_score(need, product)
    budget_score = calculate_budget_score(need, product)
    trl_score = calculate_trl_score(product)
    availability_score = calculate_availability_score(product)
    text_score = calculate_text_score(need_text, product_text)
    concept_score = calculate_concept_score(need_text, product_text)

    rule_scores = {
        "industry": industry_score,
        "concept": concept_score,
        "text": text_score,
        "budget": budget_score,
        "trl": trl_score,
        "availability": availability_score,
    }

    weighted_score = 0.0
    for name, weight in MATCH_WEIGHTS.items():
        weighted_score += rule_scores.get(name, 50.0) * weight

    if weighted_score < 40:
        return {
            "match_percentage": round(clamp(weighted_score), 2),
            "match_reason": "نیاز و عرضه تطابق قابل توجهی ندارند. پیشنهاد می‌شود نیاز یا جستجو را اصلاح کنید.",
            "risk_level": "high",
            "risk_reasons": ["تطابق کلی بسیار پایین است"],
            "recommended_actions": [],
            "llm_used": False,
            "scores": rule_scores,
        }

    llm_data = None
    if len(need_text) >= 20 and len(product_text) >= 20:
        try:
            llm_data = llm_analyze_match(need_text, product_text)
        except Exception:
            logger.exception("LLM matching error.")
            llm_data = None

    if llm_data and llm_data.get("score") is not None:
        final_score = (weighted_score * 0.4) + (llm_data["score"] * 0.6)
        final_score = round(clamp(final_score), 2)
        match_reason = llm_data.get("reason", "")
        llm_used = True
    else:
        final_score = round(clamp(weighted_score), 2)
        match_reason = generate_specific_reason(need, product, rule_scores)
        llm_used = False

    risk_level = "low" if final_score >= 80 else "medium" if final_score >= 55 else "high"
    risk_reasons = []
    if final_score < 55:
        risk_reasons.append("تطابق کلی پایین است")
    if rule_scores.get("industry", 0) < 40:
        risk_reasons.append("تطابق صنعت ضعیف است")
    if rule_scores.get("budget", 0) < 40:
        risk_reasons.append("قیمت بسیار بالاتر از بودجه است")
    if rule_scores.get("trl", 0) < 40:
        risk_reasons.append("سطح آمادگی فناوری پایین است")

    if not risk_reasons and final_score >= 80:
        risk_reasons.append("ریسک قابل توجهی شناسایی نشد")

    recommended_actions = []  # غیرفعال

    return {
        "match_percentage": final_score,
        "match_reason": match_reason,
        "risk_level": risk_level,
        "risk_reasons": risk_reasons,
        "recommended_actions": recommended_actions,
        "llm_used": llm_used,
        "scores": rule_scores,
        "llm_confidence": llm_data.get("score") if llm_data else None,
    }


# ============================================================
# Match Need With Supplies
# ============================================================

def match_need_with_supplies(
    need,
    supplies,
    limit: int = 20,
    petrochemical_only: bool = False,
) -> list[dict]:

    results = []

    try:
        total = supplies.count()
    except Exception:
        total = len(supplies)

    logger.info(f"Matching Need {getattr(need, 'id', 'Unknown')} against {total} supplies")

    if total == 0:
        return [{
            'match_percentage': 0,
            'match_reason': 'هیچ عرضه‌ای در سیستم ثبت نشده است.',
            'recommended_actions': [],
            'need_id': getattr(need, "id", None),
            'product_id': None,
            'title': 'هیچ عرضه‌ای موجود نیست',
            'provider': '',
            'description': 'در حال حاضر هیچ محصول یا خدماتی ثبت نشده است.',
            'price': None,
            'trl': None,
            'industry': '',
            'type': 'info',
            'risk_level': 'low',
            'risk_reasons': ['عدم وجود عرضه'],
            'scores': {},
            'llm_used': False,
        }]

    for supply in supplies:
        try:
            result = calculate_match(need, supply)
            if result.get("match_percentage", 0) >= MIN_MATCH_SCORE:
                supply_id = getattr(supply, "id", None)
                result["need_id"] = getattr(need, "id", None)
                result["supply_id"] = supply_id
                result["product_id"] = supply_id
                result["type"] = getattr(supply, "supply_type", None) or getattr(supply, "category", "product")
                result["title"] = getattr(supply, "title", "")
                result["description"] = get_description(supply)
                result["price"] = getattr(supply, "price", None)
                result["trl"] = getattr(supply, "trl", None)
                result["industry"] = get_industry_name(supply)

                seller = getattr(supply, "seller", None)
                if seller:
                    result["provider"] = (
                        getattr(seller, "company_name", None)
                        or getattr(seller, "full_name", None)
                        or getattr(seller, "username", None)
                        or str(seller)
                    )
                else:
                    result["provider"] = ""

                results.append(result)
        except Exception as e:
            logger.exception(f"Matching failed for supply {getattr(supply, 'id', None)}: {e}")

    if not results:
        return [{
            'match_percentage': 0,
            'match_reason': 'هیچ تطابق قابل قبولی با آستانه فعلی یافت نشد. لطفاً نیاز خود را با جزئیات بیشتری ثبت کنید یا معیارهای جستجو را تغییر دهید.',
            'recommended_actions': [],
            'need_id': getattr(need, "id", None),
            'product_id': None,
            'title': 'تطابق قابل قبولی یافت نشد',
            'provider': '',
            'description': 'برای یافتن راهکار مناسب، اطلاعات این نیاز کافی نیست یا عرضه‌های موجود با آن همخوانی ندارند.',
            'price': None,
            'trl': None,
            'industry': '',
            'type': 'info',
            'risk_level': 'low',
            'risk_reasons': ['اطلاعات ناقص یا عدم تطابق'],
            'scores': {},
            'llm_used': False,
        }]

    results.sort(key=lambda item: -float(item.get("match_percentage", 0)))
    return results[:limit]