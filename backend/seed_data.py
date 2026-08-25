# seed_data.py
# اسکریپت تولید داده‌های نمونه با تصاویر و مستندات برای تست و توسعه
# اجرا: python manage.py shell
# سپس کد زیر را کپی کنید یا فایل را به عنوان اسکریپت اجرا کنید.

import os
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal
import io
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from products.models import Product, Supply
from industries.models import IndustryCategory
from needs.models import Need
from evaluation.models import Evaluation
from negotiations.models import Negotiation
from django.utils import timezone

User = get_user_model()

# ============================================================
# پاک کردن داده‌های قبلی (اختیاری)
# ============================================================
# Product.objects.all().delete()
# Need.objects.all().delete()
# Evaluation.objects.all().delete()
# Supply.objects.all().delete()
# Negotiation.objects.all().delete()
# IndustryCategory.objects.all().delete()
# User.objects.filter(is_superuser=False).delete()

print("شروع تولید داده‌های نمونه با تصاویر و مستندات...")

# ============================================================
# ۱. ایجاد کاربران (فروشندگان و خریداران)
# ============================================================

users_data = [
    ('azadeh_karimi', 'آزاده کریمی', 'شرکت دانش بنیان پایشگر', 'azadeh@example.com'),
    ('ali_mohammadi', 'علی محمدی', 'صنایع فولاد مبارکه', 'ali@example.com'),
    ('sara_hosseini', 'سارا حسینی', 'پتروشیمی بندر امام', 'sara@example.com'),
    ('mehdi_rahmani', 'مهدی رحمانی', 'شرکت انرژی پویا', 'mehdi@example.com'),
    ('narges_ahmadi', 'نرگس احمدی', 'گروه فناوری اطلاعات صنعتی', 'narges@example.com'),
    ('reza_ghasemi', 'رضا قاسمی', 'معدن و صنایع معدنی', 'reza@example.com'),
    ('zahra_moradi', 'زهرا مرادی', 'شرکت مهندسی نفت و گاز', 'zahra@example.com'),
    ('hamid_rezai', 'حمید رضایی', 'پتروشیمی فجر', 'hamid@example.com'),
    ('leila_hashemi', 'لیلا هاشمی', 'خدمات مهندسی برق', 'leila@example.com'),
    ('saeed_karami', 'سعید کرمی', 'شرکت صنایع دارویی', 'saeed@example.com'),
]

users = {}
for username, full_name, company, email in users_data:
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'first_name': full_name.split()[0] if len(full_name.split()) >= 2 else full_name,
            'last_name': full_name.split()[1] if len(full_name.split()) >= 2 else '',
            'email': email,
            'company_name': company,
        }
    )
    if created:
        user.set_password('test1234')
        user.save()
        print(f"کاربر ایجاد شد: {username} ({full_name})")
    users[username] = user

# ============================================================
# ۲. ایجاد صنایع
# ============================================================

industry_names = [
    'نفت و گاز', 'پتروشیمی', 'فولاد و معدن', 'برق و انرژی',
    'فناوری اطلاعات', 'خودروسازی', 'داروسازی', 'کشاورزی', 'ساختمان', 'حمل و نقل'
]

industry_objs = {}
for name in industry_names:
    obj, created = IndustryCategory.objects.get_or_create(name=name)
    if created:
        print(f"صنعت ایجاد شد: {name}")
    industry_objs[name] = obj

# ============================================================
# ۳. توابع کمکی برای دریافت تصویر و ایجاد فایل مستند
# ============================================================

def get_random_image(width=600, height=400):
    """دریافت یک تصویر تصادفی از picsum.photos"""
    try:
        url = f"https://picsum.photos/{width}/{height}?random={random.randint(1, 10000)}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return ContentFile(response.content, name=f"product_{random.randint(1, 9999)}.jpg")
    except Exception as e:
        print(f"خطا در دریافت تصویر: {e}")
    return None

def create_document_file(product_title):
    """ایجاد یک فایل متنی ساده به عنوان مستندات"""
    content = f"""مستندات محصول: {product_title}

تاریخ: {timezone.now().strftime('%Y-%m-%d')}

این یک فایل مستندات نمونه برای محصول {product_title} است.
شامل مشخصات فنی، راهنمای نصب و گواهی‌ها می‌باشد.

نسخه: 1.0
تاریخ انتشار: {timezone.now().strftime('%Y-%m-%d')}

توضیحات کامل:
این محصول یک راهکار نوین در حوزه صنعتی است که با استفاده از فناوری‌های پیشرفته طراحی شده است.

مشخصات فنی:
- وزن: ۵۰ کیلوگرم
- ابعاد: ۱۲۰×۸۰×۶۰ سانتی‌متر
- توان مصرفی: ۲۲۰ ولت
- دمای کاری: ۲۰- تا ۵۰ درجه سانتی‌گراد

گواهی‌ها:
- ISO 9001
- CE
- استاندارد ملی ایران

راهنمای نصب:
1. دستگاه را در جای مناسب قرار دهید.
2. اتصالات برق را مطابق نقشه انجام دهید.
3. سیستم را روشن کنید و تنظیمات اولیه را انجام دهید.

تضمین کیفیت:
این محصول دارای ۲ سال گارانتی و ۱۰ سال خدمات پس از فروش می‌باشد.
"""
    return ContentFile(content.encode('utf-8'), name=f"document_{random.randint(1, 9999)}.txt")

