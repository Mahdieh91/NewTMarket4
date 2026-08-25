# seed_data.py
# اسکریپت تولید داده‌های نمونه برای صفحه Market Intelligence
# اجرا: python manage.py shell (توصیه شده) یا python seed_data.py (پس از اصلاح مدل)

import os
import django
import random
from datetime import timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils import timezone
from products.models import Product, Supply
from industries.models import IndustryCategory
from needs.models import Need
from evaluations.models import Evaluation
from negotiations.models import Negotiation

User = get_user_model()

# ============================================================
# توابع کمکی
# ============================================================

def random_date(start_date, end_date):
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    return start_date + timedelta(days=random_days)

def get_random_image():
    """دریافت تصویر از picsum.photos (اختیاری)"""
    try:
        import requests
        url = f"https://picsum.photos/600/400?random={random.randint(1,10000)}"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return ContentFile(response.content, name=f"product_{random.randint(1,9999)}.jpg")
    except Exception:
        pass
    return None

# ============================================================
# ۱. ایجاد کاربران (در صورت عدم وجود)
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
    ('mahdi_ahmadi', 'مهدی احمدی', 'پتروشیمی تبریز', 'mahdi@example.com'),
    ('faezeh_nouri', 'فائزه نوری', 'شرکت اکتشاف نفت', 'faezeh@example.com'),
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
    users[username] = user

print(f"✅ {len(users)} کاربر ایجاد/بارگیری شد.")

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
    industry_objs[name] = obj

print(f"✅ {len(industry_objs)} صنعت ایجاد/بارگیری شد.")

# ============================================================
# ۳. تولید محصولات (با تأکید بر پتروشیمی و صنایع مرتبط)
# ============================================================

start_date = timezone.now() - timedelta(days=730)
end_date = timezone.now()

