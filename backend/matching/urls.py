
from rest_framework.routers import DefaultRouter
from .views import MatchResultViewSet
router = DefaultRouter()
router.register(r'results', MatchResultViewSet)
urlpatterns = router.urls
