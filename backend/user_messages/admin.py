from django.contrib import admin
from .models import Message

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['subject', 'sender', 'receiver', 'is_read', 'created_at']
    list_filter = ['is_read', 'is_archived']
    search_fields = ['subject', 'content', 'sender__username', 'receiver__username']
    raw_id_fields = ['sender', 'receiver']
