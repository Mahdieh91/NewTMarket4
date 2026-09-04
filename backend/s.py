# seed_contract.py
# ایجاد کاربران، نیازها و عرضه‌های غنی با تصاویر واقعی
# اصلاح شده برای سازگاری با IndustryCategory (ForeignKey)

import os
import random
import time
import re
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
from needs.models import Need

# ============================================================
# import IndustryCategory (مسیر صحیح را بررسی کنید)
# ============================================================
try:
    from industries.models import IndustryCategory
except ImportError:
    print("❌ مدل IndustryCategory یافت نشد. لطفاً مسیر صحیح را در import تنظیم کنید.")
    exit(1)

User = get_user_model()

# ============================================================
# تنظیمات
# ============================================================

API_TIMEOUT = 25
WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"
DOWNLOAD_DIR = Path("media/market_seed_images")
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================
# داده‌های واقعی‌نما (متنوع و کافی)
# ============================================================

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

# ۵۰ عنوان عرضه متنوع و واقعی‌نما
SUPPLY_TITLES = [
    # نفت و گاز
    ("سامانه پایش هوشمند خوردگی خطوط لوله", "product", "نفت و گاز", "اینترنت اشیاء"),
    ("دوقلوی دیجیتال پالایشگاه نفت", "software_solution", "نفت و گاز", "دوقلوی دیجیتال"),
    ("ربات بازرسی داخلی مخازن ذخیره", "product", "نفت و گاز", "رباتیک"),
    ("خدمت تحلیل پیش‌بینی خرابی پمپ‌های فرایندی", "service", "نفت و گاز", "داده‌کاوی"),
    ("سامانه تشخیص نشتی گاز با بینایی ماشین", "product", "نفت و گاز", "هوش مصنوعی"),
    
    # پتروشیمی
    ("سامانه کنترل هوشمند راکتور پتروشیمی", "product", "پتروشیمی", "هوش مصنوعی"),
    ("پایش آنلاین کیفیت خوراک پتروشیمی", "product", "پتروشیمی", "اینترنت اشیاء"),
    ("دوقلوی دیجیتال خط تولید پلیمر", "software_solution", "پتروشیمی", "دوقلوی دیجیتال"),
    ("ربات نمونه‌برداری ایمن مواد شیمیایی", "product", "پتروشیمی", "رباتیک"),
    ("تحلیل داده مصرف انرژی مجتمع پتروشیمی", "service", "پتروشیمی", "داده‌کاوی"),
    
    # فولاد و معدن
    ("سامانه تشخیص ترک سطحی ورق فولادی", "product", "فولاد و معدن", "هوش مصنوعی"),
    ("حسگر هوشمند ارتعاش کوره صنعتی", "product", "فولاد و معدن", "اینترنت اشیاء"),
    ("دوقلوی دیجیتال کوره قوس الکتریکی", "software_solution", "فولاد و معدن", "دوقلوی دیجیتال"),
    ("ربات بازرسی خطوط نورد", "product", "فولاد و معدن", "رباتیک"),
    ("سامانه تحلیل داده بهره‌وری معدن", "service", "فولاد و معدن", "داده‌کاوی"),
    
    # سلامت
    ("سامانه تریاژ هوشمند بیماران", "software_solution", "سلامت", "هوش مصنوعی"),
    ("پایش پوشیدنی علائم حیاتی", "product", "سلامت", "اینترنت اشیاء"),
    ("دوقلوی دیجیتال تجهیزات بیمارستانی", "software_solution", "سلامت", "دوقلوی دیجیتال"),
    ("ربات جابه‌جایی تجهیزات بیمارستان", "product", "سلامت", "رباتیک"),
    ("تحلیل داده ریسک بازگشت بیمار", "service", "سلامت", "داده‌کاوی"),
    
    # کشاورزی
    ("سامانه تشخیص آفت گیاه با تصویر", "software_solution", "کشاورزی", "هوش مصنوعی"),
    ("شبکه حسگر هوشمند گلخانه", "product", "کشاورزی", "اینترنت اشیاء"),
    ("دوقلوی دیجیتال گلخانه صنعتی", "software_solution", "کشاورزی", "دوقلوی دیجیتال"),
    ("ربات وجین خودکار مزارع", "product", "کشاورزی", "رباتیک"),
    ("خدمت تحلیل داده عملکرد مزرعه", "service", "کشاورزی", "داده‌کاوی"),
    
    # حمل‌ونقل
    ("سامانه پیش‌بینی خرابی ناوگان", "software_solution", "حمل‌ونقل", "هوش مصنوعی"),
    ("سامانه پایش لحظه‌ای کامیون‌ها", "product", "حمل‌ونقل", "اینترنت اشیاء"),
    ("دوقلوی دیجیتال پایانه حمل بار", "software_solution", "حمل‌ونقل", "دوقلوی دیجیتال"),
    ("ربات بازرسی خودکار واگن", "product", "حمل‌ونقل", "رباتیک"),
    ("خدمت تحلیل مسیر و مصرف سوخت ناوگان", "service", "حمل‌ونقل", "داده‌کاوی"),
    
    # خودروسازی
    ("سامانه کنترل کیفیت خط مونتاژ خودرو", "product", "خودروسازی", "هوش مصنوعی"),
    ("حسگر هوشمند پایش خط تولید خودرو", "product", "خودروسازی", "اینترنت اشیاء"),
    ("دوقلوی دیجیتال خط مونتاژ", "software_solution", "خودروسازی", "دوقلوی دیجیتال"),
    ("ربات جوشکاری تطبیقی بدنه خودرو", "product", "خودروسازی", "رباتیک"),
    ("تحلیل داده توقفات خط تولید خودرو", "service", "خودروسازی", "داده‌کاوی"),
    
    # انرژی
    ("سامانه پیش‌بینی تولید نیروگاه خورشیدی", "software_solution", "انرژی", "هوش مصنوعی"),
    ("سامانه پایش هوشمند پنل خورشیدی", "product", "انرژی", "اینترنت اشیاء"),
    ("دوقلوی دیجیتال توربین بادی", "software_solution", "انرژی", "دوقلوی دیجیتال"),
    ("ربات شست‌وشوی پنل خورشیدی", "product", "انرژی", "رباتیک"),
    ("خدمت تحلیل داده مصرف برق صنعتی", "service", "انرژی", "داده‌کاوی"),
    
    # فناوری اطلاعات
    ("سکوی مدرسه هوشمند تحول", "software_solution", "فناوری اطلاعات", "هوش مصنوعی"),
    ("موتور ارزیابی هوشمند تحول", "service", "فناوری اطلاعات", "هوش مصنوعی"),
    ("سامانه مدیریت دارایی‌های فناوری", "software_solution", "فناوری اطلاعات", "داده‌کاوی"),
    ("سامانه پایش زیرساخت مرکز داده", "product", "فناوری اطلاعات", "اینترنت اشیاء"),
    ("دوقلوی دیجیتال مرکز داده", "software_solution", "فناوری اطلاعات", "دوقلوی دیجیتال"),
    ("ربات خودکار مدیریت انبار مرکز داده", "product", "فناوری اطلاعات", "رباتیک"),
    ("سامانه ثبت زنجیره تأمین فناوری", "software_solution", "فناوری اطلاعات", "بلاکچین"),
    ("تحلیل داده رفتار کاربران سازمانی", "service", "فناوری اطلاعات", "داده‌کاوی"),
    
    # محیط زیست
    ("سامانه پایش کیفیت هوای شهری", "product", "محیط زیست", "اینترنت اشیاء"),
    ("مدل هوشمند پیش‌بینی آلودگی هوا", "software_solution", "محیط زیست", "هوش مصنوعی"),
    ("دوقلوی دیجیتال تصفیه‌خانه آب", "software_solution", "محیط زیست", "دوقلوی دیجیتال"),
    ("ربات پایش رودخانه و تالاب", "product", "محیط زیست", "رباتیک"),
    ("خدمت تحلیل داده پسماند شهری", "service", "محیط زیست", "داده‌کاوی"),
]

