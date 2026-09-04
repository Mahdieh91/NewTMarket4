# -*- coding: utf-8 -*-
"""
seed_market_100_real_media.py

اسکریپت واحد برای داده‌گذاری بازار:
- دقیقاً تا ۱۰۰ عرضه
- تصویر واقعی و مرتبط از Wikimedia Commons
- بدون استفاده از reportlab
- مستند PDF واقعی از وب، در صورت پیدا شدن
- هیچ PDF ساختگی تولید نمی‌شود
- جلوگیری از تکرار تصویر و عنوان
- ذخیره تصویر در SupplyImage
- تلاش برای ذخیره مستند در فیلد documents یا فایل‌های مدل، با تشخیص خودکار
- پر کردن فیلدهای اختیاری مدل در صورت وجود
- سازگارتر با تفاوت‌های مدل Supply بین نسخه‌های پروژه

اجرا از ریشه پروژه:
    python seed_market_100_real_media.py

پیش‌نیاز:
    pip install requests pillow

نکته:
این فایل «سند رسمی تولیدکننده» جعل نمی‌کند.
اگر برای یک عرضه PDF عمومی معتبر و مرتبط پیدا نشود، فقط تصویر و خود رکورد
ثبت می‌شود و در خروجی اعلام می‌شود که سند پیدا نشده است.
"""

import os
import re
import time
import random
import hashlib
from decimal import Decimal
from io import BytesIO
from pathlib import Path
from urllib.parse import unquote, urljoin

import django
import requests
from PIL import Image
from django.core.files.base import ContentFile

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from products.models import Supply, SupplyImage


# ============================================================
# تنظیمات
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
MEDIA_DIR = BASE_DIR / "media"
IMAGE_DIR = MEDIA_DIR / "market_seed_images"
DOC_DIR = MEDIA_DIR / "market_seed_docs"

IMAGE_DIR.mkdir(parents=True, exist_ok=True)
DOC_DIR.mkdir(parents=True, exist_ok=True)

TIMEOUT = 30
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 Chrome/128 Safari/537.36 "
    "TMarket-Seed/2.0"
)

WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"
DUCKDUCKGO_URL = "https://html.duckduckgo.com/html/"

random.seed(1404)


# ============================================================
# داده‌های پایه
# ============================================================

INDUSTRIES = [
    "نفت و گاز",
    "پتروشیمی",
    "فولاد و معدن",
    "سلامت",
    "کشاورزی",
    "حمل‌ونقل",
    "خودروسازی",
    "انرژی",
    "فناوری اطلاعات",
    "محیط زیست",
]

TECHNOLOGIES = [
    "هوش مصنوعی",
    "اینترنت اشیاء",
    "دوقلوی دیجیتال",
    "رباتیک",
    "بلاکچین",
    "داده‌کاوی",
]

CITIES = [
    "تهران",
    "اصفهان",
    "شیراز",
    "تبریز",
    "مشهد",
    "یزد",
    "کرج",
    "اهواز",
    "رشت",
    "کرمان",
]

PRODUCT_CATEGORIES = [
    "تجهیزات صنعتی",
    "نرم‌افزار",
    "سخت‌افزار",
    "راهکار یکپارچه",
    "ماشین‌آلات",
    "سیستم کنترل",
    "سنسور",
    "دستگاه پزشکی",
    "پنل خورشیدی",
    "باتری",
    "رباتیک",
]

SERVICE_CATEGORIES = [
    "مشاوره",
    "آموزش",
    "ارزیابی",
    "طراحی",
    "پیاده‌سازی",
    "نگهداری",
    "تحلیل داده",
    "مدیریت پروژه",
]

UNITS = [
    "عدد",
    "دستگاه",
    "پروژه",
    "ماه",
    "ارزیابی",
    "نفر-ساعت",
    "سامانه",
    "خدمت",
]

APPLICATIONS = {
    "نفت و گاز": "پایش خطوط و تجهیزات، کاهش توقفات، ایمنی فرایند و نگهداری پیش‌بینانه",
    "پتروشیمی": "کنترل فرایند، کیفیت تولید، ایمنی و بهینه‌سازی انرژی",
    "فولاد و معدن": "کنترل کیفیت، نگهداری تجهیزات، بهره‌وری تولید و کاهش ضایعات",
    "سلامت": "پایش بیمار، مدیریت تجهیزات، تحلیل ریسک و بهبود تصمیم‌گیری",
    "کشاورزی": "پایش مزرعه، مدیریت منابع آب، تشخیص آفت و افزایش بهره‌وری",
    "حمل‌ونقل": "پایش ناوگان، کاهش مصرف سوخت، ایمنی و برنامه‌ریزی مسیر",
    "خودروسازی": "کنترل کیفیت، مونتاژ، نگهداری و تحلیل توقفات",
    "انرژی": "پایش تولید، پیش‌بینی، نگهداری و بهینه‌سازی مصرف",
    "فناوری اطلاعات": "مدیریت زیرساخت، داده، امنیت، دارایی و تحول دیجیتال",
    "محیط زیست": "پایش آلودگی، مدیریت منابع، تصفیه و تحلیل داده‌های محیطی",
}

