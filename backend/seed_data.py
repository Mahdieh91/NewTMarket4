# ============================================================
# seed_market_intelligence.py
#
# داده آزمایشی واقع‌گرایانه برای:
# Market Intelligence
# Marketplace
# Matching
# Dashboard
#
# تمرکز اصلی:
# - پتروشیمی
# - پلیمر
# - الفین
# - آروماتیک
# - کاتالیست
# - تجهیزات و پایش هوشمند
#
# اجرا:
#
# python manage.py shell < seed_market_intelligence.py
#
# یا:
#
# python manage.py shell
# >>> exec(open("seed_market_intelligence.py", encoding="utf-8").read())
#
# ============================================================
# seed_data.py
# اسکریپت تولید داده‌های نمونه با تصاویر و مستندات برای تست و توسعه
# اجرا:
# python seed_data.py

import os
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal
import io
import requests

# ============================================================
# راه‌اندازی Django
# ============================================================

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

# ============================================================
# Import مدل‌ها - فقط بعد از django.setup()
# ============================================================

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from products.models import Product, Supply
from industries.models import IndustryCategory
from needs.models import Need
from evaluations.models import Evaluation
from negotiations.models import Negotiation

User = get_user_model()


# ============================================================
# Configuration
# ============================================================

SEED_PREFIX = "market_demo_"

RANDOM_SEED = 1403
random.seed(RANDOM_SEED)


# ------------------------------------------------------------
# تعداد داده‌ها
# ------------------------------------------------------------

PRODUCT_COUNT = 90
SUPPLY_COUNT = 110
NEED_COUNT = 55
NEGOTIATION_COUNT = 25
EVALUATION_COUNT = 70


# ============================================================
# Persian / Industrial Data
# ============================================================

CITIES = [
    "تهران",
    "اصفهان",
    "شیراز",
    "تبریز",
    "مشهد",
    "عسلویه",
    "ماهشهر",
    "اراک",
    "بندرعباس",
    "کرمانشاه",
]


REGIONS = [
    "تهران",
    "اصفهان",
    "شیراز",
    "تبریز",
    "مشهد",
]


TECHNOLOGIES = [
    "هوش مصنوعی",
    "اینترنت اشیاء",
    "دوقلوی دیجیتال",
    "رباتیک",
    "داده‌کاوی",
    "اتوماسیون صنعتی",
    "بینایی ماشین",
    "پایش وضعیت",
]


PETRO_TECHS = [
    "اتوماسیون صنعتی",
    "اینترنت اشیاء",
    "دوقلوی دیجیتال",
    "هوش مصنوعی",
    "پایش وضعیت",
    "داده‌کاوی",
]


INDUSTRIES = [
    "پتروشیمی",
    "نفت و گاز",
    "فولاد و معدن",
    "انرژی",
    "خودروسازی",
    "سلامت",
    "کشاورزی",
    "حمل‌ونقل",
    "فناوری اطلاعات",
    "محیط زیست",
]


# ============================================================
# Petrochemical Products
# ============================================================

