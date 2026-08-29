# negotiations/routing.py
from django.urls import re_path
from .consumers import NegotiationConsumer

websocket_urlpatterns = [
    re_path(
        r'ws/negotiation/(?P<nego_id>\d+)/$',
        NegotiationConsumer.as_asgi(),
    ),
]