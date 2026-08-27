# seed_marketplace_data.py
# اسکریپت ایجاد داده‌های نمونه برای بازار فناوری و نوآوری
# بر اساس جدول مشخصات محصولات و خدمات

import os
import django
from django.core.files.base import ContentFile
import requests
from io import BytesIO
from PIL import Image
from decimal import Decimal

# تنظیم محیط Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from industries.models import IndustryCategory
from needs.models import Need
from products.models import Product
from matching.models import MatchResult

User = get_user_model()

def download_image(url, filename):
    """دانلود تصویر از اینترنت"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            img = Image.open(BytesIO(response.content))
            img_io = BytesIO()
            img.save(img_io, format='JPEG', quality=85)
            return ContentFile(img_io.getvalue(), name=filename)
    except Exception as e:
        print(f"⚠️ خطا در دانلود تصویر: {e}")
    return None


def create_marketplace_data():
    print("🔄 شروع ایجاد داده‌های نمونه بازار فناوری و نوآوری...")

    # ============================================================
    # 1. ایجاد یا پیدا کردن کاربران
    # ============================================================

    user_data = [
        {'username': 'azadeh123', 'first_name': 'آزاده', 'last_name': 'محمدی', 'email': 'azadeh@tech.com'},
        {'username': 'mehdi_tech', 'first_name': 'مهدی', 'last_name': 'کریمی', 'email': 'mehdi@tech.com'},
        {'username': 'sara_innovate', 'first_name': 'سارا', 'last_name': 'احمدی', 'email': 'sara@innovate.com'},
        {'username': 'reza_energy', 'first_name': 'رضا', 'last_name': 'حسینی', 'email': 'reza@energy.com'},
        {'username': 'fateme_ai', 'first_name': 'فاطمه', 'last_name': 'رضایی', 'email': 'fateme@ai.com'},
        {'username': 'ali_industry', 'first_name': 'علی', 'last_name': 'نوری', 'email': 'ali@industry.com'},
        {'username': 'test_buyer1', 'first_name': 'خریدار', 'last_name': 'نمونه', 'email': 'buyer1@test.com'},
        {'username': 'test_buyer2', 'first_name': 'خریدار', 'last_name': 'دوم', 'email': 'buyer2@test.com'},
    ]

    users = {}
    for u_data in user_data:
        user, created = User.objects.get_or_create(
            username=u_data['username'],
            defaults={
                'first_name': u_data['first_name'],
                'last_name': u_data['last_name'],
                'email': u_data['email'],
                'is_active': True,
            }
        )
        if created:
            user.set_password('123456')
            user.save()
            print(f'✅ کاربر جدید: {user.first_name} {user.last_name} ({user.username})')
        else:
            print(f'ℹ️ کاربر موجود: {user.first_name} {user.last_name}')
        users[u_data['username']] = user

    # ============================================================
    # 2. ایجاد صنایع مختلف
    # ============================================================

    industries_data = [
        {'name': 'پتروشیمی', 'description': 'صنایع پتروشیمی و فرآورده‌های نفتی'},
        {'name': 'انرژی و محیط زیست', 'description': 'انرژی‌های تجدیدپذیر، مدیریت انرژی، پایش محیط زیست'},
        {'name': 'فناوری اطلاعات و ارتباطات', 'description': 'نرم‌افزار، سخت‌افزار، شبکه، امنیت سایبری'},
        {'name': 'صنایع تولیدی و ساخت', 'description': 'تولید قطعات، ماشین‌آلات، تجهیزات صنعتی'},
        {'name': 'دارو و تجهیزات پزشکی', 'description': 'داروسازی، تجهیزات تشخیصی، بیوتکنولوژی پزشکی'},
        {'name': 'کشاورزی و صنایع غذایی', 'description': 'کشاورزی هوشمند، فرآوری مواد غذایی، بیوتکنولوژی کشاورزی'},
        {'name': 'حمل و نقل و لجستیک', 'description': 'سیستم‌های حمل و نقل هوشمند، لجستیک، خودروهای برقی'},
        {'name': 'خدمات مالی و بیمه', 'description': 'فین‌تک، بیمه‌گری، تحلیل مالی، بلاکچین'},
        {'name': 'آموزش و فرهنگ', 'description': 'فناوری‌های آموزشی، محتوای دیجیتال، واقعیت مجازی'},
        {'name': 'ساخت و ساز و مسکن', 'description': 'فناوری‌های ساختمانی، مصالح نوین، مدیریت پروژه'},
    ]

    industries = {}
    for ind_data in industries_data:
        industry, created = IndustryCategory.objects.get_or_create(
            name=ind_data['name'],
            defaults={'description': ind_data['description']}
        )
        if created:
            print(f'✅ صنعت جدید: {industry.name}')
        else:
            print(f'ℹ️ صنعت موجود: {industry.name}')
        industries[ind_data['name']] = industry

    # ============================================================
    # 3. ایجاد نیازها (برای چند صنعت و کاربر)
    # ============================================================

    needs_data = [
        # نیازهای صنعت پتروشیمی
        {
            'buyer': users['azadeh123'],
            'industry': industries['پتروشیمی'],
            'title': 'سیستم هوشمند کنترل فرآیند تولید الفین',
            'description': 'نیاز به یک سیستم هوشمند برای پایش و کنترل خودکار فرآیندهای تولید الفین در واحد پتروشیمی.',
            'budget': '850000000',
            'timeline': '4 ماه',
            'status': 'active'
        },
        {
            'buyer': users['azadeh123'],
            'industry': industries['پتروشیمی'],
            'title': 'بهینه‌سازی مصرف انرژی کوره‌های پتروشیمی',
            'description': 'راهکار کاهش مصرف انرژی در کوره‌های پتروشیمی با استفاده از الگوریتم‌های هوش مصنوعی.',
            'budget': '1200000000',
            'timeline': '6 ماه',
            'status': 'active'
        },
        {
            'buyer': users['test_buyer1'],
            'industry': industries['پتروشیمی'],
            'title': 'سیستم مدیریت پسماند و بازیافت پتروشیمی',
            'description': 'راهکار جامع مدیریت پسماندهای صنعتی پتروشیمی با رویکرد بازیافت و کاهش آلودگی.',
            'budget': '450000000',
            'timeline': '5 ماه',
            'status': 'active'
        },
        # نیازهای صنعت انرژی و محیط زیست
        {
            'buyer': users['reza_energy'],
            'industry': industries['انرژی و محیط زیست'],
            'title': 'سامانه پایش آلاینده‌های صنعتی',
            'description': 'سیستم پایش لحظه‌ای آلاینده‌های گازی و ذرات معلق در صنایع مختلف.',
            'budget': '950000000',
            'timeline': '3 ماه',
            'status': 'active'
        },
        {
            'buyer': users['reza_energy'],
            'industry': industries['انرژی و محیط زیست'],
            'title': 'سیستم مدیریت انرژی هوشمند برای ساختمان‌ها',
            'description': 'راهکار یکپارچه مدیریت مصرف انرژی در ساختمان‌های اداری و تجاری با استفاده از IoT.',
            'budget': '620000000',
            'timeline': '5 ماه',
            'status': 'active'
        },
        {
            'buyer': users['test_buyer2'],
            'industry': industries['انرژی و محیط زیست'],
            'title': 'مشاوره پیاده‌سازی انرژی‌های تجدیدپذیر',
            'description': 'ارائه خدمات مشاوره برای پیاده‌سازی سیستم‌های خورشیدی و بادی در صنایع.',
            'budget': '380000000',
            'timeline': '4 ماه',
            'status': 'active'
        },
        # نیازهای صنعت فناوری اطلاعات
        {
            'buyer': users['mehdi_tech'],
            'industry': industries['فناوری اطلاعات و ارتباطات'],
            'title': 'سامانه مدیریت یکپارچه منابع سازمانی (ERP)',
            'description': 'نیاز به یک سامانه ERP جامع برای مدیریت مالی، منابع انسانی و زنجیره تأمین.',
            'budget': '1500000000',
            'timeline': '8 ماه',
            'status': 'active'
        },
        {
            'buyer': users['mehdi_tech'],
            'industry': industries['فناوری اطلاعات و ارتباطات'],
            'title': 'سامانه احراز هویت بیومتریک',
            'description': 'سیستم تشخیص چهره و اثرانگشت برای کنترل تردد در سازمان‌های حساس.',
            'budget': '890000000',
            'timeline': '6 ماه',
            'status': 'active'
        },
        {
            'buyer': users['fateme_ai'],
            'industry': industries['فناوری اطلاعات و ارتباطات'],
            'title': 'پلتفرم آموزش مجازی مبتنی بر هوش مصنوعی',
            'description': 'پلتفرم آموزش هوشمند با مسیر یادگیری شخصی‌سازی‌شده برای هر کاربر.',
            'budget': '580000000',
            'timeline': '7 ماه',
            'status': 'active'
        },
        # نیازهای صنعت دارو و تجهیزات پزشکی
        {
            'buyer': users['sara_innovate'],
            'industry': industries['دارو و تجهیزات پزشکی'],
            'title': 'دستگاه تصویربرداری حرارتی تشخیص سرطان',
            'description': 'سیستم تصویربرداری حرارتی برای تشخیص زودهنگام سرطان پستان با دقت بالا.',
            'budget': '2500000000',
            'timeline': '10 ماه',
            'status': 'active'
        },
        {
            'buyer': users['sara_innovate'],
            'industry': industries['دارو و تجهیزات پزشکی'],
            'title': 'سامانه مدیریت اطلاعات بیمارستانی (HIS)',
            'description': 'سامانه جامع مدیریت اطلاعات بیمارستانی با قابلیت یکپارچه‌سازی با تجهیزات پزشکی.',
            'budget': '1100000000',
            'timeline': '8 ماه',
            'status': 'active'
        },
        # نیازهای صنعت کشاورزی
        {
            'buyer': users['test_buyer1'],
            'industry': industries['کشاورزی و صنایع غذایی'],
            'title': 'سیستم آبیاری هوشمند مبتنی بر اینترنت اشیا',
            'description': 'سیستم هوشمند آبیاری با استفاده از سنسورهای رطوبت خاک و پیش‌بینی بارندگی.',
            'budget': '320000000',
            'timeline': '4 ماه',
            'status': 'active'
        },
    ]

    created_needs = []
    for need_data in needs_data:
        need, created = Need.objects.get_or_create(
            buyer=need_data['buyer'],
            title=need_data['title'],
            defaults={
                'industry': need_data['industry'],
                'description': need_data['description'],
                'budget': need_data['budget'],
                'timeline': need_data['timeline'],
                'status': need_data['status'],
            }
        )
        if created:
            print(f'✅ نیاز جدید: {need.title} (خریدار: {need.buyer.username})')
        else:
            print(f'ℹ️ نیاز موجود: {need.title}')
        created_needs.append(need)

    # ============================================================
    # 4. ایجاد محصولات و خدمات (با تصاویر)
    # ============================================================

    products_data = [
        # محصولات پتروشیمی
        {
            'seller': users['azadeh123'],
            'industry': industries['پتروشیمی'],
            'title': 'سیستم کنترل هوشمند کوره‌های پتروشیمی',
            'short_description': 'سیستم کنترل هوشمند مبتنی بر هوش مصنوعی برای بهینه‌سازی دمای کوره‌ها',
            'full_description': 'سیستم کنترل هوشمند کوره‌های پتروشیمی با استفاده از الگوریتم‌های پیشرفته یادگیری عمیق. کاهش مصرف سوخت تا ۲۰٪ و افزایش عمر مفید کوره‌ها.',
            'category': 'product',
            'price': 780000000,
            'trl': 8,
            'mrl': 7,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=400&fit=crop',
            'image_name': 'furnace_control.jpg'
        },
        {
            'seller': users['azadeh123'],
            'industry': industries['پتروشیمی'],
            'title': 'سیستم پایش آلاینده‌های صنعتی',
            'short_description': 'سیستم دقیق پایش آنلاین آلاینده‌های گازی و ذرات معلق',
            'full_description': 'سیستم پیشرفته پایش آلاینده‌ها با استفاده از سنسورهای دقیق و تحلیل داده‌های محیطی. قابلیت اتصال به سامانه‌های مرکزی مدیریت محیط زیست.',
            'category': 'product',
            'price': 680000000,
            'trl': 8,
            'mrl': 8,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1614308450916-7c5f5e55f3a2?w=600&h=400&fit=crop',
            'image_name': 'pollution_monitoring.jpg'
        },
        {
            'seller': users['reza_energy'],
            'industry': industries['پتروشیمی'],
            'title': 'خدمات مشاوره بهینه‌سازی انرژی پتروشیمی',
            'short_description': 'خدمات مشاوره تخصصی بهینه‌سازی مصرف انرژی در صنایع پتروشیمی',
            'full_description': 'ارائه خدمات مشاوره جامع برای کاهش مصرف انرژی در پتروشیمی‌ها، شامل ممیزی انرژی، طراحی سیستم‌های بازیابی حرارت و آموزش پرسنل.',
            'category': 'service',
            'price': 250000000,
            'trl': 9,
            'mrl': 9,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=600&h=400&fit=crop',
            'image_name': 'energy_consulting.jpg'
        },
        # محصولات انرژی و محیط زیست
        {
            'seller': users['reza_energy'],
            'industry': industries['انرژی و محیط زیست'],
            'title': 'پکیج تولید برق خورشیدی صنعتی',
            'short_description': 'پکیج کامل تولید برق خورشیدی برای صنایع و مجتمع‌های بزرگ',
            'full_description': 'پکیج جامع تولید برق خورشیدی شامل پنل‌های فتوولتائیک، اینورترها و سیستم ذخیره‌سازی انرژی. توان تولیدی ۵۰ تا ۵۰۰ کیلووات.',
            'category': 'product',
            'price': 1500000000,
            'trl': 9,
            'mrl': 8,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=400&fit=crop',
            'image_name': 'solar_package.jpg'
        },
        {
            'seller': users['reza_energy'],
            'industry': industries['انرژی و محیط زیست'],
            'title': 'سامانه مدیریت انرژی هوشمند',
            'short_description': 'سامانه یکپارچه مدیریت و بهینه‌سازی مصرف انرژی در ساختمان‌ها و صنایع',
            'full_description': 'سامانه مدیریت انرژی با استفاده از IoT و هوش مصنوعی برای کاهش مصرف و افزایش بهره‌وری. شامل پایش لحظه‌ای و گزارش‌گیری پیشرفته.',
            'category': 'software_solution',
            'price': 890000000,
            'trl': 8,
            'mrl': 7,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=400&fit=crop',
            'image_name': 'energy_management.jpg'
        },
        # محصولات فناوری اطلاعات
        {
            'seller': users['mehdi_tech'],
            'industry': industries['فناوری اطلاعات و ارتباطات'],
            'title': 'سامانه مدیریت یکپارچه منابع سازمانی (ERP)',
            'short_description': 'راهکار جامع مدیریت مالی، منابع انسانی و زنجیره تامین',
            'full_description': 'سامانه مدیریت یکپارچه منابع سازمانی با قابلیت شخصی‌سازی بالا. شامل مدیریت مالی، حسابداری، منابع انسانی، زنجیره تأمین و انبار.',
            'category': 'software_solution',
            'price': 1200000000,
            'trl': 9,
            'mrl': 9,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
            'image_name': 'erp_system.jpg'
        },
        {
            'seller': users['fateme_ai'],
            'industry': industries['فناوری اطلاعات و ارتباطات'],
            'title': 'سامانه تشخیص چهره و احراز هویت هوشمند',
            'short_description': 'راهکار احراز هویت بیومتریک مبتنی بر تشخیص چهره',
            'full_description': 'سامانه پیشرفته تشخیص چهره و احراز هویت با استفاده از هوش مصنوعی. دقت بالای ۹۸٪ و مقاوم در برابر حملات اسپوفینگ.',
            'category': 'data_ai_asset',
            'price': 890000000,
            'trl': 8,
            'mrl': 8,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&h=400&fit=crop',
            'image_name': 'face_recognition.jpg'
        },
        {
            'seller': users['fateme_ai'],
            'industry': industries['فناوری اطلاعات و ارتباطات'],
            'title': 'پلتفرم آموزش مجازی مبتنی بر هوش مصنوعی',
            'short_description': 'پلتفرم آموزش هوشمند با مسیر یادگیری شخصی‌سازی‌شده',
            'full_description': 'پلتفرم آموزش مجازی با قابلیت شخصی‌سازی مسیر یادگیری برای هر دانش‌آموز. شامل تحلیل سطح دانش، آزمون‌های تعاملی و بازخورد لحظه‌ای.',
            'category': 'software_solution',
            'price': 580000000,
            'trl': 8,
            'mrl': 8,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&h=400&fit=crop',
            'image_name': 'edtech_platform.jpg'
        },
        # محصولات دارو و تجهیزات پزشکی
        {
            'seller': users['sara_innovate'],
            'industry': industries['دارو و تجهیزات پزشکی'],
            'title': 'دستگاه تصویربرداری حرارتی تشخیص سرطان',
            'short_description': 'سیستم تصویربرداری حرارتی برای تشخیص زودهنگام سرطان پستان',
            'full_description': 'دستگاه تصویربرداری حرارتی پیشرفته برای تشخیص زودهنگام سرطان پستان با دقت بالای ۹۵٪. کاملاً غیرتهاجمی و بدون تشعشع.',
            'category': 'equipment',
            'price': 2500000000,
            'trl': 7,
            'mrl': 6,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop',
            'image_name': 'thermal_imaging.jpg'
        },
        {
            'seller': users['sara_innovate'],
            'industry': industries['دارو و تجهیزات پزشکی'],
            'title': 'سامانه مدیریت اطلاعات بیمارستانی (HIS)',
            'short_description': 'سامانه جامع مدیریت اطلاعات بیمارستانی با قابلیت یکپارچه‌سازی',
            'full_description': 'سامانه جامع مدیریت اطلاعات بیمارستانی با قابلیت یکپارچه‌سازی با تجهیزات پزشکی و سیستم‌های بیمه.',
            'category': 'software_solution',
            'price': 950000000,
            'trl': 8,
            'mrl': 7,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop',
            'image_name': 'his_system.jpg'
        },
        # محصولات کشاورزی
        {
            'seller': users['ali_industry'],
            'industry': industries['کشاورزی و صنایع غذایی'],
            'title': 'سیستم آبیاری هوشمند مبتنی بر اینترنت اشیا',
            'short_description': 'سیستم هوشمند آبیاری با استفاده از سنسورهای رطوبت و هوش مصنوعی',
            'full_description': 'سیستم آبیاری هوشمند با استفاده از سنسورهای رطوبت خاک، دما و پیش‌بینی بارندگی. کاهش مصرف آب تا ۴۰٪.',
            'category': 'technology',
            'price': 320000000,
            'trl': 7,
            'mrl': 6,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&h=400&fit=crop',
            'image_name': 'smart_irrigation.jpg'
        },
        # محصولات صنایع تولیدی
        {
            'seller': users['ali_industry'],
            'industry': industries['صنایع تولیدی و ساخت'],
            'title': 'دستگاه جوشکاری لیزری دقیق',
            'short_description': 'دستگاه جوشکاری لیزری با دقت بالا برای صنایع حساس',
            'full_description': 'دستگاه جوشکاری لیزری دقیق با دقت کمتر از ۰.۰۱ میلی‌متر. سرعت بالا و حداقل حرارت ورودی. مناسب برای صنایع هوافضا و خودروسازی.',
            'category': 'equipment',
            'price': 1800000000,
            'trl': 7,
            'mrl': 7,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=400&fit=crop',
            'image_name': 'laser_welding.jpg'
        },
        # محصولات حمل و نقل
        {
            'seller': users['mehdi_tech'],
            'industry': industries['حمل و نقل و لجستیک'],
            'title': 'سامانه مدیریت ناوگان و ردیابی خودرو',
            'short_description': 'سامانه هوشمند مدیریت ناوگان حمل و نقل با ردیابی GPS',
            'full_description': 'سامانه جامع مدیریت ناوگان حمل و نقل با قابلیت ردیابی لحظه‌ای، مدیریت مسیر، بهینه‌سازی مصرف سوخت و گزارش‌گیری پیشرفته.',
            'category': 'software_solution',
            'price': 450000000,
            'trl': 8,
            'mrl': 8,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1543096222-72de739f791a?w=600&h=400&fit=crop',
            'image_name': 'fleet_management.jpg'
        },
        # محصولات خدمات مالی
        {
            'seller': users['azadeh123'],
            'industry': industries['خدمات مالی و بیمه'],
            'title': 'سامانه مدیریت اعتبار و ریسک مشتریان',
            'short_description': 'راهکار هوشمند ارزیابی اعتبار و ریسک مشتریان با هوش مصنوعی',
            'full_description': 'سامانه پیشرفته مدیریت اعتبار و ریسک مشتریان برای مؤسسات مالی و بیمه‌ها. شامل ارزیابی هوشمند، پیش‌بینی ریسک و داشبورد مدیریتی.',
            'category': 'software_solution',
            'price': 950000000,
            'trl': 8,
            'mrl': 8,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
            'image_name': 'credit_management.jpg'
        },
    ]

    created_products = []
    for product_data in products_data:
        image_file = None
        if 'image_url' in product_data:
            image_file = download_image(product_data['image_url'], product_data['image_name'])

        product, created = Product.objects.get_or_create(
            seller=product_data['seller'],
            title=product_data['title'],
            defaults={
                'industry': product_data['industry'],
                'short_description': product_data['short_description'],
                'full_description': product_data['full_description'],
                'category': product_data['category'],
                'price': product_data['price'],
                'trl': product_data['trl'],
                'mrl': product_data['mrl'],
                'status': product_data['status'],
            }
        )

        if created and image_file:
            product.image.save(product_data['image_name'], image_file, save=True)
            print(f'✅ تصویر برای {product.title} ذخیره شد')

        if created:
            print(f'✅ محصول جدید: {product.title} (فروشنده: {product.seller.username})')
        else:
            print(f'ℹ️ محصول موجود: {product.title}')
        created_products.append(product)

    # ============================================================
    # 5. ایجاد نتایج تطبیق
    # ============================================================

    match_pairs = [
        # پتروشیمی
        (created_needs[0], created_products[0], 88, 'تطابق عالی در حوزه کنترل فرآیند و بهینه‌سازی انرژی', 'ریسک پایین - پیشنهاد می‌شود مذاکره را شروع کنید.'),
        (created_needs[0], created_products[1], 82, 'تطابق خوب در حوزه پایش و کنترل فرآیند', 'ریسک متوسط - نیاز به بررسی دقیق‌تر قابلیت‌ها.'),
        (created_needs[1], created_products[0], 95, 'تطابق عالی در حوزه بهینه‌سازی انرژی کوره‌ها', 'ریسک پایین - بهترین گزینه موجود.'),
        (created_needs[2], created_products[2], 85, 'تطابق خوب در حوزه مدیریت پسماند', 'ریسک متوسط - گزینه قابل قبول.'),
        # انرژی و محیط زیست
        (created_needs[3], created_products[3], 90, 'تطابق عالی در حوزه پایش آلاینده‌ها', 'ریسک پایین - گزینه بسیار مناسب.'),
        (created_needs[4], created_products[4], 88, 'تطابق عالی در حوزه مدیریت انرژی هوشمند', 'ریسک پایین - گزینه بسیار مناسب.'),
        (created_needs[5], created_products[4], 75, 'تطابق خوب در حوزه مشاوره انرژی', 'ریسک متوسط - نیاز به بررسی دقیق‌تر.'),
        # فناوری اطلاعات
        (created_needs[6], created_products[5], 92, 'تطابق عالی در حوزه ERP', 'ریسک پایین - گزینه بسیار مناسب.'),
        (created_needs[7], created_products[6], 90, 'تطابق عالی در حوزه احراز هویت بیومتریک', 'ریسک پایین - گزینه بسیار مناسب.'),
        (created_needs[8], created_products[7], 85, 'تطابق عالی در حوزه آموزش مجازی', 'ریسک پایین - گزینه مناسب.'),
        # دارو و تجهیزات پزشکی
        (created_needs[9], created_products[8], 88, 'تطابق عالی در حوزه تصویربرداری حرارتی', 'ریسک پایین - گزینه بسیار مناسب.'),
        (created_needs[10], created_products[9], 85, 'تطابق خوب در حوزه HIS', 'ریسک متوسط - نیاز به بررسی دقیق‌تر.'),
        # کشاورزی
        (created_needs[11], created_products[10], 90, 'تطابق عالی در حوزه آبیاری هوشمند', 'ریسک پایین - گزینه بسیار مناسب.'),
    ]

    for need, product, score, reason, actions in match_pairs:
        if need and product:
            match, created = MatchResult.objects.get_or_create(
                need=need,
                product=product,
                defaults={
                    'score': score,
                    'match_percentage': score,
                    'reason': reason,
                    'recommended_actions': actions,
                    'status': 'approved',
                }
            )
            if created:
                print(f'✅ تطبیق: {need.title[:30]}... ↔ {product.title[:30]}... ({score}%)')
            else:
                print(f'ℹ️ تطبیق موجود')

    # ============================================================
    # 6. خلاصه نهایی
    # ============================================================

    print("\n" + "=" * 70)
    print("📊 خلاصه داده‌های ایجاد شده - بازار فناوری و نوآوری")
    print("=" * 70)
    print(f"👥 کاربران: {User.objects.count()}")
    print(f"🏭 صنایع: {IndustryCategory.objects.count()}")
    print(f"📋 نیازها: {Need.objects.count()}")
    print(f"📦 محصولات: {Product.objects.count()}")
    print(f"🔗 نتایج تطبیق: {MatchResult.objects.count()}")
    print("=" * 70)

    print("\n📋 لیست نیازها:")
    for need in Need.objects.all():
        print(f"  🔹 #{need.id}: {need.title}")
        print(f"     خریدار: {need.buyer.first_name} {need.buyer.last_name} ({need.buyer.username})")
        print(f"     صنعت: {need.industry.name}")
        print(f"     بودجه: {need.budget} تومان")
        print(f"     زمان: {need.timeline}")
        print()

    print("\n📦 لیست محصولات:")
    for product in Product.objects.all():
        print(f"  🔸 #{product.id}: {product.title}")
        print(f"     فروشنده: {product.seller.first_name} {product.seller.last_name} ({product.seller.username})")
        print(f"     صنعت: {product.industry.name}")
        print(f"     قیمت: {format(int(product.price or 0), ',')} تومان")
        print(f"     TRL: {product.trl}/۹, MRL: {product.mrl}/۹")
        if product.image:
            print(f"     📷 تصویر: {product.image.url}")
        print()

    print("\n✅ همه داده‌ها با موفقیت ایجاد شدند!")
    print("\n🔗 مسیرهای تست API:")
    print("  - /api/needs/")
    print("  - /api/products/")
    print("  - /api/matching/results/")
    print("\n👤 اطلاعات کاربران برای ورود (پسورد همه: 123456):")
    for username in users.keys():
        print(f"  - {username}")
    print("\n🎯 پیشنهاد: برای مشاهده نتایج تطبیق به مسیر /matching/ در فرانت‌اند بروید.")


if __name__ == "__main__":
    create_marketplace_data()