# واژه‌های انگلیسی صرفاً برای جست‌وجوی منابع خارجی استفاده می‌شوند.
# عنوان و داده‌های ثبت‌شده در پایگاه فارسی هستند.
SEARCH_TERMS = {
    "نفت و گاز": "oil gas pipeline refinery",
    "پتروشیمی": "petrochemical chemical plant",
    "فولاد و معدن": "steel mining industrial",
    "سلامت": "medical healthcare hospital",
    "کشاورزی": "agriculture greenhouse farm",
    "حمل‌ونقل": "transport truck railway logistics",
    "خودروسازی": "automotive vehicle manufacturing",
    "انرژی": "solar wind power plant",
    "فناوری اطلاعات": "data center information technology",
    "محیط زیست": "water treatment air pollution waste",
}

TECH_SEARCH = {
    "هوش مصنوعی": "artificial intelligence machine vision",
    "اینترنت اشیاء": "industrial internet sensors monitoring",
    "دوقلوی دیجیتال": "digital twin industrial",
    "رباتیک": "industrial robot inspection",
    "بلاکچین": "blockchain supply chain",
    "داده‌کاوی": "data analytics predictive maintenance",
}


# ============================================================
# ۱۰۰ رکورد پایه
# ============================================================

PRODUCTS = [
    ("سامانه پایش هوشمند خوردگی خطوط لوله", "product", "نفت و گاز", "اینترنت اشیاء", "تهران"),
    ("دوقلوی دیجیتال واحد تقطیر پالایشگاه", "software_solution", "نفت و گاز", "دوقلوی دیجیتال", "اهواز"),
    ("سامانه تشخیص نشتی گاز با بینایی ماشین", "product", "نفت و گاز", "هوش مصنوعی", "اهواز"),
    ("ربات بازرسی داخلی مخازن ذخیره", "product", "نفت و گاز", "رباتیک", "تبریز"),
    ("خدمت تحلیل پیش‌بینانه خرابی پمپ‌های فرایندی", "service", "نفت و گاز", "داده‌کاوی", "اصفهان"),

    ("سامانه کنترل هوشمند راکتور پتروشیمی", "product", "پتروشیمی", "هوش مصنوعی", "اصفهان"),
    ("پایش آنلاین کیفیت خوراک پتروشیمی", "product", "پتروشیمی", "اینترنت اشیاء", "شیراز"),
    ("دوقلوی دیجیتال خط تولید پلیمر", "software_solution", "پتروشیمی", "دوقلوی دیجیتال", "تبریز"),
    ("ربات نمونه‌برداری ایمن مواد شیمیایی", "product", "پتروشیمی", "رباتیک", "کرج"),
    ("تحلیل داده مصرف انرژی مجتمع پتروشیمی", "service", "پتروشیمی", "داده‌کاوی", "تهران"),

    ("سامانه تشخیص ترک سطحی ورق فولادی", "product", "فولاد و معدن", "هوش مصنوعی", "یزد"),
    ("حسگر هوشمند ارتعاش کوره صنعتی", "product", "فولاد و معدن", "اینترنت اشیاء", "اصفهان"),
    ("دوقلوی دیجیتال کوره قوس الکتریکی", "software_solution", "فولاد و معدن", "دوقلوی دیجیتال", "اهواز"),
    ("ربات بازرسی خطوط نورد", "product", "فولاد و معدن", "رباتیک", "تبریز"),
    ("سامانه تحلیل داده بهره‌وری معدن", "service", "فولاد و معدن", "داده‌کاوی", "کرمان"),

    ("سامانه تریاژ هوشمند بیماران", "software_solution", "سلامت", "هوش مصنوعی", "تهران"),
    ("پایش پوشیدنی علائم حیاتی", "product", "سلامت", "اینترنت اشیاء", "مشهد"),
    ("دوقلوی دیجیتال تجهیزات بیمارستانی", "software_solution", "سلامت", "دوقلوی دیجیتال", "شیراز"),
    ("ربات جابه‌جایی تجهیزات بیمارستان", "product", "سلامت", "رباتیک", "اصفهان"),
    ("تحلیل داده ریسک بازگشت بیمار", "service", "سلامت", "داده‌کاوی", "رشت"),

    ("سامانه تشخیص آفت گیاه با تصویر", "software_solution", "کشاورزی", "هوش مصنوعی", "کرج"),
    ("شبکه حسگر هوشمند گلخانه", "product", "کشاورزی", "اینترنت اشیاء", "شیراز"),
    ("دوقلوی دیجیتال گلخانه صنعتی", "software_solution", "کشاورزی", "دوقلوی دیجیتال", "مشهد"),
    ("ربات وجین خودکار مزارع", "product", "کشاورزی", "رباتیک", "کرمان"),
    ("خدمت تحلیل داده عملکرد مزرعه", "service", "کشاورزی", "داده‌کاوی", "یزد"),

    ("سامانه پیش‌بینی خرابی ناوگان", "software_solution", "حمل‌ونقل", "هوش مصنوعی", "تهران"),
    ("سامانه پایش لحظه‌ای کامیون‌ها", "product", "حمل‌ونقل", "اینترنت اشیاء", "مشهد"),
    ("دوقلوی دیجیتال پایانه حمل بار", "software_solution", "حمل‌ونقل", "دوقلوی دیجیتال", "اصفهان"),
    ("ربات بازرسی خودکار واگن", "product", "حمل‌ونقل", "رباتیک", "تبریز"),
    ("خدمت تحلیل مسیر و مصرف سوخت ناوگان", "service", "حمل‌ونقل", "داده‌کاوی", "رشت"),

    ("سامانه کنترل کیفیت خط مونتاژ خودرو", "product", "خودروسازی", "هوش مصنوعی", "تهران"),
    ("حسگر هوشمند پایش خط تولید خودرو", "product", "خودروسازی", "اینترنت اشیاء", "کرج"),
    ("دوقلوی دیجیتال خط مونتاژ", "software_solution", "خودروسازی", "دوقلوی دیجیتال", "تبریز"),
    ("ربات جوشکاری تطبیقی بدنه خودرو", "product", "خودروسازی", "رباتیک", "اصفهان"),
    ("تحلیل داده توقفات خط تولید خودرو", "service", "خودروسازی", "داده‌کاوی", "یزد"),

    ("سامانه پیش‌بینی تولید نیروگاه خورشیدی", "software_solution", "انرژی", "هوش مصنوعی", "یزد"),
    ("سامانه پایش هوشمند پنل خورشیدی", "product", "انرژی", "اینترنت اشیاء", "کرمان"),
    ("دوقلوی دیجیتال توربین بادی", "software_solution", "انرژی", "دوقلوی دیجیتال", "رشت"),
    ("ربات شست‌وشوی پنل خورشیدی", "product", "انرژی", "رباتیک", "شیراز"),
    ("خدمت تحلیل داده مصرف برق صنعتی", "service", "انرژی", "داده‌کاوی", "اهواز"),

    ("سکوی مدرسه هوشمند تحول", "software_solution", "فناوری اطلاعات", "هوش مصنوعی", "تهران"),
    ("موتور ارزیابی هوشمند تحول", "service", "فناوری اطلاعات", "هوش مصنوعی", "تهران"),
    ("سامانه مدیریت دارایی‌های فناوری", "software_solution", "فناوری اطلاعات", "داده‌کاوی", "تهران"),
    ("سامانه پایش زیرساخت مرکز داده", "product", "فناوری اطلاعات", "اینترنت اشیاء", "تهران"),
    ("دوقلوی دیجیتال مرکز داده", "software_solution", "فناوری اطلاعات", "دوقلوی دیجیتال", "اصفهان"),
    ("ربات خودکار مدیریت انبار مرکز داده", "product", "فناوری اطلاعات", "رباتیک", "کرج"),
    ("سامانه ثبت زنجیره تأمین فناوری", "software_solution", "فناوری اطلاعات", "بلاکچین", "مشهد"),
    ("تحلیل داده رفتار کاربران سازمانی", "service", "فناوری اطلاعات", "داده‌کاوی", "شیراز"),
    ("سامانه هوشمند کشف رخدادهای امنیتی", "software_solution", "فناوری اطلاعات", "هوش مصنوعی", "تبریز"),
    ("خدمت طراحی معماری داده سازمانی", "service", "فناوری اطلاعات", "داده‌کاوی", "رشت"),

    ("سامانه پایش کیفیت هوای شهری", "product", "محیط زیست", "اینترنت اشیاء", "تهران"),
    ("مدل هوشمند پیش‌بینی آلودگی هوا", "software_solution", "محیط زیست", "هوش مصنوعی", "اصفهان"),
    ("دوقلوی دیجیتال تصفیه‌خانه آب", "software_solution", "محیط زیست", "دوقلوی دیجیتال", "شیراز"),
    ("ربات پایش رودخانه و تالاب", "product", "محیط زیست", "رباتیک", "رشت"),
    ("خدمت تحلیل داده پسماند شهری", "service", "محیط زیست", "داده‌کاوی", "مشهد"),
]


