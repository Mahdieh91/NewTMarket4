# products/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse  # ← اضافه کردن این خط
from .models import Supply, SupplyImage


class SupplyImageInline(admin.TabularInline):
    model = SupplyImage
    extra = 1
    fields = ('image', 'caption', 'image_preview')
    readonly_fields = ('image_preview',)
    max_num = 10

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<a href="{}" target="_blank" download><img src="{}" style="max-height: 80px; border-radius: 4px; margin: 2px; border: 1px solid #ddd;" /></a>',
                obj.image.url,
                obj.image.url
            )
        return 'بدون تصویر'
    image_preview.short_description = 'پیش‌نمایش (قابل کلیک)'


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
        'thumbnail_preview',
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

    def thumbnail_preview(self, obj):
        first_image = obj.images.first()
        if first_image and first_image.image:
            return format_html(
                '<a href="{}" target="_blank" download><img src="{}" style="max-height: 50px; max-width: 50px; border-radius: 6px; object-fit: cover; border: 1px solid #ddd;" /></a>',
                first_image.image.url,
                first_image.image.url
            )
        return '—'
    thumbnail_preview.short_description = 'تصویر (قابل کلیک)'

    def image_count(self, obj):
        count = obj.images.count()
        return f'{count} تصویر'
    image_count.short_description = 'تعداد تصاویر'

    def images_preview(self, obj):
        images = obj.images.all()
        if images.exists():
            html = '<div style="display: flex; flex-wrap: wrap; gap: 8px;">'
            for img in images[:6]:
                html += f'<a href="{img.image.url}" target="_blank" download><img src="{img.image.url}" style="max-height: 80px; max-width: 80px; border-radius: 6px; object-fit: cover; border: 1px solid #ddd;" /></a>'
            if images.count() > 6:
                html += f'<span style="display: flex; align-items: center; font-size: 12px; color: #666;">+{images.count() - 6} تصویر دیگر</span>'
            html += '</div>'
            return format_html(html)
        return 'بدون تصویر'
    images_preview.short_description = 'پیش‌نمایش تصاویر (قابل کلیک)'

    @admin.action(description='تأیید عرضه‌های انتخاب‌شده')
    def approve_selected(self, request, queryset):
        updated = queryset.update(status='approved')
        self.message_user(request, f'{updated} عرضه با موفقیت تأیید شد.')

    @admin.action(description='رد عرضه‌های انتخاب‌شده')
    def reject_selected(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} عرضه با موفقیت رد شد.')


# ============================================================
# ادمین تصاویر عرضه (SupplyImage) – نمایش id عرضه و عنوان
# ============================================================
@admin.register(SupplyImage)
class SupplyImageAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'supply_link',           # ← لینک به عرضه با نمایش id و عنوان
        'image_preview',
        'caption',
        'uploaded_at',
    )
    list_filter = ('uploaded_at',)
    search_fields = ('supply__title', 'caption', 'supply__id')
    raw_id_fields = ('supply',)
    readonly_fields = ('image_preview',)

    def supply_link(self, obj):
        # نمایش id عرضه به همراه عنوان و لینک به صفحه ویرایش عرضه
        if obj.supply:
            # استفاده از reverse برای ساخت لینک ادمین
            change_url = reverse(
                f'admin:{obj.supply._meta.app_label}_{obj.supply._meta.model_name}_change',
                args=[obj.supply.id]
            )
            return format_html(
                '<a href="{}" target="_blank">#{} - {}</a>',
                change_url,
                obj.supply.id,
                obj.supply.title
            )
        return '—'
    supply_link.short_description = 'عرضه (ID / عنوان)'
    supply_link.admin_order_field = 'supply__id'   # قابلیت مرتب‌سازی بر اساس id

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<a href="{}" target="_blank" download><img src="{}" style="max-height: 100px; border-radius: 6px; border: 1px solid #ddd;" /></a>',
                obj.image.url,
                obj.image.url
            )
        return 'بدون تصویر'
    image_preview.short_description = 'پیش‌نمایش (قابل کلیک و دانلود)'