# نیازهای متنوع برای هر دو کاربر
NEED_TITLES = [
    "سیستم مدیریت انرژی هوشمند برای پتروشیمی",
    "راهکار پایش خوردگی خطوط لوله نفت",
    "سیستم کنترل کیفیت خودکار ورق فولادی",
    "پلتفرم تله‌مدیسین و پایش از راه دور بیماران",
    "سامانه آبیاری دقیق مبتنی بر اینترنت اشیاء",
    "سیستم پیش‌بینی خرابی ناوگان حمل‌ونقل",
    "راهکار مونتاژ رباتیک خودرو",
    "سیستم پایش تولید نیروگاه خورشیدی",
    "موتور تطبیق هوشمند نیازها و عرضه‌ها",
    "سامانه تحلیل داده آلودگی هوا و مدیریت محیط زیست",
    "سامانه یکپارچه مدیریت منابع سازمانی (ERP)",
    "سیستم مدیریت نگهداری و تعمیرات (نت) صنعتی",
    "سامانه هوشمند پایش انرژی",
    "پلتفرم همکاری تأمین‌کنندگان",
    "سیستم اتوماسیون اداری پیشرفته",
    "داشبورد مدیریت پروژه‌های نرم‌افزاری",
    "راهکار امنیت سایبری شبکه",
    "سامانه مدیریت دانش سازمانی",
    "پلتفرم اینترنت اشیاء صنعتی",
    "نرم‌افزار مدیریت منابع انسانی",
]

