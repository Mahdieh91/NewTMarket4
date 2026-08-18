# backend/execution/serializers.py

from rest_framework import serializers

from .models import Execution
from contracts.serializers import MilestoneSerializer


class ExecutionSerializer(serializers.ModelSerializer):
    contract_title = serializers.SerializerMethodField()
    buyer_name = serializers.SerializerMethodField()
    supplier_name = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()

    milestones = serializers.SerializerMethodField()

    completed_milestones = serializers.SerializerMethodField()
    total_milestones = serializers.SerializerMethodField()

    class Meta:
        model = Execution

        fields = [
            'id',
            'contract',
            'contract_title',

            'status',
            'progress_percent',

            'start_date',
            'expected_end_date',
            'actual_end_date',

            'final_score',
            'notes',

            'total_amount',
            'buyer_name',
            'supplier_name',

            'completed_milestones',
            'total_milestones',
            'milestones',

            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'contract_title',
            'buyer_name',
            'supplier_name',
            'total_amount',
            'completed_milestones',
            'total_milestones',
            'milestones',
            'created_at',
            'updated_at',
        ]

    def get_contract_title(self, obj):
        """
        Contract مدل فیلد title ندارد.
        بنابراین عنوان ساختگی تولید نمی‌کنیم.

        اگر terms وجود داشته باشد، HTML آن را برنمی‌گردانیم
        و صرفاً یک متن قابل نمایش تولید می‌کنیم.
        """

        contract = getattr(obj, 'contract', None)

        if not contract:
            return f'قرارداد #{obj.contract_id}'

        terms = contract.terms or ''

        if not terms:
            return f'قرارداد #{contract.id}'

        return terms[:120]

    def get_buyer_name(self, obj):
        contract = getattr(obj, 'contract', None)

        if not contract or not contract.buyer:
            return ''

        buyer = contract.buyer

        full_name = (
            f'{buyer.first_name or ""} '
            f'{buyer.last_name or ""}'
        ).strip()

        if full_name:
            return full_name

        if getattr(buyer, 'company_name', None):
            return buyer.company_name

        return getattr(
            buyer,
            'username',
            ''
        )

    def get_supplier_name(self, obj):
        contract = getattr(obj, 'contract', None)

        if not contract or not contract.supplier:
            return ''

        supplier = contract.supplier

        full_name = (
            f'{supplier.first_name or ""} '
            f'{supplier.last_name or ""}'
        ).strip()

        if full_name:
            return full_name

        if getattr(supplier, 'company_name', None):
            return supplier.company_name

        return getattr(
            supplier,
            'username',
            ''
        )

    def get_total_amount(self, obj):
        contract = getattr(obj, 'contract', None)

        if not contract:
            return None

        return contract.total_value

    def get_milestones(self, obj):
        milestones = obj.contract.milestones.all()

        return MilestoneSerializer(
            milestones,
            many=True,
            context=self.context,
        ).data

    def get_completed_milestones(self, obj):
        return obj.contract.milestones.filter(
            status='completed'
        ).count()

    def get_total_milestones(self, obj):
        return obj.contract.milestones.count()