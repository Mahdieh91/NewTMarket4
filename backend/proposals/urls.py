# proposals/urls.py
from rest_framework.routers import DefaultRouter
from .views import ProposalViewSet

router = DefaultRouter()
router.register(r'proposals', ProposalViewSet)

urlpatterns = router.urls