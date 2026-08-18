# negotiations/urls.py

from rest_framework.routers import DefaultRouter

from .views import MessageViewSet, NegotiationViewSet


router = DefaultRouter()

router.register(
    r'negotiations',
    NegotiationViewSet,
    basename='negotiation',
)

router.register(
    r'messages',
    MessageViewSet,
    basename='message',
)


urlpatterns = router.urls