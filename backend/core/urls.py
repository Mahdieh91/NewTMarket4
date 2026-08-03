
from rest_framework.routers import DefaultRouter
from .views import UserDocumentViewSet
router = DefaultRouter()
router.register(r'documents', UserDocumentViewSet)
urlpatterns = router.urls
