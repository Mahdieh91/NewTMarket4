# analytics/management/commands/generate_petro_data.py
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from products.models import Supply
from needs.models import Need
from negotiations.models import Negotiation
from contracts.models import Contract
from industries.models import IndustryCategory

User = get_user_model()


class Command(BaseCommand):
    help = 'تولید داده‌های نمونه واقعی در حوزه پتروشیمی'

    def handle(self, *args, **options):
        self.stdout.write('🚀 شروع تولید داده‌های نمونه پتروشیمی...')

        # ============================================================
        # ۱. ایجاد یا دریافت کاربران نمونه
        # ============================================================
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@tmarket.ir',
                'first_name': 'مدیر',
                'last_name': 'سیستم',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('123456')
        admin_user.save()

        # فروشندگان (شرکت‌های تأمین‌کننده تجهیزات و مواد)
        suppliers_data = [
            {'username': 'petro_supplier1', 'first_name': 'محمد', 'last_name': 'احمدی',
             'company': 'پتروشیمی فجر', 'email': 'fajr@petro.com'},
            {'username': 'petro_supplier2', 'first_name': 'علی', 'last_name': 'کریمی',
             'company': 'صنایع پلیمر پارس', 'email': 'pars@poly.com'},
            {'username': 'petro_supplier3', 'first_name': 'رضا', 'last_name': 'نوری',
             'company': 'تجهیزات فرآیندی آریا', 'email': 'arya@process.com'},
            {'username': 'petro_supplier4', 'first_name': 'سعید', 'last_name': 'حسینی',
             'company': 'کاتالیست‌سازان ایران', 'email': 'catalyst@iran.com'},
        ]
        suppliers = []
        for data in suppliers_data:
            user, _ = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': 'seller',
                    'company_name': data['company'],
                }
            )
            user.set_password('123456')
            user.save()
            suppliers.append(user)

        # خریداران (شرکت‌های پتروشیمی)
        buyers_data = [
            {'username': 'petro_buyer1', 'first_name': 'زهرا', 'last_name': 'رضایی',
             'company': 'پتروشیمی بندرامام', 'email': 'bandar@petro.com'},
            {'username': 'petro_buyer2', 'first_name': 'سارا', 'last_name': 'موسوی',
             'company': 'پتروشیمی جم', 'email': 'jam@petro.com'},
            {'username': 'petro_buyer3', 'first_name': 'مهدی', 'last_name': 'عباسی',
             'company': 'پتروشیمی تبریز', 'email': 'tabriz@petro.com'},
            {'username': 'petro_buyer4', 'first_name': 'نرگس', 'last_name': 'کرمانی',
             'company': 'پتروشیمی شیراز', 'email': 'shiraz@petro.com'},
        ]
        buyers = []
        for data in buyers_data:
            user, _ = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': 'buyer',
                    'company_name': data['company'],
                }
            )
            user.set_password('123456')
            user.save()
            buyers.append(user)

        self.stdout.write(self.style.SUCCESS('✅ کاربران نمونه ایجاد/دریافت شدند.'))

        # ============================================================
        # ۲. ایجاد صنایع (دسته‌بندی‌های پتروشیمی)
        # ============================================================
        industry_names = [
            'پلیمرها (PE/PP/PVC)',
            'مواد شیمیایی پایه (متانول، بنزن، اتیلن)',
            'کاتالیست و مواد خاص',
            'گاز و میعانات گازی',
            'تجهیزات فرآیندی (مبدل، کمپرسور، توربین)',
            'ابزار دقیق و کنترل (DCS, PLC)',
            'خدمات مهندسی و تعمیرات (EPC, HAZOP)',
            'کود و مواد شیمیایی کشاورزی',
            'ایمنی، بهداشت و محیط زیست (HSE)',
            'بسته‌بندی و لجستیک',
        ]
        industry_objs = []
        for name in industry_names:
            obj, _ = IndustryCategory.objects.get_or_create(name=name)
            industry_objs.append(obj)

        self.stdout.write(self.style.SUCCESS('✅ صنایع پتروشیمی ایجاد/دریافت شدند.'))

        # ============================================================
        # ۳. تولید ۱۰۰ عرضه (Supply) واقعی
        # ============================================================
        # لیست محصولات و خدمات واقعی پتروشیمی
        product_templates = [
            {'title': 'کاتالیست زیگلر-ناتا (Ziegler-Natta) برای پلی‌اتیلن', 'type': 'product',
             'category': 'کاتالیست و مواد خاص', 'tech': 'فناوری پلیمر', 'unit': 'کیلوگرم', 'price_range': (200000, 800000)},
            {'title': 'پلی‌اتیلن سنگین HDPE گرید فیلم', 'type': 'product',
             'category': 'پلیمرها (PE/PP/PVC)', 'tech': 'فرایند پلیمریزاسیون', 'unit': 'تن', 'price_range': (15000000, 45000000)},
            {'title': 'پلی‌پروپیلن PP گرید تزریقی', 'type': 'product',
             'category': 'پلیمرها (PE/PP/PVC)', 'tech': 'فرایند پلیمریزاسیون', 'unit': 'تن', 'price_range': (18000000, 55000000)},
            {'title': 'متانول با خلوص ۹۹.۹٪', 'type': 'product',
             'category': 'مواد شیمیایی پایه (متانول، بنزن، اتیلن)', 'tech': 'فرایند شیمیایی', 'unit': 'تن', 'price_range': (8000000, 25000000)},
            {'title': 'اتیلن خوراک واحد الفین', 'type': 'product',
             'category': 'مواد شیمیایی پایه (متانول، بنزن، اتیلن)', 'tech': 'کراکینگ', 'unit': 'تن', 'price_range': (12000000, 35000000)},
            {'title': 'بنزن با خلوص ۹۹.۸٪', 'type': 'product',
             'category': 'مواد شیمیایی پایه (متانول، بنزن، اتیلن)', 'tech': 'فرایند شیمیایی', 'unit': 'تن', 'price_range': (9000000, 28000000)},
            {'title': 'کاتالیست متالوسن (Metallocene) برای پلی‌اتیلن سنگین', 'type': 'product',
             'category': 'کاتالیست و مواد خاص', 'tech': 'فناوری پلیمر', 'unit': 'کیلوگرم', 'price_range': (400000, 1200000)},
            {'title': 'گاز طبیعی مایع (LNG) - خوراک واحد', 'type': 'product',
             'category': 'گاز و میعانات گازی', 'tech': 'فرایند مایع‌سازی', 'unit': 'تن', 'price_range': (6000000, 18000000)},
            {'title': 'مبدل حرارتی پوسته و لوله (Shell & Tube)', 'type': 'product',
             'category': 'تجهیزات فرآیندی (مبدل، کمپرسور، توربین)', 'tech': 'طراحی مکانیکی', 'unit': 'قطعه', 'price_range': (50000000, 200000000)},
            {'title': 'کمپرسور گاز سانتریفیوژ ۲۵ مگاوات', 'type': 'product',
             'category': 'تجهیزات فرآیندی (مبدل، کمپرسور، توربین)', 'tech': 'دورانی', 'unit': 'دستگاه', 'price_range': (200000000, 800000000)},
            {'title': 'توربین گازی ۳۰ مگاوات برای تولید برق', 'type': 'product',
             'category': 'تجهیزات فرآیندی (مبدل، کمپرسور، توربین)', 'tech': 'احتراق', 'unit': 'دستگاه', 'price_range': (300000000, 1200000000)},
            {'title': 'سامانه کنترل توزیع‌شده (DCS) پیشرفته', 'type': 'product',
             'category': 'ابزار دقیق و کنترل (DCS, PLC)', 'tech': 'اتوماسیون صنعتی', 'unit': 'سیستم', 'price_range': (100000000, 400000000)},
            {'title': 'سامانه پایش آنلاین واحد الفین (Online Analyzer)', 'type': 'product',
             'category': 'ابزار دقیق و کنترل (DCS, PLC)', 'tech': 'آنالیز شیمیایی', 'unit': 'سیستم', 'price_range': (80000000, 250000000)},
            {'title': 'خدمات بازدید دوره ای HAZOP واحد الفین', 'type': 'service',
             'category': 'خدمات مهندسی و تعمیرات (EPC, HAZOP)', 'tech': 'مهندسی ایمنی', 'unit': 'ماه', 'price_range': (30000000, 100000000)},
            {'title': 'اورهال کمپرسورهای اصلی واحد الفین', 'type': 'service',
             'category': 'خدمات مهندسی و تعمیرات (EPC, HAZOP)', 'tech': 'تعمیرات صنعتی', 'unit': 'دستگاه', 'price_range': (50000000, 200000000)},
            {'title': 'خدمات تحلیل کروماتوگرافی گازی (GC) برای محصولات پلیمری', 'type': 'service',
             'category': 'خدمات مهندسی و تعمیرات (EPC, HAZOP)', 'tech': 'آنالیز', 'unit': 'نمونه', 'price_range': (5000000, 20000000)},
            {'title': 'طراحی و اجرای سیستم مدیریت انرژی (EMS)', 'type': 'service',
             'category': 'ایمنی، بهداشت و محیط زیست (HSE)', 'tech': 'مدیریت انرژی', 'unit': 'پروژه', 'price_range': (150000000, 500000000)},
            {'title': 'خدمات مدیریت پسماندهای شیمیایی', 'type': 'service',
             'category': 'ایمنی، بهداشت و محیط زیست (HSE)', 'tech': 'محیط زیست', 'unit': 'تن', 'price_range': (20000000, 80000000)},
            {'title': 'کولر هوایی (Air Cooler) برای واحد الفین', 'type': 'product',
             'category': 'تجهیزات فرآیندی (مبدل، کمپرسور، توربین)', 'tech': 'انتقال حرارت', 'unit': 'دستگاه', 'price_range': (100000000, 300000000)},
            {'title': 'پمپ گریز از مرکز API 610', 'type': 'product',
             'category': 'تجهیزات فرآیندی (مبدل، کمپرسور، توربین)', 'tech': 'سیالات', 'unit': 'دستگاه', 'price_range': (30000000, 120000000)},
            {'title': 'PVC گرید S65 برای ساخت لوله', 'type': 'product',
             'category': 'پلیمرها (PE/PP/PVC)', 'tech': 'فرایند پلیمریزاسیون', 'unit': 'تن', 'price_range': (20000000, 60000000)},
            {'title': 'آمونیاک مایع با خلوص ۹۹.۵٪', 'type': 'product',
             'category': 'کود و مواد شیمیایی کشاورزی', 'tech': 'فرایند شیمیایی', 'unit': 'تن', 'price_range': (7000000, 20000000)},
        ]

        cities = ['تهران', 'اصفهان', 'شیراز', 'بندرعباس', 'تبریز', 'مشهد', 'کرمانشاه']
        statuses = ['published', 'published', 'approved', 'draft']  # بیشتر published
        trl_levels = [str(i) for i in range(4, 10)]

        # برای تنوع، ۱۰۰ عرضه ایجاد می‌کنیم
        created_supplies = []
        for i in range(100):
            template = random.choice(product_templates)
            # گاهی عنوان را تغییر می‌دهیم
            title = template['title']
            if i % 3 == 0:
                title += f" - مدل {random.randint(100, 999)}"
            elif i % 5 == 0:
                title += f" (نسخه {random.randint(1, 5)})"

            supply = Supply.objects.create(
                seller=random.choice(suppliers),
                title=title,
                supply_type=template['type'],
                category=template['category'],
                industry=template['category'],  # استفاده از همان دسته‌بندی به عنوان صنعت
                technology=template['tech'],
                city=random.choice(cities),
                description=f"توضیحات کامل برای {title}. مناسب برای صنایع پتروشیمی و واحدهای پالایشگاهی. دارای گواهی‌های کیفیت بین‌المللی.",
                quantity=str(random.randint(50, 5000)),
                unit=template['unit'],
                price=random.randint(*template['price_range']),
                trl=random.choice(trl_levels),
                status=random.choice(statuses),
                created_at=timezone.now() - timedelta(days=random.randint(1, 120)),
            )
            created_supplies.append(supply)
            if (i + 1) % 10 == 0:
                self.stdout.write(f'   ... {i+1} عرضه ایجاد شد.')

        self.stdout.write(self.style.SUCCESS(f'✅ {len(created_supplies)} عرضه پتروشیمی ایجاد شد.'))

        # ============================================================
        # ۴. تولید ۳۰ نیاز (Need) واقعی
        # ============================================================
        need_templates = [
            {'title': 'تأمین کاتالیست متالوسن برای تولید پلی‌اتیلن سنگین', 'industry': 'کاتالیست و مواد خاص',
             'desc': 'نیاز به کاتالیست متالوسن با فعالیت بالا برای پلیمریزاسیون در دمای ۸۰ درجه', 'budget_range': (200000000, 600000000)},
            {'title': 'خرید پلی‌اتیلن سنگین HDPE گرید فیلم', 'industry': 'پلیمرها (PE/PP/PVC)',
             'desc': 'تأمین ماهانه ۵۰۰ تن HDPE گرید فیلم برای تولید کیسه‌های صنعتی', 'budget_range': (500000000, 1500000000)},
            {'title': 'طراحی و پیاده‌سازی سیستم کنترل DCS پیشرفته', 'industry': 'ابزار دقیق و کنترل (DCS, PLC)',
             'desc': 'یکپارچه‌سازی سیستم‌های کنترل واحد الفین با به‌روزرسانی DCS', 'budget_range': (200000000, 800000000)},
            {'title': 'اورهال کمپرسورهای گاز واحد الفین', 'industry': 'خدمات مهندسی و تعمیرات (EPC, HAZOP)',
             'desc': 'اورهال کامل ۳ کمپرسور سانتریفیوژ با ارائه گواهی عملکرد', 'budget_range': (300000000, 1000000000)},
            {'title': 'تأمین متانول با خلوص ۹۹.۹٪ برای واحد MTBE', 'industry': 'مواد شیمیایی پایه (متانول، بنزن، اتیلن)',
             'desc': 'خرید ۲۰۰۰ تن متانول با آنالیز دقیق و تحویل درب واحد', 'budget_range': (600000000, 1800000000)},
            {'title': 'اجرای سیستم پایش آنلاین ترکیبات فرار', 'industry': 'ایمنی، بهداشت و محیط زیست (HSE)',
             'desc': 'نصب سنسورهای آنلاین برای پایش VOC و H2S در واحد الفین', 'budget_range': (100000000, 300000000)},
            {'title': 'خدمات HAZOP برای خطوط جدید واحد الفین', 'industry': 'خدمات مهندسی و تعمیرات (EPC, HAZOP)',
             'desc': 'انجام مطالعات HAZOP و ارائه راهکارهای کاهش ریسک برای خطوط جدید', 'budget_range': (50000000, 150000000)},
            {'title': 'خرید گاز طبیعی مایع (LNG) به‌عنوان خوراک', 'industry': 'گاز و میعانات گازی',
             'desc': 'تأمین ۱۰۰۰۰ تن LNG برای خوراک واحد الفین با مشخصات استاندارد', 'budget_range': (300000000, 900000000)},
            {'title': 'طراحی مخازن تحت فشار جدید', 'industry': 'تجهیزات فرآیندی (مبدل، کمپرسور، توربین)',
             'desc': 'طراحی و ساخت ۲ مخزن تحت فشار با ظرفیت ۵۰۰۰ متر مکعب', 'budget_range': (400000000, 1200000000)},
            {'title': 'خدمات آنالیز کروماتوگرافی برای محصولات پلیمری', 'industry': 'خدمات مهندسی و تعمیرات (EPC, HAZOP)',
             'desc': 'انجام تست‌های GC-MS برای کنترل کیفیت پلی‌اتیلن', 'budget_range': (20000000, 80000000)},
            {'title': 'خرید تجهیزات ابزار دقیق (ترانسمیتر، شیر کنترل)', 'industry': 'ابزار دقیق و کنترل (DCS, PLC)',
             'desc': 'تأمین ۱۰۰ عدد ترانسمیتر فشار و ۵۰ عدد شیر کنترل', 'budget_range': (150000000, 400000000)},
            {'title': 'مشاوره بهینه‌سازی مصرف انرژی', 'industry': 'ایمنی، بهداشت و محیط زیست (HSE)',
             'desc': 'انجام ممیزی انرژی و ارائه راهکارهای کاهش مصرف به‌میزان ۱۵٪', 'budget_range': (80000000, 200000000)},
            {'title': 'خرید بنزن با خلوص بالا برای واحد استایرن', 'industry': 'مواد شیمیایی پایه (متانول، بنزن، اتیلن)',
             'desc': 'تأمین ۱۵۰۰ تن بنزن با خلوص ۹۹.۸٪', 'budget_range': (300000000, 900000000)},
            {'title': 'خدمات نگهداری و تعمیرات توربین‌های گازی', 'industry': 'خدمات مهندسی و تعمیرات (EPC, HAZOP)',
             'desc': 'بازدید دوره‌ای و تعمیرات اساسی ۲ توربین گازی', 'budget_range': (200000000, 600000000)},
            {'title': 'خرید پمپ‌های گریز از مرکز API 610', 'industry': 'تجهیزات فرآیندی (مبدل، کمپرسور، توربین)',
             'desc': 'تأمین ۲۰ پمپ با مشخصات فنی مطابق استاندارد API', 'budget_range': (100000000, 300000000)},
            {'title': 'طراحی سیستم مدیریت پسماندهای شیمیایی', 'industry': 'ایمنی، بهداشت و محیط زیست (HSE)',
             'desc': 'طراحی و اجرای سیستم تصفیه و دفع پسماندهای خطرناک', 'budget_range': (150000000, 400000000)},
            {'title': 'خرید PVC گرید S65 برای لوله‌های آب', 'industry': 'پلیمرها (PE/PP/PVC)',
             'desc': 'تأمین ۳۰۰ تن PVC گرید S65 با استاندارد ISO', 'budget_range': (300000000, 800000000)},
            {'title': 'خدمات کالیبراسیون ابزار دقیق', 'industry': 'ابزار دقیق و کنترل (DCS, PLC)',
             'desc': 'کالیبراسیون دورهای ۲۰۰ عدد ابزار دقیق واحد', 'budget_range': (30000000, 100000000)},
            {'title': 'طراحی خطوط پایپینگ جدید', 'industry': 'خدمات مهندسی و تعمیرات (EPC, HAZOP)',
             'desc': 'طراحی و نظارت بر ساخت ۵۰۰ متر خطوط پایپینگ', 'budget_range': (100000000, 300000000)},
            {'title': 'خرید کولر هوایی برای واحد الفین', 'industry': 'تجهیزات فرآیندی (مبدل، کمپرسور، توربین)',
             'desc': 'تأمین ۳ دستگاه کولر هوایی با ظرفیت ۱۰۰ مگاوات', 'budget_range': (200000000, 600000000)},
        ]

        # ایجاد نیازها با تنوع بیشتر
        for i in range(30):
            template = random.choice(need_templates)
            # گاهی تغییر عنوان
            title = template['title']
            if i % 2 == 0:
                title += f" - اولویت {random.choice(['فوری', 'بلندمدت', 'فصلی'])}"

            need = Need.objects.create(
                buyer=random.choice(buyers),
                title=title,
                description=f"{template['desc']}. مهلت ارسال پیشنهاد: {random.randint(10, 30)} روز.",
                industry=random.choice([ind for ind in industry_objs if ind.name == template['industry']]) if template['industry'] else random.choice(industry_objs),
                current_status=random.choice(['در حال بررسی', 'در دست اقدام', 'نیازمند تأمین مالی']),
                expected_outcome='افزایش بهره‌وری و کاهش هزینه‌ها به‌میزان حداقل ۱۰٪',
                constraints='تأمین تجهیزات باید حداکثر ظرف ۳ ماه انجام شود.',
                budget=random.randint(*template.get('budget_range', (10000000, 100000000))),
                timeline=random.choice(['۱ ماه', '۲ ماه', '۳ ماه', '۶ ماه']),
                confidentiality=random.choice(['public', 'private']),
                status=random.choice(['published', 'published', 'receiving_proposals', 'evaluating']),
                created_at=timezone.now() - timedelta(days=random.randint(1, 90)),
            )
            if (i + 1) % 10 == 0:
                self.stdout.write(f'   ... {i+1} نیاز ایجاد شد.')

        self.stdout.write(self.style.SUCCESS('✅ ۳۰ نیاز پتروشیمی ایجاد شد.'))

        # ============================================================
        # ۵. ایجاد مذاکرات و قراردادها برای تکمیل داده‌ها
        # ============================================================
        # انتخاب تعدادی از عرضه‌ها برای مذاکره
        supplies_for_negotiation = list(Supply.objects.filter(status='published').order_by('?')[:30])
        for supply in supplies_for_negotiation:
            # انتخاب یک خریدار تصادفی
            buyer = random.choice(buyers)
            # ایجاد مذاکره
            status_choices = ['created', 'in_progress', 'awaiting_proposal', 'proposal_sent', 'under_review']
            negotiation = Negotiation.objects.create(
                supply=supply,
                buyer=buyer,
                supplier=supply.seller,
                status=random.choice(status_choices),
                context_title=f'مذاکره برای {supply.title}',
                is_active=random.choice([True, False]),
                created_at=timezone.now() - timedelta(days=random.randint(1, 45)),
            )
            # برای بعضی از آنها قرارداد ایجاد کنیم
            if random.random() < 0.3:  # ۳۰٪ تبدیل به قرارداد
                Contract.objects.create(
                    buyer=buyer,
                    supplier=supply.seller,
                    terms=f'شرایط قرارداد برای تأمین {supply.title} با قیمت توافقی',
                    total_value=supply.price * random.randint(1, 10),
                    status=random.choice(['signed', 'execution', 'completed']),
                    signed_at=timezone.now() - timedelta(days=random.randint(1, 30)),
                    created_at=timezone.now() - timedelta(days=random.randint(1, 60)),
                )

        self.stdout.write(self.style.SUCCESS('✅ مذاکرات و قراردادهای نمونه ایجاد شد.'))

        self.stdout.write(self.style.SUCCESS('🎉 تمام داده‌های نمونه پتروشیمی با موفقیت تولید شدند!'))