# ============================================================
# needs/admin.py
# ============================================================

from django.contrib import admin
from django.utils.html import format_html

from .models import Need


@admin.register(Need)
class NeedAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'title',
        'buyer_username',
        'industry',
        'status_badge',
        'budget_display',
        'timeline',
        'created_at_short',
    )

    list_filter = (
        'status',
        'industry',
        'confidentiality',
        'created_at',
    )

    search_fields = (
        'title',
        'description',
        'expected_outcome',
        'buyer__username',
        'buyer__email',
        'buyer__company_name',
    )

    readonly_fields = (
        'created_at',
        'updated_at',
    )

    ordering = (
        '-created_at',
    )

    list_per_page = 25

    # ========================================================
    # Actions
    # ========================================================

    actions = [
        'publish_selected',
        'start_receiving_proposals',
        'start_evaluation',
        'close_selected',
        'reopen_selected',
    ]

    # ========================================================
    # Fieldsets
    # ========================================================

    fieldsets = (

        (
            'اطلاعات اصلی',
            {
                'fields': (
                    'title',
                    'buyer',
                    'industry',
                )
            }
        ),

        (
            'شرح و خروجی',
            {
                'fields': (
                    'description',
                    'current_status',
                    'expected_outcome',
                    'constraints',
                )
            }
        ),

        (
            'بودجه و زمان',
            {
                'fields': (
                    'budget',
                    'timeline',
                )
            }
        ),

        (
            'وضعیت و انتشار',
            {
                'fields': (
                    'status',
                    'confidentiality',
                    'evaluation_criteria',
                )
            }
        ),

        (
            'اطلاعات زمانی',
            {
                'fields': (
                    'created_at',
                    'updated_at',
                ),
                'classes': (
                    'collapse',
                ),
            }
        ),
    )

    # ========================================================
    # ستون ثبت کننده
    # ========================================================

    @admin.display(
        description='ثبت‌کننده',
        ordering='buyer__username'
    )
    def buyer_username(self, obj):
        if obj.buyer:
            return obj.buyer.username

        return '—'

    # ========================================================
    # نمایش بودجه
    # ========================================================

    @admin.display(
        description='بودجه'
    )
    def budget_display(self, obj):

        if obj.budget is not None:
            return f'{int(obj.budget):,} تومان'

        return '—'

    # ========================================================
    # تاریخ
    # ========================================================

    @admin.display(
        description='تاریخ ایجاد'
    )
    def created_at_short(self, obj):

        if not obj.created_at:
            return '—'

        return obj.created_at.strftime(
            '%Y/%m/%d %H:%M'
        )

    # ========================================================
    # Badge وضعیت
    # ========================================================

    @admin.display(
        description='وضعیت'
    )
    def status_badge(self, obj):

        colors = {
            'draft': '#6C757D',
            'published': '#1E3A8A',
            'private': '#17A2B8',
            'receiving_proposals': '#FFC107',
            'evaluating': '#FD7E14',
            'matched': '#28A745',
            'in_negotiation': '#6F42C1',
            'contracted': '#20C997',
            'executing': '#007BFF',
            'closed': '#6C757D',
        }

        labels = {
            'draft': 'پیش‌نویس',
            'published': 'منتشر شده',
            'private': 'خصوصی',
            'receiving_proposals': 'در حال دریافت پیشنهاد',
            'evaluating': 'در حال ارزیابی',
            'matched': 'تطبیق داده شده',
            'in_negotiation': 'در حال مذاکره',
            'contracted': 'تبدیل به قرارداد',
            'executing': 'در حال اجرا',
            'closed': 'بسته شده',
        }

        color = colors.get(
            obj.status,
            '#6C757D'
        )

        label = labels.get(
            obj.status,
            obj.status
        )

        return format_html(
            '''
            <span style="
                background-color: {};
                color: white;
                padding: 5px 12px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: bold;
                display: inline-block;
                white-space: nowrap;
            ">
                {}
            </span>
            ''',
            color,
            label
        )

    # ========================================================
    # انتشار نیاز
    # draft → published
    # ========================================================

    @admin.action(
        description='انتشار نیازهای انتخاب‌شده'
    )
    def publish_selected(self, request, queryset):

        updated = queryset.filter(
            status='draft'
        ).update(
            status='published'
        )

        self.message_user(
            request,
            f'{updated} نیاز با موفقیت منتشر شد.'
        )

    # ========================================================
    # شروع دریافت پیشنهاد
    # published → receiving_proposals
    # ========================================================

    @admin.action(
        description='فعال‌سازی دریافت پیشنهاد'
    )
    def start_receiving_proposals(
        self,
        request,
        queryset
    ):

        updated = queryset.filter(
            status='published'
        ).update(
            status='receiving_proposals'
        )

        self.message_user(
            request,
            f'{updated} نیاز وارد مرحله دریافت پیشنهاد شد.'
        )

    # ========================================================
    # شروع ارزیابی
    # receiving_proposals → evaluating
    # ========================================================

    @admin.action(
        description='انتقال به مرحله ارزیابی'
    )
    def start_evaluation(
        self,
        request,
        queryset
    ):

        updated = queryset.filter(
            status='receiving_proposals'
        ).update(
            status='evaluating'
        )

        self.message_user(
            request,
            f'{updated} نیاز وارد مرحله ارزیابی شد.'
        )

    # ========================================================
    # بستن نیاز
    # هر وضعیتی → closed
    # ========================================================

    @admin.action(
        description='بستن نیازهای انتخاب‌شده'
    )
    def close_selected(
        self,
        request,
        queryset
    ):

        updated = queryset.exclude(
            status='closed'
        ).update(
            status='closed'
        )

        self.message_user(
            request,
            f'{updated} نیاز با موفقیت بسته شد.'
        )

    # ========================================================
    # بازگشایی
    # closed → published
    # ========================================================

    @admin.action(
        description='بازگشایی نیازهای انتخاب‌شده'
    )
    def reopen_selected(
        self,
        request,
        queryset
    ):

        updated = queryset.filter(
            status='closed'
        ).update(
            status='published'
        )

        self.message_user(
            request,
            f'{updated} نیاز با موفقیت بازگشایی شد.'
        )