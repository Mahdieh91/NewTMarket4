# negotiations/admin.py
from django.contrib import admin
from .models import Negotiation, Message

admin.site.register(Negotiation)
admin.site.register(Message)