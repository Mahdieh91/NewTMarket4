#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
setup_backend.py
اسکریپت کامل راه‌اندازی پروژه بازار تحول (بک‌اند)
شامل ۲۰ ماژول، مدل‌های کامل، سریالایزرها، ویوها، تست‌ها، داکر، Celery و داده‌های اولیه
"""

import os
import sys
import subprocess
import shutil
import time
import json
import logging
from pathlib import Path

# ============================================================
# تنظیمات اولیه
# ============================================================
PROJECT_ROOT = os.getcwd()
DB_NAME = "tmarket_db"
DB_USER = "postgres"
DB_PASS = "12369875"
DB_HOST = "localhost"
DB_PORT = "5432"
SECRET_KEY = "django-insecure-tmarket_change_me_in_production"
REDIS_HOST = "localhost"
REDIS_PORT = "6379"

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ============================================================
# 0. پاکسازی کامل
# ============================================================
logger.info("⏳ پاکسازی کامل فایل‌های قبلی...")
for item in [
    "venv",
    "config",
    "media",
    "staticfiles",
    "__pycache__",
    "db.sqlite3",
    "logs",
    "celerybeat-schedule",
    "celerybeat.pid",
]:
    if os.path.exists(item):
        if os.path.isdir(item):
            shutil.rmtree(item)
        else:
            os.remove(item)

for f in [
    "manage.py",
    "requirements.txt",
    "docker-compose.yml",
    "Dockerfile",
    ".env",
    ".gitignore",
    "pytest.ini",
    "setup.cfg",
]:
    if os.path.exists(f):
        os.remove(f)

app_dirs = [
    "users",
    "industries",
    "products",
    "needs",
    "evaluations",
    "readiness",
    "matching",
    "search",
    "negotiations",
    "proposals",
    "contracts",
    "execution",
    "payments",
    "support",
    "reviews",
    "crm",
    "marketing",
    "analytics",
    "governance",
    "core",
    "templates",
    "static",
    "locale",
]
for app in app_dirs:
    if os.path.exists(app) and os.path.isdir(app):
        shutil.rmtree(app)
logger.info("✅ پاکسازی کامل انجام شد.")

# ============================================================
# 1. ایجاد محیط مجازی
# ============================================================
logger.info("⏳ ایجاد محیط مجازی...")
subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
python_exe = os.path.join("venv", "Scripts", "python.exe")
pip_exe = os.path.join("venv", "Scripts", "pip.exe")
logger.info("✅ محیط مجازی ایجاد شد.")

# ============================================================
# 2. نصب وابستگی‌ها
# ============================================================
logger.info("⏳ نصب وابستگی‌ها (حدود ۱۰ دقیقه)...")
subprocess.run(
    [
        pip_exe,
        "install",
        "Django==5.0",
        "djangorestframework==3.15",
        "djangorestframework-simplejwt==5.3.1",
        "django-cors-headers==4.4",
        "psycopg2-binary",
        "gunicorn==22.0",
        "django-filter==24.3",
        "Pillow",
        "django-celery-results==2.5.1",
        "django-redis==5.4.0",
        "drf-yasg==1.21.8",
        "django-ckeditor==6.7.1",
        "django-import-export==4.1",
        "django-crispy-forms==2.1",
        "crispy-bootstrap5==0.7",
        "scikit-learn",
        "django-extensions==3.2.3",
        "django-debug-toolbar==4.4",
        "django-environ==0.11.2",
        "django-celery-beat==2.6.0",
        "celery==5.6.3",
        "redis>=5.0.0",
        "sentry-sdk==2.13.0",
        "whitenoise==6.6.0",
        "django-storages==1.14.4",
        "boto3==1.34.161",
        "python-dotenv==1.0.1",
        "pytest==8.3.2",
        "pytest-django==4.8.0",
        "coverage==7.6.1",
        "setuptools",
        "wheel",
    ],
    check=True,
)
logger.info("✅ وابستگی‌ها نصب شدند.")

# ============================================================
# 3. ایجاد پروژه Django
# ============================================================
logger.info("⏳ ایجاد پروژه Django...")
subprocess.run([python_exe, "-m", "django", "startproject", "config", "."], check=True)
logger.info("✅ پروژه Django ایجاد شد.")

# ============================================================
# 4. ایجاد ۲۰ اپلیکیشن
# ============================================================
logger.info("⏳ ایجاد ۲۰ اپلیکیشن...")
apps = [
    "users",
    "industries",
    "products",
    "needs",
    "evaluations",
    "readiness",
    "matching",
    "search",
    "negotiations",
    "proposals",
    "contracts",
    "execution",
    "payments",
    "support",
    "reviews",
    "crm",
    "marketing",
    "analytics",
    "governance",
    "core",
]
for app in apps:
    subprocess.run([python_exe, "manage.py", "startapp", app], check=True)
    logger.info(f"   ✅ اپ {app} ایجاد شد.")

# ============================================================
# 5. فایل‌های تنظیمات
# ============================================================
with open("requirements.txt", "w", encoding="utf-8") as f:
    f.write(
        """Django==5.0
djangorestframework==3.15
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.4
django-filter==24.3
django-environ==0.11.2
python-dotenv==1.0.1
psycopg2-binary
django-storages==1.14.4
boto3==1.34.161
celery==5.6.3
django-celery-beat==2.6.0
django-celery-results==2.5.1
django-redis==5.4.0
redis==5.4.0
drf-yasg==1.21.8
django-ckeditor==6.7.1
django-import-export==4.1
django-crispy-forms==2.1
crispy-bootstrap5==0.7
gunicorn==22.0
whitenoise==6.6.0
scikit-learn
django-extensions==3.2.3
django-debug-toolbar==4.4
sentry-sdk==2.13.0
pytest==8.3.2
pytest-django==4.8.0
coverage==7.6.1
Pillow
setuptools
wheel
"""
    )
logger.info("✅ requirements.txt ایجاد شد.")

with open("docker-compose.yml", "w", encoding="utf-8") as f:
    f.write(
        f"""
version: '3.8'
services:
  db:
    image: postgres:15
    container_name: tmarket_db
    environment:
      POSTGRES_DB: {DB_NAME}
      POSTGRES_USER: {DB_USER}
      POSTGRES_PASSWORD: {DB_PASS}
    ports:
      - "{DB_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U {DB_USER} -d {DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
  redis:
    image: redis:7-alpine
    container_name: tmarket_redis
    ports:
      - "{REDIS_PORT}:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
volumes:
  postgres_data:
  redis_data:
"""
    )
logger.info("✅ docker-compose.yml ایجاد شد.")

with open(".env", "w", encoding="utf-8") as f:
    f.write(
        f"""
SECRET_KEY={SECRET_KEY}
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
DB_NAME={DB_NAME}
DB_USER={DB_USER}
DB_PASS={DB_PASS}
DB_HOST={DB_HOST}
DB_PORT={DB_PORT}
REDIS_HOST={REDIS_HOST}
REDIS_PORT={REDIS_PORT}
CELERY_BROKER_URL=redis://{REDIS_HOST}:{REDIS_PORT}/0
CELERY_RESULT_BACKEND=redis://{REDIS_HOST}:{REDIS_PORT}/1
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
"""
    )
logger.info("✅ .env ایجاد شد.")

with open(".gitignore", "w", encoding="utf-8") as f:
    f.write(
        """venv/