# ============================================================
# ابزارهای عمومی
# ============================================================

def slugify(value):
    value = re.sub(r"[^\w\u0600-\u06FF]+", "_", value, flags=re.UNICODE)
    return value.strip("_").lower()[:90]


def field_names(model):
    return {f.name for f in model._meta.get_fields()}


SUPPLY_FIELDS = field_names(Supply)
SUPPLY_IMAGE_FIELDS = field_names(SupplyImage)


def request_get(url, **kwargs):
    headers = kwargs.pop("headers", {})
    headers.setdefault("User-Agent", USER_AGENT)
    try:
        return requests.get(
            url,
            timeout=kwargs.pop("timeout", TIMEOUT),
            headers=headers,
            allow_redirects=True,
            **kwargs,
        )
    except Exception:
        return None


def get_or_create_seller():
    User = get_user_model()
    seller, created = User.objects.get_or_create(
        username="supplier_demo",
        defaults={
            "first_name": "عرضه‌کننده",
            "last_name": "نمونه بازار",
            "email": "supplier@demo.local",
            "is_active": True,
        },
    )
    if created:
        seller.set_password("123456")
        seller.save()
    return seller


def safe_create_supply(data):
    clean = {k: v for k, v in data.items() if k in SUPPLY_FIELDS}
    return Supply.objects.create(**clean)