PETRO_PRODUCTS = [

    (
        "پلی‌اتیلن سنگین HDPE گرید فیلم",
        "مواد پلیمری",
        "پلی‌اتیلن",
        "پلی‌اتیلن سنگین با خلوص و پایداری مناسب برای تولید فیلم و بسته‌بندی صنعتی.",
    ),

    (
        "پلی‌اتیلن سبک LDPE گرید فیلم",
        "مواد پلیمری",
        "پلی‌اتیلن",
        "پلی‌اتیلن سبک مناسب تولید فیلم‌های بسته‌بندی، کشاورزی و کاربردهای صنعتی.",
    ),

    (
        "پلی‌پروپیلن نساجی",
        "مواد پلیمری",
        "پلی‌پروپیلن",
        "پلی‌پروپیلن با شاخص جریان مذاب کنترل‌شده برای تولید نخ و منسوجات صنعتی.",
    ),

    (
        "پلی‌پروپیلن گرید تزریق",
        "مواد پلیمری",
        "پلی‌پروپیلن",
        "گرید تزریقی پلی‌پروپیلن برای قطعات صنعتی و محصولات مهندسی.",
    ),

    (
        "اتیلن گلیکول MEG",
        "محصولات پتروشیمی",
        "الفین",
        "ماده اولیه مورد استفاده در زنجیره پلی‌استر و کاربردهای صنعتی.",
    ),

    (
        "پروپیلن صنعتی",
        "محصولات پتروشیمی",
        "الفین",
        "خوراک پتروشیمی با خلوص صنعتی برای واحدهای پایین‌دستی.",
    ),

    (
        "بنزن آروماتیک",
        "محصولات پتروشیمی",
        "آروماتیک",
        "بنزن با مشخصات کیفی مناسب برای استفاده در صنایع شیمیایی و پتروشیمی.",
    ),

    (
        "تولوئن صنعتی",
        "محصولات پتروشیمی",
        "آروماتیک",
        "تولوئن صنعتی برای کاربردهای حلال، شیمیایی و تولید مشتقات آروماتیک.",
    ),

    (
        "زایلین مخلوط",
        "محصولات پتروشیمی",
        "آروماتیک",
        "مخلوط زایلین با مشخصات فنی کنترل‌شده برای فرآیندهای پایین‌دستی.",
    ),

    (
        "کاتالیست واحد الفین",
        "کاتالیست",
        "کاتالیست",
        "کاتالیست صنعتی برای بهبود عملکرد واحدهای الفین و کاهش افت فعالیت.",
    ),

    (
        "کاتالیست ریفرمینگ",
        "کاتالیست",
        "کاتالیست",
        "کاتالیست مناسب فرآیندهای ریفرمینگ با پایداری حرارتی بالا.",
    ),

    (
        "جاذب مولکولی واحد گاز",
        "مواد فرآیندی",
        "تصفیه گاز",
        "جاذب مولکولی برای حذف رطوبت و ناخالصی از جریان‌های گازی.",
    ),

    (
        "مواد ضدخوردگی خطوط فرآیندی",
        "مواد شیمیایی",
        "پایش وضعیت",
        "مواد شیمیایی صنعتی برای کنترل خوردگی تجهیزات و خطوط انتقال.",
    ),

    (
        "افزودنی پلیمری مقاوم‌کننده",
        "مواد پلیمری",
        "پلیمر",
        "افزودنی تخصصی برای افزایش پایداری حرارتی و مکانیکی محصولات پلیمری.",
    ),

    (
        "مستربچ مشکی صنعتی",
        "مواد پلیمری",
        "مستربچ",
        "مستربچ مشکی با پراکنش مناسب برای تولید محصولات پلیمری.",
    ),

    (
        "مستربچ سفید TiO2",
        "مواد پلیمری",
        "مستربچ",
        "مستربچ سفید با پایه TiO2 برای افزایش پوشش و سفیدی محصولات.",
    ),

    (
        "گرید پلی‌اتیلن لوله",
        "مواد پلیمری",
        "پلی‌اتیلن",
        "مواد پلیمری مناسب تولید لوله‌های فشار بالا و شبکه‌های انتقال.",
    ),

    (
        "کامپاند مهندسی پلی‌پروپیلن",
        "مواد پلیمری",
        "کامپاند",
        "کامپاند مهندسی تقویت‌شده برای کاربردهای صنعتی و خودرویی.",
    ),

    (
        "پلی‌استایرن مقاوم",
        "مواد پلیمری",
        "پلیمر",
        "پلی‌استایرن مقاوم برای قطعات و کاربردهای صنعتی.",
    ),

    (
        "رزین اپوکسی صنعتی",
        "مواد شیمیایی",
        "رزین",
        "رزین اپوکسی برای پوشش‌های صنعتی، تعمیرات و حفاظت تجهیزات.",
    ),

    (
        "حلال آروماتیک صنعتی",
        "مواد شیمیایی",
        "آروماتیک",
        "حلال صنعتی با مشخصات کنترل‌شده برای فرآیندهای شیمیایی.",
    ),

    (
        "سیستم پایش هوشمند کمپرسور",
        "تجهیزات هوشمند",
        "اینترنت اشیاء",
        "سامانه پایش آنلاین ارتعاش، دما و وضعیت کمپرسورهای فرآیندی.",
    ),

    (
        "دوقلوی دیجیتال واحد تقطیر",
        "راهکار هوشمند",
        "دوقلوی دیجیتال",
        "مدل دیجیتال واحد فرآیندی برای تحلیل عملکرد و پیش‌بینی شرایط عملیاتی.",
    ),

    (
        "سامانه پیش‌بینی خرابی پمپ",
        "راهکار هوشمند",
        "هوش مصنوعی",
        "سامانه هوش مصنوعی برای پیش‌بینی خرابی و نگهداری پیشگویانه پمپ‌های صنعتی.",
    ),

    (
        "پایش هوشمند خوردگی خطوط",
        "راهکار هوشمند",
        "داده‌کاوی",
        "سامانه پایش و تحلیل روند خوردگی خطوط فرآیندی.",
    ),

]


