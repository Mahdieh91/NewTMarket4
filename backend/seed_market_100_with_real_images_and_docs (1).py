
# ============================================================
# تولید ۱۰۰ عرضه واقعی/قابل‌نمایش برای بازار تحول
# ============================================================
# این فایل را از ریشه پروژه Django اجرا کنید:
#     python seed_market_100.py
#
# ویژگی‌ها:
# - ۱۰۰ محصول/خدمت متفاوت و تخصصی
# - پوشش همه صنایع صفحه بازار
# - پوشش همه فناوری‌های صفحه بازار
# - پوشش همه شهرهای صفحه بازار
# - TRL و MRL از ۱ تا ۹
# - محصول و خدمت
# - دسته‌بندی‌های متنوع
# - قیمت، مقدار و واحد
# - تصویر مرتبط و یکتا برای هر عرضه
# - گواهی، امتیاز، ریسک و خدمات پس از فروش در صورت وجود فیلد در مدل
# - فایل PDF مرتبط برای هر عرضه در نسخه مستندات
#
# نکته مهم:
# تصاویر از جست‌وجوی عمومی ویکی‌مدیا دریافت می‌شوند تا تصویر با عنوان/حوزه
# مرتبط باشد و برای هر عرضه دوباره استفاده نشود.
# فایل‌های PDF در نسخه مستندات ابتدا از منابع عمومی معتبر جست‌وجو و دریافت می‌شوند.
# اگر برای یک مورد PDF مناسب پیدا نشود، یک برگه مشخصات آزمایشی تولید می‌شود
# و نباید آن را «مستند رسمی شرکت» تلقی کرد.
# ============================================================

import os
import re
import time
import random
import hashlib
from decimal import Decimal
from io import BytesIO
from pathlib import Path

import django
import requests
from PIL import Image
from django.core.files.base import ContentFile

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from products.models import Supply, SupplyImage

User = get_user_model()

API_TIMEOUT = 25
WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"
SEARCH_URL = "https://html.duckduckgo.com/html/"
DOWNLOAD_DIR = Path("media/market_seed_docs")
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

INDUSTRIES = [
    "نفت و گاز", "پتروشیمی", "فولاد و معدن", "سلامت", "کشاورزی",
    "حمل‌ونقل", "خودروسازی", "انرژی", "فناوری اطلاعات", "محیط زیست"
]

TECHNOLOGIES = [
    "هوش مصنوعی", "اینترنت اشیاء", "دوقلوی دیجیتال",
    "رباتیک", "بلاکچین", "داده‌کاوی"
]

CITIES = [
    "تهران", "اصفهان", "شیراز", "تبریز", "مشهد",
    "یزد", "کرج", "اهواز", "رشت", "کرمان"
]

PRODUCT_CATEGORIES = [
    "تجهیزات صنعتی", "نرم‌افزار", "سخت‌افزار", "راهکار یکپارچه",
    "ماشین‌آلات", "سیستم کنترل", "سنسور", "دستگاه پزشکی",
    "پنل خورشیدی", "باتری", "رباتیک"
]

SERVICE_CATEGORIES = [
    "مشاوره", "آموزش", "ارزیابی", "طراحی",
    "پیاده‌سازی", "نگهداری", "تحلیل داده", "مدیریت پروژه"
]

UNITS = [
    "عدد", "دستگاه", "کیلوگرم", "تن", "لیتر",
    "متر مکعب", "کیلووات ساعت", "مگابایت", "گیگابایت",
    "نفر-ساعت", "ماه", "پروژه", "ارزیابی"
]