# ============================================================
# ۴. تولید محصولات با تصاویر و مستندات
# ============================================================

def random_date(start_date, end_date):
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    return start_date + timedelta(days=random_days)

start_date = timezone.now() - timedelta(days=730)
end_date = timezone.now()

# لیست محصولات (همان محصولات قبلی با افزودن برخی برای تکمیل)
products_data = {
    'نفت و گاز': [
        {'title': 'سیستم پایش هوشمند چاه‌های نفت', 'short_description': 'سیستم مانیتورینگ آنلاین فشار و دبی چاه‌های نفت', 'full_description': 'سیستم پیشرفته با سنسورهای دقیق برای پایش لحظه‌ای عملکرد چاه‌ها و پیش‌بینی خرابی‌ها', 'category': 'product', 'price': 1500000000, 'trl': 9, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'دقت بالا و کاهش ۳۰٪ توقف تولید'},
        {'title': 'خدمات نقشه‌برداری زیرسطحی با روش لرزه‌نگاری', 'short_description': 'ارائه خدمات تخصصی اکتشاف نفت و گاز با روش‌های پیشرفته لرزه‌نگاری', 'full_description': 'خدمات کامل نقشه‌برداری سه‌بعدی برای شناسایی مخازن هیدروکربوری', 'category': 'service', 'price': 2500000000, 'trl': 7, 'mrl': 6, 'status': 'published', 'competitive_advantage': 'دقت ۹۵٪ در تشخیص مخازن'},
        {'title': 'راهکار کاهش خوردگی در خطوط لوله نفت و گاز', 'short_description': 'سیستم کنترل خوردگی با استفاده از پوشش‌های نانو', 'full_description': 'فناوری پوشش‌دهی داخلی لوله‌ها برای افزایش عمر مفید و کاهش هزینه‌های نگهداری', 'category': 'product', 'price': 900000000, 'trl': 6, 'mrl': 7, 'status': 'approved', 'competitive_advantage': 'کاهش ۵۰٪ هزینه‌های تعمیر و نگهداری'},
        {'title': 'سیستم اسکادا (SCADA) برای پالایشگاه‌ها', 'short_description': 'سیستم کنترل و مدیریت متمرکز فرآیندهای پالایشگاهی', 'full_description': 'نرم‌افزار و سخت‌افزار پیشرفته برای کنترل و پایش واحدهای پالایشگاهی', 'category': 'product', 'price': 3000000000, 'trl': 8, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'قابلیت یکپارچه‌سازی با تجهیزات قدیمی'},
        {'title': 'مشاوره بهینه‌سازی فرآیندهای پالایش نفت', 'short_description': 'ارائه راهکارهای بهبود بازدهی پالایشگاه‌ها', 'full_description': 'خدمات مشاوره تخصصی برای کاهش مصرف انرژی و افزایش تولید فرآورده‌های باارزش', 'category': 'service', 'price': 1200000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'تجربه موفق در ۱۰ پالایشگاه بزرگ'},
        {'title': 'سامانه مدیریت هوشمند خطوط انتقال نفت', 'short_description': 'سیستم مبتنی بر IoT برای پایش لحظه‌ای خطوط لوله', 'full_description': 'استفاده از سنسورهای فشرده و ارتباطات بی‌سیم برای مانیتورینگ خطوط لوله در مناطق دورافتاده', 'category': 'product', 'price': 1800000000, 'trl': 7, 'mrl': 6, 'status': 'in_negotiation', 'competitive_advantage': 'کاهش ۴۰٪ حوادث نشت'},
        {'title': 'سیستم بازیافت گازهای همراه نفت', 'short_description': 'فناوری جمع‌آوری و فرآوری گازهای فلر', 'full_description': 'سیستم پیشرفته برای کاهش هدررفت گازهای همراه و تولید محصولات جانبی', 'category': 'product', 'price': 2200000000, 'trl': 8, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'بازگشت سرمایه ۱۸ ماهه'},
        {'title': 'خدمات مهندسی و طراحی تأسیسات نفت و گاز', 'short_description': 'ارائه خدمات طراحی، نظارت و راه‌اندازی تأسیسات نفت و گاز', 'full_description': 'خدمات جامع مهندسی از مرحله مطالعه تا بهره‌برداری', 'category': 'service', 'price': 800000000, 'trl': 9, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'تیم مهندسی با ۲۰ سال تجربه'},
        {'title': 'دستگاه آنالایزر ترکیبات گاز طبیعی', 'short_description': 'دستگاه قابل حمل برای آنالیز ترکیبات گاز در میدان', 'full_description': 'دستگاه دقیق اندازه‌گیری ترکیبات گاز طبیعی با قابلیت ذخیره‌سازی داده', 'category': 'product', 'price': 450000000, 'trl': 7, 'mrl': 7, 'status': 'approved', 'competitive_advantage': 'دقت بالا در شرایط سخت محیطی'},
        {'title': 'سیستم مدیریت دارایی‌های نفت و گاز', 'short_description': 'نرم‌افزار مدیریت یکپارچه دارایی‌های فیزیکی', 'full_description': 'راهکار نرم‌افزاری برای مدیریت چرخه عمر تجهیزات از خرید تا اسقاط', 'category': 'product', 'price': 600000000, 'trl': 6, 'mrl': 5, 'status': 'published', 'competitive_advantage': 'یکپارچگی با سیستم‌های SCADA و ERP'},
    ],
    'پتروشیمی': [
        {'title': 'کاتالیست پیشرفته تبدیل متانول به الفین', 'short_description': 'کاتالیست با کارایی بالا برای واحدهای الفین', 'full_description': 'کاتالیست نسل جدید با افزایش ۱۵٪ بازدهی و کاهش مصرف انرژی', 'category': 'product', 'price': 250000000, 'trl': 8, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'کاهش ۲۰٪ مصرف کاتالیست'},
        {'title': 'خدمات تعمیر و نگهداری تخصصی مبدل‌های حرارتی', 'short_description': 'ارائه خدمات تعمیر، نظافت و بهینه‌سازی مبدل‌های حرارتی', 'full_description': 'خدمات تخصصی شامل شستشوی شیمیایی، تعویض لوله‌ها و تست فشار', 'category': 'service', 'price': 150000000, 'trl': 9, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'کاهش ۳۰٪ زمان توقف'},
        {'title': 'سیستم کنترل فرآیند پلیمریزاسیون', 'short_description': 'سیستم کنترل هوشمند برای واحدهای تولید پلیمر', 'full_description': 'سیستم DCS پیشرفته برای کنترل دقیق پارامترهای پلیمریزاسیون', 'category': 'product', 'price': 800000000, 'trl': 7, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'دقت ۰٫۵٪ در کنترل دما'},
        {'title': 'سامانه مدیریت انرژی پتروشیمی', 'short_description': 'نرم‌افزار بهینه‌سازی مصرف انرژی در واحدهای پتروشیمی', 'full_description': 'پلتفرم تحلیل و مدیریت مصرف انرژی با قابلیت پیش‌بینی و بهینه‌سازی', 'category': 'service', 'price': 600000000, 'trl': 8, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'کاهش ۱۲٪ مصرف انرژی'},
        {'title': 'راهکار تصفیه پساب پتروشیمی با غشاهای نانو', 'short_description': 'سیستم تصفیه پیشرفته با استفاده از غشاهای نانویی', 'full_description': 'فناوری ممبران برای تصفیه پساب‌های صنعتی و بازچرخانی آب', 'category': 'product', 'price': 350000000, 'trl': 6, 'mrl': 6, 'status': 'in_negotiation', 'competitive_advantage': 'بازچرخانی ۸۰٪ آب'},
        {'title': 'مشاوره توسعه محصولات پلیمری جدید', 'short_description': 'ارائه خدمات تحقیق و توسعه برای تولید پلیمرهای پیشرفته', 'full_description': 'خدمات مشاوره در زمینه تولید پلیمرهای خاص با کاربردهای صنعتی', 'category': 'service', 'price': 400000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'دارای آزمایشگاه پیشرفته R&D'},
        {'title': 'سیستم پایش آنلاین آلاینده‌های هوا', 'short_description': 'سیستم دقیق سنجش آلاینده‌های خروجی از دودکش‌ها', 'full_description': 'دستگاه آنالایزر گازهای خروجی با قابلیت اتصال به شبکه', 'category': 'product', 'price': 280000000, 'trl': 8, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'قابلیت اندازه‌گیری ۸ نوع آلاینده'},
        {'title': 'خدمات کالیبراسیون تجهیزات ابزار دقیق', 'short_description': 'ارائه خدمات کالیبراسیون و تعمیرات تجهیزات اندازه‌گیری', 'full_description': 'خدمات دوره‌ای کالیبراسیون برای تجهیزات فشار، دما، سطح و دبی', 'category': 'service', 'price': 120000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'گواهینامه ISO 17025'},
        {'title': 'سیستم بازیابی حلال‌های صنعتی', 'short_description': 'راهکار بازیافت و تصفیه حلال‌های مصرفی', 'full_description': 'سیستم تقطیر و بازیابی حلال‌های آلی با راندمان بالا', 'category': 'product', 'price': 750000000, 'trl': 7, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'بازیافت ۹۵٪ حلال'},
        {'title': 'سامانه یکپارچه مدیریت کیفیت محصولات پتروشیمی', 'short_description': 'نرم‌افزار کنترل کیفیت بر اساس استانداردهای بین‌المللی', 'full_description': 'سیستم مدیریت کیفیت برای پایش و بهبود مشخصات محصولات پتروشیمی', 'category': 'service', 'price': 500000000, 'trl': 8, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'یکپارچگی با LIMS'},
    ],
    'فولاد و معدن': [
        {'title': 'سیستم اتوماسیون کوره‌های قوس الکتریکی', 'short_description': 'کنترل هوشمند کوره‌های ذوب فولاد', 'full_description': 'سیستم کنترل پیشرفته برای بهینه‌سازی مصرف انرژی و کیفیت فولاد', 'category': 'product', 'price': 1200000000, 'trl': 7, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'کاهش ۱۵٪ مصرف برق'},
        {'title': 'خدمات آنالیز شیمیایی مواد معدنی', 'short_description': 'ارائه خدمات آزمایشگاهی برای آنالیز سنگ‌آهن و کنسانتره', 'full_description': 'خدمات آنالیز دقیق عناصر با استفاده از روش‌های XRF و ICP', 'category': 'service', 'price': 300000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'دقت نتایج در سطح آزمایشگاه‌های مرجع'},
        {'title': 'سیستم مدیریت نوار نقاله‌های معادن', 'short_description': 'سیستم مانیتورینگ و کنترل نوار نقاله‌های طولانی', 'full_description': 'سیستم مبتنی بر IoT برای پایش شرایط نوار نقاله و پیش‌بینی خرابی', 'category': 'product', 'price': 650000000, 'trl': 6, 'mrl': 6, 'status': 'approved', 'competitive_advantage': 'کاهش ۲۵٪ توقف‌های ناخواسته'},
        {'title': 'مشاوره کاهش باطله در کارخانجات فرآوری', 'short_description': 'ارائه راهکارهای افزایش عیار و کاهش باطله', 'full_description': 'خدمات مشاوره برای بهینه‌سازی فرآیندهای خردایش و فلوتاسیون', 'category': 'service', 'price': 450000000, 'trl': 8, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'افزایش ۵٪ عیار کنسانتره'},
        {'title': 'سیستم پایش کیفیت محصولات فولادی', 'short_description': 'سیستم بازرسی غیرمخرب با استفاده از اولتراسونیک', 'full_description': 'دستگاه پیشرفته برای تشخیص عیوب داخلی مقاطع فولادی', 'category': 'product', 'price': 550000000, 'trl': 8, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'دقت تشخیص ۹۹٪'},
        {'title': 'خدمات طراحی سیستم‌های انتقال مواد در معادن', 'short_description': 'طراحی و مشاوره سیستم‌های انتقال مواد معدنی', 'full_description': 'خدمات مهندسی برای طراحی سیستم‌های نوار نقاله، اسکرو و پمپ‌های دوغاب', 'category': 'service', 'price': 350000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'استفاده از نرم‌افزارهای پیشرفته شبیه‌سازی'},
        {'title': 'سیستم تصفیه پساب معادن', 'short_description': 'راهکار تصفیه و بازیابی آب در معادن', 'full_description': 'سیستم تصفیه فیزیکی-شیمیایی برای کاهش آلاینده‌های پساب معادن', 'category': 'product', 'price': 500000000, 'trl': 7, 'mrl': 6, 'status': 'published', 'competitive_advantage': 'بازیابی ۸۵٪ آب'},
        {'title': 'سامانه مدیریت ایمنی و بهداشت در معادن', 'short_description': 'نرم‌افزار جامع مدیریت ایمنی و بهداشت حرفه‌ای', 'full_description': 'سیستم ثبت و تحلیل حوادث، ارزیابی ریسک و مدیریت آموزش', 'category': 'product', 'price': 200000000, 'trl': 6, 'mrl': 6, 'status': 'draft', 'competitive_advantage': 'یکپارچگی با سیستم‌های HSE'},
        {'title': 'خدمات کالیبراسیون ترازوهای صنعتی', 'short_description': 'ارائه خدمات کالیبراسیون ترازوهای دقیق صنعتی', 'full_description': 'خدمات دوره‌ای کالیبراسیون برای ترازوهای باسکول، لودسل و ...', 'category': 'service', 'price': 80000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'استاندارد ISO 9001'},
        {'title': 'سیستم حمل و نقل هوشمند در معادن روباز', 'short_description': 'سیستم هدایت خودروهای معدنی با GPS', 'full_description': 'سیستم مدیریت ناوگان برای کاهش زمان حمل و افزایش بهره‌وری', 'category': 'product', 'price': 800000000, 'trl': 7, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'افزایش ۲۰٪ بهره‌وری حمل'},
    ],
    'برق و انرژی': [
        {'title': 'سیستم مدیریت انرژی هوشمند (EMS)', 'short_description': 'نرم‌افزار بهینه‌سازی مصرف انرژی در ساختمان‌ها و کارخانجات', 'full_description': 'پلتفرم مبتنی بر IoT برای پایش و کنترل مصرف انرژی', 'category': 'product', 'price': 400000000, 'trl': 8, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'کاهش ۲۰٪ مصرف انرژی'},
        {'title': 'خدمات مشاوره انرژی‌های تجدیدپذیر', 'short_description': 'ارائه مشاوره برای احداث نیروگاه‌های خورشیدی و بادی', 'full_description': 'خدمات مطالعات امکان‌سنجی، طراحی و نظارت بر اجرا', 'category': 'service', 'price': 600000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'تجربه اجرای ۵۰ مگاوات نیروگاه'},
        {'title': 'دستگاه آنالایزر کیفیت برق', 'short_description': 'دستگاه قابل حمل برای اندازه‌گیری پارامترهای کیفیت برق', 'full_description': 'اندازه‌گیری هارمونیک‌ها، نوسانات و ضریب توان در شبکه‌های صنعتی', 'category': 'product', 'price': 180000000, 'trl': 7, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'دقت بالا در فرکانس‌های بالا'},
        {'title': 'سیستم پایش وضعیت ترانسفورماتورها', 'short_description': 'سیستم آنلاین برای تشخیص خرابی‌های ترانسفورماتور', 'full_description': 'استفاده از سنسورهای گاز و دما برای پایش وضعیت روغن و عایق', 'category': 'product', 'price': 700000000, 'trl': 6, 'mrl': 6, 'status': 'in_negotiation', 'competitive_advantage': 'تشخیص ۹۰٪ خرابی‌ها قبل از وقوع'},
        {'title': 'خدمات بهینه‌سازی شبکه‌های توزیع برق', 'short_description': 'ارائه راهکارهای کاهش تلفات و افزایش پایداری شبکه', 'full_description': 'خدمات شبیه‌سازی و اصلاح شبکه‌های توزیع', 'category': 'service', 'price': 500000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'کاهش تلفات تا ۱۵٪'},
        {'title': 'سیستم مانیتورینگ نیروگاه‌های خورشیدی', 'short_description': 'پلتفرم پایش و کنترل نیروگاه‌های خورشیدی', 'full_description': 'سیستم مبتنی بر وب برای پایش تولید، کارایی و عیب‌یابی پنل‌ها', 'category': 'product', 'price': 300000000, 'trl': 8, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'قابلیت یکپارچه‌سازی با سیستم‌های ذخیره‌ساز'},
        {'title': 'خدمات طراحی سیستم‌های روشنایی هوشمند', 'short_description': 'طراحی و مشاوره سیستم‌های روشنایی LED با کنترل هوشمند', 'full_description': 'خدمات مهندسی روشنایی برای بهینه‌سازی مصرف و کیفیت نور', 'category': 'service', 'price': 150000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'صرفه‌جویی تا ۶۰٪'},
        {'title': 'سیستم ذخیره‌سازی انرژی باتری‌های لیتیوم-یون', 'short_description': 'سیستم ذخیره‌سازی انرژی برای کاربردهای صنعتی', 'full_description': 'باتری‌های پیشرفته با مدیریت هوشمند شارژ و دشارژ', 'category': 'product', 'price': 950000000, 'trl': 6, 'mrl': 5, 'status': 'published', 'competitive_advantage': 'عمر مفید بالا و راندمان ۹۵٪'},
        {'title': 'سامانه مدیریت مصرف برق در صنایع', 'short_description': 'نرم‌افزار مدیریت بار و کاهش پیک مصرف', 'full_description': 'سیستم برنامه‌ریزی مصرف برق برای کاهش هزینه‌های انرژی', 'category': 'product', 'price': 350000000, 'trl': 8, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'کاهش ۱۵٪ هزینه برق'},
        {'title': 'خدمات ممیزی انرژی', 'short_description': 'ارائه خدمات ممیزی انرژی در صنایع مختلف', 'full_description': 'ممیزی جامع انرژی شامل شناسایی فرصت‌های صرفه‌جویی', 'category': 'service', 'price': 200000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'گواهینامه ممیزی انرژی از سازمان بهره‌وری'},
    ],
    'فناوری اطلاعات': [
        {'title': 'پلتفرم تحلیل داده‌های کلان صنعتی', 'short_description': 'سیستم تحلیل داده‌های حجیم برای صنایع تولیدی', 'full_description': 'راهکار جامع برای جمع‌آوری، ذخیره‌سازی و تحلیل داده‌های صنعتی با استفاده از هوش مصنوعی', 'category': 'product', 'price': 600000000, 'trl': 8, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'پردازش داده در زمان واقعی'},
        {'title': 'خدمات پیاده‌سازی سیستم‌های ERP صنعتی', 'short_description': 'پیاده‌سازی و سفارشی‌سازی نرم‌افزارهای برنامه‌ریزی منابع سازمان', 'full_description': 'خدمات جامع پیاده‌سازی ERP با رویکرد صنعتی و تولیدی', 'category': 'service', 'price': 800000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'تجربه در صنایع بزرگ'},
        {'title': 'سیستم مدیریت دارایی‌های دیجیتال', 'short_description': 'نرم‌افزار مدیریت اسناد و مدارک دیجیتال', 'full_description': 'سیستم جامع مدیریت محتوا و اسناد با قابلیت جستجوی هوشمند', 'category': 'product', 'price': 250000000, 'trl': 7, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'یکپارچگی با سیستم‌های موجود'},
        {'title': 'سامانه امنیت سایبری صنعتی', 'short_description': 'راهکار حفاظت از شبکه‌های صنعتی و SCADA', 'full_description': 'سیستم تشخیص و پاسخ به تهدیدات سایبری در محیط‌های صنعتی', 'category': 'product', 'price': 450000000, 'trl': 6, 'mrl': 6, 'status': 'approved', 'competitive_advantage': 'انطباق با استانداردهای IEC 62443'},
        {'title': 'خدمات مشاوره تحول دیجیتال', 'short_description': 'ارائه نقشه راه دیجیتالی‌سازی برای سازمان‌ها', 'full_description': 'خدمات مشاوره برای شناسایی فرصت‌های دیجیتالی‌سازی و پیاده‌سازی', 'category': 'service', 'price': 700000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'استفاده از روش‌های نوین'},
        {'title': 'سیستم هوش مصنوعی برای پیش‌بینی خرابی تجهیزات', 'short_description': 'نرم‌افزار مبتنی بر یادگیری ماشین برای نگهداری پیش‌بینی‌کننده', 'full_description': 'سیستم تحلیل داده‌های حسگرها برای پیش‌بینی خرابی‌ها و برنامه‌ریزی تعمیرات', 'category': 'product', 'price': 550000000, 'trl': 7, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'دقت پیش‌بینی ۸۵٪'},
        {'title': 'خدمات پیاده‌سازی اینترنت اشیاء صنعتی', 'short_description': 'پیاده‌سازی شبکه‌های حسگر و ارتباطات IoT', 'full_description': 'خدمات جامع شامل طراحی، نصب و راه‌اندازی شبکه‌های IoT', 'category': 'service', 'price': 500000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'پشتیبانی از پروتکل‌های متنوع'},
        {'title': 'سامانه مدیریت یکپارچه هوش تجاری', 'short_description': 'داشبورد مدیریتی برای تصمیم‌گیری مبتنی بر داده', 'full_description': 'پلتفرم BI برای نمایش شاخص‌های کلیدی عملکرد (KPI)', 'category': 'product', 'price': 300000000, 'trl': 8, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'قابلیت اتصال به منابع داده مختلف'},
        {'title': 'خدمات توسعه اپلیکیشن‌های موبایل صنعتی', 'short_description': 'طراحی و توسعه اپلیکیشن‌های موبایل برای کارکنان صنعتی', 'full_description': 'توسعه اپلیکیشن‌های سفارشی برای مدیریت تولید، کنترل کیفیت و ...', 'category': 'service', 'price': 200000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'تیم متخصص بومی'},
        {'title': 'سیستم مدیریت فرآیندهای کسب‌وکار (BPM)', 'short_description': 'نرم‌افزار طراحی و اجرای فرآیندهای سازمانی', 'full_description': 'سیستم مدل‌سازی و اتوماسیون گردش کار با قابلیت یکپارچه‌سازی', 'category': 'product', 'price': 400000000, 'trl': 7, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'قابلیت شخصی‌سازی بالا'},
    ],
}

