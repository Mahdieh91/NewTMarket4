
from rest_framework.routers import DefaultRouter
from .views import ExecutionViewSet
router = DefaultRouter()
router.register(r'execution', ExecutionViewSet)
urlpatterns = router.urls