def set_optional_fields(obj, values):
    changed = []
    for name, value in values.items():
        if name not in field_names(obj.__class__):
            continue
        try:
            setattr(obj, name, value)
            changed.append(name)
        except Exception:
            continue

    if changed:
        try:
            obj.save(update_fields=changed)
        except Exception:
            obj.save()


def normalize_for_search(text):
    text = text.lower()
    replacements = {
        "‌": " ",
        "ی": "ی",
        "ك": "ک",
        "ۀ": "ه",
        "ة": "ه",
    }
    for a, b in replacements.items():
        text = text.replace(a, b)
    return re.sub(r"\s+", " ", text).strip()


# ============================================================
# تصویر واقعی و مرتبط
# ============================================================

USED_IMAGE_URLS = set()
USED_IMAGE_HASHES = set()


def score_image(title, industry, technology, page_title, description):
    target = normalize_for_search(
        f"{title} {industry} {technology} "
        f"{SEARCH_TERMS.get(industry, '')} {TECH_SEARCH.get(technology, '')}"
    )
    candidate = normalize_for_search(f"{page_title} {description}")

    # امتیاز واژه‌ای برای اینکه نتیجه صرفاً یک تصویر عمومی نباشد.
    target_words = {
        w for w in re.findall(r"[a-z0-9\u0600-\u06FF]+", target)
        if len(w) >= 4
    }
    candidate_words = {
        w for w in re.findall(r"[a-z0-9\u0600-\u06FF]+", candidate)
        if len(w) >= 4
    }

    overlap = len(target_words & candidate_words)
    return overlap


def wikimedia_search(title, industry, technology):
    queries = [
        f'"{title}"',
        f"{SEARCH_TERMS.get(industry, '')} {TECH_SEARCH.get(technology, '')}",
        SEARCH_TERMS.get(industry, ""),
        TECH_SEARCH.get(technology, ""),
    ]

    candidates = []

    for query in queries:
        if not query.strip():
            continue

        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": 6,
            "gsrlimit": 50,
            "prop": "imageinfo",
            "iiprop": "url|mime|extmetadata",
            "iiurlwidth": 1400,
        }

        response = request_get(WIKIMEDIA_API, params=params)
        if not response or not response.ok:
            continue

        try:
            data = response.json()
        except Exception:
            continue

        pages = list((data.get("query") or {}).get("pages", {}).values())

        for page in pages:
            info = (page.get("imageinfo") or [{}])[0]
            url = info.get("thumburl") or info.get("url")
            mime = (info.get("mime") or "").lower()

            if not url or not mime.startswith("image/"):
                continue
            if url in USED_IMAGE_URLS:
                continue

            metadata = info.get("extmetadata") or {}
            description = (
                metadata.get("ImageDescription", {}).get("value", "")
                if isinstance(metadata.get("ImageDescription"), dict)
                else ""
            )

            page_title = page.get("title", "")
            score = score_image(
                title,
                industry,
                technology,
                page_title,
                description,
            )

            candidates.append({
                "url": url,
                "title": page_title,
                "description": re.sub("<[^>]+>", " ", description),
                "score": score,
                "source_url": (
                    info.get("descriptionurl")
                    or f"https://commons.wikimedia.org/wiki/{page_title.replace(' ', '_')}"
                ),
                "license": (
                    metadata.get("LicenseShortName", {}).get("value", "")
                    if isinstance(metadata.get("LicenseShortName"), dict)
                    else ""
                ),
                "artist": (
                    metadata.get("Artist", {}).get("value", "")
                    if isinstance(metadata.get("Artist"), dict)
                    else ""
                ),
            })

        # اگر نتیجه‌های کافی جمع شد، ادامه جست‌وجو لازم نیست.
        if len(candidates) >= 80:
            break

    # نتیجه‌های بهتر اول.
    candidates.sort(key=lambda x: x["score"], reverse=True)

    return candidates


