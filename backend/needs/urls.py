
from rest_framework.routers import DefaultRouter
from .views import NeedViewSet
router = DefaultRouter()
router.register(r'needs', NeedViewSet)
urlpatterns = router.urls