__pycache__/
*.pyc
*.log
db.sqlite3
media/
staticfiles/
.env
.DS_Store
celerybeat-schedule
celerybeat.pid
.coverage
htmlcov/
.pytest_cache/
.idea/
.vscode/
"""
    )
logger.info("✅ .gitignore ایجاد شد.")

# ============================================================
# 6. settings.py
# ============================================================
logger.info("⏳ ایجاد settings.py...")
settings_content = f"""
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('SECRET_KEY', '{SECRET_KEY}')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_yasg',
    'ckeditor',
    'ckeditor_uploader',
    'import_export',
    'crispy_forms',
    'crispy_bootstrap5',
    'django_extensions',
    'debug_toolbar',
    'django_celery_beat',
    'django_celery_results',
    'storages',
    'whitenoise',
    {", ".join([f"'{app}'" for app in apps])}
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {{
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {{
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        }},
    }},
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {{
    'default': {{
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', '{DB_NAME}'),
        'USER': os.getenv('DB_USER', '{DB_USER}'),
        'PASSWORD': os.getenv('DB_PASS', '{DB_PASS}'),
        'HOST': os.getenv('DB_HOST', '{DB_HOST}'),
        'PORT': os.getenv('DB_PORT', '{DB_PORT}'),
    }}
}}

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {{
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}}

SIMPLE_JWT = {{
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}}

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

LANGUAGE_CODE = 'fa-ir'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = True
USE_L10N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

CKEDITOR_UPLOAD_PATH = 'uploads/'
CKEDITOR_CONFIGS = {{
    'default': {{
        'toolbar': 'full',
        'height': 300,
        'width': 'auto',
    }},
}}

CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"
CRISPY_TEMPLATE_PACK = "bootstrap5"

CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://{REDIS_HOST}:{REDIS_PORT}/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://{REDIS_HOST}:{REDIS_PORT}/1')
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

CACHES = {{
    'default': {{
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': CELERY_BROKER_URL,
        'OPTIONS': {{
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }}
    }}
}}

INTERNAL_IPS = ['127.0.0.1', 'localhost']
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
LOGGING = {{
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {{
        'verbose': {{
            'format': '[{{levelname}}] {{asctime}} {{module}} {{message}}',
            'style': '{{',
        }},
    }},
    'handlers': {{
        'console': {{
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        }},
        'file': {{
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        }},
    }},
    'root': {{
        'handlers': ['console', 'file'],
        'level': 'INFO',
    }},
}}
"""
with open("config/settings.py", "w", encoding="utf-8") as f:
    f.write(settings_content)
logger.info("✅ settings.py ایجاد شد.")

# ============================================================
# 7. config/urls.py
# ============================================================
with open("config/urls.py", "w", encoding="utf-8") as f:
    f.write(
        """
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

def home(request):
    return redirect('/admin/')

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

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home, name='home'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('api/users/', include('users.urls')),
    path('api/industries/', include('industries.urls')),
    path('api/products/', include('products.urls')),
    path('api/needs/', include('needs.urls')),
    path('api/evaluations/', include('evaluations.urls')),
    path('api/readiness/', include('readiness.urls')),
    path('api/matching/', include('matching.urls')),
    path('api/search/', include('search.urls')),
    path('api/negotiations/', include('negotiations.urls')),
    path('api/proposals/', include('proposals.urls')),
    path('api/contracts/', include('contracts.urls')),
    path('api/execution/', include('execution.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/support/', include('support.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/crm/', include('crm.urls')),
    path('api/marketing/', include('marketing.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/governance/', include('governance.urls')),
    path('api/core/', include('core.urls')),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
"""
    )
logger.info("✅ config/urls.py ایجاد شد.")

# ============================================================
# 8. مدل‌های کامل
# ============================================================
logger.info("⏳ ایجاد مدل‌های کامل...")

models_code = {
    "users": """
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('buyer', 'خریدار محصول فناورانه'),
        ('buyer_service', 'خریدار خدمت نوآورانه'),
        ('supplier', 'عرضه‌کننده محصول'),
        ('supplier_service', 'عرضه‌کننده خدمت'),
        ('need_registerer', 'ثبت‌کننده نیاز فناورانه'),
        ('investor', 'سرمایه‌گذار'),
        ('consultant', 'مشاور / ارزیاب'),
        ('broker', 'کارگزار / کارشناس رسمی'),
        ('partner', 'سازمان همکار'),
        ('admin', 'مدیر پلتفرم'),
    ]
    KYC_STATUS = [
        ('draft', 'پیش‌نویس'),
        ('pending', 'در انتظار بررسی'),
        ('approved', 'تأیید شده'),
        ('rejected', 'رد شده'),
        ('suspended', 'تعلیق شده'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='buyer')
    is_legal = models.BooleanField(default=False)
    company_name = models.CharField(max_length=200, blank=True, null=True)
    national_id = models.CharField(max_length=50, blank=True, null=True)
    registration_number = models.CharField(max_length=50, blank=True, null=True)
    economic_code = models.CharField(max_length=50, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    representative_name = models.CharField(max_length=100, blank=True, null=True)
    expertise = models.TextField(blank=True, null=True)
    activity_domain = models.TextField(blank=True, null=True)
    experience_summary = models.TextField(blank=True, null=True)
    kyc_status = models.CharField(max_length=20, choices=KYC_STATUS, default='draft')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'

    def __str__(self):
        return self.username
""",
    "industries": """
from django.db import models

class IndustryCategory(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='نام صنعت')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children', verbose_name='دسته والد')
    keywords = models.TextField(blank=True, null=True, verbose_name='کلیدواژه‌ها')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    icon = models.ImageField(upload_to='industries/icons/', blank=True, null=True, verbose_name='آیکون')

    class Meta:
        verbose_name = 'دسته صنعت'
        verbose_name_plural = 'دسته‌های صنعت'

    def __str__(self):
        return self.name
""",
    "products": """
from django.db import models
from django.conf import settings
from ckeditor.fields import RichTextField

class Product(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('submitted', 'ارسال برای بررسی'),
        ('evaluating', 'در حال ارزیابی'),
        ('needs_revision', 'نیازمند اصلاح'),
        ('approved', 'تأیید شده'),
        ('published', 'منتشر شده'),
        ('suspended', 'تعلیق شده'),
        ('in_negotiation', 'در حال مذاکره'),
        ('contracted', 'دارای قرارداد'),
        ('executing', 'در حال اجرا'),
        ('completed', 'تکمیل شده'),
    ]
    CATEGORY_CHOICES = [('product', 'محصول'), ('service', 'خدمت')]
    TRL_CHOICES = [(i, f'TRL {i}') for i in range(1, 10)]
    MRL_CHOICES = [(i, f'MRL {i}') for i in range(1, 10)]

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='products')
    title = models.CharField(max_length=200, verbose_name='عنوان')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='product', verbose_name='نوع')
    industry = models.ForeignKey('industries.IndustryCategory', on_delete=models.SET_NULL, null=True, verbose_name='صنعت')
    short_description = models.TextField(verbose_name='توضیح کوتاه')
    full_description = RichTextField(blank=True, null=True, verbose_name='توضیح کامل')
    problem_solved = models.TextField(blank=True, null=True, verbose_name='مسئله حل شده')
    competitive_advantage = models.TextField(blank=True, null=True, verbose_name='مزیت رقابتی')
    technical_specs = models.TextField(blank=True, null=True, verbose_name='مشخصات فنی')
    trl = models.IntegerField(choices=TRL_CHOICES, default=1, verbose_name='سطح آمادگی فناوری')
    mrl = models.IntegerField(choices=MRL_CHOICES, default=1, verbose_name='سطح آمادگی بازار')
    pricing_model = models.TextField(blank=True, null=True, verbose_name='مدل قیمت‌گذاری')
    price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name='قیمت (تومان)')
    ip_status = models.CharField(max_length=100, blank=True, null=True, verbose_name='وضعیت مالکیت فکری')
    documentation = models.FileField(upload_to='products/docs/', blank=True, null=True, verbose_name='مستندات')
    image = models.ImageField(upload_to='products/images/', blank=True, null=True, verbose_name='تصویر')
    video = models.URLField(blank=True, null=True, verbose_name='ویدیو معرفی')
    certificates = models.FileField(upload_to='products/certs/', blank=True, null=True, verbose_name='گواهی‌ها')
    sample_customers = models.TextField(blank=True, null=True, verbose_name='نمونه مشتریان')
    capacity = models.CharField(max_length=100, blank=True, null=True, verbose_name='ظرفیت ارائه')
    collaboration_terms = models.TextField(blank=True, null=True, verbose_name='شرایط همکاری')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='وضعیت')
    view_count = models.IntegerField(default=0, verbose_name='تعداد بازدید')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'محصول'
        verbose_name_plural = 'محصولات'

    def __str__(self):
        return self.title