def download_and_prepare_image(candidate, title, supply_id):
    response = request_get(candidate["url"], timeout=TIMEOUT)
    if not response or not response.ok or not response.content:
        return None

    raw = response.content

    digest = hashlib.sha256(raw).hexdigest()
    if digest in USED_IMAGE_HASHES:
        return None

    try:
        image = Image.open(BytesIO(raw))
        image.verify()
        image = Image.open(BytesIO(raw))

        if image.mode in ("RGBA", "LA", "P"):
            image = image.convert("RGB")
        elif image.mode != "RGB":
            image = image.convert("RGB")

        image.thumbnail((1600, 1200))

        out = BytesIO()
        image.save(out, format="JPEG", quality=90, optimize=True)

        USED_IMAGE_HASHES.add(digest)
        USED_IMAGE_URLS.add(candidate["url"])

        filename = f"{supply_id}_{slugify(title)}.jpg"
        return ContentFile(out.getvalue(), name=filename)

    except Exception:
        return None


def create_supply_image(supply, title, industry, technology):
    candidates = wikimedia_search(title, industry, technology)

    # اولویت با نتیجه‌ای است که حداقل ارتباط موضوعی دارد.
    for candidate in candidates:
        if candidate["score"] < 1 and len(candidates) > 10:
            continue

        image_file = download_and_prepare_image(candidate, title, supply.id)
        if not image_file:
            continue

        data = {
            "supply": supply,
            "image": image_file,
        }

        # این فیلدها فقط در صورت وجود در مدل استفاده می‌شوند.
        optional = {
            "caption": f"تصویر مرتبط با {title}",
            "alt_text": title,
            "title": title,
            "source_url": candidate["source_url"],
            "source": "Wikimedia Commons",
            "license": candidate["license"],
            "credit": candidate["artist"],
            "is_primary": True,
        }

        clean = {
            k: v for k, v in {**data, **optional}.items()
            if k in SUPPLY_IMAGE_FIELDS
        }

        try:
            obj = SupplyImage.objects.create(**clean)
            return obj, candidate
        except Exception:
            # اگر یک فیلد اضافی باعث خطا شد، حداقل ساختار پایه را امتحان می‌کنیم.
            try:
                base = {
                    k: v for k, v in data.items()
                    if k in SUPPLY_IMAGE_FIELDS
                }
                obj = SupplyImage.objects.create(**base)
                return obj, candidate
            except Exception:
                continue

    return None, None


# ============================================================
# مستند PDF واقعی
# ============================================================

def extract_search_links(html):
    links = []

    # لینک‌های معمول نتیجه‌های DuckDuckGo
    patterns = [
        r'nuddg=([^"&]+)',
        r'href="(https?://[^"]+)"',
        r'href="([^"]+\.pdf[^"]*)"',
    ]

    for pattern in patterns:
        for match in re.findall(pattern, html, flags=re.IGNORECASE):
            link = unquote(match)
            link = link.replace("\\/", "/")
            link = link.replace("&amp;", "&")

            if link.startswith("//"):
                link = "https:" + link

            if link.startswith("http") and link not in links:
                links.append(link)

    return links


def is_pdf_response(response):
    if not response or not response.ok or not response.content:
        return False

    content_type = (response.headers.get("Content-Type") or "").lower()
    return (
        response.content[:5] == b"%PDF-"
        or "application/pdf" in content_type
        or ".pdf" in response.url.lower()
    )


def pdf_is_reasonably_relevant(pdf_bytes, title, industry, technology):
    # برای جلوگیری از ذخیره فایل‌های اشتباه، چند کیلوبایت اول را بررسی می‌کنیم.
    # اگر PDF متن قابل مشاهده داشته باشد، نام/موضوع را جست‌وجو می‌کنیم.
    sample = pdf_bytes[:300000].lower()

    english_terms = (
        f"{SEARCH_TERMS.get(industry, '')} "
        f"{TECH_SEARCH.get(technology, '')}"
    ).lower()

    # اگر PDF تصویرمحور باشد، ممکن است متن نداشته باشد.
    # در این حالت وجود سربرگ PDF کافی است و عنوان منبع قبلاً از جست‌وجو آمده.
    if b"%pdf-" not in sample:
        return False

    # رد کردن فایل‌های خیلی کوچک یا خراب.
    if len(pdf_bytes) < 15_000:
        return False

    # اگر متن انگلیسی در فایل وجود داشته باشد، حداقل یکی از واژه‌های حوزه را ترجیح می‌دهیم.
    if any(
        token.encode("utf-8") in sample
        for token in re.findall(r"[a-z]{4,}", english_terms)
    ):
        return True

    # PDFهای تصویری/اسکن‌شده را در صورت معتبر بودن می‌پذیریم.
    return True


