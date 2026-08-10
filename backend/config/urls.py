# config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# ============================================================
# ایمپورت ویو داشبورد (جدید)
# ============================================================
from .views import dashboard_api

# ============================================================
# صفحه اصلی (ریدایرکت به ادمین)
# ============================================================
def home(request):
    return redirect('/admin/')

# ============================================================
# مستندات Swagger
# ============================================================
schema_view = get_schema_view(
    openapi.Info(
        title="بازار تحول - API",
        default_version='v1',
        description="مستندات کامل API پلتفرم بازار تحول - ۲۰ ماژول",
        terms_of_service="https://www.tmarket.ir/terms/",
        contact=openapi.Contact(email="info@tmarket.ir"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

# تغییر عنوان پنل ادمین
admin.site.site_header = "مدیریت پلتفرم بازار تحول"
admin.site.site_title = "مدیریت پلتفرم بازار تحول"
admin.site.index_title = "پنل مدیریت بازار تحول"

# ============================================================
# لیست اصلی URLها
# ============================================================
urlpatterns = [
    # پنل ادمین
    path('admin/', admin.site.urls),
    
    # پروپوزال‌ها
    path('api/proposals/', include('proposals.urls')),
    
    # صفحه اصلی
    path('', home, name='home'),
    
    # احراز هویت JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # مستندات Swagger و Redoc
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # APIهای ۲۰ ماژول
    path('api/users/', include('users.urls')),
    path('api/industries/', include('industries.urls')),
    path('api/products/', include('products.urls')),
    path('api/needs/', include('needs.urls')),
    path('api/evaluations/', include('evaluations.urls')),
    path('api/readiness/', include('readiness.urls')),
    path('api/matching/', include('matching.urls')),
    path('api/search/', include('search.urls')),
    path('api/negotiations/', include('negotiations.urls')),
    path('api/contracts/', include('contracts.urls')),
    path('api/execution/', include('execution.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/support/', include('support.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/crm/', include('crm.urls')),
    path('api/marketing/', include('marketing.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/governance/', include('governance.urls')),
    path('api/', include('user_messages.urls')),
    path('api/core/', include('core.urls')),
    
    # ============================================================
    # اضافه کردن مسیرهای جدید Messages و Wallet
    # ============================================================
    path('api/messages/', include('user_messages.urls')),  # ← اپلیکیشن پیام‌ها (تغییر نام از messages به user_messages)
    path('api/wallet/', include('wallet.urls')),           # ← اپلیکیشن کیف پول
    
    # API داشبورد
    path('api/dashboard/', dashboard_api, name='dashboard_api'),
]

# ============================================================
# تنظیمات حالت DEBUG (برای فایل‌های رسانه و debug_toolbar)
# ============================================================
if settings.DEBUG:
    # ۱. debug_toolbar (برای عیب‌یابی)
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns  # مهم: در ابتدای لیست قرار می‌گیرد تا فضای نام 'djdt' ثبت شود
    except ImportError:
        pass

    # ۲. سرویس‌دهی فایل‌های رسانه و استاتیک در حالت توسعه
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)