# افزودن صنایع دیگر
extra_industries = {
    'خودروسازی': [
        {'title': 'سیستم کنترل کیفیت بدنه خودرو', 'short_description': 'سیستم بازرسی بدنه با استفاده از بینایی ماشین', 'full_description': 'سیستم تشخیص عیوب سطحی و ابعادی بدنه خودرو', 'category': 'product', 'price': 350000000, 'trl': 8, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'دقت بالا در تشخیص عیوب'},
        {'title': 'خدمات مشاوره مهندسی خودرو', 'short_description': 'ارائه خدمات مشاوره در زمینه طراحی و توسعه خودرو', 'full_description': 'خدمات مهندسی شامل طراحی سیستم‌های تعلیق، ترمز و فرمان', 'category': 'service', 'price': 500000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'تیم با تجربه بین‌المللی'},
    ],
    'داروسازی': [
        {'title': 'سیستم کنترل کیفی دارو با HPLC', 'short_description': 'دستگاه HPLC برای آنالیز ترکیبات دارویی', 'full_description': 'دستگاه کروماتوگرافی مایع با کارایی بالا برای کنترل کیفیت', 'category': 'product', 'price': 600000000, 'trl': 9, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'دقت بالا در تشخیص ناخالصی‌ها'},
        {'title': 'خدمات مشاوره GMP در داروسازی', 'short_description': 'ارائه خدمات مشاوره برای پیاده‌سازی GMP', 'full_description': 'خدمات مشاوره جهت انطباق با استانداردهای تولید خوب', 'category': 'service', 'price': 300000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'تخصص در صنایع دارویی'},
    ],
    'کشاورزی': [
        {'title': 'سیستم آبیاری هوشمند', 'short_description': 'سیستم کنترل هوشمند آبیاری بر اساس رطوبت خاک', 'full_description': 'سیستم مبتنی بر سنسورهای رطوبت و هواشناسی برای بهینه‌سازی مصرف آب', 'category': 'product', 'price': 180000000, 'trl': 7, 'mrl': 6, 'status': 'published', 'competitive_advantage': 'کاهش ۳۰٪ مصرف آب'},
        {'title': 'خدمات مشاوره کشاورزی دقیق', 'short_description': 'ارائه راهکارهای کشاورزی دقیق با استفاده از تصاویر ماهواره‌ای', 'full_description': 'خدمات تحلیل داده‌های ماهواره‌ای برای مدیریت مزارع', 'category': 'service', 'price': 200000000, 'trl': 8, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'دقت بالا در تحلیل'},
    ],
    'ساختمان': [
        {'title': 'سیستم مدیریت انرژی ساختمان (BEMS)', 'short_description': 'سیستم هوشمند مدیریت انرژی در ساختمان‌ها', 'full_description': 'سیستم کنترل HVAC، روشنایی و سایر مصرف‌کننده‌های انرژی', 'category': 'product', 'price': 250000000, 'trl': 8, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'صرفه‌جویی تا ۲۵٪'},
        {'title': 'خدمات طراحی سازه‌های فولادی', 'short_description': 'طراحی و محاسبه سازه‌های فولادی برای ساختمان‌ها', 'full_description': 'خدمات مهندسی سازه با استفاده از نرم‌افزارهای پیشرفته', 'category': 'service', 'price': 150000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'رعایت استانداردهای بین‌المللی'},
    ],
    'حمل و نقل': [
        {'title': 'سیستم مدیریت ناوگان حمل و نقل', 'short_description': 'سیستم GPS برای ردیابی و مدیریت ناوگان', 'full_description': 'پلتفرم مدیریت ناوگان با قابلیت ردیابی لحظه‌ای و تحلیل مسیر', 'category': 'product', 'price': 300000000, 'trl': 8, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'کاهش ۲۰٪ هزینه‌های سوخت'},
        {'title': 'خدمات مشاوره لجستیک و زنجیره تامین', 'short_description': 'ارائه مشاوره بهینه‌سازی زنجیره تامین و لجستیک', 'full_description': 'خدمات تحلیل و بهبود فرآیندهای لجستیکی', 'category': 'service', 'price': 400000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'تجربه در صنایع بزرگ'},
    ],
}

