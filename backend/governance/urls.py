
from rest_framework.routers import DefaultRouter
from .views import PlatformSettingsViewSet, QualityControlViewSet
router = DefaultRouter()
router.register(r'settings', PlatformSettingsViewSet)
router.register(r'quality-controls', QualityControlViewSet)
urlpatterns = router.urls
