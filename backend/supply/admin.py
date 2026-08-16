from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Supply, SupplyImage
import json


class SupplyImageInline(admin.TabularInline):
    model = SupplyImage
    extra = 1
    fields = ('image', 'caption', 'image_preview')
    readonly_fields = ('image_preview',)
    max_num = 10

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<a href="{}" target="_blank" download style="display: inline-block; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s;" '
                'onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'">'
                '<img src="{}" style="max-height: 80px; border-radius: 4px; display: block;" />'
                '</a>',
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
        'documents_count',
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
    readonly_fields = (
        'seller', 'created_at', 'updated_at',
        'images_preview', 'documents_preview', 'documents_raw'
    )
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
        ('مستندات', {
            'fields': ('documents_preview', 'documents_raw'),
            'classes': ('collapse',),
        }),
        ('تصاویر', {
            'fields': ('images_preview',),
            'classes': ('collapse',),
        }),
        ('وضعیت', {
            'fields': ('status', 'seller'),
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
        colors = {
            'pending': '#FFA500',
            'approved': '#28A745',
            'rejected': '#DC3545',
            'draft': '#6C757D',
            'submitted': '#17A2B8',
            'evaluating': '#6F42C1',
            'needs_revision': '#FD7E14',
            'published': '#28A745',
            'suspended': '#DC3545'
        }
        labels = {
            'pending': 'در انتظار بررسی',
            'approved': 'تأیید شده',
            'rejected': 'رد شده',
            'draft': 'پیش‌نویس',
            'submitted': 'ارسال شده',
            'evaluating': 'در حال ارزیابی',
            'needs_revision': 'نیازمند اصلاح',
            'published': 'منتشر شده',
            'suspended': 'تعلیق شده'
        }
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
                '<a href="{}" target="_blank" download style="display: inline-block; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">'
                '<img src="{}" style="max-height: 50px; max-width: 50px; object-fit: cover; display: block;" />'
                '</a>',
                first_image.image.url,
                first_image.image.url
            )
        return '—'
    thumbnail_preview.short_description = 'تصویر (قابل کلیک)'

    def image_count(self, obj):
        count = obj.images.count()
        return f'{count} تصویر'
    image_count.short_description = 'تعداد تصاویر'

    # ============================================================
    # متدهای مستندات با آیکون‌های زیبا
    # ============================================================

    def documents_count(self, obj):
        docs = getattr(obj, 'documents', None)
        if isinstance(docs, list):
            count = len(docs)
        else:
            count = 0
        if count:
            return format_html('<span style="font-weight: bold; color: #0d6efd;">📄 {}</span>', count)
        return 'بدون مستند'
    documents_count.short_description = 'تعداد مستندات'

    def documents_preview(self, obj):
        docs = getattr(obj, 'documents', None)
        if not isinstance(docs, list):
            docs = []
        if not docs:
            return format_html(
                '<div style="color: #6c757d; font-style: italic; padding: 8px; background: #f8f9fa; border-radius: 6px; text-align: center;">'
                '📭 هیچ مستندی بارگذاری نشده است'
                '</div>'
            )

        html = '<div style="display: flex; flex-direction: column; gap: 8px; padding: 4px 0;">'
        for url in docs:
            filename = url.split('/')[-1] if '/' in url else url
            ext = filename.split('.')[-1].lower() if '.' in filename else ''
            icon = '📄'
            if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']:
                icon = '🖼️'
            elif ext in ['pdf']:
                icon = '📕'
            elif ext in ['doc', 'docx']:
                icon = '📝'
            elif ext in ['xls', 'xlsx']:
                icon = '📊'
            elif ext in ['zip', 'rar', '7z']:
                icon = '📦'
            elif ext in ['mp4', 'avi', 'mkv']:
                icon = '🎬'
            elif ext in ['mp3', 'wav']:
                icon = '🎵'

            html += f'''
                <div style="display: flex; align-items: center; gap: 10px; 
                            background: #f8f9fa; padding: 8px 12px; border-radius: 8px;
                            border: 1px solid #e9ecef;">
                    <span style="font-size: 20px; line-height: 1;">{icon}</span>
                    <span style="flex: 1; font-size: 13px; color: #212529; font-weight: 500; direction: ltr; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        {filename}
                    </span>
                    <a href="{url}" target="_blank" download="{filename}" 
                       style="display: inline-flex; align-items: center; gap: 6px;
                              background: linear-gradient(135deg, #0d6efd, #0a58ca);
                              color: white; text-decoration: none; font-size: 12px;
                              padding: 6px 14px; border-radius: 20px;
                              font-weight: 600; box-shadow: 0 2px 8px rgba(13,110,253,0.3);">
                        ⬇️ دانلود
                    </a>
                </div>
            '''
        html += '</div>'
        return format_html(html)
    documents_preview.short_description = 'مستندات (قابل کلیک و دانلود)'

    def documents_raw(self, obj):
        docs = getattr(obj, 'documents', None)
        if docs:
            try:
                pretty = json.dumps(docs, indent=2, ensure_ascii=False)
                return format_html(
                    '<pre style="background: #f5f5f5; padding: 10px; border-radius: 6px; max-height: 200px; overflow: auto; border: 1px solid #ddd; font-size: 12px;">{}</pre>',
                    pretty
                )
            except:
                return str(docs)
        return format_html(
            '<span style="color: #6c757d; font-style: italic;">📭 خالی (لیست مستندات خالی است)</span>'
        )
    documents_raw.short_description = 'محتویات خام documents (JSON)'

    def images_preview(self, obj):
        images = obj.images.all()
        if not images.exists():
            return 'بدون تصویر'
        html = '<div style="display: flex; flex-wrap: wrap; gap: 8px;">'
        for img in images[:6]:
            html += f'''
                <a href="{img.image.url}" target="_blank" download 
                   style="display: inline-block; border-radius: 8px; overflow: hidden; 
                          box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s;">
                    <img src="{img.image.url}" style="max-height: 80px; max-width: 80px; object-fit: cover; display: block;" />
                </a>
            '''
        if images.count() > 6:
            html += f'<span style="display: flex; align-items: center; font-size: 12px; color: #666; padding: 0 8px;">+{images.count() - 6} تصویر دیگر</span>'
        html += '</div>'
        return format_html(html)
    images_preview.short_description = 'پیش‌نمایش تصاویر (قابل کلیک)'

    @admin.action(description='تأیید عرضه‌های انتخاب‌شده')
    def approve_selected(self, request, queryset):
        updated = queryset.update(status='approved')
        self.message_user(request, f'{updated} عرضه با موفقیت تأیید شد.')

    @admin.action(description='رد عرضه‌های انتخاب‌شده')
    def reject_selected(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} عرضه با موفقیت رد شد.')


@admin.register(SupplyImage)
class SupplyImageAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'supply_link',
        'image_preview',
        'caption',
        'uploaded_at_short',  # ✅ تغییر
    )
    list_filter = ('uploaded_at',)  # ✅ تغییر (فیلتر یک‌تایی)
    search_fields = ('supply__title', 'caption', 'supply__id')
    raw_id_fields = ('supply',)
    readonly_fields = ('image_preview',)  # ✅ حذف created_at

    def supply_link(self, obj):
        if obj.supply:
            change_url = reverse(
                f'admin:{obj.supply._meta.app_label}_{obj.supply._meta.model_name}_change',
                args=[obj.supply.id]
            )
            return format_html(
                '<a href="{}" target="_blank" style="font-weight: 600; color: #0d6efd;">#{} - {}</a>',
                change_url,
                obj.supply.id,
                obj.supply.title
            )
        return '—'
    supply_link.short_description = 'عرضه (ID / عنوان)'
    supply_link.admin_order_field = 'supply__id'

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<a href="{}" target="_blank" download style="display: inline-block; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">'
                '<img src="{}" style="max-height: 100px; border-radius: 4px; display: block;" />'
                '</a>',
                obj.image.url,
                obj.image.url
            )
        return 'بدون تصویر'
    image_preview.short_description = 'پیش‌نمایش (قابل کلیک و دانلود)'

    def uploaded_at_short(self, obj):
        return obj.uploaded_at.strftime('%Y/%m/%d %H:%M')
    uploaded_at_short.short_description = 'تاریخ آپلود'