OTHER_PRODUCTS = [

    (
        "سامانه هوشمند مدیریت انرژی",
        "مدیریت انرژی",
        "هوش مصنوعی",
        "راهکار هوشمند برای پایش و بهینه‌سازی مصرف انرژی.",
    ),

    (
        "سامانه بینایی ماشین کنترل کیفیت",
        "کنترل کیفیت",
        "بینایی ماشین",
        "سیستم کنترل کیفیت خودکار با استفاده از بینایی ماشین.",
    ),

    (
        "پلتفرم تحلیل داده صنعتی",
        "نرم‌افزار صنعتی",
        "داده‌کاوی",
        "پلتفرم تحلیل داده برای خطوط تولید و تجهیزات صنعتی.",
    ),

    (
        "سامانه پایش وضعیت تجهیزات",
        "پایش وضعیت",
        "اینترنت اشیاء",
        "سامانه پایش وضعیت تجهیزات دوار و صنعتی.",
    ),

    (
        "ربات بازرسی خطوط صنعتی",
        "رباتیک",
        "رباتیک",
        "ربات متحرک برای بازرسی خطوط و محیط‌های صنعتی.",
    ),

]


# ============================================================
# Needs
# ============================================================

PETRO_NEEDS = [

    (
        "پیش‌بینی خرابی تجهیزات دوار پتروشیمی",
        "پتروشیمی",
        "هوش مصنوعی",
        "پیش‌بینی خرابی پمپ‌ها، کمپرسورها و تجهیزات دوار مجتمع پتروشیمی با استفاده از داده‌های عملیاتی.",
    ),

    (
        "دوقلوی دیجیتال واحد الفین",
        "پتروشیمی",
        "دوقلوی دیجیتال",
        "ایجاد مدل دیجیتال واحد الفین برای تحلیل سناریوهای عملیاتی و کاهش مصرف انرژی.",
    ),

    (
        "پایش هوشمند خوردگی خطوط انتقال",
        "پتروشیمی",
        "اینترنت اشیاء",
        "طراحی سامانه پایش آنلاین خوردگی خطوط و تجهیزات فرآیندی.",
    ),

    (
        "بهینه‌سازی مصرف انرژی واحد تولید",
        "پتروشیمی",
        "داده‌کاوی",
        "شناسایی عوامل مؤثر بر مصرف انرژی و ارائه مدل پیش‌بینی و بهینه‌سازی.",
    ),

    (
        "کنترل کیفیت هوشمند محصولات پلیمری",
        "پتروشیمی",
        "بینایی ماشین",
        "توسعه راهکار هوشمند کنترل کیفیت و تشخیص عیوب محصولات پلیمری.",
    ),

    (
        "پایش وضعیت کمپرسورهای فرآیندی",
        "پتروشیمی",
        "اینترنت اشیاء",
        "پایش لحظه‌ای ارتعاش، دما، فشار و شاخص‌های عملکرد کمپرسورها.",
    ),

    (
        "پیش‌بینی کیفیت محصول پتروشیمی",
        "پتروشیمی",
        "هوش مصنوعی",
        "پیش‌بینی مشخصات کیفی محصول با استفاده از داده‌های فرآیندی.",
    ),

    (
        "بهینه‌سازی واحد تقطیر",
        "پتروشیمی",
        "دوقلوی دیجیتال",
        "مدل‌سازی و بهینه‌سازی عملکرد واحد تقطیر و کاهش مصرف انرژی.",
    ),

    (
        "تشخیص نشت گاز در مجتمع",
        "پتروشیمی",
        "بینایی ماشین",
        "شناسایی سریع نشتی گاز و نقاط پرریسک در محیط صنعتی.",
    ),

    (
        "مدیریت هوشمند نگهداری و تعمیرات",
        "پتروشیمی",
        "داده‌کاوی",
        "توسعه مدل پیش‌بینی خرابی و برنامه‌ریزی نگهداری تجهیزات.",
    ),

]


