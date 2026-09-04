# matching/industry_concepts.py
# ============================================================
# دیکشنری جامع مفاهیم صنعتی برای سیستم تطبیق
# با فرمت مشابه dictionary.py و پوشش ۱۲ صنعت اصلی
# ============================================================

from __future__ import annotations

import re
from typing import Dict, List, Set, Tuple, Optional


# ============================================================
# 1. Industry Concepts Vocabulary
# ============================================================

INDUSTRY_TERMS: Dict[str, Dict[str, List[str]]] = {

    # ========================================================
    # صنعت نفت و گاز
    # ========================================================

    "نفت و گاز": {
        "keywords": [
            "نفت", "گاز", "پالایش", "پتروشیمی", "خط لوله", "مخزن", "حفاری", "اکتشاف",
            "استخراج", "تولید", "فرآورش", "گاز طبیعی", "مایع", "پالایشگاه", "پتروپالایش",
            "پلیمر", "الفین", "اتیلن", "پروپیلن", "بوتادین", "بنزین", "گازوئیل", "نفت سفید",
            "صنایع پایین دست", "صنایع بالادست", "پتروپالایشگاه", "پتروفرآوری",
            "نفت خام", "میعانات گازی", "ال ان جی", "ال پی جی", "گاز مایع",
            "oil", "gas", "refinery", "petrochemical", "pipeline", "reservoir",
            "drilling", "exploration", "extraction", "production", "processing",
            "natural gas", "LNG", "LPG", "crude oil", "condensate",
            "upstream", "downstream", "petrochemical plant",
        ]
    },

    # ========================================================
    # صنعت پتروشیمی (توسعه‌یافته)
    # ========================================================

    "پتروشیمی": {
        "keywords": [
            "پتروشیمی", "پلیمر", "پلاستیک", "رزین", "الیاف", "کاتالیست", "واکنش",
            "استایرن", "اتیلن", "پروپیلن", "بوتادین", "متانول", "آمونیاک", "اوره",
            "پلی اتیلن", "پلی پروپیلن", "پی وی سی", "پلی استایرن", "لاستیک", "پلی اورتان",
            "الیاف مصنوعی", "پلیمرهای مهندسی", "کامپوزیت", "پلیمریزاسیون",
            "تقطیر", "تفکیک", "جداسازی", "کوره", "مبدل حرارتی", "کمپرسور", "پمپ",
            "راکتور", "بویلر", "سیستم خنک‌کننده", "سپراتور", "مخزن",
            "واحد فرآیندی", "خط تولید", "کنترل فرآیند", "ابزار دقیق", "پایش",
            "petrochemical", "polymer", "plastic", "resin", "fiber", "catalyst",
            "reaction", "styrene", "ethylene", "propylene", "butadiene", "methanol",
            "ammonia", "urea", "polyethylene", "polypropylene", "PVC", "polystyrene",
            "rubber", "polyurethane", "synthetic fiber", "engineering polymer",
            "composite", "polymerization", "distillation", "fractionation",
            "separation", "furnace", "heat exchanger", "compressor", "pump",
            "reactor", "boiler", "cooling system", "separator", "tank",
            "process unit", "production line", "process control",
            "instrumentation", "monitoring",
        ]
    },

    # ========================================================
    # صنعت فولاد
    # ========================================================

    "فولاد": {
        "keywords": [
            "فولاد", "آهن", "ذوب", "نورد", "گندله", "سنگ آهن", "کک", "کنستانتره",
            "بریکت", "احیا", "کوره", "اسلب", "کلاف", "شمش", "میلگرد", "تیرآهن",
            "ورق", "پروفیل", "صنایع معدنی", "فلزات", "علیاژی", "فولادسازی",
            "کوره قوس الکتریکی", "کوره بلند", "احیای مستقیم", "گندله‌سازی",
            "steel", "iron", "smelting", "rolling", "pellet", "iron ore", "coke",
            "concentrate", "briquette", "reduction", "furnace", "slab", "coil",
            "billet", "rebar", "beam", "sheet", "profile", "mining industry",
            "metals", "alloy", "steelmaking", "electric arc furnace", "blast furnace",
            "direct reduction", "pelletizing",
        ]
    },

    # ========================================================
    # صنعت سیمان
    # ========================================================

    "سیمان": {
        "keywords": [
            "سیمان", "کلینکر", "گچ", "پوزولان", "سرباره", "آهک", "کوره", "خنک‌کننده",
            "آسیاب", "غبارگیر", "سیلو", "بسته‌بندی", "بتن", "ماسه", "شن",
            "سیمان پرتلند", "سیمان سفید", "سیمان رنگی", "سیمان هیدرولیک",
            "cement", "clinker", "gypsum", "pozzolan", "slag", "lime", "kiln",
            "cooler", "mill", "dust collector", "silo", "packaging", "concrete",
            "sand", "gravel", "Portland cement", "white cement", "colored cement",
            "hydraulic cement",
        ]
    },

    # ========================================================
    # صنعت خودرو
    # ========================================================

    "خودرو": {
        "keywords": [
            "خودرو", "قطعه", "موتور", "گیربکس", "شاسی", "بدنه", "گیره", "کمک فنر",
            "سیستم ترمز", "سیستم تعلیق", "سیستم سوخت", "سیستم برق", "سیستم تهویه",
            "کیسه هوا", "ایمنی", "آلایندگی", "سوخت", "برقی", "هیبرید", "خودران",
            "موتور احتراق داخلی", "موتور برقی", "باتری خودرو", "شارژر",
            "ایمنی خودرو", "سیستم ترمز ضد قفل", "کنترل پایداری", "کروز کنترل",
            "مرکز خدمات پس از فروش", "قطعات یدکی",
            "automobile", "car", "auto part", "engine", "transmission", "chassis",
            "body", "shock absorber", "brake system", "suspension", "fuel system",
            "electrical system", "HVAC", "airbag", "safety", "emission", "fuel",
            "electric", "hybrid", "autonomous", "internal combustion engine",
            "electric motor", "car battery", "charger", "vehicle safety",
            "ABS", "ESC", "cruise control", "after-sales service", "spare parts",
        ]
    },

    # ========================================================
    # صنعت الکترونیک
    # ========================================================

    "الکترونیک": {
        "keywords": [
            "الکترونیک", "مدار", "چیپ", "میکروکنترلر", "سنسور", "اکتواتور",
            "برد", "قطعه الکترونیکی", "نیمه‌رسانا", "ترانزیستور", "دیود", "خازن",
            "مقاومت", "سلف", "ترانسفورماتور", "پاور", "باتری", "شارژر",
            "مدار چاپی", "PCB", "IC", "LED", "LCD", "OLED", "صفحه نمایش",
            "پردازنده", "حافظه", "رم", "فلش", "ارتباطات", "بی‌سیم", "اینترنت اشیا",
            "الکترونیک قدرت", "سوئیچینگ", "اینورتر", "مبدل",
            "electronics", "circuit", "chip", "microcontroller", "sensor",
            "actuator", "board", "electronic component", "semiconductor",
            "transistor", "diode", "capacitor", "resistor", "inductor",
            "transformer", "power supply", "battery", "charger", "PCB",
            "IC", "LED", "LCD", "OLED", "display", "processor", "memory",
            "RAM", "flash", "communication", "wireless", "IoT",
            "power electronics", "switching", "inverter", "converter",
        ]
    },

    # ========================================================
    # صنعت داروسازی
    # ========================================================

    "داروسازی": {
        "keywords": [
            "دارو", "داروسازی", "قرص", "کپسول", "شربت", "آمپول", "پودر", "گرانول",
            "ماده موثره", "API", "جاذب", "پوشش", "انحلال", "زیست‌فراهمی", "استریل",
            "تزریق", "موضعی", "خوراکی", "بیوتکنولوژی", "واکسن", "آنتی‌بیوتیک",
            "مسکن", "ضدالتهاب", "هورمون", "انسولین", "نوترکیب",
            "تولید دارو", "کیفیت دارو", "کنترل کیفی", "GMP", "GLP",
            "pharmaceutical", "medicine", "drug", "tablet", "capsule", "syrup",
            "ampoule", "powder", "granule", "active ingredient", "API",
            "absorbent", "coating", "dissolution", "bioavailability", "sterile",
            "injection", "topical", "oral", "biotechnology", "vaccine",
            "antibiotic", "analgesic", "anti-inflammatory", "hormone", "insulin",
            "recombinant", "drug manufacturing", "drug quality", "quality control",
            "GMP", "GLP",
        ]
    },

    # ========================================================
    # صنعت کشاورزی
    # ========================================================

    "کشاورزی": {
        "keywords": [
            "کشاورزی", "کشت", "برداشت", "آبیاری", "کود", "سم", "بذر", "نهال",
            "گلخانه", "مکانیزاسیون", "تراکتور", "کمباین", "سیستم آبیاری", "قطره‌ای",
            "بارانی", "زهکشی", "خاک", "کود آلی", "کود شیمیایی", "آفت‌کش",
            "علف‌کش", "قارچ‌کش", "سموم کشاورزی", "کشت بدون خاک", "هیدروپونیک",
            "آبیاری تحت فشار", "آبیاری هوشمند", "ماشین‌آلات کشاورزی",
            "agriculture", "farming", "cultivation", "harvest", "irrigation",
            "fertilizer", "pesticide", "seed", "seedling", "greenhouse",
            "mechanization", "tractor", "combine", "irrigation system", "drip",
            "sprinkler", "drainage", "soil", "organic fertilizer", "chemical fertilizer",
            "pesticide", "herbicide", "fungicide", "soilless cultivation",
            "hydroponics", "pressurized irrigation", "smart irrigation",
            "agricultural machinery",
        ]
    },

    # ========================================================
    # صنعت فناوری اطلاعات
    # ========================================================

    "فناوری اطلاعات": {
        "keywords": [
            "فناوری اطلاعات", "نرم‌افزار", "سخت‌افزار", "شبکه", "اینترنت", "کلود",
            "پایگاه داده", "سیستم عامل", "امنیت", "رمزنگاری", "هوش مصنوعی", "یادگیری ماشین",
            "کلان داده", "اینترنت اشیا", "بلاکچین", "واقعیت مجازی", "بهبود فرایند",
            "دیجیتالی‌سازی", "تحول دیجیتال", "اتوماسیون", "مدیریت خدمات", "DevOps",
            "CI/CD", "میکروسرویس", "معماری نرم‌افزار", "توسعه نرم‌افزار",
            "تست نرم‌افزار", "کیفیت نرم‌افزار", "مدیریت پروژه نرم‌افزاری",
            "information technology", "software", "hardware", "network", "internet",
            "cloud", "database", "operating system", "security", "encryption",
            "artificial intelligence", "machine learning", "big data", "IoT",
            "blockchain", "virtual reality", "process improvement",
            "digitalization", "digital transformation", "automation",
            "service management", "DevOps", "CI/CD", "microservice",
            "software architecture", "software development", "software testing",
            "software quality", "software project management",
        ]
    },

    # ========================================================
    # صنعت ساخت و تولید (General Manufacturing)
    # ========================================================

    "ساخت و تولید": {
        "keywords": [
            "تولید", "کارخانه", "خط تولید", "رباتیک", "اتوماسیون", "ماشین‌آلات",
            "نگهداری", "تعمیرات", "کیفیت", "استاندارد", "ایمنی", "بهداشت", "محیط زیست",
            "مدیریت انرژی", "بهره‌وری", "کاهش ضایعات", "چابکی", "تولید ناب",
            "شش سیگما", "کنترل فرآیند آماری", "نگهداری پیش‌گیرانه", "نگهداری مبتنی بر وضعیت",
            "تولید انبوه", "تولید سفارشی", "تولید هوشمند", "کارخانه هوشمند",
            "manufacturing", "production", "plant", "production line", "robotics",
            "automation", "machinery", "maintenance", "repair", "quality",
            "standard", "safety", "health", "environment", "energy management",
            "productivity", "waste reduction", "agility", "lean manufacturing",
            "six sigma", "statistical process control", "preventive maintenance",
            "condition-based maintenance", "mass production", "custom production",
            "smart manufacturing", "smart factory",
        ]
    },

    # ========================================================
    # صنعت برق و انرژی
    # ========================================================

    "برق و انرژی": {
        "keywords": [
            "برق", "انرژی", "توزیع", "انتقال", "تولید نیرو", "توربین", "ژنراتور",
            "ترانسفورماتور", "تابلو", "کلید", "کابل", "پست", "خط", "کنترل", "مخابرات",
            "انرژی تجدیدپذیر", "خورشیدی", "باد", "هیدروژن", "ذخیره‌ساز", "هوشمند",
            "شبکه هوشمند", "ریز شبکه", "مدیریت انرژی", "کاهش تلفات", "پایداری شبکه",
            "انرژی بادی", "انرژی خورشیدی", "پنل خورشیدی", "توربین بادی",
            "باتری ذخیره‌ساز", "سیستم مدیریت انرژی", "مصرف بهینه", "بهره‌وری انرژی",
            "electricity", "energy", "distribution", "transmission", "power generation",
            "turbine", "generator", "transformer", "panel", "switch", "cable",
            "substation", "line", "control", "telecommunications", "renewable energy",
            "solar", "wind", "hydrogen", "storage", "smart", "smart grid",
            "microgrid", "energy management", "loss reduction", "grid stability",
            "wind energy", "solar energy", "solar panel", "wind turbine",
            "storage battery", "energy management system", "optimal consumption",
            "energy efficiency",
        ]
    },

    # ========================================================
    # صنعت حمل و نقل و لجستیک
    # ========================================================

    "حمل و نقل و لجستیک": {
        "keywords": [
            "حمل و نقل", "لجستیک", "باربری", "دریایی", "هوایی", "زمینی", "تریلر", "کانتینر",
            "انبار", "توزیع", "زنجیره تامین", "مدیریت ناوگان", "مسیر", "سیستم حمل",
            "خودروهای سنگین", "قطار", "کامیون", "سوخت", "آلودگی", "ایمنی جاده",
            "حمل و نقل ترکیبی", "حمل و نقل هوشمند", "مدیریت حمل و نقل", "بهینه‌سازی مسیر",
            "انبارداری", "مدیریت موجودی", "توزیع کالا", "خدمات پس از فروش",
            "حمل و نقل ریلی", "حمل و نقل جاده‌ای", "حمل و نقل دریایی", "حمل و نقل هوایی",
            "transportation", "logistics", "freight", "maritime", "air", "ground",
            "trailer", "container", "warehouse", "distribution", "supply chain",
            "fleet management", "routing", "transport system", "heavy vehicles",
            "train", "truck", "fuel", "pollution", "road safety", "intermodal",
            "intelligent transportation", "transportation management",
            "route optimization", "warehousing", "inventory management",
            "goods distribution", "after-sales service", "rail transport",
            "road transport", "maritime transport", "air transport",
        ]
    },
}