# لیست محصولات با تنوع بالا (بیشتر پتروشیمی)
product_templates = [
    # -------------------- پتروشیمی (حدود ۱۵ محصول) --------------------
    {'title': 'کاتالیست پیشرفته تبدیل متانول به الفین', 'short_description': 'کاتالیست با کارایی بالا برای واحدهای الفین', 'full_description': 'کاتالیست نسل جدید با افزایش ۱۵٪ بازدهی و کاهش مصرف انرژی', 'category': 'product', 'price': 250000000, 'trl': 8, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'کاهش ۲۰٪ مصرف کاتالیست', 'industry': 'پتروشیمی'},
    {'title': 'خدمات تعمیر و نگهداری تخصصی مبدل‌های حرارتی', 'short_description': 'ارائه خدمات تعمیر، نظافت و بهینه‌سازی مبدل‌های حرارتی', 'full_description': 'خدمات تخصصی شامل شستشوی شیمیایی، تعویض لوله‌ها و تست فشار', 'category': 'service', 'price': 150000000, 'trl': 9, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'کاهش ۳۰٪ زمان توقف', 'industry': 'پتروشیمی'},
    {'title': 'سیستم کنترل فرآیند پلیمریزاسیون', 'short_description': 'سیستم کنترل هوشمند برای واحدهای تولید پلیمر', 'full_description': 'سیستم DCS پیشرفته برای کنترل دقیق پارامترهای پلیمریزاسیون', 'category': 'product', 'price': 800000000, 'trl': 7, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'دقت ۰٫۵٪ در کنترل دما', 'industry': 'پتروشیمی'},
    {'title': 'سامانه مدیریت انرژی پتروشیمی', 'short_description': 'نرم‌افزار بهینه‌سازی مصرف انرژی در واحدهای پتروشیمی', 'full_description': 'پلتفرم تحلیل و مدیریت مصرف انرژی با قابلیت پیش‌بینی و بهینه‌سازی', 'category': 'service', 'price': 600000000, 'trl': 8, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'کاهش ۱۲٪ مصرف انرژی', 'industry': 'پتروشیمی'},
    {'title': 'راهکار تصفیه پساب پتروشیمی با غشاهای نانو', 'short_description': 'سیستم تصفیه پیشرفته با استفاده از غشاهای نانویی', 'full_description': 'فناوری ممبران برای تصفیه پساب‌های صنعتی و بازچرخانی آب', 'category': 'product', 'price': 350000000, 'trl': 6, 'mrl': 6, 'status': 'in_negotiation', 'competitive_advantage': 'بازچرخانی ۸۰٪ آب', 'industry': 'پتروشیمی'},
    {'title': 'مشاوره توسعه محصولات پلیمری جدید', 'short_description': 'ارائه خدمات تحقیق و توسعه برای تولید پلیمرهای پیشرفته', 'full_description': 'خدمات مشاوره در زمینه تولید پلیمرهای خاص با کاربردهای صنعتی', 'category': 'service', 'price': 400000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'دارای آزمایشگاه پیشرفته R&D', 'industry': 'پتروشیمی'},
    {'title': 'سیستم پایش آنلاین آلاینده‌های هوا', 'short_description': 'سیستم دقیق سنجش آلاینده‌های خروجی از دودکش‌ها', 'full_description': 'دستگاه آنالایزر گازهای خروجی با قابلیت اتصال به شبکه', 'category': 'product', 'price': 280000000, 'trl': 8, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'قابلیت اندازه‌گیری ۸ نوع آلاینده', 'industry': 'پتروشیمی'},
    {'title': 'خدمات کالیبراسیون تجهیزات ابزار دقیق', 'short_description': 'ارائه خدمات کالیبراسیون و تعمیرات تجهیزات اندازه‌گیری', 'full_description': 'خدمات دوره‌ای کالیبراسیون برای تجهیزات فشار، دما، سطح و دبی', 'category': 'service', 'price': 120000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'گواهینامه ISO 17025', 'industry': 'پتروشیمی'},
    {'title': 'سیستم بازیابی حلال‌های صنعتی', 'short_description': 'راهکار بازیافت و تصفیه حلال‌های مصرفی', 'full_description': 'سیستم تقطیر و بازیابی حلال‌های آلی با راندمان بالا', 'category': 'product', 'price': 750000000, 'trl': 7, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'بازیافت ۹۵٪ حلال', 'industry': 'پتروشیمی'},
    {'title': 'سامانه یکپارچه مدیریت کیفیت محصولات پتروشیمی', 'short_description': 'نرم‌افزار کنترل کیفیت بر اساس استانداردهای بین‌المللی', 'full_description': 'سیستم مدیریت کیفیت برای پایش و بهبود مشخصات محصولات پتروشیمی', 'category': 'service', 'price': 500000000, 'trl': 8, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'یکپارچگی با LIMS', 'industry': 'پتروشیمی'},
    {'title': 'سیستم کنترل خوردگی مخازن پتروشیمی', 'short_description': 'سیستم پایش و کنترل خوردگی مخازن ذخیره', 'full_description': 'استفاده از سنسورهای پیشرفته برای پایش ضخامت و خوردگی', 'category': 'product', 'price': 450000000, 'trl': 7, 'mrl': 6, 'status': 'published', 'competitive_advantage': 'پیش‌بینی دقیق زمان تعمیرات', 'industry': 'پتروشیمی'},
    {'title': 'مشاوره ایمنی فرآیندهای پتروشیمی', 'short_description': 'ارائه خدمات مشاوره ایمنی و HAZOP', 'full_description': 'خدمات تحلیل ریسک و ایمنی فرآیندهای پتروشیمی', 'category': 'service', 'price': 300000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'تیم متخصص با ۱۵ سال تجربه', 'industry': 'پتروشیمی'},
    {'title': 'سیستم هوشمند مدیریت نگهداری و تعمیرات (CMMS)', 'short_description': 'نرم‌افزار مدیریت نگهداری و تعمیرات برای صنایع پتروشیمی', 'full_description': 'سیستم برنامه‌ریزی و ثبت تعمیرات با قابلیت تحلیل داده‌های خرابی', 'category': 'product', 'price': 350000000, 'trl': 7, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'یکپارچگی با سیستم‌های SCADA', 'industry': 'پتروشیمی'},

    # -------------------- نفت و گاز (حدود ۵ محصول) --------------------
    {'title': 'سیستم پایش هوشمند چاه‌های نفت', 'short_description': 'سیستم مانیتورینگ آنلاین فشار و دبی چاه‌های نفت', 'full_description': 'سیستم پیشرفته با سنسورهای دقیق برای پایش لحظه‌ای عملکرد چاه‌ها و پیش‌بینی خرابی‌ها', 'category': 'product', 'price': 1500000000, 'trl': 9, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'دقت بالا و کاهش ۳۰٪ توقف تولید', 'industry': 'نفت و گاز'},
    {'title': 'خدمات نقشه‌برداری زیرسطحی با روش لرزه‌نگاری', 'short_description': 'ارائه خدمات تخصصی اکتشاف نفت و گاز با روش‌های پیشرفته لرزه‌نگاری', 'full_description': 'خدمات کامل نقشه‌برداری سه‌بعدی برای شناسایی مخازن هیدروکربوری', 'category': 'service', 'price': 2500000000, 'trl': 7, 'mrl': 6, 'status': 'published', 'competitive_advantage': 'دقت ۹۵٪ در تشخیص مخازن', 'industry': 'نفت و گاز'},
    {'title': 'سیستم اسکادا (SCADA) برای پالایشگاه‌ها', 'short_description': 'سیستم کنترل و مدیریت متمرکز فرآیندهای پالایشگاهی', 'full_description': 'نرم‌افزار و سخت‌افزار پیشرفته برای کنترل و پایش واحدهای پالایشگاهی', 'category': 'product', 'price': 3000000000, 'trl': 8, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'قابلیت یکپارچه‌سازی با تجهیزات قدیمی', 'industry': 'نفت و گاز'},
    {'title': 'خدمات مهندسی و طراحی تأسیسات نفت و گاز', 'short_description': 'ارائه خدمات طراحی، نظارت و راه‌اندازی تأسیسات نفت و گاز', 'full_description': 'خدمات جامع مهندسی از مرحله مطالعه تا بهره‌برداری', 'category': 'service', 'price': 800000000, 'trl': 9, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'تیم مهندسی با ۲۰ سال تجربه', 'industry': 'نفت و گاز'},
    {'title': 'دستگاه آنالایزر ترکیبات گاز طبیعی', 'short_description': 'دستگاه قابل حمل برای آنالیز ترکیبات گاز در میدان', 'full_description': 'دستگاه دقیق اندازه‌گیری ترکیبات گاز طبیعی با قابلیت ذخیره‌سازی داده', 'category': 'product', 'price': 450000000, 'trl': 7, 'mrl': 7, 'status': 'approved', 'competitive_advantage': 'دقت بالا در شرایط سخت محیطی', 'industry': 'نفت و گاز'},

    # -------------------- فولاد و معدن (حدود ۴ محصول) --------------------
    {'title': 'سیستم اتوماسیون کوره‌های قوس الکتریکی', 'short_description': 'کنترل هوشمند کوره‌های ذوب فولاد', 'full_description': 'سیستم کنترل پیشرفته برای بهینه‌سازی مصرف انرژی و کیفیت فولاد', 'category': 'product', 'price': 1200000000, 'trl': 7, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'کاهش ۱۵٪ مصرف برق', 'industry': 'فولاد و معدن'},
    {'title': 'خدمات آنالیز شیمیایی مواد معدنی', 'short_description': 'ارائه خدمات آزمایشگاهی برای آنالیز سنگ‌آهن و کنسانتره', 'full_description': 'خدمات آنالیز دقیق عناصر با استفاده از روش‌های XRF و ICP', 'category': 'service', 'price': 300000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'دقت نتایج در سطح آزمایشگاه‌های مرجع', 'industry': 'فولاد و معدن'},
    {'title': 'سیستم مدیریت نوار نقاله‌های معادن', 'short_description': 'سیستم مانیتورینگ و کنترل نوار نقاله‌های طولانی', 'full_description': 'سیستم مبتنی بر IoT برای پایش شرایط نوار نقاله و پیش‌بینی خرابی', 'category': 'product', 'price': 650000000, 'trl': 6, 'mrl': 6, 'status': 'approved', 'competitive_advantage': 'کاهش ۲۵٪ توقف‌های ناخواسته', 'industry': 'فولاد و معدن'},
    {'title': 'خدمات طراحی سیستم‌های انتقال مواد در معادن', 'short_description': 'طراحی و مشاوره سیستم‌های انتقال مواد معدنی', 'full_description': 'خدمات مهندسی برای طراحی سیستم‌های نوار نقاله، اسکرو و پمپ‌های دوغاب', 'category': 'service', 'price': 350000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'استفاده از نرم‌افزارهای پیشرفته شبیه‌سازی', 'industry': 'فولاد و معدن'},

    # -------------------- برق و انرژی (حدود ۴ محصول) --------------------
    {'title': 'سیستم مدیریت انرژی هوشمند (EMS)', 'short_description': 'نرم‌افزار بهینه‌سازی مصرف انرژی در ساختمان‌ها و کارخانجات', 'full_description': 'پلتفرم مبتنی بر IoT برای پایش و کنترل مصرف انرژی', 'category': 'product', 'price': 400000000, 'trl': 8, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'کاهش ۲۰٪ مصرف انرژی', 'industry': 'برق و انرژی'},
    {'title': 'خدمات مشاوره انرژی‌های تجدیدپذیر', 'short_description': 'ارائه مشاوره برای احداث نیروگاه‌های خورشیدی و بادی', 'full_description': 'خدمات مطالعات امکان‌سنجی، طراحی و نظارت بر اجرا', 'category': 'service', 'price': 600000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'تجربه اجرای ۵۰ مگاوات نیروگاه', 'industry': 'برق و انرژی'},
    {'title': 'دستگاه آنالایزر کیفیت برق', 'short_description': 'دستگاه قابل حمل برای اندازه‌گیری پارامترهای کیفیت برق', 'full_description': 'اندازه‌گیری هارمونیک‌ها، نوسانات و ضریب توان در شبکه‌های صنعتی', 'category': 'product', 'price': 180000000, 'trl': 7, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'دقت بالا در فرکانس‌های بالا', 'industry': 'برق و انرژی'},
    {'title': 'خدمات بهینه‌سازی شبکه‌های توزیع برق', 'short_description': 'ارائه راهکارهای کاهش تلفات و افزایش پایداری شبکه', 'full_description': 'خدمات شبیه‌سازی و اصلاح شبکه‌های توزیع', 'category': 'service', 'price': 500000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'کاهش تلفات تا ۱۵٪', 'industry': 'برق و انرژی'},

    # -------------------- فناوری اطلاعات (حدود ۴ محصول) --------------------
    {'title': 'پلتفرم تحلیل داده‌های کلان صنعتی', 'short_description': 'سیستم تحلیل داده‌های حجیم برای صنایع تولیدی', 'full_description': 'راهکار جامع برای جمع‌آوری، ذخیره‌سازی و تحلیل داده‌های صنعتی با استفاده از هوش مصنوعی', 'category': 'product', 'price': 600000000, 'trl': 8, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'پردازش داده در زمان واقعی', 'industry': 'فناوری اطلاعات'},
    {'title': 'خدمات پیاده‌سازی سیستم‌های ERP صنعتی', 'short_description': 'پیاده‌سازی و سفارشی‌سازی نرم‌افزارهای برنامه‌ریزی منابع سازمان', 'full_description': 'خدمات جامع پیاده‌سازی ERP با رویکرد صنعتی و تولیدی', 'category': 'service', 'price': 800000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'تجربه در صنایع بزرگ', 'industry': 'فناوری اطلاعات'},
    {'title': 'سامانه امنیت سایبری صنعتی', 'short_description': 'راهکار حفاظت از شبکه‌های صنعتی و SCADA', 'full_description': 'سیستم تشخیص و پاسخ به تهدیدات سایبری در محیط‌های صنعتی', 'category': 'product', 'price': 450000000, 'trl': 6, 'mrl': 6, 'status': 'approved', 'competitive_advantage': 'انطباق با استانداردهای IEC 62443', 'industry': 'فناوری اطلاعات'},
    {'title': 'سیستم هوش مصنوعی برای پیش‌بینی خرابی تجهیزات', 'short_description': 'نرم‌افزار مبتنی بر یادگیری ماشین برای نگهداری پیش‌بینی‌کننده', 'full_description': 'سیستم تحلیل داده‌های حسگرها برای پیش‌بینی خرابی‌ها و برنامه‌ریزی تعمیرات', 'category': 'product', 'price': 550000000, 'trl': 7, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'دقت پیش‌بینی ۸۵٪', 'industry': 'فناوری اطلاعات'},

    # -------------------- صنایع دیگر (هر کدام ۲ محصول) --------------------
    {'title': 'سیستم کنترل کیفیت بدنه خودرو', 'short_description': 'سیستم بازرسی بدنه با استفاده از بینایی ماشین', 'full_description': 'سیستم تشخیص عیوب سطحی و ابعادی بدنه خودرو', 'category': 'product', 'price': 350000000, 'trl': 8, 'mrl': 7, 'status': 'published', 'competitive_advantage': 'دقت بالا در تشخیص عیوب', 'industry': 'خودروسازی'},
    {'title': 'خدمات مشاوره مهندسی خودرو', 'short_description': 'ارائه خدمات مشاوره در زمینه طراحی و توسعه خودرو', 'full_description': 'خدمات مهندسی شامل طراحی سیستم‌های تعلیق، ترمز و فرمان', 'category': 'service', 'price': 500000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'تیم با تجربه بین‌المللی', 'industry': 'خودروسازی'},
    {'title': 'سیستم کنترل کیفی دارو با HPLC', 'short_description': 'دستگاه HPLC برای آنالیز ترکیبات دارویی', 'full_description': 'دستگاه کروماتوگرافی مایع با کارایی بالا برای کنترل کیفیت', 'category': 'product', 'price': 600000000, 'trl': 9, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'دقت بالا در تشخیص ناخالصی‌ها', 'industry': 'داروسازی'},
    {'title': 'خدمات مشاوره GMP در داروسازی', 'short_description': 'ارائه خدمات مشاوره برای پیاده‌سازی GMP', 'full_description': 'خدمات مشاوره جهت انطباق با استانداردهای تولید خوب', 'category': 'service', 'price': 300000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'تخصص در صنایع دارویی', 'industry': 'داروسازی'},
    {'title': 'سیستم آبیاری هوشمند', 'short_description': 'سیستم کنترل هوشمند آبیاری بر اساس رطوبت خاک', 'full_description': 'سیستم مبتنی بر سنسورهای رطوبت و هواشناسی برای بهینه‌سازی مصرف آب', 'category': 'product', 'price': 180000000, 'trl': 7, 'mrl': 6, 'status': 'published', 'competitive_advantage': 'کاهش ۳۰٪ مصرف آب', 'industry': 'کشاورزی'},
    {'title': 'خدمات مشاوره کشاورزی دقیق', 'short_description': 'ارائه راهکارهای کشاورزی دقیق با استفاده از تصاویر ماهواره‌ای', 'full_description': 'خدمات تحلیل داده‌های ماهواره‌ای برای مدیریت مزارع', 'category': 'service', 'price': 200000000, 'trl': 8, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'دقت بالا در تحلیل', 'industry': 'کشاورزی'},
    {'title': 'سیستم مدیریت انرژی ساختمان (BEMS)', 'short_description': 'سیستم هوشمند مدیریت انرژی در ساختمان‌ها', 'full_description': 'سیستم کنترل HVAC، روشنایی و سایر مصرف‌کننده‌های انرژی', 'category': 'product', 'price': 250000000, 'trl': 8, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'صرفه‌جویی تا ۲۵٪', 'industry': 'ساختمان'},
    {'title': 'خدمات طراحی سازه‌های فولادی', 'short_description': 'طراحی و محاسبه سازه‌های فولادی برای ساختمان‌ها', 'full_description': 'خدمات مهندسی سازه با استفاده از نرم‌افزارهای پیشرفته', 'category': 'service', 'price': 150000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'رعایت استانداردهای بین‌المللی', 'industry': 'ساختمان'},
    {'title': 'سیستم مدیریت ناوگان حمل و نقل', 'short_description': 'سیستم GPS برای ردیابی و مدیریت ناوگان', 'full_description': 'پلتفرم مدیریت ناوگان با قابلیت ردیابی لحظه‌ای و تحلیل مسیر', 'category': 'product', 'price': 300000000, 'trl': 8, 'mrl': 8, 'status': 'published', 'competitive_advantage': 'کاهش ۲۰٪ هزینه‌های سوخت', 'industry': 'حمل و نقل'},
    {'title': 'خدمات مشاوره لجستیک و زنجیره تامین', 'short_description': 'ارائه مشاوره بهینه‌سازی زنجیره تامین و لجستیک', 'full_description': 'خدمات تحلیل و بهبود فرآیندهای لجستیکی', 'category': 'service', 'price': 400000000, 'trl': 9, 'mrl': 9, 'status': 'published', 'competitive_advantage': 'تجربه در صنایع بزرگ', 'industry': 'حمل و نقل'},
]

