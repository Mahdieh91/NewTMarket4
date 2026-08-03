
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, EventViewSet, TrustBadgeViewSet
router = DefaultRouter()
router.register(r'campaigns', CampaignViewSet)
router.register(r'events', EventViewSet)
router.register(r'badges', TrustBadgeViewSet)
urlpatterns = router.urls
