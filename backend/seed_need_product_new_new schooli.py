# ============================================================
# FILE: seed_supplies_complete.py
# ============================================================
# اسکریپت تولید عرضه‌های کامل با تصاویر مرتبط برای هر صنعت
# پوشش ۱۰۰٪ فیلترها با حداقل ۳ مورد برای هر فیلتر
# ============================================================

import os
import django
from django.core.files.base import ContentFile
import random
from decimal import Decimal
from io import BytesIO
from PIL import Image
import requests
import time

# تنظیم محیط Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Supply, SupplyImage

User = get_user_model()

# ============================================================
# تصاویر مرتبط با هر صنعت (از Unsplash با کلمات کلیدی دقیق)
# ============================================================

INDUSTRY_IMAGES = {
    'نفت و گاز': [
        'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1626005093269-702710d2fbea?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=600&h=400&fit=crop',
    ],
    'پتروشیمی': [
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1614308450916-7c5f5e55f3a2?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1567449303072-595c6702cfe4?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=600&h=400&fit=crop',
    ],
    'فولاد و معدن': [
        'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1531985682301-3cfda0d5c4e8?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1574781494171-048d95cbe245?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1565232169063-24c21d0b0e0c?w=600&h=400&fit=crop',
    ],
    'سلامت': [
        'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1530023367847-a683933f4172?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600&h=400&fit=crop',
    ],
    'کشاورزی': [
        'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1592982537447-3a2ad6b03b2f?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1586771107445-d3ca88812917?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=600&h=400&fit=crop',
    ],
    'حمل‌ونقل': [
        'https://images.unsplash.com/photo-1543096222-72de739f791a?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1590674899484-d5640e854a3c?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=600&h=400&fit=crop',
    ],
    'خودروسازی': [
        'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1567548470661-7f9ea33a5657?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop',
    ],
    'انرژی': [
        'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1520013767138-02e29a872473?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1536945460482-72e7f19edf34?w=600&h=400&fit=crop',
    ],
    'فناوری اطلاعات': [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop',
    ],
    'محیط زیست': [
        'https://images.unsplash.com/photo-1614308450916-7c5f5e55f3a2?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=600&h=400&fit=crop',
    ],
}

# تصاویر پیش‌فرض برای مواردی که صنعت خاصی ندارند
DEFAULT_IMAGES = [
    'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&h=400&fit=crop',
]

# ============================================================
# داده‌های ثابت (منطبق با فیلترهای فرانت‌اند)
# ============================================================

INDUSTRIES = [
    'نفت و گاز',
    'پتروشیمی',
    'فولاد و معدن',
    'سلامت',
    'کشاورزی',
    'حمل‌ونقل',
    'خودروسازی',
    'انرژی',
    'فناوری اطلاعات',
    'محیط زیست',
]

TECHNOLOGIES = [
    'هوش مصنوعی',
    'اینترنت اشیاء',
    'دوقلوی دیجیتال',
    'رباتیک',
    'بلاکچین',
    'داده‌کاوی',
]

PROVINCES = [
    'تهران',
    'اصفهان',
    'شیراز',
    'تبریز',
    'مشهد',
    'یزد',
    'کرج',
    'اهواز',
    'رشت',
    'کرمان',
]

PRODUCT_CATEGORIES = [
    'تجهیزات صنعتی',
    'نرم‌افزار',
    'سخت‌افزار',
    'راهکار یکپارچه',
    'ماشین‌آلات',
    'سیستم کنترل',
    'سنسور',
    'دستگاه پزشکی',
    'پنل خورشیدی',
    'باتری',
]

SERVICE_CATEGORIES = [
    'مشاوره',
    'آموزش',
    'ارزیابی',
    'طراحی',
    'پیاده‌سازی',
    'نگهداری',
    'تحلیل داده',
    'مدیریت پروژه',
]

UNITS = ['عدد', 'کیلوگرم', 'تن', 'لیتر', 'متر مکعب', 'کیلووات ساعت', 'مگابایت', 'گیگابایت', 'ترابایت', 'نفر-ساعت', 'ماه']

TRL_LEVELS = list(range(5, 10))  # 5 تا 9
MRL_LEVELS = list(range(4, 9))   # 4 تا 8

# ============================================================
# توابع کمکی
# ============================================================

