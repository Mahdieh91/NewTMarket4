# backend/matching/management/commands/data.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.apps import apps
from faker import Faker
import random
from decimal import Decimal

from needs.models import Need
from products.models import Supply

User = get_user_model()
fake = Faker('fa_IR')


class Command(BaseCommand):
    help = 'تولید داده‌های آزمایشی نیاز و عرضه با قابلیت تطبیق'

    def add_arguments(self, parser):
        parser.add_argument(
            '--needs',
            type=int,
            default=100,
            help='تعداد نیازها (پیش‌فرض: 100)'
        )
        parser.add_argument(
            '--supplies',
            type=int,
            default=100,
            help='تعداد عرضه‌ها (پیش‌فرض: 100)'
        )

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('🚀 شروع تولید داده‌های آزمایشی...')

        # ============================================================
        # ۱. دریافت مدل Industry
        # ============================================================
        try:
            Industry = apps.get_model('industries', 'Industry')
        except LookupError:
            self.stdout.write(self.style.ERROR(
                '❌ مدل Industry در اپلیکیشن industries یافت نشد.\n'
                'لطفاً یکی از اقدامات زیر را انجام دهید:\n'
                '1. مطمئن شوید اپلیکیشن industries در INSTALLED_APPS قرار دارد.\n'
                '2. اگر نام مدل متفاوت است، آن را در اسکریپت اصلاح کنید.\n'
                '3. ابتدا مدل Industry را ایجاد کرده و migrations را اجرا کنید.'
            ))
            return

        # ============================================================
        # ۲. ایجاد یا دریافت صنایع
        # ============================================================
        industry_names = [
            'نفت و گاز', 'پتروشیمی', 'فولاد', 'سیمان', 'خودرو',
            'الکترونیک', 'داروسازی', 'کشاورزی', 'فناوری اطلاعات',
            'ساخت و تولید', 'برق و انرژی', 'حمل و نقل و لجستیک'
        ]

        industries = {}
        for name in industry_names:
            industry, created = Industry.objects.get_or_create(
                name=name,
                defaults={'parent': None}
            )
            industries[name] = industry
            if created:
                self.stdout.write(f'✅ صنعت "{name}" ایجاد شد')

        # ============================================================
        # ۳. ایجاد کاربران هدف
        # ============================================================
        target_users = ['azadeh', 'azadeh123', 'ghotbi']
        users = {}

        for username in target_users:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'password': '123456',
                    'is_active': True,
                }
            )
            if created:
                user.set_password('123456')
                user.save()
                self.stdout.write(f'✅ کاربر "{username}" با رمز 123456 ایجاد شد')
            else:
                self.stdout.write(f'ℹ️ کاربر "{username}" از قبل وجود دارد')
            users[username] = user

        # کاربر پیش‌فرض برای سایر داده‌ها
        default_user, _ = User.objects.get_or_create(
            username='default_seller',
            defaults={'password': '123456', 'is_active': True}
        )
        if default_user.password != '123456':
            default_user.set_password('123456')
            default_user.save()

        # ============================================================
        # ۴. الگوهای داده (همانند قبل)
        # ============================================================
        need_templates = {
            'نفت و گاز': [
                {
                    'title': 'بهینه‌سازی مصرف انرژی در پالایشگاه',
                    'desc': 'نیاز به راهکار هوشمند برای کاهش مصرف سوخت و افزایش راندمان کوره‌های پالایشگاهی با استفاده از کنترل پیشرفته و داده‌کاوی.',
                },
                {
                    'title': 'سیستم پایش نشت گاز در خطوط انتقال',
                    'desc': 'پیاده‌سازی سامانه پایش آنلاین برای تشخیص سریع نشت گاز در خطوط لوله با استفاده از سنسورهای هوشمند و الگوریتم‌های تشخیص ناهنجاری.',
                },
                {
                    'title': 'مدیریت هوشمند مخازن ذخیره نفت خام',
                    'desc': 'نیاز به سیستم مدیریت موجودی و پیش‌بینی سطح مخازن نفت خام با استفاده از اینترنت اشیا و یادگیری ماشین.',
                },
            ],
            'پتروشیمی': [
                {
                    'title': 'بهینه‌سازی فرآیند پلیمریزاسیون',
                    'desc': 'بهبود کیفیت و افزایش بازده در واحد پلیمریزاسیون با استفاده از کنترل تطبیقی و مدل‌سازی دقیق واکنش‌ها.',
                },
                {
                    'title': 'سیستم نگهداری پیش‌بینانه کمپرسورها',
                    'desc': 'پیاده‌سازی راهکار پایش وضعیت و تشخیص خطا برای کمپرسورهای گازی با استفاده از آنالیز ارتعاشات و هوش مصنوعی.',
                },
                {
                    'title': 'کاهش آلایندگی در واحد الفین',
                    'desc': 'نیاز به راهکارهای نوین برای کاهش انتشار گازهای گلخانه‌ای و بهبود کارایی مشعل‌های واحد الفین.',
                },
            ],
            'فولاد': [
                {
                    'title': 'بهبود کیفیت در خط نورد گرم',
                    'desc': 'پیاده‌سازی سیستم کنترل ضخامت و کیفیت سطح در خط نورد گرم با استفاده از بینایی ماشین و کنترل پیشرفته.',
                },
                {
                    'title': 'مدیریت انرژی کوره‌های قوس الکتریکی',
                    'desc': 'بهینه‌سازی مصرف برق در کوره‌های قوس الکتریکی با استفاده از مدل‌های پیش‌بینی و کنترل هوشمند.',
                },
            ],
            'ساخت و تولید': [
                {
                    'title': 'اتوماسیون خط تولید با ربات‌های همکار',
                    'desc': 'نیاز به استقرار ربات‌های همکار در خط مونتاژ برای افزایش بهره‌وری و کاهش خطای انسانی.',
                },
                {
                    'title': 'سیستم مدیریت کیفیت مبتنی بر داده',
                    'desc': 'پیاده‌سازی سامانه کنترل کیفیت آماری و تشخیص عیوب با استفاده از یادگیری ماشین و داده‌های حسگرها.',
                },
                {
                    'title': 'تأمین دستگاه پیشرفته تصفیه آب برای خط تولید',
                    'desc': 'نیاز به دستگاه تصفیه آب صنعتی با قابلیت پایش آنلاین و خودکار برای تأمین آب با کیفیت بالا در فرآیند تولید.',
                },
            ],
            'فناوری اطلاعات': [
                {
                    'title': 'سیستم مدیریت یکپارچه منابع سازمانی (ERP)',
                    'desc': 'پیاده‌سازی نرم‌افزار ERP برای یکپارچه‌سازی فرآیندهای مالی، فروش، تولید و منابع انسانی.',
                },
                {
                    'title': 'پلتفرم اینترنت اشیا برای صنعت',
                    'desc': 'توسعه پلتفرم IoT برای اتصال و مدیریت سنسورهای صنعتی با قابلیت تحلیل داده و ارائه داشبوردهای هوشمند.',
                },
                {
                    'title': 'سامانه ارزیابی ناوگان با فناوری بلاکچین',
                    'desc': 'پیاده‌سازی سامانه شفاف و امن برای ارزیابی عملکرد و سابقه ناوگان حمل و نقل با استفاده از بلاکچین.',
                },
            ],
            'برق و انرژی': [
                {
                    'title': 'مدیریت هوشمند شبکه توزیع برق',
                    'desc': 'پیاده‌سازی سیستم مدیریت شبکه توزیع با قابلیت تشخیص و ایزوله‌سازی خطا و بهینه‌سازی مصرف.',
                },
                {
                    'title': 'سیستم ذخیره‌سازی انرژی خورشیدی',
                    'desc': 'طراحی و پیاده‌سازی سیستم ذخیره‌سازی انرژی با باتری‌های لیتیوم-یونی برای استفاده در نیروگاه‌های خورشیدی.',
                },
            ],
            'حمل و نقل و لجستیک': [
                {
                    'title': 'سیستم مدیریت ناوگان هوشمند',
                    'desc': 'پیاده‌سازی سامانه ردیابی و مدیریت ناوگان حمل و نقل با استفاده از GPS و اینترنت اشیا برای بهینه‌سازی مسیر و کاهش مصرف سوخت.',
                },
                {
                    'title': 'اتوماسیون انبار با استفاده از AGV',
                    'desc': 'استقرار خودروهای هدایت‌شونده خودکار (AGV) در انبار برای جابجایی و چیدمان هوشمند کالاها.',
                },
            ],
            'خودرو': [
                {
                    'title': 'سیستم کمک‌راننده پیشرفته (ADAS)',
                    'desc': 'توسعه سیستم‌های کمک‌راننده برای افزایش ایمنی خودرو با استفاده از سنسورها، دوربین‌ها و هوش مصنوعی.',
                },
                {
                    'title': 'بهینه‌سازی مصرف سوخت موتورهای دیزلی',
                    'desc': 'پیاده‌سازی سیستم کنترل پیشرفته برای کاهش مصرف سوخت و آلایندگی موتورهای دیزلی سنگین.',
                },
            ],
            'الکترونیک': [
                {
                    'title': 'تولید بردهای الکترونیکی با فناوری SMT',
                    'desc': 'نیاز به خط تولید بردهای الکترونیکی با استفاده از فناوری سطح‌نصب (SMT) برای تولید انبوه قطعات با کیفیت بالا.',
                },
            ],
            'داروسازی': [
                {
                    'title': 'سیستم کنترل کیفیت داروهای استریل',
                    'desc': 'پیاده‌سازی سامانه پایش و کنترل کیفیت در خط تولید داروهای استریل با استفاده از سنسورهای پیشرفته.',
                },
            ],
            'کشاورزی': [
                {
                    'title': 'سیستم آبیاری هوشمند گلخانه‌ها',
                    'desc': 'پیاده‌سازی سیستم آبیاری خودکار بر اساس رطوبت خاک و پیش‌بینی آب و هوا برای بهینه‌سازی مصرف آب.',
                },
            ],
        }

        supply_templates = {
            'نفت و گاز': [
                {
                    'title': 'سامانه پایش انرژی پالایشگاه',
                    'desc': 'سامانه هوشمند پایش و بهینه‌سازی مصرف انرژی در واحدهای تقطیر و کوره‌های پالایشگاه با قابلیت تحلیل داده‌های لحظه‌ای.',
                    'price': random.choice([500000000, 750000000, 1000000000]),
                    'trl': random.choice([6, 7, 8]),
                    'tech': 'اینترنت اشیا و یادگیری ماشین'
                },
                {
                    'title': 'سیستم تشخیص نشت گاز با فیبر نوری',
                    'desc': 'سیستم پایش توزیع‌شده با فیبر نوری برای تشخیص نشت گاز در خطوط لوله با دقت بالا و پاسخ‌دهی سریع.',
                    'price': random.choice([300000000, 450000000]),
                    'trl': random.choice([7, 8]),
                    'tech': 'فیبر نوری و پردازش سیگنال'
                },
            ],
            'پتروشیمی': [
                {
                    'title': 'سیستم کنترل پیشرفته پلیمریزاسیون',
                    'desc': 'سیستم کنترل مبتنی بر مدل برای واحد پلیمریزاسیون با قابلیت تنظیم خودکار پارامترها و افزایش کیفیت محصول.',
                    'price': random.choice([600000000, 800000000]),
                    'trl': random.choice([6, 7, 8, 9]),
                    'tech': 'کنترل پیشرفته و مدل‌سازی'
                },
                {
                    'title': 'راهکار نگهداری پیش‌بینانه تجهیزات دوار',
                    'desc': 'سیستم پایش وضعیت و تشخیص خطا برای کمپرسورها و توربین‌ها با استفاده از آنالیز ارتعاشات و هوش مصنوعی.',
                    'price': random.choice([250000000, 400000000, 550000000]),
                    'trl': random.choice([7, 8]),
                    'tech': 'آنالیز ارتعاشات و یادگیری ماشین'
                },
            ],
            'فولاد': [
                {
                    'title': 'سیستم کنترل ضخامت نورد گرم',
                    'desc': 'سیستم کنترل ضخامت با استفاده از بینایی ماشین و الگوریتم‌های پیش‌بینی برای بهبود کیفیت و کاهش ضایعات.',
                    'price': random.choice([350000000, 500000000]),
                    'trl': random.choice([6, 7]),
                    'tech': 'بینایی ماشین و کنترل پیشرفته'
                },
            ],
            'ساخت و تولید': [
                {
                    'title': 'دستگاه تصفیه آب صنعتی هوشمند',
                    'desc': 'دستگاه تصفیه آب با فناوری اسمز معکوس و غشایی، مجهز به سیستم پایش آنلاین کیفیت آب و کنترل خودکار.',
                    'price': random.choice([200000000, 300000000, 450000000]),
                    'trl': random.choice([7, 8, 9]),
                    'tech': 'تصفیه آب و اتوماسیون'
                },
                {
                    'title': 'ربات‌های همکار برای خط مونتاژ',
                    'desc': 'ربات‌های صنعتی با قابلیت همکاری ایمن با انسان برای افزایش بهره‌وری و انعطاف‌پذیری در خطوط مونتاژ.',
                    'price': random.choice([400000000, 600000000, 800000000]),
                    'trl': random.choice([6, 7, 8]),
                    'tech': 'رباتیک و هوش مصنوعی'
                },
            ],
            'فناوری اطلاعات': [
                {
                    'title': 'پلتفرم ERP یکپارچه',
                    'desc': 'نرم‌افزار مدیریت یکپارچه منابع سازمانی با قابلیت شخصی‌سازی و اتصال به سامانه‌های موجود.',
                    'price': random.choice([150000000, 250000000, 400000000]),
                    'trl': random.choice([8, 9]),
                    'tech': 'نرم‌افزار و یکپارچه‌سازی'
                },
                {
                    'title': 'پلتفرم اینترنت اشیا صنعتی',
                    'desc': 'پلتفرم IoT برای اتصال سنسورها، جمع‌آوری داده و تحلیل با استفاده از هوش مصنوعی و داشبوردهای تعاملی.',
                    'price': random.choice([200000000, 350000000]),
                    'trl': random.choice([7, 8]),
                    'tech': 'IoT و تحلیل داده'
                },
                {
                    'title': 'سامانه بلاکچین برای تامین‌کنندگان',
                    'desc': 'سامانه مدیریت زنجیره تامین مبتنی بر بلاکچین برای شفافیت، امنیت و ردیابی کالاها از تولید تا تحویل.',
                    'price': random.choice([180000000, 280000000]),
                    'trl': random.choice([6, 7]),
                    'tech': 'بلاکچین و مدیریت زنجیره تامین'
                },
            ],
            'برق و انرژی': [
                {
                    'title': 'سیستم مدیریت انرژی شبکه توزیع',
                    'desc': 'سیستم مدیریت انرژی با قابلیت پیش‌بینی مصرف، تشخیص خطا و بهینه‌سازی توزیع برای شبکه‌های برق هوشمند.',
                    'price': random.choice([300000000, 500000000]),
                    'trl': random.choice([7, 8]),
                    'tech': 'مدیریت انرژی و شبکه هوشمند'
                },
            ],
            'حمل و نقل و لجستیک': [
                {
                    'title': 'سامانه مدیریت ناوگان با GPS و IoT',
                    'desc': 'سامانه مدیریت ناوگان با ردیابی GPS، بهینه‌سازی مسیر و کاهش مصرف سوخت با استفاده از تحلیل داده‌های جاده.',
                    'price': random.choice([100000000, 200000000, 300000000]),
                    'trl': random.choice([7, 8, 9]),
                    'tech': 'GPS و تحلیل داده'
                },
                {
                    'title': 'خودروهای هدایت‌شونده خودکار (AGV)',
                    'desc': 'خودروهای AGV با ناوبری خودکار برای جابجایی مواد در انبارها و کارخانه‌ها با قابلیت برنامه‌ریزی مسیر.',
                    'price': random.choice([250000000, 400000000]),
                    'trl': random.choice([6, 7]),
                    'tech': 'رباتیک و ناوبری خودکار'
                },
            ],
            'خودرو': [
                {
                    'title': 'سیستم ADAS مبتنی بر دوربین',
                    'desc': 'سیستم کمک‌راننده با استفاده از دوربین‌های هوشمند برای تشخیص علائم، خطوط جاده و عابران پیاده.',
                    'price': random.choice([150000000, 250000000]),
                    'trl': random.choice([7, 8]),
                    'tech': 'بینایی کامپیوتر و هوش مصنوعی'
                },
            ],
            'الکترونیک': [
                {
                    'title': 'خط تولید SMT با دقت بالا',
                    'desc': 'خط تولید بردهای الکترونیکی با فناوری SMT و سیستم بازرسی خودکار برای افزایش کیفیت و کاهش خطا.',
                    'price': random.choice([500000000, 700000000]),
                    'trl': random.choice([7, 8, 9]),
                    'tech': 'الکترونیک و اتوماسیون'
                },
            ],
            'داروسازی': [
                {
                    'title': 'سیستم پایش کیفیت داروهای استریل',
                    'desc': 'سیستم پایش آنلاین کیفیت داروهای استریل با سنسورهای پیشرفته برای کنترل دما، فشار و رطوبت.',
                    'price': random.choice([200000000, 350000000]),
                    'trl': random.choice([6, 7, 8]),
                    'tech': 'سنسورها و کنترل فرآیند'
                },
            ],
            'کشاورزی': [
                {
                    'title': 'سیستم آبیاری هوشمند گلخانه‌ای',
                    'desc': 'سیستم آبیاری خودکار با سنسورهای رطوبت خاک و پیش‌بینی آب و هوا برای کاهش مصرف آب و افزایش بازده.',
                    'price': random.choice([80000000, 150000000]),
                    'trl': random.choice([7, 8]),
                    'tech': 'سنسورها و اتوماسیون'
                },
            ],
        }

        # ============================================================
        # ۵. ایجاد نیازها
        # ============================================================
        total_needs = options['needs']
        need_objects = []
        users_list = list(users.values())

        self.stdout.write(f'📝 ایجاد {total_needs} نیاز...')

        # نیازهای کاربران هدف
        needs_per_target = 4
        for user in users_list:
            for j in range(needs_per_target):
                industry_name = random.choice(list(need_templates.keys()))
                industry = industries[industry_name]
                template = random.choice(need_templates[industry_name])

                title = template['title'] + (f" - نسخه {j+1}" if j > 0 else "")
                description = template['desc'] + " " + " ".join([fake.sentence() for _ in range(3)])

                budget = Decimal(random.randint(10000000, 1000000000)) if random.random() > 0.5 else None
                timeline = random.choice(['کمتر از ۳ ماه', '۳ تا ۶ ماه', '۶ تا ۱۲ ماه', 'بیش از ۱۲ ماه', 'فوری'])
                status = random.choice(['draft', 'published', 'evaluating'])

                need = Need(
                    title=title[:200],
                    description=description[:500],
                    industry=industry,
                    budget=budget,
                    timeline=timeline,
                    status=status,
                    buyer=user,
                    current_status=fake.sentence()[:100],
                    expected_outcome=fake.sentence()[:100],
                    constraints=fake.sentence()[:100],
                    evaluation_criteria=fake.sentence()[:100],
                )
                need_objects.append(need)

        # نیازهای باقیمانده
        remaining_needs = total_needs - (len(users_list) * needs_per_target)
        for i in range(remaining_needs):
            industry_name = random.choice(list(need_templates.keys()))
            industry = industries[industry_name]
            template = random.choice(need_templates[industry_name])

            title = template['title'] + f" - {fake.word()}"
            description = template['desc'] + " " + " ".join([fake.sentence() for _ in range(3)])

            budget = Decimal(random.randint(10000000, 1000000000)) if random.random() > 0.3 else None
            timeline = random.choice(['کمتر از ۳ ماه', '۳ تا ۶ ماه', '۶ تا ۱۲ ماه', 'بیش از ۱۲ ماه', 'فوری'])
            status = random.choice(['draft', 'published', 'evaluating'])

            need = Need(
                title=title[:200],
                description=description[:500],
                industry=industry,
                budget=budget,
                timeline=timeline,
                status=status,
                buyer=default_user,
                current_status=fake.sentence()[:100],
                expected_outcome=fake.sentence()[:100],
                constraints=fake.sentence()[:100],
                evaluation_criteria=fake.sentence()[:100],
            )
            need_objects.append(need)

        Need.objects.bulk_create(need_objects)
        self.stdout.write(f'✅ {len(need_objects)} نیاز ایجاد شد')

        # ============================================================
        # ۶. ایجاد عرضه‌ها
        # ============================================================
        total_supplies = options['supplies']
        supply_objects = []

        self.stdout.write(f'📦 ایجاد {total_supplies} عرضه...')

        # عرضه‌های کاربران هدف
        supplies_per_target = 3
        for user in users_list:
            for j in range(supplies_per_target):
                industry_name = random.choice(list(supply_templates.keys()))
                industry = industries[industry_name]
                template = random.choice(supply_templates[industry_name])

                title = template['title'] + (f" - {user.username}" if j > 0 else "")
                description = template['desc'] + " " + " ".join([fake.sentence() for _ in range(3)])

                supply = Supply(
                    title=title[:200],
                    description=description[:500],
                    category=random.choice(['product', 'service']),
                    industry=industry,
                    technology=template['tech'],
                    price=Decimal(template['price']),
                    trl=template['trl'],
                    status=random.choice(['approved', 'published']),
                    seller=user,
                    quantity=str(random.randint(1, 1000)),
                    unit=random.choice(['عدد', 'کیلوگرم', 'تن', 'متر', 'لیتر']),
                    capacity=f"{random.randint(10, 1000)} واحد در روز",
                    pricing_model=random.choice(['ثابت', 'مذاکره‌ای', 'قراردادی']),
                    collaboration_terms=fake.sentence()[:100],
                    ip_status=random.choice(['ثبت شده', 'در حال ثبت', 'آزاد']),
                )
                supply_objects.append(supply)

        # عرضه‌های باقیمانده
        remaining_supplies = total_supplies - (len(users_list) * supplies_per_target)
        for i in range(remaining_supplies):
            industry_name = random.choice(list(supply_templates.keys()))
            industry = industries[industry_name]
            template = random.choice(supply_templates[industry_name])

            title = template['title'] + f" - {fake.word()}"
            description = template['desc'] + " " + " ".join([fake.sentence() for _ in range(3)])

            supply = Supply(
                title=title[:200],
                description=description[:500],
                category=random.choice(['product', 'service']),
                industry=industry,
                technology=template['tech'],
                price=Decimal(template['price']),
                trl=template['trl'],
                status=random.choice(['approved', 'published', 'draft']),
                seller=default_user,
                quantity=str(random.randint(1, 1000)),
                unit=random.choice(['عدد', 'کیلوگرم', 'تن', 'متر', 'لیتر']),
                capacity=f"{random.randint(10, 1000)} واحد در روز",
                pricing_model=random.choice(['ثابت', 'مذاکره‌ای', 'قراردادی']),
                collaboration_terms=fake.sentence()[:100],
                ip_status=random.choice(['ثبت شده', 'در حال ثبت', 'آزاد']),
            )
            supply_objects.append(supply)

        Supply.objects.bulk_create(supply_objects)
        self.stdout.write(f'✅ {len(supply_objects)} عرضه ایجاد شد')

        # ============================================================
        # ۷. گزارش نهایی
        # ============================================================
        self.stdout.write('\n' + '='*60)
        self.stdout.write('🎉 تولید داده‌های آزمایشی با موفقیت انجام شد!')
        self.stdout.write(f'📌 تعداد نیازها: {Need.objects.count()}')
        self.stdout.write(f'📌 تعداد عرضه‌ها: {Supply.objects.count()}')
        self.stdout.write('='*60)

        self.stdout.write('\n👤 نیازهای کاربران هدف:')
        for user in users_list:
            needs = Need.objects.filter(buyer=user)
            self.stdout.write(f'  - {user.username}: {needs.count()} نیاز')
            for need in needs[:3]:
                self.stdout.write(f'    * {need.title[:50]}...')

        self.stdout.write('\n📦 عرضه‌های کاربران هدف:')
        for user in users_list:
            supplies = Supply.objects.filter(seller=user)
            self.stdout.write(f'  - {user.username}: {supplies.count()} عرضه')
            for supply in supplies[:3]:
                self.stdout.write(f'    * {supply.title[:50]}...')