OTHER_NEEDS = [

    (
        "پایش هوشمند تجهیزات معدنی",
        "فولاد و معدن",
        "اینترنت اشیاء",
        "پایش وضعیت تجهیزات و پیش‌بینی خرابی ماشین‌آلات معدنی.",
    ),

    (
        "بهینه‌سازی مصرف انرژی کارخانه",
        "فولاد و معدن",
        "هوش مصنوعی",
        "کاهش مصرف انرژی و شناسایی الگوهای مصرف.",
    ),

    (
        "سامانه تشخیص عیب خطوط تولید",
        "خودروسازی",
        "بینایی ماشین",
        "تشخیص خودکار عیوب قطعات در خط تولید.",
    ),

    (
        "مدیریت هوشمند شبکه انرژی",
        "انرژی",
        "هوش مصنوعی",
        "پیش‌بینی مصرف و بهینه‌سازی توزیع انرژی.",
    ),

    (
        "پایش گلخانه هوشمند",
        "کشاورزی",
        "اینترنت اشیاء",
        "پایش دما، رطوبت و شرایط محیطی گلخانه.",
    ),

]


# ============================================================
# Helper functions
# ============================================================

def field_names(model):
    """
    تمام فیلدهای واقعی مدل را برمی‌گرداند.
    """

    return {
        f.name
        for f in model._meta.get_fields()
        if hasattr(f, "attname")
    }


def safe_create(model, **kwargs):
    """
    فقط فیلدهایی که واقعاً در مدل وجود دارند ارسال می‌شوند.
    """

    allowed = field_names(model)

    clean = {
        key: value
        for key, value in kwargs.items()
        if key in allowed
    }

    return model.objects.create(**clean)


def safe_update(instance, **kwargs):
    allowed = field_names(instance.__class__)

    changed = []

    for key, value in kwargs.items():

        if key in allowed:
            setattr(instance, key, value)
            changed.append(key)

    if changed:
        instance.save(update_fields=changed)


def find_or_create_industry(name):
    """
    IndustryCategory در نسخه‌های مختلف پروژه ممکن است
    فیلدهای متفاوتی داشته باشد.

    ابتدا بر اساس name تلاش می‌کنیم.
    """

    names = field_names(IndustryCategory)

    if "name" not in names:
        raise RuntimeError(
            "IndustryCategory فاقد فیلد name است. "
            "مدل industries/models.py را بررسی کنید."
        )

    obj = IndustryCategory.objects.filter(
        name=name
    ).first()

    if obj:
        return obj

    kwargs = {
        "name": name
    }

    if "description" in names:
        kwargs["description"] = (
            f"صنعت {name} در بازار فناوری و نوآوری"
        )

    if "is_active" in names:
        kwargs["is_active"] = True

    return IndustryCategory.objects.create(**kwargs)


def make_username(prefix, index):
    return f"{prefix}_{index}"


def get_or_create_user(
    username,
    company_name,
    first_name="کاربر",
    last_name="نمونه",
):

    user = User.objects.filter(
        username=username
    ).first()

    if user:
        return user

    kwargs = {
        "username": username,
        "email": f"{username}@example.local",
        "first_name": first_name,
        "last_name": last_name,
    }

    user = User.objects.create_user(
        password="Test@123456",
        **kwargs
    )

    # بعضی پروژه‌ها company_name دارند
    if hasattr(user, "company_name"):
        user.company_name = company_name
        user.save(update_fields=["company_name"])

    # بعضی پروژه‌ها company دارند
    elif hasattr(user, "company"):
        user.company = company_name
        user.save(update_fields=["company"])

    return user


def random_price():
    """
    قیمت تقریبی برای محیط Demo.
    """

    return Decimal(
        random.randint(
            250,
            8500
        )
        * 1_000_000
    )


def random_product_price():
    return Decimal(
        random.randint(
            180,
            6500
        )
        * 1_000_000
    )


def random_views(minimum=100, maximum=12500):
    return random.randint(
        minimum,
        maximum
    )


# ============================================================
# Users
# ============================================================