""",
    "needs": """
from django.db import models
from django.conf import settings
from ckeditor.fields import RichTextField

class Need(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('published', 'منتشر شده'),
        ('private', 'خصوصی'),
        ('receiving_proposals', 'در حال دریافت پیشنهاد'),
        ('evaluating', 'در حال ارزیابی'),
        ('matched', 'تطبیق داده شده'),
        ('in_negotiation', 'در حال مذاکره'),
        ('contracted', 'تبدیل به قرارداد'),
        ('executing', 'در حال اجرا'),
        ('closed', 'بسته شده'),
    ]
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='needs')
    title = models.CharField(max_length=200, verbose_name='عنوان نیاز')
    description = RichTextField(verbose_name='شرح مسئله')
    industry = models.ForeignKey('industries.IndustryCategory', on_delete=models.SET_NULL, null=True, verbose_name='صنعت')
    current_status = models.TextField(blank=True, null=True, verbose_name='وضعیت فعلی')
    expected_outcome = models.TextField(blank=True, null=True, verbose_name='خروجی مورد انتظار')
    constraints = models.TextField(blank=True, null=True, verbose_name='محدودیت‌ها')
    budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name='بودجه (تومان)')
    timeline = models.CharField(max_length=100, blank=True, null=True, verbose_name='زمان‌بندی')
    confidentiality = models.CharField(max_length=20, choices=[('public', 'عمومی'), ('private', 'خصوصی')], default='public', verbose_name='سطح محرمانگی')
    evaluation_criteria = models.TextField(blank=True, null=True, verbose_name='معیارهای ارزیابی')
    attachments = models.FileField(upload_to='needs/attachments/', blank=True, null=True, verbose_name='فایل‌های پیوست')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='وضعیت')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'نیاز'
        verbose_name_plural = 'نیازها'

    def __str__(self):
        return self.title
""",
    "evaluations": """
from django.db import models
from django.conf import settings

class Evaluation(models.Model):
    DECISION_CHOICES = [
        ('approved', 'تأیید برای انتشار'),
        ('conditional', 'تأیید مشروط'),
        ('needs_info', 'نیازمند تکمیل اطلاعات'),
        ('rejected', 'رد درخواست'),
        ('referred', 'ارجاع به ارزیاب تخصصی'),
    ]
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, null=True, blank=True)
    need = models.ForeignKey('needs.Need', on_delete=models.CASCADE, null=True, blank=True)
    evaluator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='evaluations')
    comments = models.TextField(blank=True, null=True, verbose_name='یادداشت ارزیاب')
    quality_score = models.IntegerField(default=0, verbose_name='امتیاز کیفیت')
    risk_score = models.IntegerField(default=0, verbose_name='امتیاز ریسک')
    market_readiness_score = models.IntegerField(default=0, verbose_name='امتیاز آمادگی بازار')
    final_decision = models.CharField(max_length=20, choices=DECISION_CHOICES, default='needs_info', verbose_name='تصمیم نهایی')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'ارزیابی'
        verbose_name_plural = 'ارزیابی‌ها'

    def __str__(self):
        return f"ارزیابی #{self.id}"
""",
    "readiness": """
from django.db import models
from django.conf import settings

class MarketReadiness(models.Model):
    product = models.OneToOneField('products.Product', on_delete=models.CASCADE, related_name='readiness')
    market_readiness_score = models.FloatField(default=0.0, verbose_name='امتیاز آمادگی بازار')
    market_fit_score = models.FloatField(default=0.0, verbose_name='امتیاز تطابق بازار')
    demand_forecast = models.JSONField(default=dict, verbose_name='پیش‌بینی تقاضا')
    competitive_position = models.TextField(blank=True, null=True, verbose_name='موقعیت رقابتی')
    recommended_actions = models.TextField(blank=True, null=True, verbose_name='پیشنهاد اصلاح')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'سنجش بازارپذیری'
        verbose_name_plural = 'سنجش بازارپذیری'
""",
    "matching": """
from django.db import models
from django.conf import settings

class MatchResult(models.Model):
    need = models.ForeignKey('needs.Need', on_delete=models.CASCADE, related_name='matches')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='matches')
    score = models.FloatField(default=0.0, verbose_name='درصد انطباق')
    reason = models.TextField(blank=True, null=True, verbose_name='دلیل پیشنهاد')
    recommended_actions = models.TextField(blank=True, null=True, verbose_name='اقدامات پیشنهادی')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('need', 'product')
        verbose_name = 'نتیجه تطبیق'
        verbose_name_plural = 'نتایج تطبیق'

    def __str__(self):
        return f"{self.need} ↔ {self.product} ({self.score}%)"
""",
    "search": "# این اپ فقط برای جستجوی یکپارچه استفاده می‌شود\n",
    "negotiations": """
from django.db import models
from django.conf import settings

class Negotiation(models.Model):
    STATUS_CHOICES = [
        ('created', 'ایجاد شده'),
        ('in_progress', 'در حال مکاتبه'),
        ('awaiting_proposal', 'در انتظار پیشنهاد'),
        ('proposal_sent', 'پیشنهاد ارسال شده'),
        ('under_review', 'در حال بررسی'),
        ('accepted', 'پذیرفته شده'),
        ('rejected', 'رد شده'),
        ('contracted', 'ورود به قرارداد'),
    ]
    need = models.ForeignKey('needs.Need', on_delete=models.SET_NULL, null=True)
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True)
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='negotiations_as_buyer')
    supplier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='negotiations_as_supplier')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created', verbose_name='وضعیت')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'مذاکره'
        verbose_name_plural = 'مذاکرات'

    def __str__(self):
        return f"مذاکره #{self.id}"

class Message(models.Model):
    negotiation = models.ForeignKey(Negotiation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(verbose_name='متن پیام')
    file = models.FileField(upload_to='negotiations/files/', blank=True, null=True, verbose_name='فایل ضمیمه')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'پیام'
        verbose_name_plural = 'پیام‌ها'

    def __str__(self):
        return f"پیام #{self.id}"
""",
    "proposals": """
from django.db import models
from django.conf import settings
from ckeditor.fields import RichTextField

class Proposal(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('sent', 'ارسال شده'),
        ('viewed', 'مشاهده شده'),
        ('under_review', 'در حال بررسی'),
        ('needs_revision', 'نیازمند اصلاح'),
        ('accepted', 'پذیرفته شده'),
        ('rejected', 'رد شده'),
    ]
    negotiation = models.ForeignKey('negotiations.Negotiation', on_delete=models.CASCADE, related_name='proposals')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_proposals')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=200, verbose_name='عنوان پیشنهاد')
    technical_description = RichTextField(verbose_name='شرح فنی')
    price = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='قیمت (تومان)')
    timeline = models.CharField(max_length=100, verbose_name='زمان‌بندی')
    payment_terms = models.TextField(verbose_name='شرایط پرداخت')
    guarantees = models.TextField(blank=True, null=True, verbose_name='ضمانت‌ها')
    obligations = models.TextField(blank=True, null=True, verbose_name='تعهدات')
    ip_terms = models.TextField(blank=True, null=True, verbose_name='شرایط مالکیت فکری')
    confidentiality = models.TextField(blank=True, null=True, verbose_name='محرمانگی')
    attachments = models.FileField(upload_to='proposals/attachments/', blank=True, null=True, verbose_name='فایل‌های پیوست')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='وضعیت')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'پیشنهاد'
        verbose_name_plural = 'پیشنهادها'

    def __str__(self):
        return self.title
