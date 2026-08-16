# supply/models.py

"""
Compatibility layer

مدل‌های اصلی Supply و SupplyImage در اپ products تعریف شده‌اند.

این فایل عمداً مدل جدیدی تعریف نمی‌کند تا در پروژه فقط
یک Supply و یک SupplyImage وجود داشته باشد.

در نتیجه کدهای قدیمی مانند:

    from supply.models import Supply

همچنان کار خواهند کرد و همان مدل اصلی products.Supply را دریافت می‌کنند.
"""

from products.models import Supply, SupplyImage

__all__ = [
    'Supply',
    'SupplyImage',
]