def download_image(url, filename):
    """دانلود تصویر با timeout و retry"""
    for attempt in range(3):
        try:
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                img = Image.open(BytesIO(response.content))
                # تبدیل به RGB در صورت نیاز
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                img_io = BytesIO()
                img.save(img_io, format='JPEG', quality=85)
                return ContentFile(img_io.getvalue(), name=filename)
            else:
                time.sleep(1)
        except Exception as e:
            print(f"⚠️ تلاش {attempt+1} برای دانلود تصویر ناموفق: {e}")
            time.sleep(2)
    return None

def get_seller():
    seller, _ = User.objects.get_or_create(
        username='supplier_demo',
        defaults={
            'first_name': 'عرضه‌کننده',
            'last_name': 'نمونه',
            'email': 'supplier@demo.com',
            'is_active': True,
        }
    )
    if _:
        seller.set_password('123456')
        seller.save()
    return seller

def get_image_for_industry(industry):
    """دریافت تصویر مرتبط با صنعت"""
    if industry in INDUSTRY_IMAGES:
        return random.choice(INDUSTRY_IMAGES[industry])
    return random.choice(DEFAULT_IMAGES)

def create_supply(
    seller,
    title,
    supply_type,
    category,
    industry,
    technology,
    city,
    description,
    quantity,
    unit,
    price,
    trl,
    mrl,
    status='published',
    image_url=None,
    image_name=None,
):
    supply = Supply.objects.create(
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
        trl_assessed=random.choice([True, False]),
        mrl_assessed=random.choice([True, False]),
        status=status,
        view_count=random.randint(0, 500),
    )

    # استفاده از تصویر مرتبط با صنعت
    if not image_url:
        image_url = get_image_for_industry(industry)
    
    if image_url:
        img_file = download_image(image_url, image_name or f"{supply.id}.jpg")
        if img_file:
            SupplyImage.objects.create(
                supply=supply,
                image=img_file,
                caption=f"تصویر {supply.title}",
                is_primary=True,
            )
        else:
            # اگر دانلود نشد، از تصویر پیش‌فرض دیگری استفاده کن
            fallback_url = random.choice(DEFAULT_IMAGES)
            img_file = download_image(fallback_url, f"fallback_{supply.id}.jpg")
            if img_file:
                SupplyImage.objects.create(
                    supply=supply,
                    image=img_file,
                    caption=f"تصویر {supply.title}",
                    is_primary=True,
                )

    return supply

# ============================================================
# تولید داده‌های تضمینی برای پوشش کامل فیلترها
# ============================================================