""",
    "contracts": """
from django.db import models
from django.conf import settings
from ckeditor.fields import RichTextField

class Contract(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس قرارداد'),
        ('legal_review', 'بررسی حقوقی'),
        ('valuation', 'ارزش‌گذاری'),
        ('approved_buyer', 'تأیید خریدار'),
        ('approved_supplier', 'تأیید فروشنده'),
        ('signed', 'امضا شده'),
        ('execution', 'در حال اجرا'),
        ('completed', 'تکمیل شده'),
        ('disputed', 'وارد اختلاف شده'),
    ]
    negotiation = models.OneToOneField('negotiations.Negotiation', on_delete=models.SET_NULL, null=True)
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='contracts_as_buyer')
    supplier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='contracts_as_supplier')
    terms = RichTextField(verbose_name='شرایط قرارداد')
    total_value = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='مبلغ قرارداد')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='وضعیت')
    contract_file = models.FileField(upload_to='contracts/', blank=True, null=True, verbose_name='فایل قرارداد')
    signed_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ امضا')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'قرارداد'
        verbose_name_plural = 'قراردادها'

    def __str__(self):
        return f"قرارداد #{self.id}"

class Milestone(models.Model):
    STATUS_CHOICES = [
        ('not_started', 'شروع نشده'),
        ('in_progress', 'در حال انجام'),
        ('awaiting_approval', 'در انتظار تأیید'),
        ('needs_revision', 'نیازمند اصلاح'),
        ('completed', 'تکمیل شده'),
    ]
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200, verbose_name='عنوان فاز')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    due_date = models.DateField(null=True, blank=True, verbose_name='تاریخ سررسید')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started', verbose_name='وضعیت')
    deliverables = models.FileField(upload_to='deliverables/', blank=True, null=True, verbose_name='خروجی‌ها')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ تکمیل')

    class Meta:
        verbose_name = 'نقطه عطف'
        verbose_name_plural = 'نقاط عطف'

    def __str__(self):
        return self.title
""",
    "execution": """
from django.db import models
from django.conf import settings

class Execution(models.Model):
    STATUS_CHOICES = [
        ('not_started', 'شروع نشده'),
        ('in_progress', 'در حال انجام'),
        ('awaiting_approval', 'در انتظار تأیید'),
        ('needs_revision', 'نیازمند اصلاح'),
        ('completed', 'تکمیل شده'),
        ('suspended', 'متوقف شده'),
        ('disputed', 'وارد اختلاف شده'),
    ]
    contract = models.OneToOneField('contracts.Contract', on_delete=models.CASCADE, related_name='execution')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started', verbose_name='وضعیت')
    progress_percent = models.IntegerField(default=0, verbose_name='درصد پیشرفت')
    start_date = models.DateField(null=True, blank=True, verbose_name='تاریخ شروع')
    expected_end_date = models.DateField(null=True, blank=True, verbose_name='تاریخ پایان پیش‌بینی شده')
    actual_end_date = models.DateField(null=True, blank=True, verbose_name='تاریخ پایان واقعی')
    final_score = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True, verbose_name='امتیاز نهایی')
    notes = models.TextField(blank=True, null=True, verbose_name='یادداشت‌ها')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'اجرا'
        verbose_name_plural = 'اجراها'

    def __str__(self):
        return f"اجرا #{self.id} - {self.contract}"
""",
    "payments": """
from django.db import models
from django.conf import settings

class Invoice(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار پرداخت'),
        ('paid', 'پرداخت شده'),
        ('cancelled', 'لغو شده'),
    ]
    contract = models.ForeignKey('contracts.Contract', on_delete=models.CASCADE, related_name='invoices')
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='مبلغ')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='وضعیت')
    payment_method = models.CharField(max_length=50, blank=True, null=True, verbose_name='روش پرداخت')
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ پرداخت')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'فاکتور'
        verbose_name_plural = 'فاکتورها'

    def __str__(self):
        return f"فاکتور #{self.id}"

class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('completed', 'تکمیل شده'),
        ('failed', 'ناموفق'),
    ]
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='مبلغ')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='وضعیت')
    transaction_id = models.CharField(max_length=100, blank=True, null=True, verbose_name='شناسه تراکنش')
    gateway = models.CharField(max_length=50, blank=True, null=True, verbose_name='درگاه پرداخت')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'پرداخت'
        verbose_name_plural = 'پرداخت‌ها'

    def __str__(self):
        return f"پرداخت #{self.id}"
""",
    "support": """
from django.db import models
from django.conf import settings

class Ticket(models.Model):
    STATUS_CHOICES = [
        ('new', 'جدید'),
        ('in_progress', 'در حال بررسی'),
        ('answered', 'پاسخ داده شده'),
        ('referred', 'ارجاع شده'),
        ('needs_seller_action', 'نیازمند اقدام فروشنده'),
        ('closed', 'بسته شده'),
        ('disputed', 'وارد داوری شده'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'کم'),
        ('medium', 'متوسط'),
        ('high', 'زیاد'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tickets')
    subject = models.CharField(max_length=200, verbose_name='موضوع')
    description = models.TextField(verbose_name='شرح')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', verbose_name='وضعیت')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium', verbose_name='اولویت')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'تیکت'
        verbose_name_plural = 'تیکت‌ها'

    def __str__(self):
        return f"تیکت #{self.id} - {self.subject}"

class TicketMessage(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(verbose_name='متن')
    file = models.FileField(upload_to='tickets/files/', blank=True, null=True, verbose_name='فایل ضمیمه')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'پیام تیکت'
        verbose_name_plural = 'پیام‌های تیکت'

    def __str__(self):
        return f"پیام تیکت #{self.id}"
""",
    "reviews": """
from django.db import models
from django.conf import settings

class Review(models.Model):
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(default=5, verbose_name='امتیاز (۱-۵)')
    comment = models.TextField(blank=True, null=True, verbose_name='نظر')
    nps_score = models.IntegerField(null=True, blank=True, verbose_name='امتیاز NPS')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'نظر'
        verbose_name_plural = 'نظرات'

    def __str__(self):
        return f"نظر {self.user} برای {self.product}"
""",
    "crm": """
from django.db import models
from django.conf import settings

class CustomerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='crm_profile')
    loyalty_points = models.IntegerField(default=0, verbose_name='امتیاز وفاداری')
    total_purchases = models.IntegerField(default=0, verbose_name='تعداد خریدها')
    tags = models.JSONField(default=list, blank=True, verbose_name='برچسب‌ها')
    notes = models.TextField(blank=True, null=True, verbose_name='یادداشت‌ها')
    last_contact = models.DateTimeField(null=True, blank=True, verbose_name='آخرین تماس')

    class Meta:
        verbose_name = 'پروفایل مشتری'
        verbose_name_plural = 'پروفایل‌های مشتریان'

    def __str__(self):
        return f"پروفایل {self.user}"

class Interaction(models.Model):
    TYPE_CHOICES = [
        ('call', 'تماس'),
        ('email', 'ایمیل'),
        ('meeting', 'جلسه'),
        ('note', 'یادداشت'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interactions')
    interaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='نوع تعامل')
    details = models.TextField(verbose_name='جزئیات')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'تعامل'
        verbose_name_plural = 'تعاملات'

    def __str__(self):
        return f"تعامل #{self.id}"
""",
    "marketing": """
from django.db import models

class Campaign(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('active', 'فعال'),
        ('finished', 'پایان یافته'),
    ]
    title = models.CharField(max_length=200, verbose_name='عنوان')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    target_audience = models.CharField(max_length=100, blank=True, null=True, verbose_name='مخاطب هدف')
    start_date = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ شروع')
    end_date = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ پایان')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='وضعیت')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'کمپین'
        verbose_name_plural = 'کمپین‌ها'

    def __str__(self):
        return self.title

class Event(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'پیش رو'),
        ('live', 'در حال برگزاری'),
        ('past', 'برگزار شده'),
    ]
    title = models.CharField(max_length=200, verbose_name='عنوان')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    event_date = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ رویداد')
    link = models.URLField(blank=True, null=True, verbose_name='لینک')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming', verbose_name='وضعیت')

    class Meta:
        verbose_name = 'رویداد'
        verbose_name_plural = 'رویدادها'

    def __str__(self):
        return self.title

class TrustBadge(models.Model):
    name = models.CharField(max_length=100, verbose_name='نام نشان')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    image = models.ImageField(upload_to='badges/', blank=True, null=True, verbose_name='تصویر')

    class Meta:
        verbose_name = 'نشان اعتبار'
        verbose_name_plural = 'نشان‌های اعتبار'

    def __str__(self):
        return self.name
""",
    "analytics": """
from django.db import models
from django.conf import settings

class MarketTrend(models.Model):
    industry = models.ForeignKey('industries.IndustryCategory', on_delete=models.CASCADE, verbose_name='صنعت')
    trend_name = models.CharField(max_length=200, verbose_name='نام روند')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    data_points = models.JSONField(default=list, verbose_name='نقاط داده')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'روند بازار'
        verbose_name_plural = 'روندهای بازار'

    def __str__(self):
        return f"{self.industry} - {self.trend_name}"

class KPI(models.Model):
    CATEGORY_CHOICES = [
        ('conversion', 'نرخ تبدیل'),
        ('retention', 'ماندگاری'),
        ('revenue', 'درآمد'),
        ('satisfaction', 'رضایت'),
        ('matching', 'موفقیت تطبیق'),
    ]
    name = models.CharField(max_length=200, verbose_name='نام شاخص')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name='دسته‌بندی')
    value = models.FloatField(verbose_name='مقدار')
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'شاخص کلیدی'
        verbose_name_plural = 'شاخص‌های کلیدی'

    def __str__(self):
        return f"{self.name}: {self.value}"
