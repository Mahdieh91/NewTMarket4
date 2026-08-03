from django.contrib import admin
from .models import Campaign
from .models import Event
from .models import TrustBadge

admin.site.register(Campaign)
admin.site.register(Event)
admin.site.register(TrustBadge)