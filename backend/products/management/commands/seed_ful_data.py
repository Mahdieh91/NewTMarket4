# -*- coding: utf-8 -*-
import os
import random
import requests
from io import BytesIO
from django.core.files import File
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.core.files.images import ImageFile
from django.conf import settings
from products.models import Supply, SupplyImage, Product
from needs.models import Need
from negotiations.models import Negotiation, Message
from evaluations.models import Evaluation
from executions.models import Execution  # فرض می‌کنیم مدل Execution در apps.executions موجود است
from contracts.models import Contract     # فرض می‌کنیم مدل Contract وجود دارد
from industries.models import IndustryCategory  # اگر موجود است
from datetime import datetime, timedelta

User = get_user_model()

# ================================
#  داده‌های پایه (واقعی و متنوع)
# ================================

INDUSTRIES = [
    'نفت و گاز', 'پتروشیمی', 'فولاد و معدن', 'سلامت', 'کشاورزی',
    'حمل‌ونقل', 'خودروسازی', 'انرژی', 'فناوری اطلاعات', 'محیط زیست',
    'صنایع غذایی', 'نساجی', 'سیمان', 'پالایش', 'صنایع دریایی'
]

TECHNOLOGIES = [
    'هوش مصنوعی', 'اینترنت اشیاء', 'دوقلوی دیجیتال', 'رباتیک',
    'بلاکچین', 'داده‌کاوی', 'کنترل فرآیند', 'سنسورها', 'اتوماسیون',
    'بیوتکنولوژی', 'نانوتکنولوژی', 'فوتونیک', 'مواد پیشرفته'
]

CITIES = [
    'تهران', 'اصفهان', 'شیراز', 'تبریز', 'مشهد', 'یزد', 'کرج',
    'اهواز', 'رشت', 'کرمان', 'بندرعباس', 'اراک', 'همدان', 'ساری',
    'قم', 'کرمانشاه', 'زاهدان', 'بوشهر', 'گرگان', 'سنندج'
]

SUPPLY_TYPES = ['product', 'service']
CATEGORIES_PRODUCT = ['تجهیزات صنعتی', 'قطعات الکترونیک', 'مواد شیمیایی', 'ماشین‌آلات', 'ابزار دقیق']
CATEGORIES_SERVICE = ['مشاوره فنی', 'خدمات مهندسی', 'آموزش', 'نگهداری و تعمیرات', 'تحلیل داده']
UNITS = ['عدد', 'تن', 'کیلوگرم', 'متر', 'لیتر', 'ساعت', 'ماه', 'سال', 'مجوز']

# لیست کاربران واقعی (نام، نام کاربری، نوع)
REAL_USERS = [
    {'username': 'ut_isfahan', 'name': 'دانشگاه صنعتی اصفهان', 'type': 'university'},
    {'username': 'petro_imam', 'name': 'پتروشیمی بندر امام', 'type': 'industry'},
    {'username': 'nioc', 'name': 'شرکت نفت و گاز پارس', 'type': 'industry'},
    {'username': 'refinery_abadan', 'name': 'پالایشگاه نفت آبادان', 'type': 'industry'},
    {'username': 'mobarakeh_steel', 'name': 'فولاد مبارکه', 'type': 'industry'},
    {'username': 'aeoi', 'name': 'سازمان انرژی اتمی ایران', 'type': 'government'},
    {'username': 'ministry_oil', 'name': 'وزارت نفت', 'type': 'government'},
    {'username': 'nioc_iran', 'name': 'شرکت ملی نفت ایران', 'type': 'industry'},
    {'username': 'petro_jam', 'name': 'پتروشیمی جم', 'type': 'industry'},
    {'username': 'refinery_isfahan', 'name': 'پالایشگاه نفت اصفهان', 'type': 'industry'},
    {'username': 'ut_tehran', 'name': 'دانشگاه تهران', 'type': 'university'},
    {'username': 'sharif', 'name': 'دانشگاه صنعتی شریف', 'type': 'university'},
    {'username': 'petro_kharg', 'name': 'پتروشیمی خارک', 'type': 'industry'},
    {'username': 'refinery_shiraz', 'name': 'پالایشگاه نفت شیراز', 'type': 'industry'},
    {'username': 'petro_iran', 'name': 'صنایع پتروشیمی ایران', 'type': 'industry'},
]