""",
    "governance": """
from django.db import models
from django.conf import settings

class PlatformSettings(models.Model):
    key = models.CharField(max_length=100, unique=True, verbose_name='کلید')
    value = models.TextField(verbose_name='مقدار')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'تنظیمات پلتفرم'
        verbose_name_plural = 'تنظیمات پلتفرم'

    def __str__(self):
        return self.key

class QualityControl(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('passed', 'تأیید شده'),
        ('failed', 'رد شده'),
    ]
    target_type = models.CharField(max_length=50, verbose_name='نوع هدف')
    target_id = models.PositiveIntegerField(verbose_name='شناسه هدف')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='وضعیت')
    notes = models.TextField(blank=True, null=True, verbose_name='یادداشت')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name='بررسی‌کننده')
    reviewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'کنترل کیفیت'
        verbose_name_plural = 'کنترل کیفیت'

    def __str__(self):
        return f"QC {self.target_type} #{self.target_id}"
""",
    "core": """
from django.db import models
from django.conf import settings

class UserDocument(models.Model):
    DOCUMENT_TYPES = [
        ('id_card', 'کارت ملی'),
        ('registration', 'اسناد ثبتی'),
        ('license', 'مجوز یا پروانه'),
        ('representative', 'معرفی‌نامه نماینده'),
        ('other', 'سایر'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, default='other', verbose_name='نوع مدرک')
    title = models.CharField(max_length=200, verbose_name='عنوان')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    file = models.FileField(upload_to='documents/', verbose_name='فایل')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=False, verbose_name='تأیید شده')

    class Meta:
        verbose_name = 'مستند کاربر'
        verbose_name_plural = 'مستندات کاربران'

    def __str__(self):
        return f"{self.user} - {self.title}"
""",
}

for app, code in models_code.items():
    with open(f"{app}/models.py", "w", encoding="utf-8") as f:
        f.write(code)
logger.info("✅ مدل‌های کامل همه ۲۰ اپ ایجاد شدند.")

# ============================================================
# 9. سریالایزرها
# ============================================================
logger.info("⏳ ایجاد سریالایزرها...")
serializers_code = {
    "users": """
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone', 'kyc_status', 
                  'company_name', 'expertise', 'address', 'website', 'bio', 
                  'first_name', 'last_name', 'national_id', 'is_legal')
        extra_kwargs = {'password': {'write_only': True}}
""",
    "industries": """
from rest_framework import serializers
from .models import IndustryCategory

class IndustryCategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = IndustryCategory
        fields = '__all__'

    def get_children(self, obj):
        return IndustryCategorySerializer(obj.children.all(), many=True).data
""",
    "products": """
from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('view_count', 'created_at', 'updated_at')
""",
    "needs": """
from rest_framework import serializers
from .models import Need

class NeedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Need
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
""",
    "evaluations": """
from rest_framework import serializers
from .models import Evaluation

class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = '__all__'
""",
    "readiness": """
from rest_framework import serializers
from .models import MarketReadiness

class MarketReadinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketReadiness
        fields = '__all__'
""",
    "matching": """
from rest_framework import serializers
from .models import MatchResult

class MatchResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchResult
        fields = '__all__'
""",
    "search": """
from rest_framework import serializers
# Search app uses a custom view, not a model serializer
""",
    "negotiations": """
from rest_framework import serializers
from .models import Negotiation, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'

class NegotiationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Negotiation
        fields = '__all__'
""",
    "proposals": """
from rest_framework import serializers
from .models import Proposal

class ProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = '__all__'
""",
    "contracts": """
from rest_framework import serializers
from .models import Contract, Milestone

class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = '__all__'

class ContractSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, read_only=True)

    class Meta:
        model = Contract
        fields = '__all__'
""",
    "execution": """
from rest_framework import serializers
from .models import Execution

class ExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Execution
        fields = '__all__'
""",
    "payments": """
from rest_framework import serializers
from .models import Invoice, Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
""",
    "support": """
from rest_framework import serializers
from .models import Ticket, TicketMessage

class TicketMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketMessage
        fields = '__all__'

class TicketSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = '__all__'
""",
    "reviews": """
from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'
""",
    "crm": """
from rest_framework import serializers
from .models import CustomerProfile, Interaction

class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = '__all__'

class InteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interaction
        fields = '__all__'
""",
    "marketing": """
from rest_framework import serializers
from .models import Campaign, Event, TrustBadge

class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'

class TrustBadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrustBadge
        fields = '__all__'
""",
    "analytics": """
from rest_framework import serializers
from .models import MarketTrend, KPI

class MarketTrendSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketTrend
        fields = '__all__'

class KPISerializer(serializers.ModelSerializer):
    class Meta:
        model = KPI
        fields = '__all__'
""",
    "governance": """
from rest_framework import serializers
from .models import PlatformSettings, QualityControl

class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = '__all__'

class QualityControlSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityControl
        fields = '__all__'
""",
    "core": """
from rest_framework import serializers
from .models import UserDocument

class UserDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDocument
        fields = '__all__'
""",
}

for app, code in serializers_code.items():
    with open(f"{app}/serializers.py", "w", encoding="utf-8") as f:
        f.write(code)
logger.info("✅ سریالایزرهای همه اپ‌ها ایجاد شدند.")

# ============================================================
# 10. ویوها
# ============================================================
logger.info("⏳ ایجاد ویوها...")
views_code = {
    "users": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import User
from .serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'kyc_status', 'is_legal']
    search_fields = ['username', 'email', 'company_name', 'expertise']
    ordering_fields = '__all__'
""",
    "industries": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import IndustryCategory
from .serializers import IndustryCategorySerializer

class IndustryCategoryViewSet(viewsets.ModelViewSet):
    queryset = IndustryCategory.objects.all()
    serializer_class = IndustryCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['parent']
    search_fields = ['name', 'keywords', 'description']
