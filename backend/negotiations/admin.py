from django.contrib import admin
from .models import Negotiation
from .models import Message

admin.site.register(Negotiation)
admin.site.register(Message)