def create_users():

    sellers = []

    companies = [
        "پتروشیمی آریا",
        "پتروشیمی پارس",
        "پتروشیمی جم",
        "پتروشیمی مارون",
        "پتروشیمی نوری",
        "پتروشیمی زاگرس",
        "پتروشیمی امیرکبیر",
        "شرکت فناوری فرآیند هوشمند",
        "راهکاران صنعت نوین",
        "فناوران انرژی پارس",
        "پژوهشگران هوشمند صنعت",
        "نگین کنترل فرآیند",
    ]

    for i, company in enumerate(companies, start=1):

        user = get_or_create_user(
            username=make_username(
                "market_supplier",
                i
            ),
            company_name=company,
            first_name="مدیر",
            last_name=f"شرکت {i}",
        )

        sellers.append(user)

    buyers = []

    buyer_companies = [
        "مجتمع پتروشیمی جنوب",
        "شرکت صنایع شیمیایی پارس",
        "هلدینگ انرژی نوین",
        "شرکت تولید پلیمر ایران",
        "مجتمع پتروشیمی مرکزی",
        "شرکت مهندسی و توسعه فرآیند",
        "صنایع پایین‌دستی پلیمر",
        "شرکت بهره‌برداری انرژی",
    ]

    for i, company in enumerate(
        buyer_companies,
        start=1
    ):

        user = get_or_create_user(
            username=make_username(
                "market_buyer",
                i
            ),
            company_name=company,
            first_name="کارشناس",
            last_name=f"خریدار {i}",
        )

        buyers.append(user)

    return sellers, buyers


# ============================================================
# Industries
# ============================================================

def create_industries():

    result = {}

    for name in INDUSTRIES:

        result[name] = find_or_create_industry(
            name
        )

    return result


# ============================================================
# Products
# ============================================================

def create_products(
    sellers,
    industries,
):

    products = []

    names = []

    # --------------------------------------------------------
    # حدود 75% پتروشیمی
    # --------------------------------------------------------

    for item in PETRO_PRODUCTS:

        names.append(
            (
                item,
                "پتروشیمی"
            )
        )

    for item in OTHER_PRODUCTS:

        names.append(
            (
                item,
                random.choice(
                    [
                        "نفت و گاز",
                        "فولاد و معدن",
                        "انرژی",
                        "خودروسازی",
                        "فناوری اطلاعات",
                    ]
                )
            )
        )

    # تکرار کنترل‌شده برای داشتن حجم واقعی
    while len(names) < PRODUCT_COUNT:

        item = random.choice(
            PETRO_PRODUCTS
        )

        names.append(
            (
                item,
                "پتروشیمی"
            )
        )

    random.shuffle(names)

    for index in range(PRODUCT_COUNT):

        item, industry_name = names[index]

        title, category, technology, description = item

        seller = random.choice(
            sellers
        )

        industry = industries[
            industry_name
        ]

        is_petro = (
            industry_name == "پتروشیمی"
        )

        if is_petro:

            tech = technology

            trl = random.choice(
                [7, 8, 8, 9]
            )

            mrl = random.choice(
                [6, 7, 8, 8, 9]
            )

        else:

            tech = technology

            trl = random.choice(
                [5, 6, 7, 8]
            )

            mrl = random.choice(
                [5, 6, 7, 8]
            )

        price = (
            random_product_price()
        )

        product_data = {

            "seller": seller,

            "title":
                title
                if index < len(PETRO_PRODUCTS)
                else f"{title} - مدل صنعتی {index + 1}",

            "category": "product",

            "industry": industry,

            "short_description":
                description,

            "full_description":
                f"""
                این محصول برای استفاده در زنجیره صنعتی
                {industry_name} طراحی شده است.

                کاربرد اصلی:
                {description}

                قابلیت استقرار در محیط صنعتی،
                امکان پایش عملکرد و پشتیبانی فنی
                از ویژگی‌های این محصول است.
                """,

            "problem_solved":
                "کاهش هزینه عملیاتی، افزایش قابلیت اطمینان "
                "و بهبود بهره‌وری فرآیند.",

            "competitive_advantage":
                "قابلیت استقرار صنعتی، پشتیبانی فنی و "
                "امکان توسعه متناسب با نیاز مشتری.",

            "technical_specs":
                f"فناوری: {tech} | "
                f"TRL: {trl} | "
                f"MRL: {mrl} | "
                f"کاربرد: {industry_name}",

            "trl": trl,

            "mrl": mrl,

            "pricing_model":
                "فروش مستقیم / قرارداد تأمین صنعتی",

            "price":
                price,

            "ip_status":
                random.choice(
                    [
                        "مالکیت داخلی",
                        "تحت لیسانس",
                        "قابل توسعه",
                        "ثبت اختراع",
                    ]
                ),

            "sample_customers":
                random.choice(
                    [
                        "مجتمع‌های پتروشیمی",
                        "شرکت‌های تولیدی بزرگ",
                        "صنایع فرآیندی",
                        "مشتریان صنعتی منتخب",
                    ]
                ),

            "capacity":
                random.choice(
                    [
                        "100 تن در ماه",
                        "250 تن در ماه",
                        "500 تن در ماه",
                        "1000 تن در ماه",
                        "قابل توسعه تا 2000 تن در ماه",
                    ]
                ),

            "collaboration_terms":
                "تأمین، نصب، راه‌اندازی و خدمات پس از فروش",

            "status":
                random.choice(
                    [
                        "published",
                        "published",
                        "published",
                        "approved",
                        "in_negotiation",
                    ]
                ),

            "view_count":
                random_views(),

            "city":
                random.choice(
                    CITIES
                ),

            "technology":
                tech,
        }

        product = safe_create(
            Product,
            **product_data
        )

        products.append(
            product
        )

    return products