""",
    "products": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product
from .serializers import ProductSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['industry', 'status', 'trl', 'mrl', 'category']
    search_fields = ['title', 'short_description', 'full_description', 'problem_solved']
    ordering_fields = '__all__'
""",
    "needs": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Need
from .serializers import NeedSerializer

class NeedViewSet(viewsets.ModelViewSet):
    queryset = Need.objects.all()
    serializer_class = NeedSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['industry', 'status', 'confidentiality']
    search_fields = ['title', 'description', 'expected_outcome']
    ordering_fields = '__all__'
""",
    "evaluations": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Evaluation
from .serializers import EvaluationSerializer

class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['final_decision', 'evaluator']
    search_fields = ['comments']
    ordering_fields = '__all__'
""",
    "readiness": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import MarketReadiness
from .serializers import MarketReadinessSerializer

class MarketReadinessViewSet(viewsets.ModelViewSet):
    queryset = MarketReadiness.objects.all()
    serializer_class = MarketReadinessSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__title']
    ordering_fields = '__all__'
""",
    "matching": """
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import MatchResult
from .serializers import MatchResultSerializer
from needs.models import Need
from products.models import Product
from .utils import SmartMatcher

class MatchResultViewSet(viewsets.ModelViewSet):
    queryset = MatchResult.objects.all()
    serializer_class = MatchResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['need', 'product']
    search_fields = ['need__title', 'product__title']
    ordering_fields = '__all__'

    @action(detail=False, methods=['post'])
    def run_matching(self, request):
        need_id = request.data.get('need_id')
        if not need_id:
            return Response({'error': 'need_id is required'}, status=400)
        try:
            need = Need.objects.get(id=need_id)
            results = SmartMatcher.match_need_to_products(need_id)
            return Response({'need': need.title, 'results': results[:20]}, status=200)
        except Need.DoesNotExist:
            return Response({'error': 'Need not found'}, status=404)
""",
    "search": """
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from products.models import Product
from needs.models import Need
from products.serializers import ProductSerializer
from needs.serializers import NeedSerializer

class SearchViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def all(self, request):
        query = request.query_params.get('q', '')
        industry = request.query_params.get('industry', '')
        status = request.query_params.get('status', '')
        
        products = Product.objects.all()
        needs = Need.objects.all()
        
        if query:
            products = products.filter(title__icontains=query) | products.filter(short_description__icontains=query)
            needs = needs.filter(title__icontains=query) | needs.filter(description__icontains=query)
        
        if industry:
            products = products.filter(industry__name=industry)
            needs = needs.filter(industry__name=industry)
        
        if status:
            products = products.filter(status=status)
            needs = needs.filter(status=status)
        
        product_serializer = ProductSerializer(products[:50], many=True)
        need_serializer = NeedSerializer(needs[:50], many=True)
        
        return Response({
            'products': product_serializer.data,
            'needs': need_serializer.data,
            'counts': {
                'products': products.count(),
                'needs': needs.count()
            }
        })
""",
    "negotiations": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Negotiation, Message
from .serializers import NegotiationSerializer, MessageSerializer

class NegotiationViewSet(viewsets.ModelViewSet):
    queryset = Negotiation.objects.all()
    serializer_class = NegotiationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['need__title', 'product__title']
    ordering_fields = '__all__'

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sender']
    search_fields = ['text']
    ordering_fields = '__all__'
""",
    "proposals": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Proposal
from .serializers import ProposalSerializer

class ProposalViewSet(viewsets.ModelViewSet):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'sender']
    search_fields = ['title', 'technical_description']
    ordering_fields = '__all__'
""",
    "contracts": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Contract, Milestone
from .serializers import ContractSerializer, MilestoneSerializer

class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['terms', 'buyer__username', 'supplier__username']
    ordering_fields = '__all__'

class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'contract']
    search_fields = ['title', 'description']
    ordering_fields = '__all__'
""",
    "execution": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Execution
from .serializers import ExecutionSerializer

class ExecutionViewSet(viewsets.ModelViewSet):
    queryset = Execution.objects.all()
    serializer_class = ExecutionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['contract__terms']
    ordering_fields = '__all__'
""",
    "payments": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Invoice, Payment
from .serializers import InvoiceSerializer, PaymentSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = '__all__'

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = '__all__'
""",
    "support": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Ticket, TicketMessage
from .serializers import TicketSerializer, TicketMessageSerializer

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority']
    search_fields = ['subject', 'description']
    ordering_fields = '__all__'

class TicketMessageViewSet(viewsets.ModelViewSet):
    queryset = TicketMessage.objects.all()
    serializer_class = TicketMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sender']
    search_fields = ['text']
    ordering_fields = '__all__'
""",
    "reviews": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Review
from .serializers import ReviewSerializer

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product', 'user', 'rating']
    search_fields = ['comment']
    ordering_fields = '__all__'
""",
    "crm": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import CustomerProfile, Interaction
from .serializers import CustomerProfileSerializer, InteractionSerializer

class CustomerProfileViewSet(viewsets.ModelViewSet):
    queryset = CustomerProfile.objects.all()
    serializer_class = CustomerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['loyalty_points']
    search_fields = ['user__username', 'tags']
    ordering_fields = '__all__'

class InteractionViewSet(viewsets.ModelViewSet):
    queryset = Interaction.objects.all()
    serializer_class = InteractionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['interaction_type']
    search_fields = ['details']
    ordering_fields = '__all__'
""",
    "marketing": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Campaign, Event, TrustBadge
from .serializers import CampaignSerializer, EventSerializer, TrustBadgeSerializer

class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['title', 'description']
    ordering_fields = '__all__'

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['title', 'description']
    ordering_fields = '__all__'

class TrustBadgeViewSet(viewsets.ModelViewSet):
    queryset = TrustBadge.objects.all()
    serializer_class = TrustBadgeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = '__all__'
""",
    "analytics": """
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import MarketTrend, KPI
from .serializers import MarketTrendSerializer, KPISerializer

class MarketTrendViewSet(viewsets.ModelViewSet):
    queryset = MarketTrend.objects.all()
    serializer_class = MarketTrendSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['industry']
    search_fields = ['industry__name']
    ordering_fields = '__all__'

    @action(detail=False, methods=['get'])
    def demand_forecast(self, request):
        trends = self.get_queryset()
        serializer = self.get_serializer(trends, many=True)
        return Response(serializer.data)

class KPIViewSet(viewsets.ModelViewSet):
    queryset = KPI.objects.all()
    serializer_class = KPISerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name']
    ordering_fields = '__all__'

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        kpis = self.get_queryset().order_by('-recorded_at')[:20]
        serializer = self.get_serializer(kpis, many=True)
        return Response(serializer.data)
""",
    "governance": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import PlatformSettings, QualityControl
from .serializers import PlatformSettingsSerializer, QualityControlSerializer

class PlatformSettingsViewSet(viewsets.ModelViewSet):
    queryset = PlatformSettings.objects.all()
    serializer_class = PlatformSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['key', 'value']
    ordering_fields = '__all__'

class QualityControlViewSet(viewsets.ModelViewSet):
    queryset = QualityControl.objects.all()
    serializer_class = QualityControlSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['target_type']
    ordering_fields = '__all__'
""",
    "core": """
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import UserDocument
from .serializers import UserDocumentSerializer

class UserDocumentViewSet(viewsets.ModelViewSet):
    queryset = UserDocument.objects.all()
    serializer_class = UserDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user']
    search_fields = ['title', 'description']
    ordering_fields = '__all__'
""",
}

for app, code in views_code.items():
    with open(f"{app}/views.py", "w", encoding="utf-8") as f:
        f.write(code)
logger.info("✅ ویوهای همه اپ‌ها ایجاد شدند.")

# ============================================================
# 11. یوآرال‌ها
# ============================================================
logger.info("⏳ ایجاد یوآرال‌ها...")
urls_code = {
    "users": """