for industry_name, products in extra_industries.items():
    if industry_name in products_data:
        products_data[industry_name].extend(products)
    else:
        products_data[industry_name] = products

# ایجاد محصولات با تصویر و مستندات
for industry_name, product_list in products_data.items():
    industry = industry_objs.get(industry_name)
    if not industry:
        continue
    for data in product_list:
        seller = random.choice(list(users.values()))
        product, created = Product.objects.get_or_create(
            title=data['title'],
            defaults={
                'seller': seller,
                'industry': industry,
                'short_description': data['short_description'],
                'full_description': data.get('full_description', ''),
                'category': data['category'],
                'price': data['price'],
                'trl': data['trl'],
                'mrl': data['mrl'],
                'status': data['status'],
                'competitive_advantage': data.get('competitive_advantage', ''),
                'created_at': random_date(start_date, end_date),
            }
        )
        if created:
            # افزودن تصویر (برای ۸۰٪ محصولات)
            if random.random() < 0.8:
                image_content = get_random_image()
                if image_content:
                    product.image.save(f"product_{product.id}.jpg", image_content, save=True)
                    print(f"تصویر برای محصول {product.title} اضافه شد.")

            # افزودن مستندات (برای ۵۰٪ محصولات)
            if random.random() < 0.5:
                doc_content = create_document_file(product.title)
                product.documentation.save(f"document_{product.id}.txt", doc_content, save=True)
                print(f"مستندات برای محصول {product.title} اضافه شد.")

            print(f"محصول ایجاد شد: {product.title} (صنعت: {industry_name})")

