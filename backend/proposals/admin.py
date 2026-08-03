# proposals/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Proposal


@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'title',
        'need_title',
        'sender_username',
        'price_display',
        'status_badge',
        'file_link',
        'created_at_short',
    )
    list_filter = ('status', 'need__industry', 'created_at')
    search_fields = (
        'title',
        'technical_description',
        'terms',
        'sender__username',
        'sender__email',
        'need__title',
    )
    readonly_fields = ('created_at', 'updated_at', 'file_preview', 'file_info')
    ordering = ('-created_at',)
    list_per_page = 25
    actions = ['approve_selected', 'reject_selected']

    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('need', 'supply', 'sender', 'title')
        }),
        ('جزئیات پیشنهاد', {
            'fields': ('technical_description', 'price', 'delivery_time', 'terms')
        }),
        ('فایل پروپوزال', {
            'fields': ('file', 'file_preview', 'file_info')
        }),
        ('وضعیت', {
            'fields': ('status',)
        }),
        ('اطلاعات زمانی', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def need_title(self, obj):
        return obj.need.title if obj.need else '—'
    need_title.short_description = 'نیاز'
    need_title.admin_order_field = 'need__title'

    def sender_username(self, obj):
        return obj.sender.username if obj.sender else '—'
    sender_username.short_description = 'فرستنده'
    sender_username.admin_order_field = 'sender__username'

    def price_display(self, obj):
        if obj.price:
            return f'{int(obj.price):,} تومان'
        return '—'
    price_display.short_description = 'قیمت'

    def created_at_short(self, obj):
        return obj.created_at.strftime('%Y/%m/%d %H:%M')
    created_at_short.short_description = 'تاریخ ایجاد'

    def status_badge(self, obj):
        colors = {
            'draft': '#6C757D',
            'sent': '#17A2B8',
            'under_review': '#FFC107',
            'accepted': '#28A745',
            'rejected': '#DC3545',
        }
        labels = {
            'draft': 'پیش‌نویس',
            'sent': 'ارسال شده',
            'under_review': 'در حال بررسی',
            'accepted': 'پذیرفته شده',
            'rejected': 'رد شده',
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            colors.get(obj.status, '#6C757D'),
            labels.get(obj.status, obj.status)
        )
    status_badge.short_description = 'وضعیت'

    def file_link(self, obj):
        if obj.file:
            url = reverse('admin:proposals_proposal_change', args=[obj.id])
            return format_html(
                '<a href="{}" target="_blank" style="color: #1E3A8A;">📄 {} ({})</a>',
                obj.file.url,
                obj.file.name.split('/')[-1],
                obj.file_size_mb()
            )
        return 'بدون فایل'
    file_link.short_description = 'فایل'

    def file_preview(self, obj):
        if obj.file:
            ext = obj.file_extension()
            icon = '📄'
            if ext == '.pdf':
                icon = '📕'
            elif ext in ['.docx', '.doc']:
                icon = '📘'
            elif ext == '.tex':
                icon = '📐'

            return format_html(
                '<div style="padding: 10px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;">'
                '<div style="font-size: 40px; text-align: center;">{}</div>'
                '<div style="text-align: center; margin-top: 5px;">'
                '<a href="{}" target="_blank" class="button" style="background: #1E3A8A; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; margin: 2px;">دانلود</a>'
                '<span style="margin: 0 5px;">|</span>'
                '<span style="color: #6c757d; font-size: 12px;">{} ({})</span>'
                '</div>'
                '</div>',
                icon,
                obj.file.url,
                obj.file.name.split('/')[-1],
                f'{obj.file_size_mb()} MB'
            )
        return 'فایلی وجود ندارد'
    file_preview.short_description = 'پیش‌نمایش فایل'

    def file_info(self, obj):
        if obj.file:
            ext = obj.file_extension()
            ext_names = {
                '.pdf': 'PDF',
                '.docx': 'Word',
                '.doc': 'Word',
                '.tex': 'LaTeX'
            }
            return format_html(
                '<div style="font-size: 12px; color: #6c757d;">'
                '<p><strong>نوع فایل:</strong> {}</p>'
                '<p><strong>اندازه:</strong> {} MB</p>'
                '<p><strong>مسیر:</strong> {}</p>'
                '</div>',
                ext_names.get(ext, ext),
                obj.file_size_mb(),
                obj.file.path
            )
        return 'فایلی آپلود نشده است'
    file_info.short_description = 'اطلاعات فایل'

    @admin.action(description='پذیرش پروپوزال‌های انتخاب‌شده')
    def approve_selected(self, request, queryset):
        updated = queryset.update(status='accepted')
        self.message_user(request, f'{updated} پروپوزال با موفقیت پذیرفته شد.')

    @admin.action(description='رد پروپوزال‌های انتخاب‌شده')
    def reject_selected(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} پروپوزال با موفقیت رد شد.')