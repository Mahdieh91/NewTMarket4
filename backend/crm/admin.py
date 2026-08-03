from django.contrib import admin
from .models import CustomerProfile
from .models import Interaction

admin.site.register(CustomerProfile)
admin.site.register(Interaction)