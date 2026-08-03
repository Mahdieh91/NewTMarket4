
from rest_framework.routers import DefaultRouter
from .views import ContractViewSet, MilestoneViewSet
router = DefaultRouter()
router.register(r'contracts', ContractViewSet)
router.register(r'milestones', MilestoneViewSet)
urlpatterns = router.urls