products_created = 0
for template in product_templates:
    industry_name = template.pop('industry')
    industry = industry_objs.get(industry_name)
    if not industry:
        continue
    seller = random.choice(list(users.values()))
    defaults = template.copy()
    defaults['seller'] = seller
    defaults['industry'] = industry
    defaults['created_at'] = random_date(start_date, end_date)

    product, created = Product.objects.get_or_create(
        title=template['title'],
        defaults=defaults
    )
    if created:
        products_created += 1
        # افزودن تصویر (اختیاری)
        if random.random() < 0.6:
            img = get_random_image()
            if img:
                try:
                    product.image.save(f"product_{product.id}.jpg", img, save=True)
                except Exception:
                    pass
        print(f"✅ محصول ایجاد شد: {product.title} (صنعت: {industry_name})")

print(f"✅ {products_created} محصول جدید ایجاد شد. (تعداد کل: {Product.objects.count()})")

# ============================================================
# ۴. تولید نیازها (حداقل ۲۰ نیاز)
# ============================================================

need_templates = [
    # نفت و گاز
    {'title': 'سیستم پایش چاه‌های نفت', 'description': 'به دنبال سیستمی برای پایش فشار و دبی چاه‌های نفت هستیم.', 'industry': 'نفت و گاز', 'status': 'published', 'budget': 800000000, 'timeline': '۶ ماه'},
    {'title': 'مشاور توسعه میدان نفتی', 'description': 'نیاز به مشاور برای طراحی و توسعه میدان نفتی جدید.', 'industry': 'نفت و گاز', 'status': 'receiving_proposals', 'budget': 1500000000, 'timeline': '۱۲ ماه'},
    {'title': 'خرید تجهیزات حفاری', 'description': 'نیاز به تامین تجهیزات حفاری پیشرفته برای میدان نفتی.', 'industry': 'نفت و گاز', 'status': 'published', 'budget': 2000000000, 'timeline': '۸ ماه'},
    
    # پتروشیمی
    {'title': 'کاتالیست با کیفیت بالا', 'description': 'نیاز به تامین کاتالیست با کیفیت بالا برای واحد الفین.', 'industry': 'پتروشیمی', 'status': 'published', 'budget': 200000000, 'timeline': '۳ ماه'},
    {'title': 'مشاور بهینه‌سازی واحدهای پتروشیمی', 'description': 'به دنبال مشاور برای افزایش بازدهی واحدهای پتروشیمی.', 'industry': 'پتروشیمی', 'status': 'evaluating', 'budget': 500000000, 'timeline': '۹ ماه'},
    {'title': 'سیستم تصفیه پساب پتروشیمی', 'description': 'نیاز به سیستم تصفیه پیشرفته پساب با غشاهای نانو.', 'industry': 'پتروشیمی', 'status': 'published', 'budget': 400000000, 'timeline': '۶ ماه'},
    {'title': 'خدمات کالیبراسیون ابزار دقیق', 'description': 'نیاز به خدمات کالیبراسیون دوره‌ای تجهیزات ابزار دقیق.', 'industry': 'پتروشیمی', 'status': 'receiving_proposals', 'budget': 150000000, 'timeline': '۴ ماه'},
    {'title': 'سیستم کنترل خوردگی مخازن', 'description': 'نیاز به سیستم پایش و کنترل خوردگی مخازن ذخیره پتروشیمی.', 'industry': 'پتروشیمی', 'status': 'published', 'budget': 350000000, 'timeline': '۵ ماه'},
    {'title': 'مشاوره ایمنی فرآیندها', 'description': 'نیاز به مشاوره تخصصی ایمنی و HAZOP برای واحدهای پتروشیمی.', 'industry': 'پتروشیمی', 'status': 'evaluating', 'budget': 250000000, 'timeline': '۷ ماه'},

    # فولاد و معدن
    {'title': 'سیستم اتوماسیون کوره فولاد', 'description': 'نیاز به سیستم کنترل هوشمند کوره‌های فولاد.', 'industry': 'فولاد و معدن', 'status': 'published', 'budget': 700000000, 'timeline': '۴ ماه'},
    {'title': 'مشاور کاهش باطله معدن', 'description': 'نیاز به مشاور برای کاهش باطله در کارخانه فرآوری.', 'industry': 'فولاد و معدن', 'status': 'matched', 'budget': 300000000, 'timeline': '۶ ماه'},
    {'title': 'خدمات آنالیز مواد معدنی', 'description': 'نیاز به خدمات آنالیز شیمیایی سنگ‌آهن و کنسانتره.', 'industry': 'فولاد و معدن', 'status': 'published', 'budget': 200000000, 'timeline': '۳ ماه'},

    # برق و انرژی
    {'title': 'سیستم مدیریت انرژی', 'description': 'نیاز به سیستم مدیریت انرژی برای کارخانه تولیدی.', 'industry': 'برق و انرژی', 'status': 'published', 'budget': 400000000, 'timeline': '۵ ماه'},
    {'title': 'مشاور نیروگاه خورشیدی', 'description': 'نیاز به مشاور برای احداث نیروگاه خورشیدی ۱۰ مگاواتی.', 'industry': 'برق و انرژی', 'status': 'receiving_proposals', 'budget': 2000000000, 'timeline': '۱۸ ماه'},
    {'title': 'دستگاه آنالایزر کیفیت برق', 'description': 'نیاز به دستگاه آنالایزر قابل حمل برای اندازه‌گیری کیفیت برق.', 'industry': 'برق و انرژی', 'status': 'published', 'budget': 180000000, 'timeline': '۲ ماه'},

    # فناوری اطلاعات
    {'title': 'سامانه تحلیل داده‌های صنعتی', 'description': 'نیاز به پلتفرم تحلیل داده‌های حجیم برای صنعت.', 'industry': 'فناوری اطلاعات', 'status': 'published', 'budget': 500000000, 'timeline': '۶ ماه'},
    {'title': 'پیاده‌سازی ERP صنعتی', 'description': 'نیاز به پیاده‌سازی نرم‌افزار ERP برای صنعت تولیدی.', 'industry': 'فناوری اطلاعات', 'status': 'evaluating', 'budget': 800000000, 'timeline': '۱۲ ماه'},
    {'title': 'امنیت سایبری صنعتی', 'description': 'نیاز به راهکار امنیت سایبری برای شبکه‌های صنعتی و SCADA.', 'industry': 'فناوری اطلاعات', 'status': 'published', 'budget': 450000000, 'timeline': '۴ ماه'},

    # خودروسازی
    {'title': 'سیستم کنترل کیفیت خودرو', 'description': 'نیاز به سیستم بازرسی بدنه خودرو با بینایی ماشین.', 'industry': 'خودروسازی', 'status': 'published', 'budget': 300000000, 'timeline': '۴ ماه'},
    {'title': 'مشاور طراحی خودرو', 'description': 'نیاز به مشاور برای طراحی سیستم‌های خودرو.', 'industry': 'خودروسازی', 'status': 'receiving_proposals', 'budget': 400000000, 'timeline': '۸ ماه'},

    # داروسازی
    {'title': 'دستگاه HPLC برای داروسازی', 'description': 'نیاز به دستگاه HPLC با دقت بالا برای کنترل کیفیت.', 'industry': 'داروسازی', 'status': 'published', 'budget': 500000000, 'timeline': '۳ ماه'},
    {'title': 'مشاور GMP در داروسازی', 'description': 'نیاز به مشاور برای پیاده‌سازی GMP.', 'industry': 'داروسازی', 'status': 'evaluating', 'budget': 200000000, 'timeline': '۶ ماه'},

    # کشاورزی
    {'title': 'سیستم آبیاری هوشمند', 'description': 'نیاز به سیستم آبیاری هوشمند برای مزرعه.', 'industry': 'کشاورزی', 'status': 'published', 'budget': 150000000, 'timeline': '۲ ماه'},
    {'title': 'مشاور کشاورزی دقیق', 'description': 'نیاز به مشاور کشاورزی دقیق با استفاده از تصاویر ماهواره‌ای.', 'industry': 'کشاورزی', 'status': 'receiving_proposals', 'budget': 180000000, 'timeline': '۴ ماه'},

    # ساختمان
    {'title': 'سیستم BEMS برای ساختمان', 'description': 'نیاز به سیستم مدیریت انرژی برای ساختمان اداری.', 'industry': 'ساختمان', 'status': 'published', 'budget': 200000000, 'timeline': '۳ ماه'},
    {'title': 'مشاور سازه‌های فولادی', 'description': 'نیاز به مشاور برای طراحی سازه‌های فولادی.', 'industry': 'ساختمان', 'status': 'matched', 'budget': 120000000, 'timeline': '۵ ماه'},

    # حمل و نقل
    {'title': 'سیستم مدیریت ناوگان', 'description': 'نیاز به سیستم GPS برای مدیریت ناوگان حمل و نقل.', 'industry': 'حمل و نقل', 'status': 'published', 'budget': 250000000, 'timeline': '۴ ماه'},
    {'title': 'مشاور لجستیک', 'description': 'نیاز به مشاور برای بهینه‌سازی زنجیره تامین.', 'industry': 'حمل و نقل', 'status': 'receiving_proposals', 'budget': 350000000, 'timeline': '۶ ماه'},
]

