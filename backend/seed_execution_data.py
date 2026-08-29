# seed_execution_data.py
# اسکریپت ایجاد داده‌های اجرا (قراردادها، اجراها و مراحل) بر اساس تطبیق‌های تأییدشده

import os
import django
from datetime import date, timedelta
from decimal import Decimal
import random

# تنظیم محیط Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from contracts.models import Contract
from execution.models import Execution, Milestone
from matching.models import MatchResult
from needs.models import Need
from products.models import Product

User = get_user_model()

# وضعیت‌های ممکن برای قرارداد
CONTRACT_STATUSES = ['active', 'completed', 'suspended']
# وضعیت‌های ممکن برای اجرا
EXECUTION_STATUSES = ['not_started', 'in_progress', 'awaiting_approval', 'needs_revision', 'completed', 'suspended']
# وضعیت‌های ممکن برای مرحله
MILESTONE_STATUSES = ['not_started', 'in_progress', 'awaiting_approval', 'needs_revision', 'completed']


def random_date(start, end):
    """تولید تاریخ تصادفی بین دو تاریخ"""
    delta = end - start
    int_delta = delta.days
    if int_delta <= 0:
        return start
    random_day = random.randint(0, int_delta)
    return start + timedelta(days=random_day)


def create_execution_data():
    print("🔄 شروع ایجاد داده‌های اجرا (قراردادها، اجراها و مراحل)...")

    # 1. دریافت تطبیق‌های تأییدشده
    approved_matches = MatchResult.objects.filter(status='approved').select_related('need', 'product')
    if not approved_matches.exists():
        print("⚠️ هیچ تطبیق تأییدشده‌ای یافت نشد. لطفاً ابتدا داده‌های تطبیق را ایجاد کنید.")
        return

    print(f"🔍 تعداد تطبیق‌های تأییدشده: {approved_matches.count()}")

    created_contracts = 0
    created_executions = 0
    created_milestones = 0

    for match in approved_matches:
        need = match.need
        product = match.product

        # فروشنده = صاحب محصول، خریدار = صاحب نیاز
        supplier = product.seller
        buyer = need.buyer

        # اگر کاربران یکسان هستند، از آن صرف‌نظر کن (یا می‌توانی تغییر دهی)
        if supplier == buyer:
            print(f"⚠️ تطبیق #{match.id}: فروشنده و خریدار یکی هستند، رد شد.")
            continue

        # ========== ایجاد قرارداد ==========
        # تاریخ شروع: بین امروز و ۳ ماه قبل
        start_date = random_date(date.today() - timedelta(days=90), date.today())
        # مدت زمان اجرا: بین ۱ تا ۶ ماه
        duration_days = random.randint(30, 180)
        expected_end_date = start_date + timedelta(days=duration_days)

        # مبلغ قرارداد: قیمت محصول یا میانگین قیمت
        price = product.price or 0
        if price <= 0:
            price = Decimal(random.randint(100_000_000, 2_000_000_000))

        contract, created = Contract.objects.get_or_create(
            need=need,
            product=product,
            defaults={
                'buyer': buyer,
                'supplier': supplier,
                'status': 'active',
                'start_date': start_date,
                'expected_end_date': expected_end_date,
                'total_amount': price,
                'terms': f"قرارداد اجرای پروژه '{product.title}' بر اساس نیاز '{need.title}'"
            }
        )
        if created:
            created_contracts += 1
            print(f"✅ قرارداد #{contract.id} برای نیاز '{need.title[:30]}...' و محصول '{product.title[:30]}...'")
        else:
            print(f"ℹ️ قرارداد #{contract.id} از قبل وجود داشت.")

        # ========== ایجاد اجرا ==========
        # وضعیت اجرا بر اساس تاریخ شروع و پایان
        today = date.today()
        if today < start_date:
            exec_status = 'not_started'
            progress = 0
        elif today > expected_end_date:
            # ممکن است کامل شده یا به تأخیر افتاده باشد
            exec_status = random.choice(['completed', 'suspended', 'disputed'])
            progress = 100 if exec_status == 'completed' else random.randint(30, 90)
        else:
            exec_status = random.choice(['in_progress', 'awaiting_approval', 'needs_revision'])
            progress = random.randint(10, 85)

        # امتیاز نهایی (در صورت تکمیل)
        final_score = None
        if exec_status == 'completed':
            final_score = Decimal(random.randint(70, 100) / 10)  # 7.0 تا 10.0

        execution, created = Execution.objects.get_or_create(
            contract=contract,
            defaults={
                'status': exec_status,
                'progress_percent': progress,
                'start_date': start_date,
                'expected_end_date': expected_end_date,
                'actual_end_date': date.today() if exec_status == 'completed' else None,
                'final_score': final_score,
                'notes': f"یادداشت‌های اجرا برای قرارداد #{contract.id}"
            }
        )
        if created:
            created_executions += 1
            print(f"   └─ اجرا #{execution.id} با وضعیت '{exec_status}' و پیشرفت {progress}%")
        else:
            print(f"   └─ اجرا #{execution.id} از قبل وجود داشت.")

        # ========== ایجاد مراحل (Milestones) ==========
        # تعداد مراحل بین ۳ تا ۶
        num_milestones = random.randint(3, 6)
        milestone_titles = [
            "طراحی اولیه", "توسعه نمونه اولیه", "آزمایش‌های داخلی",
            "تأیید کیفیت", "آماده‌سازی برای استقرار", "استقرار و راه‌اندازی",
            "آموزش کاربران", "پشتیبانی اولیه", "گزارش نهایی"
        ]
        # انتخاب تصادفی عناوین (با جایگزینی)
        selected_titles = random.sample(milestone_titles, min(num_milestones, len(milestone_titles)))
        # اگر تعداد عناوین کمتر از تعداد مراحل بود، از عناوین تکراری استفاده کن
        while len(selected_titles) < num_milestones:
            selected_titles.append(f"مرحله {len(selected_titles)+1}")

        # تاریخ‌های سررسید به صورت پله‌ای بین start_date و expected_end_date
        if start_date and expected_end_date and expected_end_date > start_date:
            total_days = (expected_end_date - start_date).days
            step = total_days // (num_milestones + 1) if num_milestones > 0 else 1
        else:
            step = 30  # fallback

        milestone_objects = []
        for i in range(num_milestones):
            due_date = start_date + timedelta(days=(i+1)*step) if start_date else None
            # وضعیت مرحله: اگر تاریخ سررسید گذشته باشد، احتمال تکمیل بیشتر است
            status_choices = MILESTONE_STATUSES.copy()
            if due_date and due_date < date.today():
                # احتمال تکمیل یا در حال انجام
                status = random.choices(
                    ['completed', 'completed', 'completed', 'in_progress', 'awaiting_approval'],
                    weights=[40, 30, 20, 5, 5]
                )[0]
            else:
                status = random.choices(
                    ['not_started', 'not_started', 'in_progress'],
                    weights=[60, 30, 10]
                )[0]

            completed_at = None
            if status == 'completed':
                completed_at = due_date if due_date and due_date <= date.today() else date.today()

            milestone, created = Milestone.objects.get_or_create(
                contract=contract,
                title=selected_titles[i % len(selected_titles)],
                defaults={
                    'description': f"توضیحات مرحله {i+1}: {selected_titles[i % len(selected_titles)]}",
                    'due_date': due_date,
                    'status': status,
                    'deliverables': f"خروجی‌های مرحله {i+1}",
                    'completed_at': completed_at,
                }
            )
            if created:
                created_milestones += 1
                milestone_objects.append(milestone)

        if milestone_objects:
            print(f"   └─ {len(milestone_objects)} مرحله برای قرارداد #{contract.id} ایجاد شد.")

    # ========== جمع‌بندی ==========
    print("\n" + "=" * 70)
    print("📊 خلاصه داده‌های ایجاد شده برای اجرا")
    print("=" * 70)
    print(f"📄 قراردادهای جدید: {created_contracts}")
    print(f"⚙️  اجراهای جدید: {created_executions}")
    print(f"📌 مراحل جدید: {created_milestones}")
    print("=" * 70)
    print("\n✅ اسکریپت با موفقیت اجرا شد!")


if __name__ == "__main__":
    create_execution_data()