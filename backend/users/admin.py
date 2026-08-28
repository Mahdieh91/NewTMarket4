from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    list_display = (
        'username', 'email', 'role', 'approval_status', 'kyc_status', 'is_active'
    )
    list_filter = (
        'approval_status', 'role', 'kyc_status', 'is_active'
    )
    fieldsets = UserAdmin.fieldsets + (
        ('وضعیت تأیید', {'fields': ('approval_status',)}),
    )

admin.site.register(User, CustomUserAdmin)