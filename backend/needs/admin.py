# needs/admin.py
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
    list_filter = ('status', 'industry', 'confidentiality', 'created_at')
    search_fields = (
        'title',
        'description',
        'expected_outcome',
        'buyer__username',
        'buyer__email',
        'buyer__company_name',
    )
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    list_per_page = 25
    actions = ['close_selected', 'reopen_selected']

    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('title', 'buyer', 'industry')
        }),
        ('شرح و خروجی', {
            'fields': ('description', 'current_status', 'expected_outcome', 'constraints')
        }),
        ('بودجه و زمان', {
            'fields': ('budget', 'timeline')
        }),
        ('وضعیت و محرمانگی', {
            'fields': ('status', 'confidentiality', 'evaluation_criteria')
        }),
        ('اطلاعات زمانی', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def buyer_username(self, obj):
        return obj.buyer.username if obj.buyer else '—'
    buyer_username.short_description = 'ثبت‌کننده'
    buyer_username.admin_order_field = 'buyer__username'

    def budget_display(self, obj):
        if obj.budget:
            return f'{int(obj.budget):,} تومان'
        return '—'
    budget_display.short_description = 'بودجه'

    def created_at_short(self, obj):
        return obj.created_at.strftime('%Y/%m/%d %H:%M')
    created_at_short.short_description = 'تاریخ ایجاد'

    def status_badge(self, obj):
        colors = {
            'draft': '#6C757D', 'published': '#1E3A8A', 'private': '#17A2B8',
            'receiving_proposals': '#FFC107', 'evaluating': '#FD7E14',
            'matched': '#28A745', 'in_negotiation': '#6F42C1',
            'contracted': '#20C997', 'executing': '#007BFF', 'closed': '#6C757D',
        }
        labels = {
            'draft': 'پیش‌نویس', 'published': 'منتشر شده', 'private': 'خصوصی',
            'receiving_proposals': 'دریافت پیشنهاد', 'evaluating': 'در حال ارزیابی',
            'matched': 'تطبیق داده شده', 'in_negotiation': 'در حال مذاکره',
            'contracted': 'تبدیل به قرارداد', 'executing': 'در حال اجرا',
            'closed': 'بسته شده',
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            colors.get(obj.status, '#6C757D'),
            labels.get(obj.status, obj.status)
        )
    status_badge.short_description = 'وضعیت'

    @admin.action(description='بستن نیازهای انتخاب‌شده')
    def close_selected(self, request, queryset):
        updated = queryset.update(status='closed')
        self.message_user(request, f'{updated} نیاز با موفقیت بسته شد.')

    @admin.action(description='بازگشایی نیازهای انتخاب‌شده')
    def reopen_selected(self, request, queryset):
        updated = queryset.update(status='published')
        self.message_user(request, f'{updated} نیاز با موفقیت بازگشایی شد.')