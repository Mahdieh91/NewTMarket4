# seed_contracts.py
# ایجاد قراردادهای واقعی بین azadeh و azadeh123

import os
import django
from datetime import timedelta, date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from contracts.models import Contract, Milestone
from execution.models import Execution
from products.models import Supply
from needs.models import Need
from industries.models import IndustryCategory
from negotiations.models import Negotiation

User = get_user_model()

def create_contracts():
    print("=" * 70)
    print("🔄 شروع ایجاد قراردادهای واقعی بین azadeh و azadeh123")
    print("=" * 70)

    # ============================================================
    # 1. دریافت کاربران
    # ============================================================
    
    try:
        azadeh = User.objects.get(username='azadeh')
        azadeh123 = User.objects.get(username='azadeh123')
        print(f'✅ کاربر azadeh: {azadeh.first_name} {azadeh.last_name} (ID: {azadeh.id})')
        print(f'✅ کاربر azadeh123: {azadeh123.first_name} {azadeh123.last_name} (ID: {azadeh123.id})')
    except User.DoesNotExist as e:
        print(f'❌ کاربر یافت نشد: {e}')
        return

    # ============================================================
    # 2. دریافت صنعت و داده‌ها
    # ============================================================
    
    try:
        industry = IndustryCategory.objects.get(name='پتروشیمی')
        print(f'✅ صنعت: {industry.name}')
    except IndustryCategory.DoesNotExist:
        print('❌ صنعت پتروشیمی وجود ندارد!')
        return

    needs = list(Need.objects.filter(industry=industry))
    supplies = list(Supply.objects.filter(industry=industry.name))

    if len(needs) < 3:
        print('❌ تعداد نیازها کم است!')
        return
    
    if len(supplies) < 3:
        print('❌ تعداد Supply‌ها کم است!')
        return

    print(f'📦 تعداد نیازها: {len(needs)}')
    print(f'📦 تعداد Supply‌ها: {len(supplies)}')

    # ============================================================
    # 3. تعریف قراردادها
    # ============================================================
    
    contracts_config = [
        {
            # قرارداد 1: تکمیل شده با همه مراحل
            'need_index': 0,
            'supply_index': 0,
            'buyer': azadeh,
            'supplier': azadeh123,
            'status': 'completed',
            'total_value': 780_000_000,
            'signed_at': timezone.now() - timedelta(days=185),
            'contract_status': 'completed',
            'execution_status': 'completed',
            'progress_percent': 100,
            'start_date': timezone.now() - timedelta(days=180),
            'expected_end_date': timezone.now() - timedelta(days=30),
            'actual_end_date': timezone.now() - timedelta(days=30),
            'final_score': None,  # بعداً توسط AI محاسبه می‌شود
            'milestones': [
                {'title': 'مطالعه و تحلیل نیازمندی‌ها', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=170), 'completed_at': timezone.now() - timedelta(days=165)},
                {'title': 'طراحی معماری سیستم', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=150), 'completed_at': timezone.now() - timedelta(days=145)},
                {'title': 'پیاده‌سازی ماژول اصلی', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=120), 'completed_at': timezone.now() - timedelta(days=115)},
                {'title': 'تست و استقرار', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=90), 'completed_at': timezone.now() - timedelta(days=85)},
                {'title': 'آموزش و تحویل نهایی', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=30), 'completed_at': timezone.now() - timedelta(days=30)},
            ]
        },
        {
            # قرارداد 2: تکمیل شده با یک مرحله نیازمند اصلاح
            'need_index': 1,
            'supply_index': 1,
            'buyer': azadeh123,
            'supplier': azadeh,
            'status': 'completed',
            'total_value': 950_000_000,
            'signed_at': timezone.now() - timedelta(days=205),
            'contract_status': 'completed',
            'execution_status': 'completed',
            'progress_percent': 100,
            'start_date': timezone.now() - timedelta(days=200),
            'expected_end_date': timezone.now() - timedelta(days=50),
            'actual_end_date': timezone.now() - timedelta(days=50),
            'final_score': None,
            'milestones': [
                {'title': 'تحلیل نیازمندی‌ها', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=190), 'completed_at': timezone.now() - timedelta(days=185)},
                {'title': 'طراحی سیستم', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=170), 'completed_at': timezone.now() - timedelta(days=165)},
                {'title': 'پیاده‌سازی ماژول پایش', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=140), 'completed_at': timezone.now() - timedelta(days=135)},
                {'title': 'پیاده‌سازی داشبورد', 'status': 'needs_revision', 'due_date': timezone.now() - timedelta(days=110), 'completed_at': None},
                {'title': 'تست یکپارچه‌سازی', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=80), 'completed_at': timezone.now() - timedelta(days=78)},
                {'title': 'استقرار نهایی', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=50), 'completed_at': timezone.now() - timedelta(days=50)},
            ]
        },
        {
            # قرارداد 3: تکمیل شده با تأخیر
            'need_index': 2,
            'supply_index': 2,
            'buyer': azadeh,
            'supplier': azadeh123,
            'status': 'completed',
            'total_value': 680_000_000,
            'signed_at': timezone.now() - timedelta(days=225),
            'contract_status': 'completed',
            'execution_status': 'completed',
            'progress_percent': 100,
            'start_date': timezone.now() - timedelta(days=220),
            'expected_end_date': timezone.now() - timedelta(days=40),
            'actual_end_date': timezone.now() - timedelta(days=20),
            'final_score': None,
            'milestones': [
                {'title': 'بررسی نیازمندی‌ها', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=210), 'completed_at': timezone.now() - timedelta(days=205)},
                {'title': 'طراحی سیستم سنسورها', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=190), 'completed_at': timezone.now() - timedelta(days=185)},
                {'title': 'پیاده‌سازی جمع‌آوری داده', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=160), 'completed_at': timezone.now() - timedelta(days=158)},
                {'title': 'نصب سنسورها', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=130), 'completed_at': timezone.now() - timedelta(days=135)},
                {'title': 'سیستم هشدار و گزارش‌گیری', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=100), 'completed_at': timezone.now() - timedelta(days=110)},
                {'title': 'تست نهایی و تحویل', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=40), 'completed_at': timezone.now() - timedelta(days=20)},
            ]
        },
        {
            # قرارداد 4: در حال اجرا (execution)
            'need_index': 3,
            'supply_index': 3,
            'buyer': azadeh,
            'supplier': azadeh123,
            'status': 'execution',
            'total_value': 250_000_000,
            'signed_at': timezone.now() - timedelta(days=65),
            'contract_status': 'execution',
            'execution_status': 'in_progress',
            'progress_percent': 60,
            'start_date': timezone.now() - timedelta(days=60),
            'expected_end_date': timezone.now() + timedelta(days=90),
            'actual_end_date': None,
            'final_score': None,
            'milestones': [
                {'title': 'ممیزی انرژی واحدها', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=45), 'completed_at': timezone.now() - timedelta(days=42)},
                {'title': 'تحلیل داده‌های ممیزی', 'status': 'completed', 'due_date': timezone.now() - timedelta(days=30), 'completed_at': timezone.now() - timedelta(days=28)},
                {'title': 'ارائه راهکارهای بهینه‌سازی', 'status': 'in_progress', 'due_date': timezone.now() + timedelta(days=10), 'completed_at': None},
                {'title': 'پیاده‌سازی راهکارها', 'status': 'not_started', 'due_date': timezone.now() + timedelta(days=45), 'completed_at': None},
                {'title': 'پایش و ارزیابی نتایج', 'status': 'not_started', 'due_date': timezone.now() + timedelta(days=90), 'completed_at': None},
            ]
        },
        {
            # قرارداد 5: امضا شده (signed)
            'need_index': 4,
            'supply_index': 4,
            'buyer': azadeh123,
            'supplier': azadeh,
            'status': 'signed',
            'total_value': 1_200_000_000,
            'signed_at': timezone.now() - timedelta(days=5),
            'contract_status': 'signed',
            'execution_status': 'not_started',
            'progress_percent': 0,
            'start_date': timezone.now() + timedelta(days=15),
            'expected_end_date': timezone.now() + timedelta(days=180),
            'actual_end_date': None,
            'final_score': None,
            'milestones': [
                {'title': 'بررسی نیازمندی‌های نت', 'status': 'not_started', 'due_date': timezone.now() + timedelta(days=30), 'completed_at': None},
                {'title': 'طراحی سیستم نت', 'status': 'not_started', 'due_date': timezone.now() + timedelta(days=60), 'completed_at': None},
                {'title': 'پیاده‌سازی ماژول‌ها', 'status': 'not_started', 'due_date': timezone.now() + timedelta(days=120), 'completed_at': None},
                {'title': 'تست و استقرار', 'status': 'not_started', 'due_date': timezone.now() + timedelta(days=165), 'completed_at': None},
                {'title': 'تحویل نهایی', 'status': 'not_started', 'due_date': timezone.now() + timedelta(days=180), 'completed_at': None},
            ]
        },
        {
            # قرارداد 6: پیش‌نویس (draft)
            'need_index': 5,
            'supply_index': 5,
            'buyer': azadeh,
            'supplier': azadeh123,
            'status': 'draft',
            'total_value': 280_000_000,
            'signed_at': None,
            'contract_status': 'draft',
            'execution_status': 'not_started',
            'progress_percent': 0,
            'start_date': timezone.now() + timedelta(days=30),
            'expected_end_date': timezone.now() + timedelta(days=120),
            'actual_end_date': None,
            'final_score': None,
            'milestones': []
        },
        {
            # قرارداد 7: امضا شده با تاریخ شروع گذشته
            'need_index': 6,
            'supply_index': 6,
            'buyer': azadeh123,
            'supplier': azadeh,
            'status': 'signed',
            'total_value': 890_000_000,
            'signed_at': timezone.now() - timedelta(days=25),
            'contract_status': 'signed',
            'execution_status': 'not_started',
            'progress_percent': 0,
            'start_date': timezone.now() - timedelta(days=20),
            'expected_end_date': timezone.now() + timedelta(days=160),
            'actual_end_date': None,
            'final_score': None,
            'milestones': [
                {'title': 'نیازسنجی و طراحی', 'status': 'not_started', 'due_date': timezone.now() + timedelta(days=30), 'completed_at': None},
                {'title': 'پیاده‌سازی سیستم', 'status': 'not_started', 'due_date': timezone.now() + timedelta(days=100), 'completed_at': None},
                {'title': 'تست و راه‌اندازی', 'status': 'not_started', 'due_date': timezone.now() + timedelta(days=160), 'completed_at': None},
            ]
        },
    ]

    # ============================================================
    # 4. ایجاد قراردادها
    # ============================================================
    
    created_count = 0
    
    for idx, config in enumerate(contracts_config):
        need = needs[config['need_index']]
        supply = supplies[config['supply_index']]
        
        print(f"\n{'='*50}")
        print(f"📝 قرارداد {idx+1}: {need.title[:40]}...")
        print(f"   خریدار: {config['buyer'].username} → فروشنده: {config['supplier'].username}")
        print(f"   وضعیت: {config['status']}")
        print(f"   مبلغ: {format(config['total_value'], ',')} تومان")
        
        # ایجاد مذاکره
        negotiation, neg_created = Negotiation.objects.get_or_create(
            supply=supply,
            buyer=config['buyer'],
            supplier=config['supplier'],
            defaults={
                'status': 'contracted' if config['status'] in ['completed', 'execution'] else 'accepted',
                'context_title': need.title,
                'context_meta': {'need_id': need.id, 'supply_id': supply.id},
                'is_active': True,
                'created_at': timezone.now() - timedelta(days=200 - idx*10),
            }
        )
        if neg_created:
            print(f"   ✅ مذاکره جدید ایجاد شد (ID: {negotiation.id})")
        else:
            print(f"   ℹ️ مذاکره موجود (ID: {negotiation.id})")
        
        # ایجاد قرارداد
        contract, contract_created = Contract.objects.get_or_create(
            negotiation=negotiation,
            buyer=config['buyer'],
            supplier=config['supplier'],
            defaults={
                'status': config['contract_status'],
                'total_value': config['total_value'],
                'signed_at': config['signed_at'],
                'terms': f"""
قرارداد همکاری بین {config['buyer'].get_full_name()} و {config['supplier'].get_full_name()}

موضوع: {need.title}

شرح: {need.description}

مبلغ قرارداد: {format(config['total_value'], ',')} تومان

تاریخ امضا: {config['signed_at'].strftime('%Y-%m-%d') if config['signed_at'] else 'در انتظار امضا'}

شرایط: این قرارداد بر اساس نیاز ثبت شده در سامانه و عرضه ارائه شده تنظیم شده است.
                """,
            }
        )
        
        if contract_created:
            print(f"   ✅ قرارداد جدید ایجاد شد (ID: {contract.id})")
            created_count += 1
        else:
            print(f"   ℹ️ قرارداد موجود (ID: {contract.id})")
        
        # ایجاد Execution
        execution, exec_created = Execution.objects.get_or_create(
            contract=contract,
            defaults={
                'status': config['execution_status'],
                'progress_percent': config['progress_percent'],
                'start_date': config['start_date'].date() if hasattr(config['start_date'], 'date') else config['start_date'],
                'expected_end_date': config['expected_end_date'].date() if hasattr(config['expected_end_date'], 'date') else config['expected_end_date'],
                'actual_end_date': config['actual_end_date'].date() if config['actual_end_date'] and hasattr(config['actual_end_date'], 'date') else config['actual_end_date'],
                'final_score': config['final_score'],
                'notes': f'اجرای قرارداد {contract.id} - وضعیت: {config["execution_status"]}',
            }
        )
        if exec_created:
            print(f"   ✅ اجرا ایجاد شد (ID: {execution.id}, پیشرفت: {config['progress_percent']}%)")
        else:
            print(f"   ℹ️ اجرا موجود (ID: {execution.id})")
        
        # ایجاد نقاط عطف
        milestone_count = 0
        for m_data in config['milestones']:
            milestone, m_created = Milestone.objects.get_or_create(
                contract=contract,
                title=m_data['title'],
                defaults={
                    'status': m_data['status'],
                    'due_date': m_data['due_date'].date() if hasattr(m_data['due_date'], 'date') else m_data['due_date'],
                    'completed_at': m_data['completed_at'] if m_data.get('completed_at') else None,
                    'description': f'نقطه عطف {m_data["title"]} برای قرارداد {contract.id}',
                }
            )
            if m_created:
                milestone_count += 1
        
        if milestone_count > 0:
            print(f"   ✅ {milestone_count} نقطه عطف جدید ایجاد شد")
        elif config['milestones']:
            print(f"   ℹ️ نقاط عطف موجود هستند")

    # ============================================================
    # 5. خلاصه نهایی
    # ============================================================
    
    print("\n" + "=" * 70)
    print("📊 خلاصه نهایی قراردادها")
    print("=" * 70)
    
    print(f"\n📋 مجموع قراردادها: {Contract.objects.count()}")
    print(f"📌 مجموع نقاط عطف: {Milestone.objects.count()}")
    print(f"⚙️ مجموع اجراها: {Execution.objects.count()}")
    
    print("\n📋 لیست قراردادها:")
    for contract in Contract.objects.all().order_by('id'):
        print(f"\n  🔹 قرارداد #{contract.id}")
        print(f"     خریدار: {contract.buyer.get_full_name() or contract.buyer.username} (ID: {contract.buyer.id})")
        print(f"     فروشنده: {contract.supplier.get_full_name() or contract.supplier.username} (ID: {contract.supplier.id})")
        print(f"     وضعیت: {contract.status}")
        print(f"     مبلغ: {format(int(contract.total_value or 0), ',')} تومان")
        if contract.signed_at:
            print(f"     امضا: {contract.signed_at.strftime('%Y-%m-%d')}")
        
        # نمایش نقاط عطف
        milestones = Milestone.objects.filter(contract=contract)
        if milestones:
            completed = milestones.filter(status='completed').count()
            total = milestones.count()
            print(f"     نقاط عطف: {completed}/{total} تکمیل شده")
            for m in milestones:
                status_emoji = '✅' if m.status == 'completed' else '⚠️' if m.status == 'needs_revision' else '⏳' if m.status == 'in_progress' else '📝'
                print(f"        {status_emoji} {m.title} - {m.status}")
    
    print("\n" + "=" * 70)
    print("✅ همه قراردادها با موفقیت ایجاد شدند!")
    print("\n📊 وضعیت قراردادها:")
    print("  - قراردادهای completed: 3 عدد (با سناریوهای مختلف)")
    print("  - قراردادهای execution: 1 عدد (در حال اجرا)")
    print("  - قراردادهای signed: 2 عدد (امضا شده)")
    print("  - قراردادهای draft: 1 عدد (پیش‌نویس)")
    print("\n👤 کاربران درگیر:")
    print("  - azadeh (ID: {})".format(azadeh.id))
    print("  - azadeh123 (ID: {})".format(azadeh123.id))
    print("=" * 70)

if __name__ == "__main__":
    create_contracts()