# ============================================================
# ۵. تولید نیازها
# ============================================================

need_data = [
    {'title': 'نیاز به سیستم پایش چاه‌های نفت', 'description': 'به دنبال سیستمی برای پایش فشار و دبی چاه‌های نفت هستیم.', 'industry': 'نفت و گاز', 'status': 'published', 'budget': 800000000, 'timeline': '۶ ماه'},
    {'title': 'مشاور توسعه میدان نفتی', 'description': 'نیاز به مشاور برای طراحی و توسعه میدان نفتی جدید.', 'industry': 'نفت و گاز', 'status': 'receiving_proposals', 'budget': 1500000000, 'timeline': '۱۲ ماه'},
    {'title': 'خرید کاتالیست پتروشیمی', 'description': 'نیاز به تامین کاتالیست با کیفیت بالا برای واحد الفین.', 'industry': 'پتروشیمی', 'status': 'published', 'budget': 200000000, 'timeline': '۳ ماه'},
    {'title': 'مشاور بهینه‌سازی واحدهای پتروشیمی', 'description': 'به دنبال مشاور برای افزایش بازدهی واحدهای پتروشیمی.', 'industry': 'پتروشیمی', 'status': 'evaluating', 'budget': 500000000, 'timeline': '۹ ماه'},
    {'title': 'سیستم اتوماسیون کوره فولاد', 'description': 'نیاز به سیستم کنترل هوشمند کوره‌های فولاد.', 'industry': 'فولاد و معدن', 'status': 'published', 'budget': 700000000, 'timeline': '۴ ماه'},
    {'title': 'مشاور کاهش باطله معدن', 'description': 'نیاز به مشاور برای کاهش باطله در کارخانه فرآوری.', 'industry': 'فولاد و معدن', 'status': 'matched', 'budget': 300000000, 'timeline': '۶ ماه'},
    {'title': 'سیستم مدیریت انرژی', 'description': 'نیاز به سیستم مدیریت انرژی برای کارخانه تولیدی.', 'industry': 'برق و انرژی', 'status': 'published', 'budget': 400000000, 'timeline': '۵ ماه'},
    {'title': 'مشاور نیروگاه خورشیدی', 'description': 'نیاز به مشاور برای احداث نیروگاه خورشیدی ۱۰ مگاواتی.', 'industry': 'برق و انرژی', 'status': 'receiving_proposals', 'budget': 2000000000, 'timeline': '۱۸ ماه'},
    {'title': 'سامانه تحلیل داده‌های صنعتی', 'description': 'نیاز به پلتفرم تحلیل داده‌های حجیم برای صنعت.', 'industry': 'فناوری اطلاعات', 'status': 'published', 'budget': 500000000, 'timeline': '۶ ماه'},
    {'title': 'پیاده‌سازی ERP صنعتی', 'description': 'نیاز به پیاده‌سازی نرم‌افزار ERP برای صنعت تولیدی.', 'industry': 'فناوری اطلاعات', 'status': 'evaluating', 'budget': 800000000, 'timeline': '۱۲ ماه'},
    {'title': 'سیستم کنترل کیفیت خودرو', 'description': 'نیاز به سیستم بازرسی بدنه خودرو با بینایی ماشین.', 'industry': 'خودروسازی', 'status': 'published', 'budget': 300000000, 'timeline': '۴ ماه'},
    {'title': 'مشاور طراحی خودرو', 'description': 'نیاز به مشاور برای طراحی سیستم‌های خودرو.', 'industry': 'خودروسازی', 'status': 'receiving_proposals', 'budget': 400000000, 'timeline': '۸ ماه'},
    {'title': 'دستگاه HPLC برای داروسازی', 'description': 'نیاز به دستگاه HPLC با دقت بالا برای کنترل کیفیت.', 'industry': 'داروسازی', 'status': 'published', 'budget': 500000000, 'timeline': '۳ ماه'},
    {'title': 'مشاور GMP در داروسازی', 'description': 'نیاز به مشاور برای پیاده‌سازی GMP.', 'industry': 'داروسازی', 'status': 'evaluating', 'budget': 200000000, 'timeline': '۶ ماه'},
    {'title': 'سیستم آبیاری هوشمند', 'description': 'نیاز به سیستم آبیاری هوشمند برای مزرعه.', 'industry': 'کشاورزی', 'status': 'published', 'budget': 150000000, 'timeline': '۲ ماه'},
    {'title': 'مشاور کشاورزی دقیق', 'description': 'نیاز به مشاور کشاورزی دقیق با استفاده از تصاویر ماهواره‌ای.', 'industry': 'کشاورزی', 'status': 'receiving_proposals', 'budget': 180000000, 'timeline': '۴ ماه'},
    {'title': 'سیستم BEMS برای ساختمان', 'description': 'نیاز به سیستم مدیریت انرژی برای ساختمان اداری.', 'industry': 'ساختمان', 'status': 'published', 'budget': 200000000, 'timeline': '۳ ماه'},
    {'title': 'مشاور سازه‌های فولادی', 'description': 'نیاز به مشاور برای طراحی سازه‌های فولادی.', 'industry': 'ساختمان', 'status': 'matched', 'budget': 120000000, 'timeline': '۵ ماه'},
    {'title': 'سیستم مدیریت ناوگان', 'description': 'نیاز به سیستم GPS برای مدیریت ناوگان حمل و نقل.', 'industry': 'حمل و نقل', 'status': 'published', 'budget': 250000000, 'timeline': '۴ ماه'},
    {'title': 'مشاور لجستیک', 'description': 'نیاز به مشاور برای بهینه‌سازی زنجیره تامین.', 'industry': 'حمل و نقل', 'status': 'receiving_proposals', 'budget': 350000000, 'timeline': '۶ ماه'},
]

