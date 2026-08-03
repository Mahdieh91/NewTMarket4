
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, TicketMessageViewSet
router = DefaultRouter()
router.register(r'tickets', TicketViewSet)
router.register(r'ticket-messages', TicketMessageViewSet)
urlpatterns = router.urls
