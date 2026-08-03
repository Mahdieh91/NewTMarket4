
from rest_framework.routers import DefaultRouter
from .views import IndustryCategoryViewSet
router = DefaultRouter()
router.register(r'industries', IndustryCategoryViewSet)
urlpatterns = router.urls