for data in need_data:
    industry = industry_objs.get(data['industry'])
    if not industry:
        continue
    buyer = random.choice(list(users.values()))
    need, created = Need.objects.get_or_create(
        title=data['title'],
        defaults={
            'buyer': buyer,
            'description': data['description'],
            'industry': industry,
            'status': data['status'],
            'budget': data['budget'],
            'timeline': data['timeline'],
            'created_at': random_date(start_date, end_date),
        }
    )
    if created:
        print(f"نیاز ایجاد شد: {need.title} (صنعت: {data['industry']})")

# ============================================================
# ۶. تولید ارزیابی
# ============================================================

products = Product.objects.all()
for product in products:
    if not Evaluation.objects.filter(product=product).exists():
        evaluator = random.choice(list(users.values()))
        Evaluation.objects.create(
            product=product,
            evaluator=evaluator,
            quality_score=random.randint(60, 95),
            risk_score=random.randint(10, 40),
            market_readiness_score=random.randint(60, 90),
            final_decision=random.choice(['approved', 'approved', 'approved', 'conditional', 'rejected']),
            comments='ارزیابی خودکار برای تست',
            created_at=random_date(start_date, end_date),
        )
        print(f"ارزیابی برای محصول {product.title} ایجاد شد.")

# ============================================================
# ۷. تولید داده‌های عرضه (Supply)
# ============================================================