# ================================
#  توابع کمکی برای ویکی‌مدیا
# ================================

WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php'
USER_AGENT = 'DjangoSeeder/1.0 (contact@example.com)'

def search_wikimedia(query, file_type='image', limit=1):
    """
    جستجو در ویکی‌مدیا و بازگرداندن لیستی از URLهای فایل‌های تصویر یا PDF.
    file_type: 'image' یا 'pdf'
    """
    params = {
        'action': 'query',
        'format': 'json',
        'generator': 'search',
        'gsrsearch': query,
        'gsrlimit': limit,
        'prop': 'imageinfo',
        'iiprop': 'url|mime',
    }
    # برای PDFها، شرط اضافه می‌کنیم
    if file_type == 'pdf':
        params['gsrsearch'] = f'{query} filetype:pdf'
    else:
        params['gsrsearch'] = f'{query} filetype:image'

    try:
        resp = requests.get(WIKIMEDIA_API, params=params, headers={'User-Agent': USER_AGENT}, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        pages = data.get('query', {}).get('pages', {})
        results = []
        for page_id, page in pages.items():
            title = page.get('title', '')
            imageinfo = page.get('imageinfo', [])
            if imageinfo:
                url = imageinfo[0].get('url')
                mime = imageinfo[0].get('mime', '')
                if url:
                    results.append({
                        'url': url,
                        'title': title,
                        'mime': mime,
                    })
        return results
    except Exception as e:
        print(f"⚠️ خطا در جستجوی ویکی‌مدیا برای '{query}': {e}")
        return []

def download_file(url, max_size=5*1024*1024):
    """دانلود فایل از URL و بازگرداندن محتوای باینری، در صورت تجاوز از اندازه max_size بازگرداندن None"""
    try:
        resp = requests.get(url, stream=True, timeout=30)
        resp.raise_for_status()
        total_size = 0
        chunks = []
        for chunk in resp.iter_content(1024):
            total_size += len(chunk)
            if total_size > max_size:
                return None
            chunks.append(chunk)
        return b''.join(chunks)
    except Exception as e:
        print(f"⚠️ خطا در دانلود {url}: {e}")
        return None

# ================================
#  کلاس اصلی مدیریت
# ================================

class Command(BaseCommand):
    help = 'پر کردن پایگاه داده با داده‌های واقعی و نمونه برای بازار، مذاکرات و اجراها'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=80, help='تعداد عرضه‌های مورد نظر (حداکثر ۱۰۰)')
        parser.add_argument('--skip-images', action='store_true', help='از دانلود تصاویر صرف‌نظر کن (برای سرعت)')
        parser.add_argument('--skip-pdf', action='store_true', help='از جستجوی PDF صرف‌نظر کن')

    def handle(self, *args, **options):
        self.stdout.write('🚀 شروع فرآیند پر کردن داده...')

        # تنظیمات
        target_count = min(options.get('count', 80), 100)
        skip_images = options.get('skip_images', False)
        skip_pdf = options.get('skip_pdf', False)

        # ۱. ایجاد کاربران
        self.stdout.write('👤 ایجاد/بازیابی کاربران...')
        users = self.create_users()

        # ۲. ایجاد عرضه‌ها (Supply)
        self.stdout.write(f'📦 ایجاد {target_count} عرضه...')
        supplies = self.create_supplies(users, target_count, skip_images, skip_pdf)

        # ۳. ایجاد محصولات (Product) – با استفاده از داده‌های Supply
        self.stdout.write('📦 ایجاد محصولات (Product)...')
        self.create_products(users, supplies)

        # ۴. ایجاد نیازها (Need)
        self.stdout.write('📝 ایجاد نیازها...')
        self.create_needs(users)

        # ۵. ایجاد مذاکرات (Negotiation)
        self.stdout.write('💬 ایجاد مذاکرات...')
        negotiations = self.create_negotiations(users, supplies)

        # ۶. ایجاد اجراها (Execution)
        self.stdout.write('⚙️ ایجاد اجراها...')
        self.create_executions(negotiations)

        # ۷. ایجاد ارزیابی‌ها (Evaluation)
        self.stdout.write('📊 ایجاد ارزیابی‌ها...')
        self.create_evaluations(users, supplies)

        self.stdout.write(self.style.SUCCESS('✅ عملیات با موفقیت به پایان رسید.'))

    # ------------------------------------------------------------
    # ۱. ایجاد کاربران
    # ------------------------------------------------------------
    def create_users(self):
        users = []
        for user_data in REAL_USERS:
            username = user_data['username']
            # رمز عبور ثابت برای همه
            password = '123456'
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@example.com',
                    'first_name': user_data['name'],
                }
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f'   ✅ کاربر جدید: {user_data["name"]} ({username})')
            else:
                self.stdout.write(f'   🔄 کاربر موجود: {user_data["name"]}')
            users.append(user)
        return users

    # ------------------------------------------------------------
    # ۲. ایجاد عرضه‌ها
    # ------------------------------------------------------------
    def create_supplies(self, users, target_count, skip_images, skip_pdf):
        supplies = []
        used_titles = set()
        # برای جلوگیری از تکرار تصویر، کلید عبارت جستجو را ذخیره می‌کنیم
        image_cache = {}

        # تابع تولید عنوان منحصربه‌فرد
        def generate_title(industry, technology):
            templates = [
                f"سامانه {technology} در {industry}",
                f"راهکار {technology} برای صنعت {industry}",
                f"{technology} هوشمند در {industry}",
                f"سیستم پایش {technology} در {industry}",
                f"ابزار {technology} برای {industry}",
                f"{industry} مبتنی بر {technology}",
            ]
            base = random.choice(templates)
            if base not in used_titles:
                used_titles.add(base)
                return base
            # اگر تکراری بود، عدد اضافه کن
            for i in range(1, 10):
                new_title = f"{base} {i}"
                if new_title not in used_titles:
                    used_titles.add(new_title)
                    return new_title
            return f"{base} {random.randint(100,999)}"

        # برای هر کاربر، بین ۱ تا ۵ عرضه ایجاد می‌کنیم تا به تعداد هدف برسیم
        user_count = len(users)
        supplies_per_user = max(1, target_count // user_count)
        extra = target_count - (supplies_per_user * user_count)

        for idx, user in enumerate(users):
            count = supplies_per_user + (1 if idx < extra else 0)
            for _ in range(count):
                # انتخاب تصادفی داده‌ها
                industry = random.choice(INDUSTRIES)
                technology = random.choice(TECHNOLOGIES)
                city = random.choice(CITIES)
                supply_type = random.choice(SUPPLY_TYPES)
                if supply_type == 'product':
                    category = random.choice(CATEGORIES_PRODUCT)
                else:
                    category = random.choice(CATEGORIES_SERVICE)

                title = generate_title(industry, technology)
                description = f"توضیحات جامع برای {title}. این {supply_type} با استفاده از {technology} در صنعت {industry} ارائه می‌شود."
                quantity = random.randint(1, 100)
                unit = random.choice(UNITS)
                price = random.randint(0, 5000000000)  # تا ۵ میلیارد تومان
                trl = str(random.randint(1, 9))
                mrl = str(random.randint(1, 9))
                trl_assessed = random.choice([True, False])
                mrl_assessed = random.choice([True, False])
                status = random.choice(['published', 'approved', 'pending', 'draft'])
                # بیشتر موارد را منتشرشده انتخاب می‌کنیم
                if random.random() < 0.6:
                    status = 'published'

                # ایجاد عرضه
                supply = Supply.objects.create(
                    seller=user,
                    title=title,
                    supply_type=supply_type,
                    category=category,
                    industry=industry,
                    technology=technology,
                    city=city,
                    description=description,
                    quantity=str(quantity),
                    unit=unit,
                    price=price,
                    trl=trl,
                    mrl=mrl,
                    trl_assessed=trl_assessed,
                    mrl_assessed=mrl_assessed,
                    status=status,
                    view_count=random.randint(0, 100),
                )
                supplies.append(supply)
                self.stdout.write(f'   ✅ عرضه {supply.id}: {title}')

                # ----- تصویر -----
                if not skip_images:
                    image_key = f"{industry}|{technology}|{title[:30]}"
                    if image_key in image_cache:
                        cached_image = image_cache[image_key]
                        if cached_image:
                            # تکرار تصویر مجاز نیست، اما برای سادگی از همان تصویر استفاده می‌کنیم
                            # ولی برای جلوگیری از تکرار فایل، یک کپی از تصویر قبلی می‌سازیم (با نام جدید)
                            self._copy_existing_image(supply, cached_image)
                        else:
                            self.stdout.write(f'      ⚠️ تصویر قبلاً برای {image_key} یافت نشده بود.')
                    else:
                        # جستجو در ویکی‌مدیا
                        search_query = f"{title} {industry} {technology}"
                        results = search_wikimedia(search_query, file_type='image', limit=3)
                        if results:
                            # اولین نتیجه را انتخاب می‌کنیم
                            img_info = results[0]
                            img_data = download_file(img_info['url'])
                            if img_data:
                                # ذخیره تصویر
                                image_file = self._save_image_from_data(supply, img_data, img_info['title'])
                                if image_file:
                                    image_cache[image_key] = image_file
                                    self.stdout.write(f'      🖼️ تصویر ذخیره شد: {img_info["title"]}')
                                else:
                                    image_cache[image_key] = None
                            else:
                                image_cache[image_key] = None
                        else:
                            image_cache[image_key] = None
                            self.stdout.write(f'      ⚠️ تصویری برای {search_query} یافت نشد.')

                # ----- PDF -----
                if not skip_pdf:
                    search_query = f"{title} {industry} {technology}"
                    pdf_results = search_wikimedia(search_query, file_type='pdf', limit=2)
                    documents = []
                    if pdf_results:
                        for pdf_info in pdf_results:
                            pdf_data = download_file(pdf_info['url'], max_size=10*1024*1024)
                            if pdf_data:
                                # ذخیره PDF در فیلد documents (JSON)
                                doc_entry = {
                                    'url': pdf_info['url'],
                                    'title': pdf_info['title'],
                                    'downloaded': True,
                                }
                                documents.append(doc_entry)
                                self.stdout.write(f'      📄 PDF یافت شد: {pdf_info["title"]}')
                            else:
                                documents.append({
                                    'url': pdf_info['url'],
                                    'title': pdf_info['title'],
                                    'downloaded': False,
                                    'reason': 'دانلود ناموفق یا حجم زیاد'
                                })
                    if documents:
                        supply.documents = documents
                        supply.save(update_fields=['documents'])
                    else:
                        self.stdout.write(f'      ⚠️ هیچ PDF مرتبطی برای {title} یافت نشد.')

        return supplies

    # ------------------------------------------------------------
    # ۳. ایجاد محصولات (Product) – مشابه Supply
    # ------------------------------------------------------------
    def create_products(self, users, supplies):
        # برای هر کاربر، تعدادی Product ایجاد می‌کنیم با داده‌های مشابه
        for user in users:
            # بین ۱ تا ۳ محصول
            for _ in range(random.randint(1, 3)):
                supply = random.choice(supplies) if supplies else None
                if not supply:
                    continue
                # استفاده از داده‌های یک عرضه تصادفی
                product = Product.objects.create(
                    seller=user,
                    title=f"محصول مشابه: {supply.title}",
                    category='product' if supply.supply_type == 'product' else 'service',
                    industry=IndustryCategory.objects.first(),  # فرض می‌کنیم IndustryCategory وجود دارد
                    short_description=supply.description[:200],
                    full_description=supply.description,
                    trl=int(supply.trl) if supply.trl.isdigit() else 1,
                    mrl=int(supply.mrl) if supply.mrl.isdigit() else 1,
                    price=supply.price / 1000000,  # تبدیل به میلیون تومان
                    status='published',
                    view_count=random.randint(0, 50),
                )
                self.stdout.write(f'   ✅ محصول {product.id}: {product.title}')

    # ------------------------------------------------------------
    # ۴. ایجاد نیازها (Need)
    # ------------------------------------------------------------
    def create_needs(self, users):
        for user in users:
            # هر کاربر ۱ یا ۲ نیاز
            for _ in range(random.randint(1, 2)):
                industry = random.choice(INDUSTRIES)
                title = f"نیاز به راهکار {random.choice(TECHNOLOGIES)} در {industry}"
                need = Need.objects.create(
                    buyer=user,
                    title=title,
                    description=f"شرح نیاز: {title}. این نیاز برای بهبود فرآیندهای {industry} ضروری است.",
                    industry=IndustryCategory.objects.first(),  # فرض
                    current_status="تحلیل اولیه",
                    expected_outcome="افزایش بهره‌وری ۲۰ درصدی",
                    budget=random.randint(100000000, 5000000000),
                    timeline="۶ ماه",
                    confidentiality=random.choice(['public', 'private']),
                    status=random.choice(['published', 'receiving_proposals', 'evaluating']),
                )
                self.stdout.write(f'   ✅ نیاز {need.id}: {title}')

    # ------------------------------------------------------------
    # ۵. ایجاد مذاکرات (Negotiation)
    # ------------------------------------------------------------
    def create_negotiations(self, users, supplies):
        negotiations = []
        published_supplies = [s for s in supplies if s.status in ['published', 'approved']]
        if not published_supplies:
            self.stdout.write('   ⚠️ هیچ عرضه منتشرشده‌ای برای مذاکره وجود ندارد.')
            return negotiations

        for supply in published_supplies:
            # بین ۰ تا ۲ مذاکره
            num_negotiations = random.randint(0, 2)
            for _ in range(num_negotiations):
                # انتخاب خریدار (کاربری غیر از فروشنده)
                potential_buyers = [u for u in users if u.id != supply.seller.id]
                if not potential_buyers:
                    break
                buyer = random.choice(potential_buyers)
                # وضعیت مذاکره
                status = random.choice([
                    'created', 'in_progress', 'proposal_sent',
                    'under_review', 'accepted', 'contracted'
                ])
                # برخی را به قرارداد می‌رسانیم
                if random.random() < 0.3:
                    status = 'contracted'
                negotiation = Negotiation.objects.create(
                    supply=supply,
                    buyer=buyer,
                    supplier=supply.seller,
                    status=status,
                    context_title=f"مذاکره برای {supply.title}",
                    is_active=status not in ['rejected', 'contracted'],
                )
                # یک پیام اولیه
                Message.objects.create(
                    negotiation=negotiation,
                    sender=buyer,
                    text=f"سلام، علاقه‌مند به {supply.title} هستم. لطفاً اطلاعات بیشتر بفرمایید.",
                )
                negotiations.append(negotiation)
                self.stdout.write(f'   💬 مذاکره {negotiation.id} برای عرضه {supply.id} با {buyer.username}')

        return negotiations

    # ------------------------------------------------------------
    # ۶. ایجاد اجراها (Execution)
    # ------------------------------------------------------------
    def create_executions(self, negotiations):
        # برای مذاکراتی که وضعیت contracted دارند، اجرا ایجاد کن
        contracted = [n for n in negotiations if n.status == 'contracted']
        for neg in contracted:
            # یک قرارداد فرضی (Contract) – در صورت وجود مدل Contract
            # اگر Contract وجود ندارد، یک نمونه ساده می‌سازیم
            try:
                contract = Contract.objects.create(
                    negotiation=neg,
                    title=f"قرارداد {neg.supply.title}",
                    status='active'
                )
            except Exception as e:
                self.stdout.write(f'   ⚠️ ایجاد Contract برای مذاکره {neg.id} ممکن نیست: {e}')
                # برای ادامه، یک قرارداد ساختگی با استفاده از خود مذاکره ایجاد می‌کنیم
                # اما از آنجایی که مدل Contract تعریف نشده، از این بخش صرف‌نظر می‌کنیم
                continue

            # ایجاد Execution
            status = random.choice([
                'not_started', 'in_progress', 'awaiting_approval',
                'needs_revision', 'completed', 'suspended'
            ])
            exec_obj = Execution.objects.create(
                contract=contract,
                status=status,
                progress_percent=random.randint(0, 100),
                start_date=datetime.now().date() - timedelta(days=random.randint(0, 60)),
                expected_end_date=datetime.now().date() + timedelta(days=random.randint(30, 180)),
                final_score=random.uniform(1, 5) if status == 'completed' else None,
                notes="توضیحات اجرا",
            )
            self.stdout.write(f'   ⚙️ اجرا {exec_obj.id} برای قرارداد {contract.id}')

    # ------------------------------------------------------------
    # ۷. ایجاد ارزیابی‌ها (Evaluation)
    # ------------------------------------------------------------
    def create_evaluations(self, users, supplies):
        # برای برخی از عرضه‌ها یا محصولات، ارزیابی ایجاد می‌کنیم
        for supply in random.sample(supplies, min(20, len(supplies))):
            evaluator = random.choice([u for u in users if u.id != supply.seller.id])
            if not evaluator:
                continue
            eval_obj = Evaluation.objects.create(
                product=None,  # یا می‌توانیم Product مرتبط را پیدا کنیم
                need=None,
                evaluator=evaluator,
                comments=f"ارزیابی {supply.title}",
                quality_score=random.randint(1, 10),
                risk_score=random.randint(1, 10),
                market_readiness_score=random.randint(1, 10),
                final_decision=random.choice(['approved', 'conditional', 'needs_info', 'rejected']),
            )
            self.stdout.write(f'   📊 ارزیابی {eval_obj.id} برای عرضه {supply.id}')

    # ------------------------------------------------------------
    # توابع کمکی برای ذخیره تصویر
    # ------------------------------------------------------------
    def _save_image_from_data(self, supply, image_data, filename):
        """ذخیره تصویر از داده باینری در SupplyImage"""
        try:
            from django.core.files.base import ContentFile
            # تولید نام فایل
            ext = '.jpg'  # پیش‌فرض
            # تشخیص نوع از محتوا (ساده)
            if image_data[:4] == b'\x89PNG':
                ext = '.png'
            elif image_data[:2] == b'\xff\xd8':
                ext = '.jpg'
            elif image_data[:4] == b'RIFF':
                ext = '.webp'
            # نام فایل
            base_name = slugify(filename[:50]) or 'image'
            file_name = f"{base_name}_{supply.id}{ext}"

            # ایجاد ContentFile
            content_file = ContentFile(image_data, name=file_name)
            # ذخیره در SupplyImage
            supply_image = SupplyImage.objects.create(
                supply=supply,
                caption=filename,
                is_primary=True,  # اولین تصویر اصلی
            )
            supply_image.image.save(file_name, content_file, save=True)
            return supply_image
        except Exception as e:
            self.stdout.write(f'      ❌ خطا در ذخیره تصویر: {e}')
            return None

    def _copy_existing_image(self, supply, existing_image_obj):
        """کپی کردن تصویر از یک SupplyImage موجود به Supply جدید (جلوگیری از تکرار دانلود)"""
        try:
            if not existing_image_obj or not existing_image_obj.image:
                return
            original = existing_image_obj.image
            # باز کردن فایل اصلی
            original.open(mode='rb')
            content = original.read()
            original.close()
            # ذخیره در شیء جدید
            new_image = SupplyImage.objects.create(
                supply=supply,
                caption=f"کپی از {existing_image_obj.caption}",
                is_primary=True,
            )
            # ایجاد نام فایل جدید بر اساس نام اصلی
            name_parts = original.name.split('/')[-1].split('.')
            ext = name_parts[-1] if len(name_parts) > 1 else 'jpg'
            base_name = slugify(existing_image_obj.caption[:30]) or 'copy'
            new_file_name = f"{base_name}_{supply.id}.{ext}"
            new_image.image.save(new_file_name, File(BytesIO(content)), save=True)
            self.stdout.write(f'      🖼️ تصویر کپی شد از {existing_image_obj.id}')
        except Exception as e:
            self.stdout.write(f'      ❌ خطا در کپی تصویر: {e}')