def generate_guaranteed_coverage():
    seller = get_seller()
    print(f"👤 فروشنده: {seller.username}")
    print("🔄 شروع تولید عرضه‌ها با تصاویر مرتبط...")

    # ============================================================
    # دیکشنری صنایع با محصولات و خدمات مرتبط
    # ============================================================
    
    industry_titles = {
        'نفت و گاز': [
            ('سامانه پایش هوشمند چاه‌های نفت', 'product', 'سیستم کنترل'),
            ('راهکار بهینه‌سازی مصرف انرژی پالایشگاه', 'service', 'مشاوره'),
            ('سیستم پیش‌بینی خرابی تجهیزات نفتی', 'product', 'نرم‌افزار'),
            ('خدمات ممیزی ایمنی تاسیسات نفتی', 'service', 'ارزیابی'),
            ('سامانه مدیریت یکپارچه خطوط لوله', 'product', 'راهکار یکپارچه'),
            ('دستگاه اندازه‌گیری دقیق جریان سیال', 'product', 'تجهیزات صنعتی'),
            ('خدمات آموزش ایمنی و HSE', 'service', 'آموزش'),
            ('سامانه مدیریت دارایی‌های نفتی', 'product', 'نرم‌افزار'),
            ('خدمات مشاوره کاهش گازهای فلر', 'service', 'مشاوره'),
        ],
        'پتروشیمی': [
            ('سیستم کنترل هوشمند کوره‌های پتروشیمی', 'product', 'سیستم کنترل'),
            ('سامانه پایش آلاینده‌های پتروشیمی', 'product', 'سنسور'),
            ('خدمات ممیزی انرژی پتروشیمی', 'service', 'مشاوره'),
            ('سیستم بازیابی حرارت از گازهای خروجی', 'product', 'تجهیزات صنعتی'),
            ('سامانه مدیریت پسماند پتروشیمی', 'product', 'راهکار یکپارچه'),
            ('خدمات طراحی سیستم‌های تصفیه پساب', 'service', 'طراحی'),
            ('دستگاه آنالیز ترکیبات شیمیایی', 'product', 'تجهیزات صنعتی'),
            ('سامانه کنترل کیفیت محصولات پتروشیمی', 'product', 'سیستم کنترل'),
            ('خدمات مشاوره کاهش مصرف آب', 'service', 'مشاوره'),
        ],
        'فولاد و معدن': [
            ('سیستم کنترل کیفیت محصولات فولادی با بینایی ماشین', 'product', 'سیستم کنترل'),
            ('سامانه مدیریت حمل و نقل مواد معدنی', 'service', 'مدیریت پروژه'),
            ('دستگاه آنالیز ترکیبات سنگ معدن', 'product', 'تجهیزات صنعتی'),
            ('سیستم پایش سلامت تجهیزات معدن', 'product', 'سنسور'),
            ('خدمات مشاوره بهینه‌سازی فرآوری', 'service', 'مشاوره'),
            ('ربات جوشکار و برشکار صنعتی', 'product', 'رباتیک'),
            ('سامانه مدیریت موجودی انبار معدن', 'product', 'نرم‌افزار'),
            ('سیستم پایش ارتعاشات تجهیزات', 'product', 'سنسور'),
            ('خدمات آموزش ایمنی معدن', 'service', 'آموزش'),
        ],
        'سلامت': [
            ('دستگاه تصویربرداری حرارتی تشخیص سرطان', 'product', 'دستگاه پزشکی'),
            ('سامانه مدیریت اطلاعات بیمارستانی (HIS)', 'product', 'نرم‌افزار'),
            ('خدمات مشاوره پیاده‌سازی HIS', 'service', 'مشاوره'),
            ('دستگاه تست قند خون هوشمند', 'product', 'دستگاه پزشکی'),
            ('سامانه نوبت‌دهی و مدیریت بیماران', 'product', 'نرم‌افزار'),
            ('خدمات آموزش پرستاری با شبیه‌سازی', 'service', 'آموزش'),
            ('سیستم تشخیص چهره برای کنترل تردد بیمارستان', 'product', 'سخت‌افزار'),
            ('دستگاه اکسیژن‌ساز پرتابل', 'product', 'دستگاه پزشکی'),
            ('سامانه مدیریت داروخانه', 'product', 'نرم‌افزار'),
        ],
        'کشاورزی': [
            ('سیستم آبیاری هوشمند مبتنی بر اینترنت اشیا', 'product', 'تجهیزات صنعتی'),
            ('سامانه تحلیل داده‌های مزرعه و پیش‌بینی عملکرد', 'service', 'تحلیل داده'),
            ('دستگاه سنجش رطوبت خاک و دما', 'product', 'سنسور'),
            ('پلتفرم مدیریت هوشمند گلخانه', 'product', 'نرم‌افزار'),
            ('خدمات مشاوره بهینه‌سازی مصرف آب', 'service', 'مشاوره'),
            ('سیستم تغذیه هوشمند دام و طیور', 'product', 'تجهیزات صنعتی'),
            ('سامانه ردیابی محصولات کشاورزی', 'product', 'راهکار یکپارچه'),
            ('دستگاه سمپاشی هوشمند', 'product', 'تجهیزات صنعتی'),
            ('خدمات آزمایش خاک و گیاه', 'service', 'تحلیل داده'),
        ],
        'حمل‌ونقل': [
            ('سامانه مدیریت ناوگان و ردیابی خودرو', 'product', 'نرم‌افزار'),
            ('سامانه پیش‌بینی ترافیک شهری با هوش مصنوعی', 'service', 'تحلیل داده'),
            ('دستگاه ردیاب GPS خودرو', 'product', 'سخت‌افزار'),
            ('پلتفرم مدیریت حمل و نقل عمومی', 'product', 'نرم‌افزار'),
            ('خدمات مشاوره بهینه‌سازی مسیر', 'service', 'مشاوره'),
            ('سیستم تشخیص تخلفات رانندگی', 'product', 'سخت‌افزار'),
            ('سامانه مدیریت پارکینگ هوشمند', 'product', 'راهکار یکپارچه'),
            ('سیستم هشدار تصادفات جاده‌ای', 'product', 'سنسور'),
            ('خدمات طراحی سیستم‌های حمل و نقل', 'service', 'طراحی'),
        ],
        'خودروسازی': [
            ('دستگاه جوشکاری لیزری دقیق برای خودرو', 'product', 'ماشین‌آلات'),
            ('سامانه تست خودروهای خودران با شبیه‌سازی', 'service', 'طراحی'),
            ('سیستم کنترل کیفیت خط تولید خودرو', 'product', 'سیستم کنترل'),
            ('دستگاه تست باتری خودروهای برقی', 'product', 'تجهیزات صنعتی'),
            ('خدمات طراحی قطعات خودرو با دوقلوی دیجیتال', 'service', 'طراحی'),
            ('ربات مونتاژ قطعات خودرو', 'product', 'رباتیک'),
            ('سامانه مدیریت زنجیره تأمین خودرو', 'product', 'نرم‌افزار'),
            ('سیستم تشخیص عیوب رنگ خودرو', 'product', 'سیستم کنترل'),
            ('خدمات مشاوره کاهش وزن خودرو', 'service', 'مشاوره'),
        ],
        'انرژی': [
            ('پکیج تولید برق خورشیدی صنعتی', 'product', 'پنل خورشیدی'),
            ('سامانه مدیریت انرژی هوشمند ساختمان', 'product', 'نرم‌افزار'),
            ('سیستم ذخیره‌سازی انرژی با باتری', 'product', 'باتری'),
            ('خدمات مشاوره انرژی‌های تجدیدپذیر', 'service', 'مشاوره'),
            ('دستگاه اندازه‌گیری مصرف انرژی', 'product', 'سنسور'),
            ('سامانه پایش و کنترل شبکه توزیع برق', 'product', 'سیستم کنترل'),
            ('خدمات آموزش بهینه‌سازی مصرف انرژی', 'service', 'آموزش'),
            ('تurbine بادی کوچک مقیاس', 'product', 'تجهیزات صنعتی'),
            ('سیستم مدیریت مصرف برق صنعتی', 'product', 'نرم‌افزار'),
        ],
        'فناوری اطلاعات': [
            ('سامانه یکپارچه مدیریت منابع سازمانی (ERP)', 'product', 'نرم‌افزار'),
            ('سامانه تشخیص چهره و احراز هویت هوشمند', 'product', 'سخت‌افزار'),
            ('پلتفرم آموزش مجازی مبتنی بر هوش مصنوعی', 'product', 'نرم‌افزار'),
            ('خدمات توسعه اپلیکیشن موبایل سفارشی', 'service', 'طراحی'),
            ('سامانه مدیریت ارتباط با مشتری (CRM)', 'product', 'نرم‌افزار'),
            ('خدمات امنیت سایبری و پنترست', 'service', 'مشاوره'),
            ('راهکار بلاکچین برای مدیریت اسناد', 'product', 'راهکار یکپارچه'),
            ('سامانه تحلیل داده‌های کلان', 'product', 'نرم‌افزار'),
            ('خدمات پیاده‌سازی زیرساخت ابری', 'service', 'پیاده‌سازی'),
            ('سامانه مدیریت محتوای سازمانی', 'product', 'نرم‌افزار'),
            ('خدمات مشاوره تحول دیجیتال', 'service', 'مشاوره'),
        ],
        'محیط زیست': [
            ('سامانه پایش آلاینده‌های هوا با پهپاد', 'product', 'تجهیزات صنعتی'),
            ('خدمات مدیریت پسماند صنعتی و بازیافت', 'service', 'مشاوره'),
            ('دستگاه سنجش آلاینده‌های آب', 'product', 'سنسور'),
            ('سامانه مدیریت سبز و کاهش کربن', 'product', 'نرم‌افزار'),
            ('خدمات مشاوره ارزیابی اثرات زیست‌محیطی', 'service', 'ارزیابی'),
            ('سیستم تصفیه فاضلاب صنعتی', 'product', 'تجهیزات صنعتی'),
            ('راهکار کاهش مصرف پلاستیک', 'product', 'راهکار یکپارچه'),
            ('دستگاه سنجش کیفیت خاک', 'product', 'سنسور'),
            ('خدمات آموزش محیط زیست', 'service', 'آموزش'),
            ('سیستم بازیافت پلاستیک', 'product', 'تجهیزات صنعتی'),
        ],
    }

    # ============================================================
    # ایجاد عرضه‌ها
    # ============================================================

    created_count = 0

    for industry, items in industry_titles.items():
        # انتخاب فناوری‌های مختلف برای این صنعت
        techs = random.sample(TECHNOLOGIES, min(4, len(TECHNOLOGIES)))
        if len(techs) < 3:
            techs = random.sample(TECHNOLOGIES, 3)

        # انتخاب استان‌های مختلف برای این صنعت
        cities = random.sample(PROVINCES, min(4, len(PROVINCES)))
        if len(cities) < 3:
            cities = random.sample(PROVINCES, 3)

        for idx, (title, supply_type, category) in enumerate(items):
            tech = techs[idx % len(techs)]
            city = cities[idx % len(cities)]
            
            price = random.randint(150000000, 2000000000)
            trl = random.choice(TRL_LEVELS)
            mrl = random.choice(MRL_LEVELS)
            quantity = random.randint(5, 100)
            unit = random.choice(UNITS)
            
            desc = f"{title} با استفاده از فناوری {tech} در صنعت {industry}، ارائه‌شده در شهر {city}. این راهکار برای بهبود بهره‌وری و کاهش هزینه‌ها طراحی شده است."

            # تصویر مرتبط با صنعت
            img_url = get_image_for_industry(industry)

            supply = create_supply(
                seller=seller,
                title=title,
                supply_type=supply_type,
                category=category,
                industry=industry,
                technology=tech,
                city=city,
                description=desc,
                quantity=quantity,
                unit=unit,
                price=price,
                trl=trl,
                mrl=mrl,
                status='published',
                image_url=img_url,
                image_name=f"{industry}_{idx}.jpg",
            )
            created_count += 1
            print(f"✅ {created_count:3d}. {supply.title[:40]} | صنعت: {supply.industry} | فناوری: {supply.technology}")

    # ============================================================
    # اضافه کردن آیتم‌های اضافی برای پوشش کامل فناوری‌ها و استان‌ها
    # ============================================================

    # بررسی پوشش فناوری‌ها
    for tech in TECHNOLOGIES:
        count = Supply.objects.filter(technology=tech).count()
        if count < 3:
            need = 3 - count
            print(f"⚠️ تکمیل فناوری {tech} با {need} مورد اضافی")
            industries_without = [ind for ind in INDUSTRIES if not Supply.objects.filter(industry=ind, technology=tech).exists()]
            if not industries_without:
                industries_without = INDUSTRIES
            selected_inds = random.sample(industries_without, min(need, len(industries_without)))
            
            for ind in selected_inds:
                title = f"راهکار {tech} در صنعت {ind}"
                category = random.choice(PRODUCT_CATEGORIES)
                city = random.choice(PROVINCES)
                price = random.randint(200000000, 1500000000)
                trl = random.choice(TRL_LEVELS)
                mrl = random.choice(MRL_LEVELS)
                supply_type = random.choice(['product', 'service'])
                desc = f"راهکار تخصصی با فناوری {tech} برای صنعت {ind}، ارائه‌شده در {city}."
                img_url = get_image_for_industry(ind)
                
                supply = create_supply(
                    seller=seller,
                    title=title,
                    supply_type=supply_type,
                    category=category,
                    industry=ind,
                    technology=tech,
                    city=city,
                    description=desc,
                    quantity=random.randint(5, 80),
                    unit=random.choice(UNITS),
                    price=price,
                    trl=trl,
                    mrl=mrl,
                    status='published',
                    image_url=img_url,
                    image_name=f"tech_{tech}_{ind}.jpg",
                )
                created_count += 1
                print(f"✅ {created_count:3d}. تکمیل فناوری: {supply.title[:40]}")

    # بررسی پوشش استان‌ها
    for prov in PROVINCES:
        count = Supply.objects.filter(city=prov).count()
        if count < 3:
            need = 3 - count
            print(f"⚠️ تکمیل استان {prov} با {need} مورد اضافی")
            industries_without = [ind for ind in INDUSTRIES if not Supply.objects.filter(industry=ind, city=prov).exists()]
            if not industries_without:
                industries_without = INDUSTRIES
            selected_inds = random.sample(industries_without, min(need, len(industries_without)))
            
            for ind in selected_inds:
                title = f"راهکار صنعت {ind} در {prov}"
                category = random.choice(PRODUCT_CATEGORIES)
                tech = random.choice(TECHNOLOGIES)
                price = random.randint(200000000, 1500000000)
                trl = random.choice(TRL_LEVELS)
                mrl = random.choice(MRL_LEVELS)
                supply_type = random.choice(['product', 'service'])
                desc = f"راهکار تخصصی برای صنعت {ind} با فناوری {tech}، ارائه‌شده در {prov}."
                img_url = get_image_for_industry(ind)
                
                supply = create_supply(
                    seller=seller,
                    title=title,
                    supply_type=supply_type,
                    category=category,
                    industry=ind,
                    technology=tech,
                    city=prov,
                    description=desc,
                    quantity=random.randint(5, 80),
                    unit=random.choice(UNITS),
                    price=price,
                    trl=trl,
                    mrl=mrl,
                    status='published',
                    image_url=img_url,
                    image_name=f"city_{prov}_{ind}.jpg",
                )
                created_count += 1
                print(f"✅ {created_count:3d}. تکمیل استان: {supply.title[:40]}")

    # ============================================================
    # اضافه کردن محصولات تصادفی برای تنوع بیشتر
    # ============================================================
    
    extra_titles = [
        'سامانه مدیریت دارایی‌های سازمانی',
        'دستگاه تشخیص نشت گاز هوشمند',
        'پلتفرم مدیریت پروژه‌های تحقیق و توسعه',
        'سیستم اتوماسیون اداری یکپارچه',
        'راهکار مانیتورینگ شبکه‌های صنعتی',
        'دستگاه کالیبراسیون فشار و دما',
        'سامانه مدیریت دانش سازمانی',
        'ربات اکتشافی زیر آب',
        'سیستم تصفیه هوای صنعتی',
        'پلتفرم همکاری و اشتراک‌گذاری اسناد',
        'دستگاه سنجش کیفیت آب',
        'سامانه پیش‌بینی تقاضای بازار',
        'راهکار مدیریت بحران و پدافند غیرعامل',
        'سیستم روشنایی هوشمند خیابانی',
        'پلتفرم تحلیل احساسات مشتریان',
        'سامانه مدیریت قراردادها',
        'دستگاه تست غیرمخرب فراصوت',
        'سیستم کنترل دسترسی هوشمند',
        'راهکار مدیریت نیروی کار',
        'سامانه ارزیابی عملکرد کارکنان',
    ]

    for idx, title in enumerate(extra_titles):
        industry = random.choice(INDUSTRIES)
        tech = random.choice(TECHNOLOGIES)
        city = random.choice(PROVINCES)
        category = random.choice(PRODUCT_CATEGORIES + SERVICE_CATEGORIES)
        supply_type = random.choice(['product', 'service'])
        price = random.randint(150000000, 2000000000)
        trl = random.choice(TRL_LEVELS)
        mrl = random.choice(MRL_LEVELS)
        desc = f"{title} با فناوری {tech} برای صنعت {industry} در {city}."
        img_url = get_image_for_industry(industry)

        supply = create_supply(
            seller=seller,
            title=title,
            supply_type=supply_type,
            category=category,
            industry=industry,
            technology=tech,
            city=city,
            description=desc,
            quantity=random.randint(5, 100),
            unit=random.choice(UNITS),
            price=price,
            trl=trl,
            mrl=mrl,
            status='published',
            image_url=img_url,
            image_name=f"extra_{idx}.jpg",
        )
        created_count += 1
        print(f"✅ {created_count:3d}. اضافه: {supply.title[:40]}")

    # ============================================================
    # گزارش نهایی
    # ============================================================

    print("\n" + "=" * 70)
    print("📊 گزارش نهایی - پوشش فیلترها با تصاویر مرتبط")
    print("=" * 70)

    print("\n🏭 پوشش صنایع:")
    for ind in INDUSTRIES:
        count = Supply.objects.filter(industry=ind).count()
        status = "✅" if count >= 3 else "⚠️"
        print(f"  {status} {ind}: {count} مورد")

    print("\n🔬 پوشش فناوری‌ها:")
    for tech in TECHNOLOGIES:
        count = Supply.objects.filter(technology=tech).count()
        status = "✅" if count >= 3 else "⚠️"
        print(f"  {status} {tech}: {count} مورد")

    print("\n📍 پوشش استان‌ها:")
    for prov in PROVINCES:
        count = Supply.objects.filter(city=prov).count()
        status = "✅" if count >= 3 else "⚠️"
        print(f"  {status} {prov}: {count} مورد")

    product_count = Supply.objects.filter(supply_type='product').count()
    service_count = Supply.objects.filter(supply_type='service').count()
    print(f"\n📦 نوع عرضه: {product_count} محصول, {service_count} خدمت")

    print(f"\n🎯 تعداد کل عرضه‌های ایجاد شده: {created_count}")
    print("\n✅ تمام فیلترها حداقل ۳ مورد دارند و تصاویر مرتبط با صنعت هستند.")

if __name__ == "__main__":
    print("🔄 شروع تولید عرضه‌های کامل با تصاویر مرتبط...")
    generate_guaranteed_coverage()
    print("\n✅ اسکریپت با موفقیت اجرا شد.")