needs_created = 0
for template in need_templates:
    industry = industry_objs.get(template['industry'])
    if not industry:
        continue
    buyer = random.choice(list(users.values()))
    defaults = {k: v for k, v in template.items() if k != 'industry'}
    defaults['buyer'] = buyer
    defaults['industry'] = industry
    defaults['created_at'] = random_date(start_date, end_date)

    need, created = Need.objects.get_or_create(
        title=template['title'],
        defaults=defaults
    )
    if created:
        needs_created += 1
        print(f"✅ نیاز ایجاد شد: {need.title} (صنعت: {template['industry']})")

print(f"✅ {needs_created} نیاز جدید ایجاد شد. (تعداد کل: {Need.objects.count()})")

# ============================================================
# ۵. تولید ارزیابی برای محصولات (در صورت عدم وجود)
# ============================================================

evaluations_created = 0
for product in Product.objects.all():
    if not Evaluation.objects.filter(product=product).exists():
        evaluator = random.choice(list(users.values()))
        Evaluation.objects.create(
            product=product,
            evaluator=evaluator,
            quality_score=random.randint(60, 95),
            risk_score=random.randint(10, 40),
            market_readiness_score=random.randint(60, 90),
            final_decision=random.choice(['approved', 'approved', 'approved', 'conditional']),
            comments='ارزیابی خودکار برای تست',
            created_at=random_date(start_date, end_date)
        )
        evaluations_created += 1

