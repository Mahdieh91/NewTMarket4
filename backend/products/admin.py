# products/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Product, Supply, SupplyImage


# ============================================================
# Inline برای تصاویر عرضه
# ============================================================
class SupplyImageInline(admin.TabularInline):
    model = SupplyImage
    extra = 1
    fields = ('image', 'caption', 'image_preview')
    readonly_fields = ('image_preview',)
    max_num = 10

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 80px; border-radius: 4px; margin: 2px; border: 1px solid #ddd;" />',
                obj.image.url
            )
        return 'بدون تصویر'
    image_preview.short_description = 'پیش‌نمایش'


# ============================================================
# ادمین محصولات (Product)
# ============================================================
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'title',
        'seller_username',
        'category',
        'status_badge',
        'trl',
        'price_display',
        'view_count',
        'created_at_short',
    )
    list_filter = ('status', 'category', 'industry', 'trl', 'mrl', 'created_at')
    search_fields = (
        'title',
        'short_description',
        'full_description',
        'problem_solved',
        'seller__username',
        'seller__email',
        'seller__company_name',
    )
    readonly_fields = ('view_count', 'created_at', 'updated_at', 'image_preview')
    ordering = ('-created_at',)
    list_per_page = 25
    actions = ['publish_selected', 'suspend_selected']

    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('title', 'seller', 'category', 'industry')
        }),
        ('توضیحات و مشخصات', {
            'fields': ('short_description', 'full_description', 'problem_solved',
                       'competitive_advantage', 'technical_specs')
        }),
        ('سطح آمادگی و قیمت', {
            'fields': ('trl', 'mrl', 'pricing_model', 'price')
        }),
        ('وضعیت و مستندات', {
            'fields': ('status', 'image', 'image_preview', 'video', 'documentation',
                       'certificates', 'ip_status', 'capacity', 'collaboration_terms',
                       'sample_customers')
        }),
        ('اطلاعات زمانی', {
            'fields': ('view_count', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def seller_username(self, obj):
        return obj.seller.username if obj.seller else '—'
    seller_username.short_description = 'فروشنده'
    seller_username.admin_order_field = 'seller__username'

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
            'draft': '#6C757D', 'submitted': '#17A2B8', 'evaluating': '#FFC107',
            'needs_revision': '#FD7E14', 'approved': '#28A745', 'published': '#1E3A8A',
            'suspended': '#DC3545', 'in_negotiation': '#6F42C1', 'contracted': '#20C997',
            'executing': '#007BFF', 'completed': '#28A745',
        }
        labels = {
            'draft': 'پیش‌نویس', 'submitted': 'ارسال شده', 'evaluating': 'در حال ارزیابی',
            'needs_revision': 'نیازمند اصلاح', 'approved': 'تأیید شده', 'published': 'منتشر شده',
            'suspended': 'تعلیق شده', 'in_negotiation': 'در حال مذاکره',
            'contracted': 'قرارداد بسته شده', 'executing': 'در حال اجرا', 'completed': 'تکمیل شده',
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            colors.get(obj.status, '#6C757D'),
            labels.get(obj.status, obj.status)
        )
    status_badge.short_description = 'وضعیت'

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 150px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />',
                obj.image.url
            )
        return 'تصویری وجود ندارد'
    image_preview.short_description = 'پیش‌نمایش تصویر'

    @admin.action(description='انتشار محصولات انتخاب‌شده')
    def publish_selected(self, request, queryset):
        updated = queryset.update(status='published')
        self.message_user(request, f'{updated} محصول با موفقیت منتشر شد.')

    @admin.action(description='تعلیق محصولات انتخاب‌شده')
    def suspend_selected(self, request, queryset):
        updated = queryset.update(status='suspended')
        self.message_user(request, f'{updated} محصول با موفقیت تعلیق شد.')


# ============================================================
# ادمین عرضه‌ها (Supply)
# ============================================================
@admin.register(Supply)
class SupplyAdmin(admin.ModelAdmin):
    inlines = [SupplyImageInline]
    list_display = (
        'id',
        'title',
        'seller_username',
        'category',
        'industry',
        'city',
        'price_display',
        'status_badge',
        'image_count',
        'created_at_short',
    )
    list_filter = ('status', 'category', 'industry', 'city', 'created_at')
    search_fields = (
        'title',
        'description',
        'seller__username',
        'seller__email',
        'seller__company_name',
        'category',
        'industry',
        'city',
    )
    readonly_fields = ('seller', 'created_at', 'updated_at', 'images_preview')
    ordering = ('-created_at',)
    list_per_page = 25
    actions = ['approve_selected', 'reject_selected']

    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('title', 'category', 'industry', 'technology', 'city')
        }),
        ('جزئیات عرضه', {
            'fields': ('description', 'quantity', 'unit', 'price', 'trl')
        }),
        ('وضعیت', {
            'fields': ('status', 'seller'),
            'classes': ('collapse',),
        }),
        ('تصاویر', {
            'fields': ('images_preview',),
            'classes': ('collapse',),
        }),
        ('اطلاعات زمانی', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def seller_username(self, obj):
        return obj.seller.username if obj.seller else '—'
    seller_username.short_description = 'فروشنده'
    seller_username.admin_order_field = 'seller__username'

    def price_display(self, obj):
        if obj.price:
            return f'{int(obj.price):,} تومان'
        return '—'
    price_display.short_description = 'قیمت'

    def created_at_short(self, obj):
        return obj.created_at.strftime('%Y/%m/%d %H:%M')
    created_at_short.short_description = 'تاریخ ایجاد'

    def status_badge(self, obj):
        colors = {'pending': '#FFA500', 'approved': '#28A745', 'rejected': '#DC3545'}
        labels = {'pending': 'در انتظار بررسی', 'approved': 'تأیید شده', 'rejected': 'رد شده'}
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            colors.get(obj.status, '#6C757D'),
            labels.get(obj.status, obj.status)
        )
    status_badge.short_description = 'وضعیت'

    def image_count(self, obj):
        count = obj.images.count()
        return f'{count} تصویر'
    image_count.short_description = 'تعداد تصاویر'

    def images_preview(self, obj):
        images = obj.images.all()
        if images.exists():
            html = '<div style="display: flex; flex-wrap: wrap; gap: 8px;">'
            for img in images[:6]:
                html += f'<img src="{img.image.url}" style="max-height: 80px; max-width: 80px; border-radius: 6px; object-fit: cover; border: 1px solid #ddd;" />'
            if images.count() > 6:
                html += f'<span style="display: flex; align-items: center; font-size: 12px; color: #666;">+{images.count() - 6} تصویر دیگر</span>'
            html += '</div>'
            return format_html(html)
        return 'بدون تصویر'
    images_preview.short_description = 'پیش‌نمایش تصاویر'

    @admin.action(description='تأیید عرضه‌های انتخاب‌شده')
    def approve_selected(self, request, queryset):
        updated = queryset.update(status='approved')
        self.message_user(request, f'{updated} عرضه با موفقیت تأیید شد.')

    @admin.action(description='رد عرضه‌های انتخاب‌شده')
    def reject_selected(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} عرضه با موفقیت رد شد.')