# ۱۰۰ مورد واقعی‌نما و مشخص، نه عناوین عمومی تکراری.
# هر رکورد عنوان مشخص، کاربرد، صنعت، فناوری، شهر و نوع عرضه دارد.
PRODUCTS = [
    ("سامانه پایش هوشمند خوردگی خطوط لوله", "product", "نفت و گاز", "اینترنت اشیاء", "تهران"),
    ("دوقلوی دیجیتال واحد تقطیر پالایشگاه", "software_solution", "نفت و گاز", "دوقلوی دیجیتال", "اهواز"),
    ("سامانه تشخیص نشتی گاز با بینایی ماشین", "product", "نفت و گاز", "هوش مصنوعی", "عسلویه"),
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

# برای رسیدن دقیق به ۱۰۰ مورد، ترکیب‌های تخصصی تکمیلی ساخته می‌شوند.
EXTRA_TEMPLATES = [
    ("سامانه هوشمند", "product"),
    ("راهکار پایش", "product"),
    ("خدمت ارزیابی", "service"),
    ("سامانه تحلیل", "software_solution"),
    ("راهکار کنترل", "product"),
    ("خدمت پیاده‌سازی", "service"),
    ("سامانه پیش‌بینی", "software_solution"),
    ("راهکار نگهداری", "service"),
]

APPLICATIONS = {
    "نفت و گاز": "پایش تجهیزات، کاهش توقفات، ایمنی فرایند و نگهداری پیش‌بینانه",
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

def slugify(value):
    value = re.sub(r"[^\w\u0600-\u06FF]+", "_", value, flags=re.UNICODE)
    return value.strip("_").lower()

def get_or_create_seller():
    seller, created = User.objects.get_or_create(
        username="supplier_demo",
        defaults={
            "first_name": "عرضه‌کننده",
            "last_name": "نمونه بازار",
            "email": "supplier@demo.com",
            "is_active": True,
        },
    )
    if created:
        seller.set_password("123456")
        seller.save()
    return seller

def existing_field_names():
    return {f.name for f in Supply._meta.get_fields()}

SUPPLY_FIELDS = existing_field_names()

def safe_supply_create(**data):
    clean = {k: v for k, v in data.items() if k in SUPPLY_FIELDS}
    return Supply.objects.create(**clean)

def set_optional_fields(supply, values):
    changed = []
    for field, value in values.items():
        if field in SUPPLY_FIELDS:
            setattr(supply, field, value)
            changed.append(field)
    if changed:
        supply.save(update_fields=changed)

def download_binary(url):
    try:
        r = requests.get(
            url,
            timeout=API_TIMEOUT,
            headers={"User-Agent": "TMarket-Demo-Seed/1.0"},
        )
        if r.ok and r.content:
            return r.content, r.headers.get("content-type", "")
    except Exception:
        pass
    return None, ""

IMAGE_CACHE = {}
USED_IMAGE_URLS = set()

def wikimedia_image(query):
    # چند جست‌وجوی دقیق‌تر تا عکس واقعاً با موضوع ارتباط داشته باشد.
    queries = [
        query,
        query.replace("سامانه", "").strip(),
        query.split(" ")[-1],
    ]
    for q in queries:
        try:
            params = {
                "action": "query",
                "format": "json",
                "generator": "search",
                "gsrsearch": q,
                "gsrnamespace": 6,
                "gsrlimit": 20,
                "prop": "imageinfo",
                "iiprop": "url|mime",
                "iiurlwidth": 1000,
            }
            r = requests.get(
                WIKIMEDIA_API,
                params=params,
                timeout=API_TIMEOUT,
                headers={"User-Agent": "TMarket-Demo-Seed/1.0"},
            )
            data = r.json()
            pages = list(data.get("query", {}).get("pages", {}).values())
            random.shuffle(pages)
            for page in pages:
                info = (page.get("imageinfo") or [{}])[0]
                url = info.get("thumburl") or info.get("url")
                mime = info.get("mime", "")
                if url and mime.startswith("image/") and url not in USED_IMAGE_URLS:
                    USED_IMAGE_URLS.add(url)
                    return url
        except Exception:
            continue
    return None

def download_image_for_supply(title, supply_id):
    url = wikimedia_image(title)
    if not url:
        return None

    raw, _ = download_binary(url)
    if not raw:
        return None

    try:
        img = Image.open(BytesIO(raw))
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGB")
        img.thumbnail((1400, 1000))
        out = BytesIO()
        img.save(out, format="JPEG", quality=88)
        return ContentFile(out.getvalue(), name=f"{supply_id}_{slugify(title)[:60]}.jpg")
    except Exception:
        return None

def search_real_pdf(query):
    # تلاش برای سند PDF عمومی و مرتبط.
    # این بخش سند را «رسمی» فرض نمی‌کند، فقط PDF عمومی مرتبط پیدا می‌کند.
    queries = [
        f'"{query}" filetype:pdf',
        f'"{query}" technical report pdf',
        f'"{query}" manual pdf',
    ]
    for q in queries:
        try:
            r = requests.get(
                SEARCH_URL,
                params={"q": q},
                timeout=API_TIMEOUT,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            if not r.ok:
                continue

            links = re.findall(r'nuddg=(https?[^&"]+)', r.text)
            for link in links[:15]:
                link = link.replace("%3A", ":").replace("%2F", "/")
                if ".pdf" not in link.lower():
                    continue
                raw, ctype = download_binary(link)
                if raw and (b"%PDF" in raw[:20] or "pdf" in ctype.lower()):
                    return raw, link
        except Exception:
            continue
    return None, None

def create_demo_datasheet_pdf(title, industry, technology, city, trl, mrl, kind):
    # فقط جایگزین زمانی که PDF عمومی مناسب پیدا نشود.
    # این فایل «برگه مشخصات آزمایشی» است و سند رسمی تولیدکننده نیست.
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_RIGHT
    from reportlab.lib import colors

    out = BytesIO()
    doc = SimpleDocTemplate(out, pagesize=A4, rightMargin=45, leftMargin=45, topMargin=45, bottomMargin=45)
    styles = getSampleStyleSheet()
    style = ParagraphStyle(
        "fa",
        parent=styles["Normal"],
        fontName="Helvetica",
        alignment=TA_RIGHT,
        leading=18,
        fontSize=10,
    )

    story = [
        Paragraph("برگه مشخصات عرضه آزمایشی بازار تحول", styles["Title"]),
        Spacer(1, 15),
        Paragraph(f"عنوان: {title}", style),
        Paragraph(f"صنعت: {industry}", style),
        Paragraph(f"فناوری: {technology}", style),
        Paragraph(f"شهر عرضه‌کننده: {city}", style),
        Paragraph(f"نوع عرضه: {kind}", style),
        Paragraph(f"سطح آمادگی فناوری: TRL {trl}", style),
        Paragraph(f"سطح آمادگی تولید/ارائه: MRL {mrl}", style),
        Spacer(1, 12),
        Paragraph(f"کاربرد: {APPLICATIONS.get(industry, 'افزایش بهره‌وری و بهبود تصمیم‌گیری')}", style),
        Spacer(1, 12),
        Paragraph("این فایل برای داده‌گذاری و آزمون بازار تولید شده است و سند رسمی تولیدکننده محسوب نمی‌شود.", style),
    ]
    doc.build(story)
    return out.getvalue()

def attach_document(supply, title, industry, technology, city, trl, mrl, kind):
    raw, source = search_real_pdf(title)
    if not raw:
        raw = create_demo_datasheet_pdf(title, industry, technology, city, trl, mrl, kind)
        source = "generated-demo-datasheet"

    filename = f"{supply.id}_{slugify(title)[:70]}.pdf"
    path = DOWNLOAD_DIR / filename
    path.write_bytes(raw)

    # مدل‌های مختلف پروژه ممکن است documents را JSONField، فایل یا رشته داشته باشند.
    if "documents" in SUPPLY_FIELDS:
        try:
            current = getattr(supply, "documents", None)
            if isinstance(current, list):
                current.append(str(path))
                supply.documents = current
                supply.save(update_fields=["documents"])
            elif isinstance(current, dict):
                current[str(len(current) + 1)] = str(path)
                supply.documents = current
                supply.save(update_fields=["documents"])
            else:
                supply.documents = [str(path)]
                supply.save(update_fields=["documents"])
        except Exception:
            pass

    return path, source

def make_description(title, industry, technology, city, kind, trl, mrl):
    kind_fa = "محصول" if kind == "product" else "خدمت"
    return (
        f"{title} یک {kind_fa} فناورانه برای حوزه {industry} است که با فناوری {technology} "
        f"برای استفاده در {city} در نظر گرفته شده است. "
        f"کاربرد اصلی آن {APPLICATIONS.get(industry, 'افزایش بهره‌وری و کاهش هزینه‌ها')} است. "
        f"این عرضه با سطح آمادگی فناوری TRL {trl} و سطح آمادگی تولید/ارائه MRL {mrl} "
        f"برای نمایش و آزمون فیلترهای بازار ثبت می‌شود."
    )

def ensure_100_records():
    records = list(PRODUCTS)

    # ترکیب‌های تکمیلی را بدون تکرار عنوان اضافه می‌کنیم.
    idx = 0
    while len(records) < 100:
        industry = INDUSTRIES[idx % len(INDUSTRIES)]
        technology = TECHNOLOGIES[(idx * 2 + 1) % len(TECHNOLOGIES)]
        city = CITIES[(idx * 3 + 2) % len(CITIES)]
        prefix, kind = EXTRA_TEMPLATES[idx % len(EXTRA_TEMPLATES)]
        title = f"{prefix} {technology} برای {APPLICATIONS[industry].split('،')[0]} {industry}"
        if not any(r[0] == title for r in records):
            records.append((title, kind, industry, technology, city))
        idx += 1

    return records[:100]

def create_one(seller, record, index):
    title, kind, industry, technology, city = record

    trl = (index % 9) + 1
    mrl = ((index * 2) % 9) + 1

    category = (
        random.choice(PRODUCT_CATEGORIES)
        if kind != "service"
        else random.choice(SERVICE_CATEGORIES)
    )

    # قیمت را طوری نگه می‌داریم که فیلتر قیمت صفحه بازار بتواند نمونه‌های مختلف داشته باشد.
    price = random.randrange(80_000_000, 4_900_000_000, 10_000_000)

    quantity = random.randint(1, 50)
    unit = random.choice(UNITS)

    supply_type = "service" if kind == "service" else "product"
    description = make_description(
        title, industry, technology, city, supply_type, trl, mrl
    )

    supply = safe_supply_create(
        seller=seller,
        title=title,
        supply_type=supply_type,
        category=category,
        industry=industry,
        technology=technology,
        city=city,
        description=description,
        quantity=str(quantity),
        unit=unit,
        price=Decimal(str(price)),
        trl=str(trl),
        mrl=str(mrl),
        trl_assessed=True,
        mrl_assessed=True,
        status="published",
        view_count=random.randint(20, 900),
    )

    # فیلدهای اختیاری که اگر مدل داشته باشد، مقدار واقعی برای تست فیلتر می‌گیرند.
    rating = round(random.uniform(2.5, 5.0), 1)
    risk = random.choice(["low", "medium", "high"])
    certifications = random.sample(
        ["ISO 9001", "ISO 14001", "ISO 45001", "دانش‌بنیان", "استاندارد ملی"],
        k=random.randint(0, 2),
    )

    set_optional_fields(
        supply,
        {
            "rating": rating,
            "seller_rating": rating,
            "risk_level": risk,
            "after_sales_service": random.choice([True, False]),
            "ip_status": random.choice(["registered", "pending", "none"]),
            "certifications": certifications,
            "compliance_score": random.randint(70, 99),
            "short_description": description[:240],
        },
    )

    image_file = download_image_for_supply(title, supply.id)
    if image_file:
        SupplyImage.objects.create(
            supply=supply,
            image=image_file,
            caption=f"تصویر مرتبط با {title}",
            is_primary=True,
        )

    # مستند مرتبط: PDF عمومی واقعی در صورت یافتن، در غیر این صورت برگه آزمایشی
    pdf_path, pdf_source = attach_document(
        supply, title, industry, technology, city, trl, mrl, supply_type
    )
    print(f"      PDF: {pdf_source} -> {pdf_path}")

    return supply, trl, mrl

def run():
    seller = get_or_create_seller()
    records = ensure_100_records()

    print("=" * 80)
    print("شروع ایجاد ۱۰۰ عرضه")
    print("=" * 80)

    created = []
    for i, record in enumerate(records, start=1):
        try:
            supply, trl, mrl = create_one(seller, record, i)
            created.append(supply)
            print(
                f"[{i:03d}/100] {supply.title} | "
                f"{supply.industry} | {supply.technology} | {supply.city} | "
                f"TRL={trl} | MRL={mrl}"
            )
            time.sleep(0.15)
        except Exception as exc:
            print(f"[خطا] {record[0]} -> {exc}")

    print("\\n" + "=" * 80)
    print(f"تعداد ایجادشده: {len(created)}")
    print("پوشش صنایع:")
    for value in INDUSTRIES:
        print(f"  {value}: {Supply.objects.filter(industry=value).count()}")
    print("پوشش فناوری‌ها:")
    for value in TECHNOLOGIES:
        print(f"  {value}: {Supply.objects.filter(technology=value).count()}")
    print("پوشش شهرها:")
    for value in CITIES:
        print(f"  {value}: {Supply.objects.filter(city=value).count()}")
    print("پایان.")

if __name__ == "__main__":
    run()