# ============================================================
# توابع کمکی
# ============================================================

def slugify(value):
    value = re.sub(r"[^\w\u0600-\u06FF]+", "_", value, flags=re.UNICODE)
    return value.strip("_").lower()

def get_or_create_industry(name):
    """دریافت یا ایجاد IndustryCategory بر اساس نام"""
    obj, created = IndustryCategory.objects.get_or_create(name=name)
    return obj

def get_or_create_user(username, first_name, last_name, role='buyer', company_name=''):
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'first_name': first_name,
            'last_name': last_name,
            'email': f'{username}@example.com',
            'role': role,
            'company_name': company_name or f'شرکت {first_name}',
            'approval_status': 'approved',
        }
    )
    if created:
        user.set_password('123456')
        user.save()
        print(f"✅ کاربر {username} ایجاد شد.")
    else:
        print(f"ℹ️ کاربر {username} از قبل وجود دارد.")
    return user

def download_image(query):
    """دریافت تصویر از ویکی‌مدیا بر اساس جست‌وجو"""
    try:
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": 6,
            "gsrlimit": 10,
            "prop": "imageinfo",
            "iiprop": "url|mime",
            "iiurlwidth": 1000,
        }
        r = requests.get(WIKIMEDIA_API, params=params, timeout=API_TIMEOUT,
                         headers={"User-Agent": "TMarket-Seed/1.0"})
        data = r.json()
        pages = list(data.get("query", {}).get("pages", {}).values())
        random.shuffle(pages)
        for page in pages:
            info = (page.get("imageinfo") or [{}])[0]
            url = info.get("thumburl") or info.get("url")
            mime = info.get("mime", "")
            if url and mime.startswith("image/"):
                img_resp = requests.get(url, timeout=API_TIMEOUT)
                if img_resp.ok:
                    img = Image.open(BytesIO(img_resp.content))
                    if img.mode in ("RGBA", "LA", "P"):
                        img = img.convert("RGB")
                    img.thumbnail((1200, 900))
                    out = BytesIO()
                    img.save(out, format="JPEG", quality=85)
                    return ContentFile(out.getvalue(), name=f"{slugify(query)}.jpg")
    except Exception as e:
        print(f"      ⚠️ خطا در دریافت تصویر برای '{query}': {e}")
    return None

