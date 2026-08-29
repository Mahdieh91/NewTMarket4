# config/asgi.py
import os

os.environ.setdefault(
    'DJANGO_SETTINGS_MODULE',
    'config.settings',
)

from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from channels.routing import (
    ProtocolTypeRouter,
    URLRouter,
)

from channels.security.websocket import (
    AllowedHostsOriginValidator,
)

from negotiations.routing import websocket_urlpatterns  # <-- تغییر: استفاده از routing
from negotiations.jwt_middleware import (
    JWTAuthMiddleware,
)


application = ProtocolTypeRouter({

    'http':
        django_asgi_app,

    'websocket':
        AllowedHostsOriginValidator(

            JWTAuthMiddleware(

                URLRouter(
                    websocket_urlpatterns  # <-- تغییر: ارجاع به لیست مسیرها
                )

            )

        ),

})