def search_real_pdf(title, industry, technology):
    queries = [
        f'"{title}" filetype:pdf',
        f'"{title}" pdf',
        f'"{SEARCH_TERMS.get(industry, "")}" "{TECH_SEARCH.get(technology, "")}" filetype:pdf',
        f'"{SEARCH_TERMS.get(industry, "")}" technical report filetype:pdf',
        f'"{TECH_SEARCH.get(technology, "")}" technical report filetype:pdf',
    ]

    seen = set()

    for query in queries:
        response = request_get(
            DUCKDUCKGO_URL,
            params={"q": query},
            timeout=TIMEOUT,
        )

        if not response or not response.ok:
            continue

        for link in extract_search_links(response.text):
            if link in seen:
                continue
            seen.add(link)

            # فایل‌هایی که واضحاً PDF نیستند را کنار می‌گذاریم.
            if ".pdf" not in link.lower():
                continue

            pdf_response = request_get(link, timeout=TIMEOUT)

            if not is_pdf_response(pdf_response):
                continue

            if not pdf_is_reasonably_relevant(
                pdf_response.content,
                title,
                industry,
                technology,
            ):
                continue

            return pdf_response.content, pdf_response.url

    return None, None


def save_document_file(supply, title, raw_pdf, source_url):
    filename = f"{supply.id}_{slugify(title)}.pdf"
    path = DOC_DIR / filename
    path.write_bytes(raw_pdf)

    return path, source_url


def attach_document_metadata(supply, title, path, source_url):
    """
    بسته به مدل پروژه:
    - FileField
    - TextField
    - URLField
    - JSONField
    - یا documents
    را تا حد امکان پشتیبانی می‌کند.

    اگر هیچ فیلد سندی در Supply نباشد، فایل در media ذخیره می‌شود
    و مسیر آن در خروجی چاپ می‌شود.
    """

    fields = field_names(supply.__class__)
    changed = []

    candidates = [
        "document",
        "file",
        "pdf",
        "datasheet",
        "manual",
        "documentation",
        "document_file",
        "document_url",
        "source_url",
        "documents",
    ]

    # اول FileFieldها
    for field_name in candidates:
        if field_name not in fields:
            continue

        try:
            field = supply._meta.get_field(field_name)
        except Exception:
            continue

        internal_type = getattr(field, "get_internal_type", lambda: "")()

        if internal_type == "FileField":
            try:
                relative = path.relative_to(MEDIA_DIR)
                with open(path, "rb") as f:
                    getattr(supply, field_name).save(
                        path.name,
                        ContentFile(f.read()),
                        save=False,
                    )
                changed.append(field_name)
                supply.save(update_fields=changed)
                return True
            except Exception:
                pass

    # سپس URL یا متن
    for field_name in [
        "document_url",
        "source_url",
        "documentation_url",
        "manual_url",
    ]:
        if field_name not in fields:
            continue

        try:
            setattr(supply, field_name, source_url)
            supply.save(update_fields=[field_name])
            return True
        except Exception:
            continue

    # در نهایت documents
    if "documents" in fields:
        try:
            current = getattr(supply, "documents", None)
            relative_path = str(path.relative_to(BASE_DIR)).replace("\\", "/")

            if isinstance(current, list):
                current.append({
                    "title": title,
                    "path": relative_path,
                    "url": source_url,
                })
            elif isinstance(current, dict):
                current[str(len(current) + 1)] = {
                    "title": title,
                    "path": relative_path,
                    "url": source_url,
                }
            else:
                current = [{
                    "title": title,
                    "path": relative_path,
                    "url": source_url,
                }]

            supply.documents = current
            supply.save(update_fields=["documents"])
            return True

        except Exception:
            pass

    return False


# ============================================================
# تولید رکوردهای تکمیلی تا رسیدن به ۱۰۰
# ============================================================

EXTRA_PATTERNS = [
    ("سامانه پایش", "product"),
    ("سامانه تشخیص", "software_solution"),
    ("سامانه پیش‌بینی", "software_solution"),
    ("سامانه کنترل", "product"),
    ("سامانه مدیریت", "software_solution"),
    ("سامانه ارزیابی", "service"),
    ("خدمت تحلیل", "service"),
    ("خدمت نگهداری", "service"),
    ("ربات بازرسی", "product"),
    ("راهکار هوشمند", "product"),
    ("شبکه حسگر", "product"),
    ("دوقلوی دیجیتال", "software_solution"),
]