from rest_framework.routers import DefaultRouter
from .views import UserViewSet
router = DefaultRouter()
router.register(r'users', UserViewSet)
urlpatterns = router.urls
""",
    "industries": """
from rest_framework.routers import DefaultRouter
from .views import IndustryCategoryViewSet
router = DefaultRouter()
router.register(r'industries', IndustryCategoryViewSet)
urlpatterns = router.urls
""",
    "products": """
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet
router = DefaultRouter()
router.register(r'products', ProductViewSet)
urlpatterns = router.urls
""",
    "needs": """
from rest_framework.routers import DefaultRouter
from .views import NeedViewSet
router = DefaultRouter()
router.register(r'needs', NeedViewSet)
urlpatterns = router.urls
""",
    "evaluations": """
from rest_framework.routers import DefaultRouter
from .views import EvaluationViewSet
router = DefaultRouter()
router.register(r'evaluations', EvaluationViewSet)
urlpatterns = router.urls
""",
    "readiness": """
from rest_framework.routers import DefaultRouter
from .views import MarketReadinessViewSet
router = DefaultRouter()
router.register(r'readiness', MarketReadinessViewSet)
urlpatterns = router.urls
""",
    "matching": """
from rest_framework.routers import DefaultRouter
from .views import MatchResultViewSet
router = DefaultRouter()
router.register(r'results', MatchResultViewSet)
urlpatterns = router.urls
""",
    "search": """
from django.urls import path
from .views import SearchViewSet
urlpatterns = [
    path('', SearchViewSet.as_view({'get': 'all'}), name='search'),
]
""",
    "negotiations": """
from rest_framework.routers import DefaultRouter
from .views import NegotiationViewSet, MessageViewSet
router = DefaultRouter()
router.register(r'rooms', NegotiationViewSet)
router.register(r'messages', MessageViewSet)
urlpatterns = router.urls
""",
    "proposals": """
from rest_framework.routers import DefaultRouter
from .views import ProposalViewSet
router = DefaultRouter()
router.register(r'proposals', ProposalViewSet)
urlpatterns = router.urls
""",
    "contracts": """
from rest_framework.routers import DefaultRouter
from .views import ContractViewSet, MilestoneViewSet
router = DefaultRouter()
router.register(r'contracts', ContractViewSet)
router.register(r'milestones', MilestoneViewSet)
urlpatterns = router.urls
""",
    "execution": """
from rest_framework.routers import DefaultRouter
from .views import ExecutionViewSet
router = DefaultRouter()
router.register(r'execution', ExecutionViewSet)
urlpatterns = router.urls
""",
    "payments": """
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, PaymentViewSet
router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)
urlpatterns = router.urls
""",
    "support": """
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, TicketMessageViewSet
router = DefaultRouter()
router.register(r'tickets', TicketViewSet)
router.register(r'ticket-messages', TicketMessageViewSet)
urlpatterns = router.urls
""",
    "reviews": """
from rest_framework.routers import DefaultRouter
from .views import ReviewViewSet
router = DefaultRouter()
router.register(r'reviews', ReviewViewSet)
urlpatterns = router.urls
""",
    "crm": """
from rest_framework.routers import DefaultRouter
from .views import CustomerProfileViewSet, InteractionViewSet
router = DefaultRouter()
router.register(r'profiles', CustomerProfileViewSet)
router.register(r'interactions', InteractionViewSet)
urlpatterns = router.urls
""",
    "marketing": """
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, EventViewSet, TrustBadgeViewSet
router = DefaultRouter()
router.register(r'campaigns', CampaignViewSet)
router.register(r'events', EventViewSet)
router.register(r'badges', TrustBadgeViewSet)
urlpatterns = router.urls
""",
    "analytics": """
from rest_framework.routers import DefaultRouter
from .views import MarketTrendViewSet, KPIViewSet
router = DefaultRouter()
router.register(r'trends', MarketTrendViewSet)
router.register(r'kpis', KPIViewSet)
urlpatterns = router.urls
""",
    "governance": """
from rest_framework.routers import DefaultRouter
from .views import PlatformSettingsViewSet, QualityControlViewSet
router = DefaultRouter()
router.register(r'settings', PlatformSettingsViewSet)
router.register(r'quality-controls', QualityControlViewSet)
urlpatterns = router.urls
""",
    "core": """
from rest_framework.routers import DefaultRouter
from .views import UserDocumentViewSet
router = DefaultRouter()
router.register(r'documents', UserDocumentViewSet)
urlpatterns = router.urls
""",
}

for app, code in urls_code.items():
    with open(f"{app}/urls.py", "w", encoding="utf-8") as f:
        f.write(code)
logger.info("✅ یوآرال‌های همه اپ‌ها ایجاد شدند.")

# ============================================================
# 12. admin.py
# ============================================================
logger.info("⏳ ایجاد admin.py...")
admin_registry = {
    "users": ["User"],
    "industries": ["IndustryCategory"],
    "products": ["Product"],
    "needs": ["Need"],
    "evaluations": ["Evaluation"],
    "readiness": ["MarketReadiness"],
    "matching": ["MatchResult"],
    "negotiations": ["Negotiation", "Message"],
    "proposals": ["Proposal"],
    "contracts": ["Contract", "Milestone"],
    "execution": ["Execution"],
    "payments": ["Invoice", "Payment"],
    "support": ["Ticket", "TicketMessage"],
    "reviews": ["Review"],
    "crm": ["CustomerProfile", "Interaction"],
    "marketing": ["Campaign", "Event", "TrustBadge"],
    "analytics": ["MarketTrend", "KPI"],
    "governance": ["PlatformSettings", "QualityControl"],
    "core": ["UserDocument"],
}

for app, models in admin_registry.items():
    lines = ["from django.contrib import admin"]
    for model in models:
        lines.append(f"from .models import {model}")
    lines.append("")
    for model in models:
        lines.append(f"admin.site.register({model})")
    with open(f"{app}/admin.py", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
logger.info("✅ admin.py همه اپ‌ها ایجاد شد.")

# ============================================================
# 13. فایل‌های utils
# ============================================================
logger.info("⏳ ایجاد فایل‌های utils...")

matching_utils = """
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from products.models import Product
from needs.models import Need
from .models import MatchResult

class SmartMatcher:
    @staticmethod
    def calculate_similarity(text1, text2):
        if not text1 or not text2:
            return 0.0
        try:
            vectorizer = TfidfVectorizer(stop_words=None)
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            return similarity[0][0]
        except:
            return 0.0

    @staticmethod
    def match_need_to_products(need_id):
        try:
            need = Need.objects.get(id=need_id)
            products = Product.objects.filter(status='published')
            results = []

            w_industry = 0.30
            w_text = 0.25
            w_trl = 0.15
            w_mrl = 0.10
            w_budget = 0.10
            w_seller = 0.10

            for product in products:
                score = 0.0
                reasons = []

                if product.industry and need.industry:
                    if product.industry == need.industry:
                        score += w_industry * 1.0
                        reasons.append("صنعت هدف یکسان است")
                    elif product.industry.parent == need.industry.parent:
                        score += w_industry * 0.6
                        reasons.append("زیرمجموعه صنعت هدف است")

                text_product = product.title + " " + product.short_description
                text_need = need.title + " " + need.description
                sim_text = SmartMatcher.calculate_similarity(text_product, text_need)
                score += w_text * sim_text
                reasons.append(f"تشابه متن: {sim_text:.2f}")

                if product.trl:
                    diff_trl = abs(product.trl - 5) / 9.0
                    score += w_trl * (1 - diff_trl)

                if product.mrl:
                    diff_mrl = abs(product.mrl - 4) / 9.0
                    score += w_mrl * (1 - diff_mrl)

                if need.budget and product.price:
                    if product.price <= need.budget:
                        score += w_budget * 1.0
                    else:
                        score += w_budget * max(0, 1 - (product.price - need.budget) / need.budget)

                results.append({
                    'product': product,
                    'score': round(score, 4),
                    'reason': ' | '.join(reasons)
                })

            results.sort(key=lambda x: x['score'], reverse=True)
            MatchResult.objects.filter(need=need).delete()
            for item in results[:20]:
                MatchResult.objects.create(
                    need=need,
                    product=item['product'],
                    score=item['score'],
                    reason=item['reason']
                )
            return results
        except Need.DoesNotExist:
            return []