# ============================================================
# Supplies
# ============================================================

def create_supplies(
    sellers,
):

    supplies = []

    # --------------------------------------------------------
    # برای Market Intelligence
    # بخش بزرگی حتماً پتروشیمی باشد.
    # --------------------------------------------------------

    for i in range(
        SUPPLY_COUNT
    ):

        seller = random.choice(
            sellers
        )

        is_petro = (
            i < int(
                SUPPLY_COUNT * 0.78
            )
        )

        if is_petro:

            item = random.choice(
                PETRO_PRODUCTS
            )

            title, category, technology, description = item

            industry = "پتروشیمی"

            tech = (
                technology
                if technology
                in PETRO_TECHS
                else random.choice(
                    PETRO_TECHS
                )
            )

            city = random.choice(
                [
                    "عسلویه",
                    "ماهشهر",
                    "تهران",
                    "بندرعباس",
                    "اراک",
                ]
            )

        else:

            item = random.choice(
                OTHER_PRODUCTS
            )

            title, category, technology, description = item

            industry = random.choice(
                [
                    "نفت و گاز",
                    "فولاد و معدن",
                    "انرژی",
                    "خودروسازی",
                    "فناوری اطلاعات",
                ]
            )

            tech = technology

            city = random.choice(
                CITIES
            )

        supply_data = {

            "seller": seller,

            "title":
                f"{title} - عرضه صنعتی {i + 1}",

            "supply_type":
                "product",

            "category":
                category,

            "industry":
                industry,

            "technology":
                tech,

            "city":
                city,

            "description":
                description
                + " این عرضه برای همکاری و تأمین صنعتی "
                "در بازار فناوری و زنجیره تأمین ثبت شده است.",

            "quantity":
                random.choice(
                    [
                        "20",
                        "50",
                        "100",
                        "250",
                        "500",
                        "1000",
                    ]
                ),

            "unit":
                random.choice(
                    [
                        "تن",
                        "کیلوگرم",
                        "دستگاه",
                        "مورد",
                        "پکیج",
                    ]
                ),

            "price":
                random_price(),

            "trl":
                str(
                    random.choice(
                        [
                            7,
                            8,
                            8,
                            9,
                        ]
                    )
                ),

            "documents":
                [
                    {
                        "type": "technical",
                        "title": "دیتاشیت فنی",
                    },
                    {
                        "type": "quality",
                        "title": "گواهی کنترل کیفیت",
                    },
                ],

            "status":
                random.choice(
                    [
                        "published",
                        "published",
                        "published",
                        "approved",
                    ]
                ),
        }

        supply = safe_create(
            Supply,
            **supply_data
        )

        supplies.append(
            supply
        )

    return supplies


# ============================================================
# Needs
# ============================================================

