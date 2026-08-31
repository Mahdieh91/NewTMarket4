# ============================================================
# matching/services.py
# ============================================================

from __future__ import annotations

import json
import logging
import re
from decimal import Decimal, InvalidOperation
from typing import Any, Optional

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
    "industry": 0.20,
    "concept": 0.30,
    "text": 0.15,
    "budget": 0.10,
    "trl": 0.08,
    "type": 0.07,
    "availability": 0.05,
    "data_quality": 0.05,
}


OPENROUTER_API_KEY = getattr(
    settings,
    "OPENROUTER_API_KEY",
    None,
)

OPENROUTER_BASE_URL = getattr(
    settings,
    "OPENROUTER_BASE_URL",
    "https://openrouter.ai/api/v1",
)

OPENROUTER_MODEL = getattr(
    settings,
    "OPENROUTER_MODEL",
    "openai/gpt-oss-20b:free",
)

OPENROUTER_MAX_TOKENS = getattr(
    settings,
    "OPENROUTER_MAX_TOKENS",
    1200,
)

OPENROUTER_TEMPERATURE = getattr(
    settings,
    "OPENROUTER_TEMPERATURE",
    0.1,
)


# ============================================================
# Generic Helpers
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


def get_supply_type(obj) -> str:
    value = getattr(obj, "supply_type", None)
    if value:
        return safe_text(value)
    value = getattr(obj, "category", None)
    return safe_text(value)


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
# Need Text
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


# ============================================================
# Supply / Product Text
# ============================================================

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
# Concept Matching
# ============================================================

def calculate_concept_score(need_text: str, product_text: str) -> tuple[float, set]:
    need_concepts = set(get_petrochemical_concepts(need_text))
    product_concepts = set(get_petrochemical_concepts(product_text))
    if not need_concepts:
        return 50.0, set()
    if not product_concepts:
        return 0.0, set()
    common = need_concepts.intersection(product_concepts)
    union = need_concepts.union(product_concepts)
    score = (len(common) / max(len(union), 1)) * 100
    return clamp(score), common


# ============================================================
# Industry Score
# ============================================================

def calculate_industry_score(need, product) -> float:
    need_industry = normalize(get_industry_name(need))
    product_industry = normalize(get_industry_name(product))
    if not need_industry:
        return 50.0
    if not product_industry:
        return 30.0
    if need_industry == product_industry:
        return 100.0
    need_words = set(need_industry.split())
    product_words = set(product_industry.split())
    overlap = need_words.intersection(product_words)
    if overlap:
        return 75.0
    if "پتروشیمی" in need_industry and "پتروشیمی" in product_industry:
        return 90.0
    if "پتروشیمی" in need_industry:
        return 25.0
    return 40.0


# ============================================================
# Budget
# ============================================================

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
    return 15.0


# ============================================================
# TRL
# ============================================================

def calculate_trl_score(product) -> float:
    trl = get_trl(product)
    if trl is None:
        return 50.0
    if trl >= 9:
        return 100.0
    if trl >= 7:
        return 85.0
    if trl >= 5:
        return 65.0
    if trl >= 3:
        return 45.0
    return 25.0


# ============================================================
# Type
# ============================================================

def calculate_type_score(need, product) -> float:
    need_type = normalize(getattr(need, "need_type", ""))
    product_type = normalize(get_supply_type(product))
    if not need_type or not product_type:
        return 50.0
    if need_type == product_type:
        return 100.0
    return 50.0


# ============================================================
# Availability
# ============================================================

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
            return 20.0
    return 50.0


# ============================================================
# Data Quality
# ============================================================

def calculate_data_quality(product) -> float:
    fields = [
        getattr(product, "title", None),
        get_description(product),
        get_industry_name(product),
        get_category(product),
        getattr(product, "price", None),
        getattr(product, "trl", None),
    ]
    filled = sum(1 for field in fields if safe_text(field))
    return round((filled / len(fields)) * 100, 2)


# ============================================================
# Text
# ============================================================

