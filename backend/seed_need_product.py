# seed.py - نسخه نهایی با فیلدهای صحیح

import os
import django
from django.core.files.base import ContentFile
import requests
from io import BytesIO
from PIL import Image

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

def create_petro_data():
    print("🔄 شروع ایجاد داده‌های واقعی صنعت پتروشیمی...")

    # ============================================================
    # 1. ایجاد یا پیدا کردن کاربران
    # ============================================================
    
    users = {}
    user_data = [
        {'username': 'azadeh', 'first_name': 'آزاده', 'last_name': 'محمدی', 'email': 'azadeh@petro.com'},
        {'username': 'azadeh123', 'first_name': 'محمد', 'last_name': 'رضایی', 'email': 'mohammad@petro.com'},
        {'username': 'testuser1', 'first_name': 'سارا', 'last_name': 'کریمی', 'email': 'sara@petro.com'},
        {'username': 'testuser2', 'first_name': 'علی', 'last_name': 'احمدی', 'email': 'ali@petro.com'},
        {'username': 'petro_admin', 'first_name': 'مدیر', 'last_name': 'پتروشیمی', 'email': 'admin@petro.com'},
    ]
    
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
    # 2. ایجاد صنعت پتروشیمی
    # ============================================================
    
    industry, created = IndustryCategory.objects.get_or_create(
        name='پتروشیمی'
    )
    if created:
        print(f'✅ صنعت جدید: {industry.name}')
    else:
        print(f'ℹ️ صنعت موجود: {industry.name}')

    # ============================================================
    # 3. ایجاد نیازها (بدون فیلد category)
    # ============================================================
    
    needs_data = [
        # نیازهای azadeh
        {
            'buyer': users['azadeh'],
            'industry': industry,
            'title': 'سیستم هوشمند کنترل فرآیند تولید الفین',
            'description': 'نیاز به یک سیستم هوشمند برای پایش و کنترل خودکار فرآیندهای تولید الفین در واحد پتروشیمی. سیستم باید قابلیت اتصال به سنسورهای موجود را داشته باشد.',
            'budget': '850000000',
            'timeline': '4 ماه',
            'status': 'active'
        },
        {
            'buyer': users['azadeh'],
            'industry': industry,
            'title': 'بهینه‌سازی مصرف انرژی کوره‌های پتروشیمی',
            'description': 'راهکار کاهش مصرف انرژی در کوره‌های پتروشیمی با استفاده از الگوریتم‌های هوش مصنوعی. هدف کاهش ۲۰ درصدی مصرف سوخت.',
            'budget': '1200000000',
            'timeline': '6 ماه',
            'status': 'active'
        },
        {
            'buyer': users['azadeh'],
            'industry': industry,
            'title': 'سیستم مدیریت پسماند و بازیافت پتروشیمی',
            'description': 'راهکار جامع مدیریت پسماندهای صنعتی پتروشیمی با رویکرد بازیافت و کاهش آلودگی.',
            'budget': '450000000',
            'timeline': '5 ماه',
            'status': 'active'
        },
        {
            'buyer': users['azadeh'],
            'industry': industry,
            'title': 'سیستم پایش آنلاین آلاینده‌های صنعتی',
            'description': 'سیستم پایش لحظه‌ای آلاینده‌های گازی و ذرات معلق در صنایع پتروشیمی.',
            'budget': '950000000',
            'timeline': '3 ماه',
            'status': 'active'
        },
        {
            'buyer': users['azadeh'],
            'industry': industry,
            'title': 'مشاوره پیاده‌سازی صنعت ۴.۰ در پتروشیمی',
            'description': 'ارائه خدمات مشاوره برای پیاده‌سازی صنعت ۴.۰ و دیجیتال‌سازی در صنایع پتروشیمی.',
            'budget': '600000000',
            'timeline': '7 ماه',
            'status': 'active'
        },
        # نیازهای azadeh123
        {
            'buyer': users['azadeh123'],
            'industry': industry,
            'title': 'سیستم نگهداری و تعمیرات پیشگیرانه (نت) هوشمند',
            'description': 'سیستم مدیریت نگهداری و تعمیرات پیشگیرانه مبتنی بر داده‌های عملیاتی و هوش مصنوعی.',
            'budget': '1500000000',
            'timeline': '8 ماه',
            'status': 'active'
        },
        {
            'buyer': users['azadeh123'],
            'industry': industry,
            'title': 'سیستم کنترل کیفیت محصولات پتروشیمی',
            'description': 'سیستم کنترل کیفیت اتوماتیک با استفاده از بینایی ماشین و یادگیری عمیق.',
            'budget': '890000000',
            'timeline': '6 ماه',
            'status': 'active'
        },
        {
            'buyer': users['azadeh123'],
            'industry': industry,
            'title': 'سیستم مدیریت انرژی و بهینه‌سازی مصرف',
            'description': 'سیستم مدیریت یکپارچه انرژی با قابلیت بهینه‌سازی مصرف در واحدهای پتروشیمی.',
            'budget': '1100000000',
            'timeline': '5 ماه',
            'status': 'active'
        },
        {
            'buyer': users['azadeh123'],
            'industry': industry,
            'title': 'سیستم پیش‌بینی خرابی تجهیزات',
            'description': 'سیستم پیش‌بینی خرابی تجهیزات با استفاده از تحلیل داده‌های سنسورها و هوش مصنوعی.',
            'budget': '980000000',
            'timeline': '7 ماه',
            'status': 'active'
        },
        {
            'buyer': users['azadeh123'],
            'industry': industry,
            'title': 'سیستم مدیریت زنجیره تأمین پتروشیمی',
            'description': 'سیستم مدیریت یکپارچه زنجیره تأمین با قابلیت ردیابی مواد اولیه و محصولات.',
            'budget': '760000000',
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
    # 4. ایجاد محصولات (با تصاویر)
    # ============================================================
    
    products_data = [
        {
            'seller': users['azadeh123'],
            'industry': industry,
            'title': 'سیستم کنترل هوشمند کوره‌های پتروشیمی',
            'short_description': 'سیستم کنترل هوشمند مبتنی بر هوش مصنوعی برای بهینه‌سازی دمای کوره‌های پتروشیمی',
            'full_description': 'سیستم کنترل هوشمند کوره‌های پتروشیمی با استفاده از الگوریتم‌های پیشرفته یادگیری عمیق.',
            'category': 'product',
            'price': 780000000,
            'trl': 8,
            'mrl': 7,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=400&fit=crop',
            'image_name': 'furnace_control.jpg'
        },
        {
            'seller': users['azadeh'],
            'industry': industry,
            'title': 'سامانه پایش و کنترل فرآیند پتروشیمی',
            'short_description': 'سامانه جامع پایش و کنترل پارامترهای فرآیندی در واحدهای پتروشیمی',
            'full_description': 'سامانه یکپارچه پایش و کنترل فرآیندهای پتروشیمی با قابلیت اتصال به تجهیزات مختلف.',
            'category': 'product',
            'price': 950000000,
            'trl': 7,
            'mrl': 6,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&h=400&fit=crop',
            'image_name': 'process_control.jpg'
        },
        {
            'seller': users['azadeh123'],
            'industry': industry,
            'title': 'سیستم پایش آلاینده‌های صنعتی',
            'short_description': 'سیستم دقیق پایش آنلاین آلاینده‌های گازی و ذرات معلق',
            'full_description': 'سیستم پیشرفته پایش آلاینده‌ها با استفاده از سنسورهای دقیق و تحلیل داده‌های محیطی.',
            'category': 'product',
            'price': 680000000,
            'trl': 8,
            'mrl': 8,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1614308450916-7c5f5e55f3a2?w=600&h=400&fit=crop',
            'image_name': 'pollution_monitoring.jpg'
        },
        {
            'seller': users['azadeh'],
            'industry': industry,
            'title': 'خدمات مشاوره بهینه‌سازی انرژی پتروشیمی',
            'short_description': 'خدمات مشاوره تخصصی بهینه‌سازی مصرف انرژی در صنایع پتروشیمی',
            'full_description': 'ارائه خدمات مشاوره جامع برای کاهش مصرف انرژی در پتروشیمی‌ها.',
            'category': 'service',
            'price': 250000000,
            'trl': 9,
            'mrl': 9,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=600&h=400&fit=crop',
            'image_name': 'energy_consulting.jpg'
        },
        {
            'seller': users['azadeh123'],
            'industry': industry,
            'title': 'سیستم نت هوشمند پتروشیمی',
            'short_description': 'سیستم مدیریت نگهداری و تعمیرات پیشگیرانه مبتنی بر هوش مصنوعی',
            'full_description': 'سیستم پیشرفته مدیریت نگهداری و تعمیرات (نت) با قابلیت پیش‌بینی خرابی‌ها.',
            'category': 'product',
            'price': 1200000000,
            'trl': 7,
            'mrl': 6,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=600&h=400&fit=crop',
            'image_name': 'predictive_maintenance.jpg'
        },
        {
            'seller': users['azadeh'],
            'industry': industry,
            'title': 'سامانه مدیریت پسماند صنعتی پتروشیمی',
            'short_description': 'سامانه جامع مدیریت، دسته‌بندی و بازیافت پسماندهای صنعتی',
            'full_description': 'سامانه مدیریت یکپارچه پسماندهای صنعتی با رویکرد بازیافت و اقتصاد چرخشی.',
            'category': 'product',
            'price': 520000000,
            'trl': 8,
            'mrl': 7,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&h=400&fit=crop',
            'image_name': 'waste_management.jpg'
        },
        {
            'seller': users['azadeh123'],
            'industry': industry,
            'title': 'سیستم کنترل کیفیت محصولات پتروشیمی',
            'short_description': 'سیستم کنترل کیفیت مبتنی بر بینایی ماشین برای محصولات پتروشیمی',
            'full_description': 'سیستم کنترل کیفیت اتوماتیک با استفاده از بینایی ماشین و یادگیری عمیق.',
            'category': 'product',
            'price': 890000000,
            'trl': 7,
            'mrl': 6,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1581092335391-9c5b7f9f7a5a?w=600&h=400&fit=crop',
            'image_name': 'quality_control.jpg'
        },
        {
            'seller': users['azadeh'],
            'industry': industry,
            'title': 'سیستم مدیریت انرژی و هوشمندسازی',
            'short_description': 'سیستم مدیریت یکپارچه انرژی با قابلیت هوشمندسازی و بهینه‌سازی مصرف',
            'full_description': 'سیستم مدیریت انرژی با استفاده از هوش مصنوعی برای کاهش مصرف و افزایش بهره‌وری.',
            'category': 'product',
            'price': 650000000,
            'trl': 8,
            'mrl': 7,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=400&fit=crop',
            'image_name': 'energy_management.jpg'
        },
        {
            'seller': users['azadeh123'],
            'industry': industry,
            'title': 'سیستم پیش‌بینی و مانیتورینگ تجهیزات',
            'short_description': 'سیستم پیش‌بینی خرابی و مانیتورینگ لحظه‌ای تجهیزات صنعتی',
            'full_description': 'سیستم پیشرفته برای پیش‌بینی خرابی و مانیتورینگ لحظه‌ای تجهیزات صنعتی.',
            'category': 'product',
            'price': 750000000,
            'trl': 7,
            'mrl': 6,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=600&h=400&fit=crop',
            'image_name': 'predictive_monitoring.jpg'
        },
        {
            'seller': users['azadeh'],
            'industry': industry,
            'title': 'خدمات مشاوره مدیریت پسماند صنعتی',
            'short_description': 'خدمات مشاوره تخصصی مدیریت پسماند و بازیافت در صنایع پتروشیمی',
            'full_description': 'ارائه خدمات مشاوره جامع برای مدیریت پسماند و بازیافت در صنایع پتروشیمی.',
            'category': 'service',
            'price': 280000000,
            'trl': 9,
            'mrl': 9,
            'status': 'published',
            'image_url': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&h=400&fit=crop',
            'image_name': 'waste_consulting.jpg'
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
        (created_needs[0], created_products[0], 88, 'تطابق عالی در حوزه کنترل فرآیند و بهینه‌سازی انرژی', 'ریسک پایین - پیشنهاد می‌شود مذاکره را شروع کنید.'),
        (created_needs[0], created_products[1], 82, 'تطابق خوب در حوزه پایش و کنترل فرآیند', 'ریسک متوسط - نیاز به بررسی دقیق‌تر قابلیت‌ها.'),
        (created_needs[0], created_products[3], 70, 'خدمات مشاوره با رویکرد کاهش مصرف انرژی', 'ریسک متوسط - گزینه مکمل مناسب.'),
        (created_needs[1], created_products[0], 95, 'تطابق عالی در حوزه بهینه‌سازی انرژی کوره‌ها', 'ریسک پایین - بهترین گزینه موجود.'),
        (created_needs[1], created_products[3], 75, 'خدمات مشاوره جامع با رویکرد بهینه‌سازی انرژی', 'ریسک متوسط - گزینه مکمل مناسب.'),
        (created_needs[2], created_products[5], 92, 'تطابق عالی در حوزه مدیریت پسماند و بازیافت', 'ریسک پایین - گزینه بسیار مناسب.'),
        (created_needs[2], created_products[4], 68, 'سیستم نت با قابلیت‌های مدیریتی مناسب', 'ریسک متوسط - نیاز به بررسی دقیق‌تر.'),
        (created_needs[3], created_products[2], 90, 'تطابق عالی در حوزه پایش آلاینده‌های صنعتی', 'ریسک پایین - گزینه بسیار مناسب.'),
        (created_needs[3], created_products[6], 72, 'سیستم کنترل کیفیت با قابلیت‌های قابل تطبیق', 'ریسک متوسط - نیاز به بررسی قابلیت‌ها.'),
        (created_needs[4], created_products[3], 85, 'تطابق عالی در حوزه مشاوره پیاده‌سازی صنعت ۴.۰', 'ریسک پایین - گزینه مناسب با تجربه بالا.'),
        (created_needs[4], created_products[7], 78, 'سیستم مدیریت انرژی با قابلیت‌های هوشمندسازی', 'ریسک متوسط - نیاز به بررسی دقیق‌تر.'),
        (created_needs[5], created_products[4], 96, 'تطابق کامل در حوزه نگهداری و تعمیرات پیشگیرانه', 'ریسک پایین - بهترین گزینه با قابلیت‌های پیشرفته.'),
        (created_needs[5], created_products[8], 85, 'سیستم پیش‌بینی خرابی با قابلیت‌های کامل', 'ریسک پایین - گزینه بسیار مناسب.'),
        (created_needs[6], created_products[6], 90, 'تطابق عالی در حوزه کنترل کیفیت محصولات', 'ریسک پایین - گزینه بسیار مناسب.'),
        (created_needs[6], created_products[7], 72, 'سیستم مدیریت انرژی با قابلیت‌های کنترل کیفیت', 'ریسک متوسط - نیاز به بررسی دقیق‌تر.'),
        (created_needs[7], created_products[7], 88, 'تطابق عالی در حوزه مدیریت انرژی و بهینه‌سازی', 'ریسک پایین - گزینه بسیار مناسب.'),
        (created_needs[7], created_products[3], 65, 'خدمات مشاوره با رویکرد بهینه‌سازی انرژی', 'ریسک متوسط - گزینه مکمل مناسب.'),
        (created_needs[8], created_products[8], 92, 'تطابق عالی در حوزه پیش‌بینی خرابی تجهیزات', 'ریسک پایین - گزینه بسیار مناسب.'),
        (created_needs[8], created_products[4], 78, 'سیستم نت هوشمند با قابلیت‌های پیش‌بینی', 'ریسک متوسط - نیاز به بررسی دقیق‌تر.'),
        (created_needs[9], created_products[1], 80, 'تطابق خوب در حوزه مدیریت زنجیره تأمین', 'ریسک متوسط - نیاز به بررسی قابلیت‌ها.'),
        (created_needs[9], created_products[7], 70, 'سیستم مدیریت انرژی با قابلیت‌های زنجیره تأمین', 'ریسک متوسط - گزینه قابل قبول.'),
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
    
    print("\n" + "="*70)
    print("📊 خلاصه داده‌های ایجاد شده - صنعت پتروشیمی")
    print("="*70)
    print(f"👥 کاربران: {User.objects.count()}")
    print(f"🏭 صنایع: {IndustryCategory.objects.count()}")
    print(f"📋 نیازها: {Need.objects.filter(industry=industry).count()}")
    print(f"📦 محصولات: {Product.objects.filter(industry=industry).count()}")
    print(f"🔗 نتایج تطبیق: {MatchResult.objects.filter(need__industry=industry).count()}")
    print("="*70)
    
    print("\n📋 لیست نیازها:")
    for need in Need.objects.filter(industry=industry):
        print(f"  🔹 #{need.id}: {need.title}")
        print(f"     خریدار: {need.buyer.first_name} {need.buyer.last_name} ({need.buyer.username})")
        print(f"     بودجه: {need.budget} تومان")
        print(f"     زمان: {need.timeline}")
        print()
    
    print("\n📦 لیست محصولات:")
    for product in Product.objects.filter(industry=industry):
        print(f"  🔸 #{product.id}: {product.title}")
        print(f"     فروشنده: {product.seller.first_name} {product.seller.last_name} ({product.seller.username})")
        print(f"     قیمت: {format(int(product.price or 0), ',')} تومان")
        print(f"     TRL: {product.trl}/۹, MRL: {product.mrl}/۹")
        if product.image:
            print(f"     📷 تصویر: {product.image.url}")
        print()
    
    print("\n✅ همه داده‌ها با موفقیت ایجاد شدند!")
    print("\n🔗 مسیرهای تست:")
    print("  - /api/needs/1/ تا /api/needs/10/")
    print("  - /api/matching/results/needs/1/ تا /api/matching/results/needs/10/")
    print("  - /matching/1 تا /matching/10 در فرانت‌اند")
    print("\n👤 اطلاعات کاربران برای ورود:")
    print("  - azadeh / پسورد: 123456 (۵ نیاز)")
    print("  - azadeh123 / پسورد: 123456 (۵ نیاز)")
    print("  - testuser1 / پسورد: 123456")
    print("  - testuser2 / پسورد: 123456")
    print("  - petro_admin / پسورد: 123456")

if __name__ == "__main__":
    create_petro_data()