# seed_negotiations.py
# ایجاد Negotiation برای قراردادهای موجود و اتصال آن‌ها به قراردادها
# تا API داشبورد بتواند آمار معاملات را محاسبه کند

import os
import django
from datetime import timedelta
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from contracts.models import Contract
from negotiations.models import Negotiation  # فرض بر این است که اپ negotiations وجود دارد
from products.models import Supply
from needs.models import Need

User = get_user_model()

def get_or_create_negotiation(contract):
    """
    برای یک قرارداد، یک Negotiation ایجاد یا دریافت می‌کند.
    وضعیت Negotiation را بر اساس وضعیت قرارداد تنظیم می‌کند.
    """
    # بررسی اینکه آیا قبلاً Negotiation وجود دارد
    if hasattr(contract, 'negotiation') and contract.negotiation:
        print(f"   ℹ️ قرارداد #{contract.id} قبلاً Negotiation دارد (ID: {contract.negotiation.id})")
        return contract.negotiation

    # پیدا کردن Supply و Need مرتبط با قرارداد (اگر وجود داشته باشد)
    # در غیر این صورت، از مقادیر پیش‌فرض استفاده می‌کنیم
    supply = None
    need = None

    # اگر مدل Contract دارای فیلدهای supply و need باشد
    if hasattr(contract, 'supply') and contract.supply:
        supply = contract.supply
    if hasattr(contract, 'need') and contract.need:
        need = contract.need

    # اگر supply و need وجود نداشت، از اولین Supply و Need کاربر استفاده می‌کنیم
    if not supply:
        supply = Supply.objects.filter(seller=contract.supplier).first()
    if not need:
        need = Need.objects.filter(buyer=contract.buyer).first()

    # اگر باز هم پیدا نشد، یک Supply و Need ساختگی ایجاد می‌کنیم (فقط برای نمایش)
    if not supply:
        supply, _ = Supply.objects.get_or_create(
            seller=contract.supplier,
            title=f"عرضه پیش‌فرض برای قرارداد {contract.id}",
            defaults={
                'supply_type': 'product',
                'category': 'سایر',
                'industry': None,
                'technology': 'سایر',
                'city': 'تهران',
                'description': 'عرضه خودکار برای قرارداد',
                'price': Decimal('100000000'),
                'status': 'published',
            }
        )
    if not need:
        need, _ = Need.objects.get_or_create(
            buyer=contract.buyer,
            title=f"نیاز پیش‌فرض برای قرارداد {contract.id}",
            defaults={
                'description': 'نیاز خودکار برای قرارداد',
                'industry': None,
                'status': 'published',
            }
        )

    # تعیین وضعیت Negotiation بر اساس وضعیت قرارداد
    status_map = {
        'draft': 'draft',
        'signed': 'accepted',
        'execution': 'in_progress',
        'completed': 'contracted',
        'disputed': 'disputed',
    }
    neg_status = status_map.get(contract.status, 'draft')

    # ایجاد Negotiation
    negotiation = Negotiation.objects.create(
        supply=supply,
        buyer=contract.buyer,
        supplier=contract.supplier,
        status=neg_status,
        context_title=need.title,
        context_meta={'contract_id': contract.id, 'need_id': need.id, 'supply_id': supply.id},
        is_active=contract.status not in ['completed', 'disputed'],
        created_at=contract.signed_at or timezone.now() - timedelta(days=30),
    )

    # اتصال Negotiation به قرارداد
    contract.negotiation = negotiation
    contract.save(update_fields=['negotiation'])

    print(f"   ✅ Negotiation #{negotiation.id} برای قرارداد #{contract.id} ایجاد شد (وضعیت: {neg_status})")
    return negotiation

def main():
    print("=" * 80)
    print("🔄 شروع ایجاد Negotiation برای قراردادهای موجود")
    print("=" * 80)

    contracts = Contract.objects.all()
    if not contracts.exists():
        print("⚠️ هیچ قراردادی در دیتابیس یافت نشد. لطفاً ابتدا اسکریپت‌های seed را اجرا کنید.")
        return

    print(f"📄 تعداد قراردادهای یافت‌شده: {contracts.count()}")

    for contract in contracts:
        print(f"\n📝 قرارداد #{contract.id} (وضعیت: {contract.status})")
        get_or_create_negotiation(contract)

    # خلاصه
    print("\n" + "=" * 80)
    print("📊 خلاصه")
    print("=" * 80)
    print(f"📄 تعداد کل قراردادها: {Contract.objects.count()}")
    print(f"💬 تعداد کل Negotiation‌ها: {Negotiation.objects.count()}")
    print(f"🔗 قراردادهای دارای Negotiation: {Contract.objects.filter(negotiation__isnull=False).count()}")

    print("\n✅ اسکریپت با موفقیت اجرا شد!")
    print("اکنون به داشبورد بروید و بروزرسانی کنید.")

if __name__ == "__main__":
    main()