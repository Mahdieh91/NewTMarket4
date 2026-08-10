# admin.py
from django.contrib import admin
from .models import Message

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['subject', 'sender', 'receiver', 'is_read', 'is_archived', 'created_at']
    list_filter = ['is_read', 'is_archived']
    search_fields = ['subject', 'content', 'sender__username', 'receiver__username']
    raw_id_fields = ['receiver']          # انتخاب گیرنده با جستجو
    fields = ['receiver', 'subject', 'content']   # sender را مخفی می‌کنیم
    readonly_fields = ['created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        if not change:                     # فقط هنگام ایجاد پیام جدید
            obj.sender = request.user      # sender = ادمین فعلی
        super().save_model(request, obj, form, change)