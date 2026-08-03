from django.contrib import admin
from .models import Invoice
from .models import Payment

admin.site.register(Invoice)
admin.site.register(Payment)