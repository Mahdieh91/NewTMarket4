
from rest_framework.routers import DefaultRouter
from .views import CustomerProfileViewSet, InteractionViewSet
router = DefaultRouter()
router.register(r'profiles', CustomerProfileViewSet)
router.register(r'interactions', InteractionViewSet)
urlpatterns = router.urls