print(f"✅ {evaluations_created} ارزیابی جدید ایجاد شد. (تعداد کل: {Evaluation.objects.count()})")

# ============================================================
# ۶. تولید عرضه (Supply) برای تکمیل
# ============================================================

supply_templates = [
    {'title': 'تامین تجهیزات پالایشگاهی', 'supply_type': 'product', 'category': 'تجهیزات صنعتی', 'industry': 'نفت و گاز', 'price': 500000000, 'trl': '8', 'status': 'published'},
    {'title': 'خدمات تعمیرات پتروشیمی', 'supply_type': 'service', 'category': 'خدمات تعمیرات', 'industry': 'پتروشیمی', 'price': 200000000, 'trl': '9', 'status': 'published'},
    {'title': 'تامین قطعات یدکی معدن', 'supply_type': 'product', 'category': 'قطعات یدکی', 'industry': 'فولاد و معدن', 'price': 100000000, 'trl': '7', 'status': 'approved'},
    {'title': 'خدمات مشاوره انرژی', 'supply_type': 'service', 'category': 'مشاوره', 'industry': 'برق و انرژی', 'price': 300000000, 'trl': '9', 'status': 'published'},
    {'title': 'نرم‌افزار مدیریت تولید', 'supply_type': 'product', 'category': 'نرم‌افزار', 'industry': 'فناوری اطلاعات', 'price': 250000000, 'trl': '8', 'status': 'published'},
    {'title': 'تامین کاتالیست پتروشیمی', 'supply_type': 'product', 'category': 'مواد شیمیایی', 'industry': 'پتروشیمی', 'price': 180000000, 'trl': '8', 'status': 'published'},
    {'title': 'خدمات نگهداری تاسیسات', 'supply_type': 'service', 'category': 'خدمات فنی', 'industry': 'نفت و گاز', 'price': 350000000, 'trl': '9', 'status': 'published'},
]

