from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from contracts.models import Contract, Milestone
from decimal import Decimal
from datetime import datetime, timedelta
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'ایجاد داده‌های نمونه برای قراردادها با کاربران ghotbi و azadeh'

    def handle(self, *args, **options):
        # ۱. ساختن کاربر ghotbi
        ghotbi, created = User.objects.get_or_create(
            username='ghotbi',
            defaults={
                'email': 'ghotbi@example.com',
                'first_name': 'قُطبی',
                'last_name': 'کاربر',
            }
        )
        if created:
            ghotbi.set_password('123456')
            ghotbi.save()
            self.stdout.write(self.style.SUCCESS('کاربر ghotbi ساخته شد.'))

        # ۲. ساختن کاربر azadeh
        azadeh, created = User.objects.get_or_create(
            username='azadeh',
            defaults={
                'email': 'azadeh@example.com',
                'first_name': 'آزاده',
                'last_name': 'کاربر',
            }
        )
        if created:
            azadeh.set_password('azadeh123')
            azadeh.save()
            self.stdout.write(self.style.SUCCESS('کاربر azadeh ساخته شد.'))

        # ۳. ساختن چند کاربر دیگر برای طرف مقابل
        other_users = []
        for i in range(3):
            user, created = User.objects.get_or_create(
                username=f'user_{i+1}',
                defaults={
                    'email': f'user{i+1}@example.com',
                    'first_name': f'کاربر {i+1}',
                    'last_name': 'تستی',
                }
            )
            if created:
                user.set_password('123456')
                user.save()
                self.stdout.write(f'کاربر {user.username} ساخته شد.')
            other_users.append(user)

        # ۴. لیست قراردادهای نمونه
        contracts_config = [
            # قراردادهایی که ghotbi خریدار است
            {
                'buyer': ghotbi,
                'supplier': other_users[0],
                'terms': 'قرارداد خرید کالاهای دیجیتال به مبلغ ۱۲۰ میلیون تومان',
                'total_value': Decimal('120000000'),
                'status': 'draft',
                'signed_at': None,
            },
            {
                'buyer': ghotbi,
                'supplier': other_users[1],
                'terms': 'قرارداد خدمات امنیتی به مبلغ ۸۰ میلیون تومان',
                'total_value': Decimal('80000000'),
                'status': 'legal_review',
                'signed_at': None,
            },
            # قراردادهایی که ghotbi فروشنده است
            {
                'buyer': other_users[2],
                'supplier': ghotbi,
                'terms': 'قرارداد فروش نرم‌افزار مدیریت فروش به مبلغ ۲۵۰ میلیون تومان',
                'total_value': Decimal('250000000'),
                'status': 'signed',
                'signed_at': datetime.now() - timedelta(days=3),
            },
            {
                'buyer': azadeh,  # azadeh خریدار
                'supplier': ghotbi,  # ghotbi فروشنده
                'terms': 'قرارداد مشاوره مالی به مبلغ ۶۰ میلیون تومان',
                'total_value': Decimal('60000000'),
                'status': 'execution',
                'signed_at': datetime.now() - timedelta(days=15),
            },
            # قراردادهایی که azadeh خریدار است
            {
                'buyer': azadeh,
                'supplier': other_users[0],
                'terms': 'قرارداد تأمین قطعات صنعتی به مبلغ ۹۰ میلیون تومان',
                'total_value': Decimal('90000000'),
                'status': 'approved_buyer',
                'signed_at': None,
            },
            {
                'buyer': azadeh,
                'supplier': other_users[2],
                'terms': 'قرارداد طراحی سایت فروشگاهی به مبلغ ۴۵ میلیون تومان',
                'total_value': Decimal('45000000'),
                'status': 'completed',
                'signed_at': datetime.now() - timedelta(days=45),
            },
            # قراردادهایی که azadeh فروشنده است
            {
                'buyer': other_users[1],
                'supplier': azadeh,
                'terms': 'قرارداد فروش محتوای آموزشی به مبلغ ۳۰ میلیون تومان',
                'total_value': Decimal('30000000'),
                'status': 'disputed',
                'signed_at': datetime.now() - timedelta(days=8),
            },
            {
                'buyer': ghotbi,  # ghotbi خریدار
                'supplier': azadeh,  # azadeh فروشنده
                'terms': 'قرارداد خدمات پشتیبانی شبکه به مبلغ ۷۰ میلیون تومان',
                'total_value': Decimal('70000000'),
                'status': 'valuation',
                'signed_at': None,
            },
            # قرارداد بین خود ghotbi و azadeh (هر دو نقش دارند)
            {
                'buyer': ghotbi,
                'supplier': azadeh,
                'terms': 'قرارداد مشارکت در پروژه استارتاپی به مبلغ ۵۰۰ میلیون تومان',
                'total_value': Decimal('500000000'),
                'status': 'signed',
                'signed_at': datetime.now() - timedelta(days=1),
            },
            {
                'buyer': azadeh,
                'supplier': ghotbi,
                'terms': 'قرارداد انتقال دانش فنی به مبلغ ۱۵۰ میلیون تومان',
                'total_value': Decimal('150000000'),
                'status': 'execution',
                'signed_at': datetime.now() - timedelta(days=10),
            },
        ]

        # ۵. ایجاد قراردادها
        for config in contracts_config:
            contract = Contract.objects.create(
                negotiation=None,  # اگر Negotiation داری، می‌تونی مقدار دهی کنی
                buyer=config['buyer'],
                supplier=config['supplier'],
                terms=config['terms'],
                total_value=config['total_value'],
                status=config['status'],
                signed_at=config['signed_at'],
            )
            self.stdout.write(f'✅ قرارداد #{contract.id} ساخته شد (خریدار: {contract.buyer.username} - فروشنده: {contract.supplier.username})')

            # ۶. ساخت نقاط عطف (۲ تا ۳ عدد) برای هر قرارداد
            num_milestones = random.randint(2, 3)
            for i in range(num_milestones):
                milestone = Milestone.objects.create(
                    contract=contract,
                    title=f'فاز {i+1} - {contract.id}',
                    description=f'توضیحات فاز {i+1} از قرارداد {contract.id}',
                    due_date=datetime.now().date() + timedelta(days=random.randint(5, 40)),
                    status=random.choice(['not_started', 'in_progress', 'awaiting_approval', 'completed']),
                    completed_at=datetime.now() - timedelta(days=random.randint(1, 20)) if random.choice([True, False]) else None,
                )
                self.stdout.write(f'  └─ نقطه عطف: {milestone.title} (وضعیت: {milestone.status})')

        self.stdout.write(self.style.SUCCESS('\n🎉 همه داده‌های نمونه با موفقیت ساخته شدند!'))
        self.stdout.write(f'👤 کاربر ghotbi با رمز: 123456')
        self.stdout.write(f'👤 کاربر azadeh با رمز: azadeh123')