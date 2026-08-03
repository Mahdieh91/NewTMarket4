from django.contrib import admin
from .models import Ticket
from .models import TicketMessage

admin.site.register(Ticket)
admin.site.register(TicketMessage)