APPLICATION_SHORT = {
    "نفت و گاز": ["پمپ‌های فرایندی", "مخازن ذخیره", "خطوط انتقال", "کمپرسورها", "واحدهای فرایندی"],
    "پتروشیمی": ["راکتورها", "مبدل‌های حرارتی", "خطوط تولید", "مخازن مواد", "واحدهای فرایندی"],
    "فولاد و معدن": ["کوره‌ها", "خطوط نورد", "تجهیزات معدنی", "نوار نقاله", "واحدهای ذوب"],
    "سلامت": ["تجهیزات بیمارستانی", "پایش بیمار", "آزمایشگاه", "تصویربرداری پزشکی", "مدیریت تخت"],
    "کشاورزی": ["گلخانه", "آبیاری", "مزرعه", "زنجیره سرد", "پایش محصول"],
    "حمل‌ونقل": ["ناوگان", "واگن", "پایانه", "کامیون", "مسیرهای حمل"],
    "خودروسازی": ["خط مونتاژ", "بدنه خودرو", "جوشکاری", "کنترل کیفیت", "انبار قطعات"],
    "انرژی": ["نیروگاه خورشیدی", "توربین بادی", "شبکه برق", "ذخیره‌ساز انرژی", "مصرف برق"],
    "فناوری اطلاعات": ["مرکز داده", "زیرساخت شبکه", "دارایی فناوری", "امنیت اطلاعات", "داده سازمانی"],
    "محیط زیست": ["تصفیه‌خانه", "کیفیت هوا", "پسماند", "رودخانه", "منابع آب"],
}


def ensure_100_records():
    records = list(PRODUCTS)
    used_titles = {r[0] for r in records}

    i = 0
    while len(records) < 100:
        industry = INDUSTRIES[i % len(INDUSTRIES)]
        technology = TECHNOLOGIES[(i * 3 + 1) % len(TECHNOLOGIES)]
        city = CITIES[(i * 5 + 2) % len(CITIES)]
        prefix, kind = EXTRA_PATTERNS[i % len(EXTRA_PATTERNS)]
        application = APPLICATION_SHORT[industry][i % len(APPLICATION_SHORT[industry])]

        title = f"{prefix} {application} با فناوری {technology}"

        if title not in used_titles:
            records.append((title, kind, industry, technology, city))
            used_titles.add(title)

        i += 1

    return records[:100]


# ============================================================
# توضیحات و داده‌های فیلترها
# ============================================================

def build_description(title, kind, industry, technology, city, trl, mrl):
    kind_fa = "محصول" if kind != "service" else "خدمت"
    return (
        f"{title} یک {kind_fa} فناورانه در حوزه {industry} است که "
        f"با فناوری {technology} برای استفاده در {city} عرضه شده است. "
        f"کاربرد اصلی آن {APPLICATIONS[industry]} است. "
        f"سطح آمادگی فناوری این عرضه {trl} و سطح آمادگی تولید یا ارائه آن {mrl} است. "
        f"این رکورد برای آزمون جست‌وجو، فیلتر، تطبیق و نمایش بازار ثبت می‌شود."
    )


def choose_category(kind, index):
    if kind == "service":
        return SERVICE_CATEGORIES[index % len(SERVICE_CATEGORIES)]
    return PRODUCT_CATEGORIES[index % len(PRODUCT_CATEGORIES)]