def create_needs(
    buyers,
    industries,
):

    needs = []

    templates = []

    for item in PETRO_NEEDS:

        templates.append(
            item
        )

    for item in OTHER_NEEDS:

        templates.append(
            item
        )

    while len(templates) < NEED_COUNT:

        templates.append(
            random.choice(
                PETRO_NEEDS
            )
        )

    random.shuffle(
        templates
    )

    for i in range(
        NEED_COUNT
    ):

        title, industry_name, technology, description = (
            templates[i]
        )

        buyer = random.choice(
            buyers
        )

        industry = industries[
            industry_name
        ]

        budget = Decimal(
            random.randint(
                500,
                9000
            )
            * 1_000_000
        )

        need_data = {

            "buyer": buyer,

            "title":
                title,

            "description":
                description,

            "industry":
                industry,

            "current_status":
                random.choice(
                    [
                        "مرحله شناسایی و ارزیابی راهکارها",
                        "در حال بررسی تأمین‌کنندگان",
                        "نیاز به اجرای پایلوت",
                        "در حال آماده‌سازی مناقصه",
                        "در حال ارزیابی فنی",
                    ]
                ),

            "expected_outcome":
                random.choice(
                    [
                        "کاهش حداقل 10 درصد هزینه عملیاتی",
                        "افزایش قابلیت اطمینان تجهیزات",
                        "کاهش توقف اضطراری خط تولید",
                        "بهبود کیفیت محصول",
                        "کاهش مصرف انرژی",
                        "افزایش دقت پایش فرآیند",
                    ]
                ),

            "constraints":
                "لزوم سازگاری با تجهیزات موجود، "
                "رعایت الزامات HSE و امکان استقرار "
                "در محیط صنعتی.",

            "budget":
                budget,

            "timeline":
                random.choice(
                    [
                        "3 ماه",
                        "4 ماه",
                        "6 ماه",
                        "9 ماه",
                        "12 ماه",
                    ]
                ),

            "confidentiality":
                random.choice(
                    [
                        "public",
                        "public",
                        "private",
                    ]
                ),

            "evaluation_criteria":
                "توان فنی، سابقه صنعتی، TRL، MRL، "
                "قیمت، زمان اجرا، پشتیبانی و امکان پایلوت.",

            "status":
                random.choice(
                    [
                        "published",
                        "published",
                        "receiving_proposals",
                        "evaluating",
                        "matched",
                        "in_negotiation",
                    ]
                ),
        }

        need = safe_create(
            Need,
            **need_data
        )

        needs.append(
            need
        )

    return needs


# ============================================================
# Evaluations
# ============================================================

def create_evaluations(
    products,
    buyers,
):

    if Evaluation is None:

        print(
            "⚠️ Evaluation پیدا نشد. "
            "از این مرحله عبور شد."
        )

        return []

    evaluations = []

    names = field_names(
        Evaluation
    )

    # پیدا کردن فیلد ارتباط با Product
    product_field = None

    for candidate in [
        "product",
        "supply",
        "target",
    ]:

        if candidate in names:
            product_field = candidate
            break

    if not product_field:

        print(
            "⚠️ Evaluation فیلد product/supply ندارد. "
            "از ساخت Evaluation عبور شد."
        )

        return []

    for i in range(
        EVALUATION_COUNT
    ):

        product = random.choice(
            products
        )

        kwargs = {
            product_field:
                product,
        }

        # reviewer
        for candidate in [
            "reviewer",
            "user",
            "evaluator",
        ]:

            if candidate in names:

                kwargs[candidate] = (
                    random.choice(
                        buyers
                    )
                )

                break

        # rating
        for candidate in [
            "rating",
            "score",
            "overall_rating",
        ]:

            if candidate in names:

                kwargs[candidate] = (
                    Decimal(
                        str(
                            random.choice(
                                [
                                    3.8,
                                    4.0,
                                    4.1,
                                    4.2,
                                    4.3,
                                    4.5,
                                    4.7,
                                    4.8,
                                ]
                            )
                        )
                    )
                )

                break

        # comment
        for candidate in [
            "comment",
            "review",
            "description",
            "text",
        ]:

            if candidate in names:

                kwargs[candidate] = random.choice(
                    [
                        "کیفیت فنی مناسب و قابلیت استقرار صنعتی.",
                        "راهکار از نظر بلوغ فناوری وضعیت مناسبی دارد.",
                        "پشتیبانی فنی و مستندات قابل قبول است.",
                        "گزینه مناسب برای اجرای پایلوت صنعتی.",
                        "عملکرد محصول در ارزیابی اولیه مناسب بوده است.",
                    ]
                )

                break

        try:

            evaluation = safe_create(
                Evaluation,
                **kwargs
            )

            evaluations.append(
                evaluation
            )

        except Exception as exc:

            print(
                "⚠️ Evaluation ایجاد نشد:",
                exc
            )

            break

    return evaluations


# ============================================================
# Negotiations
# ============================================================