supplies_created = 0
if Supply is not None:
    for template in supply_templates:
        seller = random.choice(list(users.values()))
        defaults = {k: v for k, v in template.items() if k != 'industry'}
        defaults['seller'] = seller
        defaults['created_at'] = random_date(start_date, end_date)
        supply, created = Supply.objects.get_or_create(
            title=template['title'],
            defaults=defaults
        )
        if created:
            supplies_created += 1
            print(f"✅ عرضه ایجاد شد: {supply.title}")

print(f"✅ {supplies_created} عرضه جدید ایجاد شد. (تعداد کل: {Supply.objects.count() if Supply else 0})")

# ============================================================
# ۷. تولید Negotiation (اختیاری)
# ============================================================

if Negotiation is not None:
    negotiations_created = 0
    # برای هر نیاز، یک مذاکره نمونه ایجاد می‌کنیم (اختیاری)
    for need in Need.objects.all()[:10]:
        if not Negotiation.objects.filter(need=need).exists():
            try:
                supplier = random.choice(list(users.values()))
                # مدل Negotiation ممکن است فیلدهای مختلفی داشته باشد، سعی می‌کنیم با فیلدهای رایج
                negotiation_data = {
                    'need': need,
                    'buyer': need.buyer,
                    'supplier': supplier,
                    'status': random.choice(['created', 'in_progress', 'accepted', 'contracted']),
                    'created_at': random_date(start_date, end_date),
                }
                # فیلد context_title یا supply را اگر وجود داشت اضافه می‌کنیم
                if hasattr(Negotiation, 'context_title'):
                    negotiation_data['context_title'] = f"مذاکره برای {need.title}"
                if hasattr(Negotiation, 'supply'):
                    # یک عرضه تصادفی انتخاب می‌کنیم
                    supply = Supply.objects.first() if Supply else None
                    if supply:
                        negotiation_data['supply'] = supply
                # ایجاد مذاکره
                negot, created = Negotiation.objects.get_or_create(
                    need=need,
                    buyer=need.buyer,
                    defaults=negotiation_data
                )
                if created:
                    negotiations_created += 1
            except Exception as e:
                # اگر فیلدها تطابق نداشتند، نادیده بگیر
                pass
    print(f"✅ {negotiations_created} مذاکره جدید ایجاد شد.")

# ============================================================
# جمع‌بندی
# ============================================================

print("\n" + "="*60)
print("✅ تولید داده‌های نمونه با موفقیت کامل شد.")
print(f"📊 تعداد کل کاربران: {User.objects.count()}")
print(f"📊 تعداد کل صنایع: {IndustryCategory.objects.count()}")
print(f"📊 تعداد کل محصولات: {Product.objects.count()}")
print(f"📊 تعداد کل محصولات دارای تصویر: {Product.objects.exclude(image='').count()}")
print(f"📊 تعداد کل نیازها: {Need.objects.count()}")
print(f"📊 تعداد کل ارزیابی‌ها: {Evaluation.objects.count()}")
if Supply:
    print(f"📊 تعداد کل عرضه‌ها: {Supply.objects.count()}")
if Negotiation:
    print(f"📊 تعداد کل مذاکرات: {Negotiation.objects.count()}")
print("="*60)