def calculate_text_score(need_text: str, product_text: str) -> float:
    need_words = set(normalize(need_text).split())
    product_words = set(normalize(product_text).split())
    if not need_words or not product_words:
        return 0.0
    common = need_words.intersection(product_words)
    score = (len(common) / max(len(need_words), 1)) * 100
    return clamp(score)


# ============================================================
# LLM Prompt & Analysis
# ============================================================

def build_llm_prompt(need_text: str, product_text: str) -> str:
    return f"""
Analyze compatibility between a BUYER NEED and a PRODUCT/SUPPLY.

Rules:
- Judge actual technical and business compatibility.
- Do not rely only on shared words.
- Do not invent facts.
- Missing information must reduce confidence.
- Return ONLY valid JSON.
- All scores must be between 0 and 100.
- The reason must be in Persian.

BUYER NEED:
{need_text[:2500]}

PRODUCT/SUPPLY:
{product_text[:2500]}

Return exactly:

{{
  "semantic_match": 0,
  "requirement_match": 0,
  "concept_match": 0,
  "confidence": 0,
  "matched_requirements": [],
  "missing_requirements": [],
  "risk_factors": [],
  "reason": "",
  "recommended_actions": []
}}

semantic_match:
Meaning-level compatibility.

requirement_match:
Compatibility with explicit requirements.

concept_match:
Technical/domain concept compatibility.

confidence:
Confidence based only on provided information.

matched_requirements:
Requirements that appear satisfied.

missing_requirements:
Requirements that cannot be confirmed.

risk_factors:
Important risks or uncertainties.

reason:
Short Persian explanation.

recommended_actions:
Useful next steps.
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
        logger.warning("LLM unavailable. Using deterministic matcher.")
        return None
    prompt = build_llm_prompt(need_text, product_text)
    logger.info(f"Sending matching request to OpenRouter. model={OPENROUTER_MODEL}")
    response = client.generate(prompt)
    if not response:
        logger.warning("LLM returned no response.")
        return None
    data = extract_json(response)
    if not data:
        logger.warning("Could not parse LLM JSON.")
        return None
    return {
        "semantic_match": clamp(data.get("semantic_match", 50)),
        "requirement_match": clamp(data.get("requirement_match", 50)),
        "concept_match": clamp(data.get("concept_match", 50)),
        "confidence": clamp(data.get("confidence", 50)),
        "matched_requirements": data.get("matched_requirements", []) if isinstance(data.get("matched_requirements", []), list) else [],
        "missing_requirements": data.get("missing_requirements", []) if isinstance(data.get("missing_requirements", []), list) else [],
        "risk_factors": data.get("risk_factors", []) if isinstance(data.get("risk_factors", []), list) else [],
        "reason": safe_text(data.get("reason", "")),
        "recommended_actions": data.get("recommended_actions", []) if isinstance(data.get("recommended_actions", []), list) else [],
    }


# ============================================================
# Final Score
# ============================================================

def calculate_final_score(scores: dict) -> float:
    weighted_score = 0.0
    for name, weight in MATCH_WEIGHTS.items():
        weighted_score += float(scores.get(name, 50.0)) * weight
    return round(clamp(weighted_score), 2)


# ============================================================
# Risk
# ============================================================

def calculate_risk(final_score: float, scores: dict, llm_data: Optional[dict]) -> tuple[str, list[str]]:
    reasons = []
    points = 0
    if final_score < 30:
        points += 4
        reasons.append("درصد تطابق کلی بسیار پایین است")
    elif final_score < 45:
        points += 3
        reasons.append("درصد تطابق کلی پایین است")
    elif final_score < 60:
        points += 2
        reasons.append("درصد تطابق متوسط یا پایین است")
    elif final_score < 75:
        points += 1

    if scores["industry"] < 40:
        points += 2
        reasons.append("تطابق صنعت ضعیف است")
    if scores["budget"] < 40:
        points += 2
        reasons.append("قیمت محصول فاصله زیادی با بودجه دارد")
    if scores["trl"] < 40:
        points += 2
        reasons.append("سطح آمادگی فناوری پایین است")

    if llm_data:
        for risk in llm_data.get("risk_factors", [])[:3]:
            if safe_text(risk):
                reasons.append(safe_text(risk))
        if llm_data.get("confidence", 50) < 40:
            points += 1
            reasons.append("اطمینان مدل نسبت به اطلاعات موجود پایین است")

    level = "high" if points >= 8 else "medium" if points >= 4 else "low"
    if not reasons:
        reasons.append("ریسک قابل توجهی در اطلاعات موجود شناسایی نشد")
    return level, reasons


# ============================================================
# Main Matching
# ============================================================

def calculate_match(need, product) -> dict:
    need_text = build_need_text(need)
    product_text = build_supply_text(product)

    concept_score, common_concepts = calculate_concept_score(need_text, product_text)
    industry_score = calculate_industry_score(need, product)
    budget_score = calculate_budget_score(need, product)
    trl_score = calculate_trl_score(product)
    type_score = calculate_type_score(need, product)
    availability_score = calculate_availability_score(product)
    quality_score = calculate_data_quality(product)
    text_score = calculate_text_score(need_text, product_text)

    llm_data = None
    if len(need_text) >= 10 and len(product_text) >= 10:
        try:
            llm_data = llm_analyze_match(need_text, product_text)
        except Exception:
            logger.exception("Unexpected LLM matching error.")
            llm_data = None

    if llm_data:
        concept_score = round(concept_score * 0.35 + llm_data["concept_match"] * 0.65, 2)
        text_score = round(text_score * 0.35 + llm_data["semantic_match"] * 0.65, 2)
        text_score = round(text_score * 0.70 + llm_data["requirement_match"] * 0.30, 2)

    scores = {
        "industry": round(industry_score, 2),
        "concept": round(concept_score, 2),
        "text": round(text_score, 2),
        "budget": round(budget_score, 2),
        "trl": round(trl_score, 2),
        "type": round(type_score, 2),
        "availability": round(availability_score, 2),
        "data_quality": round(quality_score, 2),
    }

    final_score = calculate_final_score(scores)
    risk_level, risk_reasons = calculate_risk(final_score, scores, llm_data)

    concepts = list(common_concepts)
    concept_labels = [safe_text(concept).replace("_", " ") for concept in concepts]

    if llm_data and llm_data.get("reason"):
        match_reason = llm_data["reason"]
    elif concepts:
        match_reason = "تطابق مفهومی در حوزه‌های: " + ", ".join(concept_labels[:5])
    elif final_score >= 70:
        match_reason = "تطابق مناسب بر اساس معیارهای ساختاری و محتوایی"
    elif final_score >= 50:
        match_reason = "تطابق نسبی بر اساس اطلاعات موجود"
    else:
        match_reason = "تطابق محدود بر اساس اطلاعات موجود"

    recommended_actions = []
    if llm_data:
        recommended_actions.extend([safe_text(action) for action in llm_data.get("recommended_actions", []) if safe_text(action)][:5])
        for missing in llm_data.get("missing_requirements", [])[:3]:
            if safe_text(missing):
                recommended_actions.append(f"بررسی الزامات: {safe_text(missing)}")

    if not recommended_actions:
        if budget_score < 60:
            recommended_actions.append("بررسی امکان مذاکره درباره قیمت")
        if trl_score < 60:
            recommended_actions.append("بررسی سطح آمادگی فناوری محصول")
        if quality_score < 60:
            recommended_actions.append("تکمیل اطلاعات عرضه توسط فروشنده")

    details = {
        "industry_reason": "امتیاز صنعت بر اساس تطابق صنعت Need و Supply محاسبه شده است.",
        "budget_reason": "امتیاز بودجه بر اساس مقایسه بودجه نیاز و قیمت عرضه محاسبه شده است.",
        "trl_reason": "امتیاز TRL بر اساس سطح آمادگی فناوری عرضه محاسبه شده است.",
        "availability_reason": "امتیاز دسترس‌پذیری بر اساس وضعیت عرضه محاسبه شده است.",
        "missing_fields": [],
    }

    if not safe_text(getattr(product, "description", None)) and not get_description(product):
        details["missing_fields"].append("description")
    if not get_industry_name(product):
        details["missing_fields"].append("industry")
    if getattr(product, "price", None) is None:
        details["missing_fields"].append("price")
    if getattr(product, "trl", None) in (None, ""):
        details["missing_fields"].append("trl")

    return {
        "match_percentage": final_score,
        "match_reason": match_reason,
        "risk_level": risk_level,
        "risk_reasons": risk_reasons,
        "concepts": concepts,
        "concept_labels": concept_labels,
        "scores": scores,
        "details": details,
        "llm_used": bool(llm_data),
        "llm_confidence": llm_data.get("confidence", 0) if llm_data else 0,
        "matched_requirements": llm_data.get("matched_requirements", []) if llm_data else [],
        "missing_requirements": llm_data.get("missing_requirements", []) if llm_data else [],
        "risk_factors": llm_data.get("risk_factors", []) if llm_data else [],
        "recommended_actions": recommended_actions,
    }


# ============================================================
# Petrochemical Filtering
# ============================================================

def is_petrochemical_text(text: str) -> bool:
    normalized = normalize(text)
    if not normalized:
        return False
    keywords = [
        "پتروشیمی", "صنعت پتروشیمی", "مجتمع پتروشیمی", "صنایع پتروشیمی",
        "petrochemical", "petrochemical industry", "petrochemical complex",
        "پلیمر", "پلی اتیلن", "پلی پروپیلن", "کاتالیست", "راکتور", "تقطیر",
        "واحد الفین", "واحد آروماتیک", "گاز طبیعی", "ال ان جی", "lng",
        "dcs", "plc", "hse", "hazop"
    ]
    for keyword in keywords:
        if normalize(keyword) in normalized:
            return True
    concepts = get_petrochemical_concepts(normalized)
    return len(concepts) >= 2


def is_petrochemical_supply(product) -> bool:
    industry = get_industry_name(product)
    text = build_supply_text(product)
    return is_petrochemical_text(industry) or is_petrochemical_text(text)


def is_petrochemical_need(need) -> bool:
    industry = get_industry_name(need)
    text = build_need_text(need)
    return is_petrochemical_text(industry) or is_petrochemical_text(text)


# ============================================================
# Match Need With Supplies (اصلاح‌شده با Fallback هوشمند)
# ============================================================

def match_need_with_supplies(
    need,
    supplies,
    limit: int = 20,
    petrochemical_only: bool = True,
) -> list[dict]:

    results = []

    try:
        total = supplies.count()
    except Exception:
        total = len(supplies)

    logger.info(
        "Matching Need %s against %s supplies",
        getattr(need, "id", "Unknown"),
        total,
    )

    # --------------------------------------------------------
    # فقط پتروشیمی
    # --------------------------------------------------------
    if petrochemical_only and not is_petrochemical_need(need):
        logger.info(
            "Need %s is not petrochemical. No matches returned.",
            getattr(need, "id", None),
        )
        # برگرداندن پیام خالی با راهنمایی
        return [{
            'match_percentage': 0,
            'match_reason': 'نیاز شما در حوزه پتروشیمی نیست. برای یافتن تطبیق مناسب، لطفاً نیاز خود را در حوزه صحیح ثبت کنید.',
            'recommended_actions': ['ثبت نیاز در حوزه صنعتی مناسب'],
            'need_id': getattr(need, "id", None),
            'product_id': None,
            'title': 'حوزه صنعتی نامناسب',
            'provider': '',
            'description': 'نیاز شما در حوزه پتروشیمی شناسایی نشد. لطفاً نیاز خود را در دسته‌بندی صحیح ثبت کنید تا تطبیق‌های دقیق‌تری دریافت کنید.',
            'price': None,
            'trl': None,
            'industry': '',
            'type': 'info',
            'risk_level': 'low',
            'risk_reasons': ['حوزه صنعتی نامناسب'],
            'scores': {},
            'llm_used': False,
        }]

    # اگر هیچ Supply وجود نداشت
    if total == 0:
        return [{
            'match_percentage': 0,
            'match_reason': 'برای یافتن تطبیق دقیق‌تر، اطلاعات این نیاز را تکمیل کنید.',
            'recommended_actions': ['تکمیل اطلاعات نیاز (شرح، بودجه، الزامات فنی)'],
            'need_id': getattr(need, "id", None),
            'product_id': None,
            'title': 'هیچ عرضه‌ای ثبت نشده است',
            'provider': '',
            'description': 'در حال حاضر هیچ محصول یا خدماتی در سیستم ثبت نشده که با این نیاز تطابق داشته باشد. لطفاً بعداً مجدداً تلاش کنید یا نیاز خود را تکمیل کنید.',
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
        # ----------------------------------------------------
        # فقط Supply های پتروشیمی
        # ----------------------------------------------------
        if petrochemical_only and not is_petrochemical_supply(supply):
            continue

        try:
            result = calculate_match(need, supply)
        except Exception:
            logger.exception(
                "Matching failed for need=%s supply=%s",
                getattr(need, "id", None),
                getattr(supply, "id", None),
            )
            continue

        supply_id = getattr(supply, "id", None)

        result["need_id"] = getattr(need, "id", None)
        result["supply_id"] = supply_id
        result["product_id"] = supply_id
        result["type"] = getattr(supply, "supply_type", None) or getattr(supply, "category", "product")
        result["title"] = getattr(supply, "title", "")

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

        result["price"] = getattr(supply, "price", None)
        result["trl"] = getattr(supply, "trl", None)
        result["industry"] = get_industry_name(supply)
        result["description"] = get_description(supply)
        result["delivery_time"] = ""
        result["entity_type"] = "supply"

        results.append(result)

    # اگر بعد از حلقه، results خالی بود (همه زیر آستانه یا هیچ Supply پتروشیمی نبود)
    if not results:
        return [{
            'match_percentage': 0,
            'match_reason': 'هیچ تطابق قابل قبولی یافت نشد. برای بهبود نتیجه، اطلاعات نیاز را کامل کنید.',
            'recommended_actions': ['تکمیل شرح نیاز', 'افزودن الزامات فنی', 'تعیین بودجه دقیق‌تر'],
            'need_id': getattr(need, "id", None),
            'product_id': None,
            'title': 'نیاز به اطلاعات بیشتر دارد',
            'provider': '',
            'description': 'برای یافتن راهکار مناسب، اطلاعات این نیاز کافی نیست. پیشنهاد می‌کنیم شرح نیاز، الزامات فنی و نتیجه مورد انتظار را تکمیل کنید.',
            'price': None,
            'trl': None,
            'industry': '',
            'type': 'info',
            'risk_level': 'low',
            'risk_reasons': ['اطلاعات ناقص'],
            'scores': {},
            'llm_used': False,
        }]

    risk_order = {"low": 0, "medium": 1, "high": 2}
    results.sort(
        key=lambda item: (
            -float(item.get("match_percentage", 0)),
            risk_order.get(item.get("risk_level", "medium"), 1),
        )
    )

    return results[:limit]


# ============================================================
# Best Matches
# ============================================================

def get_best_matches(need, supplies, limit: int = 10) -> list[dict]:
    return match_need_with_supplies(need=need, supplies=supplies, limit=limit, petrochemical_only=True)


# ============================================================
# Legacy Product MatchResult Payload
# ============================================================

def build_match_result_payload(need, product) -> dict:
    result = calculate_match(need, product)
    return {
        "need_id": getattr(need, "id", None),
        "product_id": getattr(product, "id", None),
        "match_percentage": result["match_percentage"],
        "match_reason": result["match_reason"],
        "risk_level": result["risk_level"],
        "risk_reasons": result["risk_reasons"],
        "concepts": result["concepts"],
        "scores": result["scores"],
    }