def create_negotiations(
    products,
    needs,
    buyers,
):

    if Negotiation is None:

        print(
            "⚠️ Negotiation پیدا نشد."
        )

        return []

    negotiations = []

    names = field_names(
        Negotiation
    )

    # نسخه پروژه ممکن است need داشته باشد
    # یا نداشته باشد.

    possible_products = list(
        products
    )

    possible_needs = list(
        needs
    )

    for i in range(
        NEGOTIATION_COUNT
    ):

        product = random.choice(
            possible_products
        )

        buyer = random.choice(
            [
                u
                for u in buyers
                if u.id != product.seller_id
            ]
        )

        kwargs = {}

        if "product" in names:
            kwargs["product"] = product

        if "need" in names:

            kwargs["need"] = (
                random.choice(
                    possible_needs
                )
            )

        if "buyer" in names:
            kwargs["buyer"] = buyer

        if "supplier" in names:
            kwargs["supplier"] = (
                product.seller
            )

        if "status" in names:

            kwargs["status"] = random.choice(
                [
                    "created",
                    "in_progress",
                    "proposal_sent",
                    "under_review",
                    "accepted",
                    "contracted",
                ]
            )

        try:

            negotiation = safe_create(
                Negotiation,
                **kwargs
            )

            negotiations.append(
                negotiation
            )

        except Exception as exc:

            print(
                "⚠️ Negotiation ایجاد نشد:",
                exc
            )

            continue

    return negotiations


# ============================================================
# Create additional realistic view counts
# ============================================================

def refresh_product_views(products):

    for product in products:

        if hasattr(
            product,
            "view_count"
        ):

            product.view_count = (
                random.randint(
                    250,
                    18000
                )
            )

            product.save(
                update_fields=[
                    "view_count"
                ]
            )


# ============================================================
# Main Seed
# ============================================================

@transaction.atomic
def run():

    print()
    print("=" * 70)
    print(
        "🚀 شروع تولید داده Market Intelligence"
    )
    print("=" * 70)
    print()

    # --------------------------------------------------------
    # Users
    # --------------------------------------------------------

    print(
        "👥 ایجاد کاربران..."
    )

    sellers, buyers = create_users()

    print(
        f"   فروشنده: {len(sellers)}"
    )

    print(
        f"   خریدار: {len(buyers)}"
    )

    # --------------------------------------------------------
    # Industries
    # --------------------------------------------------------

    print(
        "\n🏭 ایجاد صنایع..."
    )

    industries = create_industries()

    print(
        f"   صنایع: {len(industries)}"
    )

    # --------------------------------------------------------
    # Products
    # --------------------------------------------------------

    print(
        "\n📦 ایجاد محصولات..."
    )

    products = create_products(
        sellers,
        industries
    )

    petro_products = sum(
        1
        for p in products
        if getattr(
            getattr(
                p,
                "industry",
                None
            ),
            "name",
            ""
        ) == "پتروشیمی"
    )

    print(
        f"   محصولات: {len(products)}"
    )

    print(
        f"   محصولات پتروشیمی: {petro_products}"
    )

    # --------------------------------------------------------
    # Supplies
    # --------------------------------------------------------

    print(
        "\n📈 ایجاد عرضه‌ها..."
    )

    supplies = create_supplies(
        sellers
    )

    petro_supplies = sum(
        1
        for s in supplies
        if getattr(
            s,
            "industry",
            ""
        ) == "پتروشیمی"
    )

    print(
        f"   عرضه‌ها: {len(supplies)}"
    )

    print(
        f"   عرضه پتروشیمی: {petro_supplies}"
    )

    # --------------------------------------------------------
    # Needs
    # --------------------------------------------------------

    print(
        "\n💡 ایجاد نیازها..."
    )

    needs = create_needs(
        buyers,
        industries
    )

    petro_needs = sum(
        1
        for n in needs
        if getattr(
            getattr(
                n,
                "industry",
                None
            ),
            "name",
            ""
        ) == "پتروشیمی"
    )

    print(
        f"   نیازها: {len(needs)}"
    )

    print(
        f"   نیاز پتروشیمی: {petro_needs}"
    )

    # --------------------------------------------------------
    # Evaluations
    # --------------------------------------------------------

    print(
        "\n⭐ ایجاد ارزیابی‌ها..."
    )

    evaluations = create_evaluations(
        products,
        buyers
    )

    print(
        f"   ارزیابی‌ها: {len(evaluations)}"
    )

    # --------------------------------------------------------
    # Negotiations
    # --------------------------------------------------------

    print(
        "\n🤝 ایجاد مذاکرات..."
    )

    negotiations = create_negotiations(
        products,
        needs,
        buyers
    )

    print(
        f"   مذاکرات: {len(negotiations)}"
    )

    # --------------------------------------------------------
    # Views
    # --------------------------------------------------------

    print(
        "\n👁️ تنظیم بازدید محصولات..."
    )

    refresh_product_views(
        products
    )

    # --------------------------------------------------------
    # Final statistics
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print