# ============================================================
# 2. Normalization
# ============================================================

INDUSTRY_NORMALIZATION = {
    "ي": "ی",
    "ى": "ی",
    "ك": "ک",
    "\u200c": " ",
    "\u200f": " ",
    "\u200e": " ",
    "ـ": "",
    "أ": "ا",
    "إ": "ا",
    "ٱ": "ا",
    "ؤ": "و",
    "ئ": "ی",
}


def normalize_industry_text(text: str) -> str:
    if not text:
        return ""
    text = str(text).lower().strip()
    for old, new in INDUSTRY_NORMALIZATION.items():
        text = text.replace(old, new)
    text = text.replace("-", " ")
    text = text.replace("_", " ")
    text = re.sub(r"[،؛,:.!؟?()\[\]{}\"'«»]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# ============================================================
# 3. Build Term Index
# ============================================================

def _build_industry_term_index() -> Dict[str, Set[str]]:
    index = {}
    for industry, data in INDUSTRY_TERMS.items():
        industry_key = normalize_industry_text(industry)
        keywords = data.get("keywords", [])
        index[industry_key] = {
            normalize_industry_text(term)
            for term in keywords
            if normalize_industry_text(term)
        }
    return index


INDUSTRY_TERM_INDEX = _build_industry_term_index()


# ============================================================
# 4. Get Industry by Name
# ============================================================

def get_industry_key(industry_name: str) -> Optional[str]:
    if not industry_name:
        return None
    normalized = normalize_industry_text(industry_name)
    for key in INDUSTRY_TERM_INDEX.keys():
        if normalized in key or key in normalized:
            return key
    return None


# ============================================================
# 5. Concept Lookup
# ============================================================

def get_industry_concepts(text: str, industry_name: Optional[str] = None) -> List[str]:
    normalized_text = normalize_industry_text(text)
    if not normalized_text:
        return []

    concepts = []

    if industry_name:
        key = get_industry_key(industry_name)
        if key and key in INDUSTRY_TERM_INDEX:
            for term in INDUSTRY_TERM_INDEX[key]:
                if term in normalized_text:
                    concepts.append(key)
                    break
        return concepts

    for industry_key, terms in INDUSTRY_TERM_INDEX.items():
        for term in terms:
            if term in normalized_text:
                concepts.append(industry_key)
                break

    return concepts


# ============================================================
# 6. Concept Similarity
# ============================================================

def calculate_concept_similarity(
    text_a: str,
    text_b: str,
    industry_name: Optional[str] = None,
) -> float:
    concepts_a = set(get_industry_concepts(text_a, industry_name))
    concepts_b = set(get_industry_concepts(text_b, industry_name))
    if not concepts_a or not concepts_b:
        return 0.0
    intersection = concepts_a.intersection(concepts_b)
    union = concepts_a.union(concepts_b)
    if not union:
        return 0.0
    return round(len(intersection) / len(union), 4)


# ============================================================
# 7. Weighted Concept Similarity
# ============================================================

INDUSTRY_WEIGHTS = {
    "نفت و گاز": 1.5,
    "پتروشیمی": 1.5,
    "فولاد": 1.4,
    "سیمان": 1.3,
    "خودرو": 1.4,
    "الکترونیک": 1.3,
    "داروسازی": 1.5,
    "کشاورزی": 1.3,
    "فناوری اطلاعات": 1.3,
    "ساخت و تولید": 1.4,
    "برق و انرژی": 1.5,
    "حمل و نقل و لجستیک": 1.4,
}


def calculate_weighted_concept_similarity(
    text_a: str,
    text_b: str,
    industry_name: Optional[str] = None,
) -> float:
    concepts_a = set(get_industry_concepts(text_a, industry_name))
    concepts_b = set(get_industry_concepts(text_b, industry_name))
    if not concepts_a or not concepts_b:
        return 0.0
    intersection = concepts_a.intersection(concepts_b)
    if not intersection:
        return 0.0
    intersection_weight = sum(INDUSTRY_WEIGHTS.get(concept, 1.0) for concept in intersection)
    total_weight = sum(INDUSTRY_WEIGHTS.get(concept, 1.0) for concept in concepts_a.union(concepts_b))
    if total_weight == 0:
        return 0.0
    return round(intersection_weight / total_weight, 4)


# ============================================================
# 8. Title Priority
# ============================================================

def build_weighted_text(title: str, body: str, repeat_title: int = 3) -> str:
    normalized_title = normalize_industry_text(title or "")
    normalized_body = normalize_industry_text(body or "")
    repeated_title = " ".join([normalized_title] * repeat_title) if normalized_title else ""
    if repeated_title and normalized_body:
        return f"{repeated_title} {normalized_body}"
    if repeated_title:
        return repeated_title
    return normalized_body


# ============================================================
# 9. Risk Rules
# ============================================================

HIGH_RISK_TERMS = [
    "انفجار", "حریق", "آتش سوزی", "گاز سمی", "مواد سمی", "سمی",
    "خطرناک", "مواد خطرناک", "مواد قابل اشتعال", "قابل اشتعال",
    "فشار بسیار بالا", "فشار بالا", "دمای بسیار بالا",
    "نشتی گاز", "نشت گاز", "نشت مواد",
    "H2S", "hydrogen sulfide", "toxic gas", "flammable",
    "explosive", "explosion", "fire hazard", "fire risk",
    "high pressure", "high temperature", "hazardous material",
    "toxic material", "radioactive", "radiation",
]

MEDIUM_RISK_TERMS = [
    "کوره", "راکتور", "کمپرسور", "مبدل حرارتی", "بویلر",
    "پمپ", "مخزن", "خط لوله", "فرآیند", "فرایند",
    "کنترل فرآیند", "کنترل فرایند", "ابزار دقیق",
    "تعمیرات", "نگهداری", "تجهیزات", "فشار", "دما",
    "احتراق", "گاز", "بخار", "موتور", "ترانسفورماتور",
    "process equipment", "reactor", "compressor", "furnace",
    "boiler", "pump", "pipeline", "process control",
    "maintenance", "equipment", "pressure", "temperature",
]

LOW_RISK_TERMS = [
    "داشبورد", "گزارش", "تحلیل داده", "تحلیل", "مشاوره",
    "آموزش", "نرم افزار", "نرم‌افزار", "نرم افزاری",
    "شبیه سازی", "شبیه‌سازی", "مدل سازی", "مدل‌سازی",
    "پایش داده", "پیش بینی", "پیش‌بینی", "داده کاوی",
    "هوش مصنوعی", "یادگیری ماشین", "cloud", "digital",
    "dashboard", "report", "data analysis", "consulting",
    "software", "simulation", "modeling", "forecasting",
    "AI", "machine learning",
]


def _count_terms(normalized_text: str, terms: List[str]) -> Tuple[int, List[str]]:
    count = 0
    matched = []
    for term in terms:
        normalized_term = normalize_industry_text(term)
        if normalized_term and normalized_term in normalized_text:
            count += 1
            matched.append(normalized_term)
    return count, matched


def get_risk_signals(text: str) -> Dict:
    normalized_text = normalize_industry_text(text)
    high_count, high_terms = _count_terms(normalized_text, HIGH_RISK_TERMS)
    medium_count, medium_terms = _count_terms(normalized_text, MEDIUM_RISK_TERMS)
    low_count, low_terms = _count_terms(normalized_text, LOW_RISK_TERMS)
    return {
        "high": high_count,
        "medium": medium_count,
        "low": low_count,
        "high_terms": high_terms,
        "medium_terms": medium_terms,
        "low_terms": low_terms,
    }


def calculate_risk_level(text: str) -> str:
    signals = get_risk_signals(text)
    if signals["high"] >= 1:
        return "high"
    if signals["medium"] >= 2:
        return "medium"
    if signals["medium"] == 1:
        return "medium"
    return "low"


def calculate_risk_score(text: str) -> float:
    signals = get_risk_signals(text)
    score = 0.0
    score += signals["high"] * 30
    score += signals["medium"] * 12
    score -= signals["low"] * 5
    score = max(0.0, min(100.0, score))
    return round(score, 2)


def calculate_combined_risk(need_text: str, supply_text: str) -> Dict:
    need_score = calculate_risk_score(need_text)
    supply_score = calculate_risk_score(supply_text)
    combined_score = (need_score * 0.55) + (supply_score * 0.45)
    if combined_score >= 60:
        level = "high"
    elif combined_score >= 25:
        level = "medium"
    else:
        level = "low"
    return {
        "risk_level": level,
        "risk_score": round(combined_score, 2),
        "need_risk_score": need_score,
        "supply_risk_score": supply_score,
        "need_signals": get_risk_signals(need_text),
        "supply_signals": get_risk_signals(supply_text),
    }


def calculate_risk_penalty(need_text: str, supply_text: str) -> float:
    risk = calculate_combined_risk(need_text, supply_text)
    score = risk["risk_score"]
    if score >= 70:
        return 0.30
    if score >= 50:
        return 0.20
    if score >= 30:
        return 0.10
    if score >= 15:
        return 0.05
    return 0.0


# ============================================================
# 10. Extract Keywords
# ============================================================

def extract_keywords(text: str, top_n: int = 5) -> List[str]:
    stopwords = {
        "و", "با", "از", "به", "برای", "در", "را", "این", "آن", "یک", "دو",
        "ها", "های", "شده", "می", "است", "که", "نه", "بر", "هم", "چون",
        "بسیار", "خیلی", "بیشتر", "کمتر", "نسبت", "مثل", "مانند", "طبق",
        "جهت", "بابت", "بعد", "قبل", "حین", "زمان", "حال", "چه", "هر",
        "سامانه", "سیستم", "راهکار", "محصول", "خدمات", "نیاز", "کاربر",
        "هست", "هستند", "بود", "بودند", "شود", "شوند", "گشت", "می‌شود",
    }
    normalized = normalize_industry_text(text)
    words = normalized.split()
    filtered = [w for w in words if len(w) > 2 and w not in stopwords]
    if not filtered:
        return []
    from collections import Counter
    weighted = Counter()
    for w in filtered:
        weighted[w] += len(w)
    most_common = weighted.most_common(top_n)
    return [word for word, _ in most_common]


# ============================================================
# 11. Utility Functions
# ============================================================

def is_industry_related(text: str, industry_name: str) -> bool:
    concepts = get_industry_concepts(text, industry_name)
    return len(concepts) > 0


def get_industry_label(industry_key: str) -> str:
    labels = {
        "نفت و گاز": "صنعت نفت و گاز",
        "پتروشیمی": "صنعت پتروشیمی",
        "فولاد": "صنعت فولاد",
        "سیمان": "صنعت سیمان",
        "خودرو": "صنعت خودرو",
        "الکترونیک": "صنعت الکترونیک",
        "داروسازی": "صنعت داروسازی",
        "کشاورزی": "صنعت کشاورزی",
        "فناوری اطلاعات": "صنعت فناوری اطلاعات",
        "ساخت و تولید": "صنعت ساخت و تولید",
        "برق و انرژی": "صنعت برق و انرژی",
        "حمل و نقل و لجستیک": "صنعت حمل و نقل و لجستیک",
    }
    return labels.get(industry_key, industry_key)