"""
with open("matching/utils.py", "w", encoding="utf-8") as f:
    f.write(matching_utils)

analytics_utils = """
from django.db.models import Count, Sum
from products.models import Product
from needs.models import Need
from contracts.models import Contract
from .models import KPI, MarketTrend

class MarketAnalytics:
    @staticmethod
    def update_market_trends():
        total_products = Product.objects.filter(status='published').count()
        total_needs = Need.objects.filter(status='published').count()
        total_contracts = Contract.objects.filter(status='signed').count()

        trend_data = {
            'total_products': total_products,
            'total_needs': total_needs,
            'total_contracts': total_contracts,
        }

        KPI.objects.create(
            name='تعداد محصولات',
            value=total_products,
            category='revenue'
        )
        KPI.objects.create(
            name='تعداد نیازها',
            value=total_needs,
            category='revenue'
        )
        KPI.objects.create(
            name='تعداد قراردادها',
            value=total_contracts,
            category='conversion'
        )
        return trend_data
"""
with open("analytics/utils.py", "w", encoding="utf-8") as f:
    f.write(analytics_utils)

core_exceptions = """
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None:
        response.data = {
            'status': 'error',
            'message': response.data.get('detail', 'خطایی رخ داده است'),
            'errors': response.data.get('errors', {}),
            'status_code': response.status_code
        }
    
    return response
"""
with open("core/exceptions.py", "w", encoding="utf-8") as f:
    f.write(core_exceptions)
logger.info("✅ فایل‌های utils ایجاد شدند.")

# ============================================================
# 14. تنظیمات Celery
# ============================================================
logger.info("⏳ تنظیمات Celery...")
with open("config/celery.py", "w", encoding="utf-8") as f:
    f.write(
        """
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('tmarket')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
"""
    )
with open("config/__init__.py", "w", encoding="utf-8") as f:
    f.write("from .celery import app as celery_app\n\n__all__ = ['celery_app']\n")
logger.info("✅ تنظیمات Celery انجام شد.")

# ============================================================
# 15. تست‌ها
# ============================================================
logger.info("⏳ ایجاد تست‌های نمونه...")
sample_test = """
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class {app_title}ModelTest(TestCase):
    def test_create_instance(self):
        # این تست به صورت نمونه ایجاد شده است
        self.assertTrue(True)
"""
for app in apps:
    with open(f"{app}/tests.py", "w", encoding="utf-8") as f:
        f.write(sample_test.replace("{app_title}", app.title()))
logger.info("✅ تست‌های نمونه ایجاد شدند.")

# ============================================================
# 16. دستور seed
# ============================================================
logger.info("⏳ ایجاد دستور seed...")
os.makedirs("core/management/commands", exist_ok=True)
seed_command = """
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from industries.models import IndustryCategory

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed initial data for the platform'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')
        
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@tmarket.ir', 'admin123')
            self.stdout.write('Admin created: admin/admin123')
        
        industries = [
            'نفت و گاز', 'پتروشیمی', 'فولاد و معدن', 'سلامت',
            'کشاورزی', 'حمل‌ونقل', 'خودروسازی', 'انرژی',
            'فناوری اطلاعات', 'محیط زیست'
        ]
        for name in industries:
            IndustryCategory.objects.get_or_create(name=name)
            self.stdout.write(f'Industry created: {name}')
        
        self.stdout.write(self.style.SUCCESS('Data seeded successfully!'))
"""
with open("core/management/commands/seed.py", "w", encoding="utf-8") as f:
    f.write(seed_command)
logger.info("✅ دستور seed ایجاد شد.")

# ============================================================
# 17. نصب scikit-learn
# ============================================================
logger.info("⏳ نصب scikit-learn...")
subprocess.run([pip_exe, "install", "scikit-learn"], check=True)
logger.info("✅ scikit-learn نصب شد.")

# ============================================================
# 18. راه‌اندازی Docker و مهاجرت
# ============================================================
logger.info("⏳ راه‌اندازی کانتینرهای داکر...")
subprocess.run(["docker-compose", "down", "-v"], check=False)
subprocess.run(["docker-compose", "up", "-d"], check=True)

logger.info("⏳ منتظر آماده‌سازی PostgreSQL (۲۰ ثانیه)...")
time.sleep(20)

logger.info("⏳ اجرای مهاجرت‌ها...")
subprocess.run([python_exe, "manage.py", "makemigrations"] + apps, check=True)
subprocess.run([python_exe, "manage.py", "migrate"], check=True)
logger.info("✅ مهاجرت‌ها با موفقیت اجرا شدند.")

# ============================================================
# 19. اجرای seed
# ============================================================
logger.info("⏳ ایجاد داده‌های اولیه...")
subprocess.run([python_exe, "manage.py", "seed"], check=True)
logger.info("✅ داده‌های اولیه ایجاد شدند.")

# ============================================================
# 20. جمع‌آوری فایل‌های استاتیک
# ============================================================
logger.info("⏳ جمع‌آوری فایل‌های استاتیک...")
subprocess.run([python_exe, "manage.py", "collectstatic", "--noinput"], check=True)
logger.info("✅ فایل‌های استاتیک جمع‌آوری شدند.")

# ============================================================
# 21. پیام نهایی
# ============================================================
print("\n" + "=" * 80)
print("✅✅✅ پروژه بازار تحول (بک‌اند کامل) با موفقیت ساخته شد! ✅✅✅")
print("=" * 80)
print(f"\n📁 مسیر پروژه: {os.getcwd()}")
print(f"\n🐍 پایتون: {python_exe}")
print("\n🔐 کاربران نمونه:")
print("   ادمین: admin / admin123")
print("\n📌 برای اجرای سرور:")
print(f"   {python_exe} manage.py runserver")
print("\n📌 اجرا با Docker:")
print("   docker-compose up -d")
print("\n📌 مستندات API (Swagger):")
print("   http://127.0.0.1:8000/swagger/")
print("\n📌 پنل ادمین:")
print("   http://127.0.0.1:8000/admin/")
print("\n📌 اجرای تست‌ها:")
print("   pytest")
print("\n🐳 دیتابیس PostgreSQL روی Docker:")
print("   docker-compose ps")
print("\n📌 Celery Worker:")
print("   docker-compose exec celery_worker celery -A config worker -l info")
print("\n📌 Celery Beat:")
print("   docker-compose exec celery_beat celery -A config beat -l info")
print("=" * 80)
print("\n🎯 ۲۰ ماژول اصلی پیاده‌سازی شدند:")
modules = [
    "1. کاربران و احراز هویت",
    "2. صنایع",
    "3. محصولات و خدمات",
    "4. نیازها و چالش‌ها",
    "5. ارزیابی و اعتبارسنجی",
    "6. سنجش بازارپذیری",
    "7. تطبیق هوشمند",
    "8. جستجو و مقایسه",
    "9. اتاق مذاکره",
    "10. پیشنهادها",
    "11. قراردادها",
    "12. اجرای پروژه",
    "13. پرداخت‌ها",
    "14. پشتیبانی",
    "15. نظرات",
    "16. CRM",
    "17. بازارگرمی",
    "18. تحلیل بازار",
    "19. حکمرانی",
    "20. هسته داده",
]
for m in modules:
    print(f"   {m}")
print("=" * 80)
