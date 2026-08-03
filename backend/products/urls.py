# products/urls.py
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, SupplyViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'supplies', SupplyViewSet)

urlpatterns = router.urls