def create_need(buyer, title, industry_name, status='published'):
    """ایجاد نیاز با دریافت شیء IndustryCategory"""
    industry_obj = get_or_create_industry(industry_name)
    need, created = Need.objects.get_or_create(
        buyer=buyer,
        title=title,
        defaults={
            'description': f"نیاز به {title} در حوزه {industry_name} برای بهبود بهره‌وری و کاهش هزینه‌ها.",
            'industry': industry_obj,   # ← شیء IndustryCategory
            'status': status,
        }
    )
    if created:
        print(f"   ✅ نیاز '{title[:40]}...' ایجاد شد.")
    return need

def create_supply(seller, title, supply_type, industry_name, technology, city, trl, mrl, price):
    """ایجاد عرضه با دریافت شیء IndustryCategory"""
    industry_obj = get_or_create_industry(industry_name)
    # انتخاب دسته‌بندی مناسب
    if supply_type in ('service', 'software_solution'):
        category = random.choice(["مشاوره", "آموزش", "طراحی", "پیاده‌سازی", "تحلیل داده"])
    else:
        category = random.choice(["تجهیزات صنعتی", "نرم‌افزار", "سخت‌افزار", "سنسور", "رباتیک"])
    
    quantity = random.randint(1, 20)
    unit = random.choice(["عدد", "دستگاه", "مجوز", "پروژه", "ماه"])

    supply, created = Supply.objects.get_or_create(
        seller=seller,
        title=title,
        defaults={
            'supply_type': 'service' if supply_type == 'service' else 'product',
            'category': category,
            'industry': industry_obj,   # ← شیء IndustryCategory
            'technology': technology,
            'city': city,
            'description': f"{title} یک راهکار فناورانه برای صنعت {industry_name} با فناوری {technology} است.",
            'quantity': str(quantity),
            'unit': unit,
            'price': Decimal(str(price)),
            'trl': str(trl),
            'mrl': str(mrl),
            'status': 'published',
            'view_count': random.randint(10, 500),
        }
    )
    if created:
        print(f"   ✅ عرضه '{title[:40]}...' ایجاد شد (TRL={trl}, MRL={mrl}, قیمت={price:,} تومان)")
        # افزودن تصویر
        img = download_image(title)
        if img:
            SupplyImage.objects.create(
                supply=supply,
                image=img,
                caption=f"تصویر مرتبط با {title}",
                is_primary=True,
            )
            print(f"      🖼️ تصویر برای '{title[:30]}...' اضافه شد.")
    return supply

# ============================================================
# اجرای اصلی
# ============================================================

