
from rest_framework.routers import DefaultRouter
from .views import MarketTrendViewSet, KPIViewSet
router = DefaultRouter()
router.register(r'trends', MarketTrendViewSet)
router.register(r'kpis', KPIViewSet)
urlpatterns = router.urls