supply_data = [
    {'title': 'تامین تجهیزات پالایشگاهی', 'supply_type': 'product', 'category': 'تجهیزات صنعتی', 'industry': 'نفت و گاز', 'price': 500000000, 'trl': '8', 'status': 'published'},
    {'title': 'خدمات تعمیرات پتروشیمی', 'supply_type': 'service', 'category': 'خدمات تعمیرات', 'industry': 'پتروشیمی', 'price': 200000000, 'trl': '9', 'status': 'published'},
    {'title': 'تامین قطعات یدکی معدن', 'supply_type': 'product', 'category': 'قطعات یدکی', 'industry': 'فولاد و معدن', 'price': 100000000, 'trl': '7', 'status': 'approved'},
    {'title': 'خدمات مشاوره انرژی', 'supply_type': 'service', 'category': 'مشاوره', 'industry': 'برق و انرژی', 'price': 300000000, 'trl': '9', 'status': 'published'},
    {'title': 'نرم‌افزار مدیریت تولید', 'supply_type': 'product', 'category': 'نرم‌افزار', 'industry': 'فناوری اطلاعات', 'price': 250000000, 'trl': '8', 'status': 'published'},
]

if Supply is not None:
    for data in supply_data:
        seller = random.choice(list(users.values()))
        supply, created = Supply.objects.get_or_create(
            title=data['title'],
            defaults={
                'seller': seller,
                'supply_type': data['supply_type'],
                'category': data['category'],
                'industry': data['industry'],
                'price': data['price'],
                'trl': data['trl'],
                'status': data['status'],
                'description': f"توصیف {data['title']}",
                'quantity': '۱',
                'unit': 'واحد',
                'created_at': random_date(start_date, end_date),
            }
        )
        if created:
            print(f"عرضه ایجاد شد: {supply.title}")

print("تولید داده‌های نمونه با موفقیت به پایان رسید.")
print(f"تعداد کاربران: {User.objects.count()}")
print(f"تعداد صنایع: {IndustryCategory.objects.count()}")
print(f"تعداد محصولات: {Product.objects.count()}")
print(f"تعداد محصولات دارای تصویر: {Product.objects.exclude(image='').count()}")
print(f"تعداد محصولات دارای مستندات: {Product.objects.exclude(documentation='').count()}")
print(f"تعداد نیازها: {Need.objects.count()}")
print(f"تعداد ارزیابی‌ها: {Evaluation.objects.count()}")
if Supply is not None:
    print(f"تعداد عرضه‌ها: {Supply.objects.count()}")