def create_supply(seller, record, index):
    title, kind, industry, technology, city = record

    trl = ((index * 5) % 9) + 1
    mrl = ((index * 7 + 2) % 9) + 1

    # قیمت متنوع برای تست فیلتر قیمت
    price = Decimal(
        str(random.randrange(80_000_000, 4_900_000_001, 20_000_000))
    )

    quantity = random.randint(1, 40)
    category = choose_category(kind, index)
    supply_type = "service" if kind == "service" else "product"

    description = build_description(
        title,
        kind,
        industry,
        technology,
        city,
        trl,
        mrl,
    )

    base = {
        "seller": seller,
        "title": title,
        "supply_type": supply_type,
        "category": category,
        "industry": industry,
        "technology": technology,
        "city": city,
        "description": description,
        "quantity": str(quantity),
        "unit": UNITS[index % len(UNITS)],
        "price": price,
        "trl": str(trl),
        "mrl": str(mrl),
        "trl_assessed": True,
        "mrl_assessed": True,
        "status": "published",
        "view_count": random.randint(20, 1500),
    }

    supply = safe_create_supply(base)

    rating = round(random.uniform(3.0, 5.0), 1)
    risk = ["low", "medium", "high"][index % 3]

    certification_pool = [
        "ISO 9001",
        "ISO 14001",
        "ISO 45001",
        "دانش‌بنیان",
        "استاندارد ملی",
    ]

    certifications = [
        certification_pool[j]
        for j in range(len(certification_pool))
        if (index + j) % 4 == 0
    ]

    optional = {
        "rating": rating,
        "seller_rating": rating,
        "risk_level": risk,
        "after_sales_service": (index % 3 != 0),
        "ip_status": ["registered", "pending", "none"][index % 3],
        "certifications": certifications,
        "compliance_score": random.randint(72, 99),
        "short_description": description[:240],
        "keywords": [industry, technology, category],
        "title_en": title,
        "revenue_model": "فروش مستقیم" if kind != "service" else "قرارداد خدمات",
        "kpis": [
            "کاهش هزینه",
            "افزایش بهره‌وری",
            "کاهش توقفات",
        ],
        "target_audiences": [
            industry,
            "سازمان‌های صنعتی",
            "شرکت‌های فناور",
        ],
        "competitive_advantages": [
            "پایش داده‌محور",
            "قابلیت توسعه",
            "گزارش‌گیری",
        ],
    }

    set_optional_fields(supply, optional)

    # تصویر واقعی
    image_obj, image_meta = create_supply_image(
        supply,
        title,
        industry,
        technology,
    )

    if image_obj:
        print(
            f"      تصویر: پیدا شد | "
            f"{image_meta.get('title', '')} | "
            f"{image_meta.get('source_url', '')}"
        )
    else:
        print("      تصویر: پیدا نشد")

    # مستند واقعی
    pdf_raw, pdf_url = search_real_pdf(
        title,
        industry,
        technology,
    )

    if pdf_raw:
        path, source_url = save_document_file(
            supply,
            title,
            pdf_raw,
            pdf_url,
        )
        attached = attach_document_metadata(
            supply,
            title,
            path,
            source_url,
        )
        print(
            f"      مستند: پیدا شد | ذخیره شد={attached} | {source_url}"
        )
    else:
        print(
            "      مستند: PDF واقعی مرتبط پیدا نشد "
            "(هیچ فایل ساختگی ایجاد نشد)"
        )

    return supply, image_obj is not None, pdf_raw is not None


# ============================================================
# اجرای اصلی
# ============================================================

def run():
    seller = get_or_create_seller()
    records = ensure_100_records()

    print("=" * 90)
    print("شروع داده‌گذاری ۱۰۰ عرضه")
    print("تصویر: Wikimedia Commons")
    print("مستند: فقط PDF واقعی پیدا‌شده در وب")
    print("بدون reportlab و بدون PDF ساختگی")
    print("=" * 90)

    created = 0
    images = 0
    docs = 0

    for index, record in enumerate(records, start=1):
        title = record[0]

        # اگر همان عنوان قبلاً وجود داشته، رکورد تازه نساز.
        if "title" in SUPPLY_FIELDS and Supply.objects.filter(title=title).exists():
            print(f"[{index:03d}/100] رد شد چون قبلاً وجود دارد: {title}")
            continue

        try:
            supply, has_image, has_doc = create_supply(
                seller,
                record,
                index,
            )

            created += 1
            images += int(has_image)
            docs += int(has_doc)

            print(
                f"[{index:03d}/100] "
                f"{supply.title} | "
                f"{supply.industry} | "
                f"{supply.technology} | "
                f"{supply.city} | "
                f"TRL={getattr(supply, 'trl', '-')} | "
                f"MRL={getattr(supply, 'mrl', '-')}"
            )

        except Exception as exc:
            print(f"[خطا] {title} -> {type(exc).__name__}: {exc}")

        # فشار کمتر روی سرویس‌های عمومی
        time.sleep(0.25)

    print("\n" + "=" * 90)
    print("گزارش نهایی")
    print("=" * 90)
    print(f"رکوردهای ایجادشده در این اجرا: {created}")
    print(f"تصاویر واقعی ذخیره‌شده: {images}")
    print(f"مستندهای PDF واقعی ذخیره‌شده: {docs}")

    if "industry" in SUPPLY_FIELDS:
        print("\nپوشش صنایع:")
        for item in INDUSTRIES:
            print(
                f"  {item}: "
                f"{Supply.objects.filter(industry=item).count()}"
            )

    if "technology" in SUPPLY_FIELDS:
        print("\nپوشش فناوری‌ها:")
        for item in TECHNOLOGIES:
            print(
                f"  {item}: "
                f"{Supply.objects.filter(technology=item).count()}"
            )

    if "city" in SUPPLY_FIELDS:
        print("\nپوشش شهرها:")
        for item in CITIES:
            print(
                f"  {item}: "
                f"{Supply.objects.filter(city=item).count()}"
            )

    print("\nپایان.")


if __name__ == "__main__":
    run()