def run():
    print("=" * 80)
    print("🚀 شروع ایجاد داده‌های غنی بازار (نیازها و عرضه‌ها)")
    print("=" * 80)

    # 1. کاربران
    azadeh = get_or_create_user('azadeh', 'آزاده', 'محمدی', role='buyer', company_name='شرکت نوآوران آزاده')
    azadeh123 = get_or_create_user('azadeh123', 'احمد', 'رضایی', role='supplier', company_name='توسعه‌گران احمد')

    # 2. نیازها برای هر دو کاربر
    print("\n📌 ایجاد نیازها...")
    for idx, title in enumerate(NEED_TITLES):
        industry_name = INDUSTRIES[idx % len(INDUSTRIES)]
        buyer = azadeh if idx % 2 == 0 else azadeh123
        create_need(buyer, title, industry_name, status='published' if idx % 3 != 0 else 'active')

    # 3. عرضه‌ها با تنوع بالا
    print("\n📦 ایجاد عرضه‌ها...")
    
    supplies_created = 0
    for idx, (title, s_type, industry_name, tech) in enumerate(SUPPLY_TITLES):
        city = CITIES[idx % len(CITIES)]
        seller = azadeh123 if idx % 2 == 0 else azadeh
        trl = (idx % 9) + 1  # ۱ تا ۹
        mrl = ((idx * 2) % 9) + 1
        price = random.randrange(80_000_000, 4_900_000_000, 10_000_000)
        supply = create_supply(seller, title, s_type, industry_name, tech, city, trl, mrl, price)
        if supply:
            supplies_created += 1
        time.sleep(0.2)  # جلوگیری از ارسال بیش از حد درخواست به ویکی‌مدیا

    # 4. اگر تعداد عرضه‌ها کمتر از ۵۰ بود، موارد اضافی با ترکیب‌های جدید بسازیم
    if supplies_created < 50:
        print(f"\n⚠️ تعداد عرضه‌ها ({supplies_created}) کمتر از ۵۰ است. ایجاد موارد تکمیلی...")
        extra_templates = [
            ("سامانه هوشمند مدیریت زنجیره تأمین", "product", "فناوری اطلاعات", "بلاکچین"),
            ("خدمت ارزیابی ریسک فناوری", "service", "فناوری اطلاعات", "داده‌کاوی"),
            ("راهکار پایش محیط‌های صنعتی", "product", "محیط زیست", "اینترنت اشیاء"),
            ("سامانه تحلیل پیش‌بینی فروش", "software_solution", "فناوری اطلاعات", "هوش مصنوعی"),
            ("ربات برداشت محصول کشاورزی", "product", "کشاورزی", "رباتیک"),
            ("دوقلوی دیجیتال بیمارستان هوشمند", "software_solution", "سلامت", "دوقلوی دیجیتال"),
        ]
        for idx, (title, s_type, industry_name, tech) in enumerate(extra_templates):
            if supplies_created >= 50:
                break
            city = CITIES[(idx + 7) % len(CITIES)]
            seller = azadeh123 if (idx + 3) % 2 == 0 else azadeh
            trl = ((idx + 5) % 9) + 1
            mrl = ((idx * 3 + 2) % 9) + 1
            price = random.randrange(100_000_000, 3_000_000_000, 10_000_000)
            supply = create_supply(seller, title, s_type, industry_name, tech, city, trl, mrl, price)
            if supply:
                supplies_created += 1
            time.sleep(0.2)

    # 5. آمار نهایی
    print("\n" + "=" * 80)
    print("📊 خلاصه داده‌های ایجاد شده")
    print("=" * 80)
    print(f"👤 کاربران: {User.objects.count()} نفر")
    print(f"📦 نیازها: {Need.objects.count()} عدد")
    print(f"📦 عرضه‌ها: {Supply.objects.count()} عدد")
    print(f"🖼️ تصاویر: {SupplyImage.objects.count()} عدد")
    
    print("\n📋 توزیع صنایع:")
    for industry_name in INDUSTRIES:
        try:
            industry_obj = IndustryCategory.objects.get(name=industry_name)
            count = Supply.objects.filter(industry=industry_obj).count()
            print(f"  {industry_name}: {count}")
        except IndustryCategory.DoesNotExist:
            print(f"  {industry_name}: 0")
    
    print("\n📋 توزیع فناوری‌ها:")
    # اگر technology از نوع CharField است، به‌صورت مستقیم filter می‌کنیم
    # در غیر این صورت باید مشابه industry عمل کنیم
    # فرض می‌کنیم CharField است
    for tech in TECHNOLOGIES:
        count = Supply.objects.filter(technology=tech).count()
        print(f"  {tech}: {count}")
    
    print("\n📋 توزیع استان‌ها:")
    for city in CITIES:
        count = Supply.objects.filter(city=city).count()
        print(f"  {city}: {count}")
    
    print("\n📋 توزیع نوع عرضه:")
    product_count = Supply.objects.filter(supply_type='product').count()
    service_count = Supply.objects.filter(supply_type='service').count()
    print(f"  محصول: {product_count}")
    print(f"  خدمت: {service_count}")
    
    print("\n✅ اسکریپت با موفقیت اجرا شد!")
    print("=" * 80)

if __name__ == "__main__":
    run()