
from rest_framework.routers import DefaultRouter
from .views import NegotiationViewSet, MessageViewSet
router = DefaultRouter()
router.register(r'rooms', NegotiationViewSet)
router.register(r'messages', MessageViewSet)
urlpatterns = router.urls
