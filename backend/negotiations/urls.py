from rest_framework.routers import DefaultRouter
from .views import NegotiationViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'negotiations', NegotiationViewSet, basename='negotiation')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = router.urls