# fix_dashboard_data.py
# به‌روزرسانی وضعیت‌ها برای نمایش در داشبورد

import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from contracts.models import Contract
from execution.models import Execution
from negotiations.models import Negotiation
from django.utils import timezone

def fix_statuses():
    print("🔧 به‌روزرسانی وضعیت‌ها برای داشبورد...")

    # قراردادهای تکمیل شده
    completed_contracts = Contract.objects.filter(status='completed')
    for contract in completed_contracts:
        if hasattr(contract, 'negotiation') and contract.negotiation:
            contract.negotiation.status = 'contracted'
            contract.negotiation.is_active = False
            contract.negotiation.save()
            print(f"✅ Negotiation #{contract.negotiation.id} به 'contracted' تغییر یافت")

    # قراردادهای در حال اجرا
    execution_contracts = Contract.objects.filter(status='execution')
    for contract in execution_contracts:
        if hasattr(contract, 'negotiation') and contract.negotiation:
            contract.negotiation.status = 'in_progress'
            contract.negotiation.is_active = True
            contract.negotiation.save()
            print(f"✅ Negotiation #{contract.negotiation.id} به 'in_progress' تغییر یافت")

    # ایجاد Execution برای قراردادهایی که ندارند
    for contract in Contract.objects.all():
        execution = Execution.objects.filter(contract=contract).first()
        if not execution:
            Execution.objects.create(
                contract=contract,
                status='not_started',
                progress_percent=0,
                start_date=timezone.now(),
                expected_end_date=timezone.now() + timezone.timedelta(days=90),
            )
            print(f"✅ Execution برای قرارداد #{contract.id} ایجاد شد")

    print("✅ به‌روزرسانی کامل شد.")
    print(f"📊 تعداد قراردادها: {Contract.objects.count()}")
    print(f"📊 تعداد Negotiation‌ها: {Negotiation.objects.count()}")
    print(f"📊 تعداد Execution‌ها: {Execution.objects.count()}")

if __name__ == "__main__":
    fix_statuses()