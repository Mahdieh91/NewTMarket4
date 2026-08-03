
from rest_framework.routers import DefaultRouter
from .views import MarketReadinessViewSet
router = DefaultRouter()
router.register(r'readiness', MarketReadinessViewSet)
urlpatterns = router.urls
