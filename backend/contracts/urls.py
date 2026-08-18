from rest_framework.routers import DefaultRouter

from .views import ContractViewSet, MilestoneViewSet


router = DefaultRouter()

router.register(r'contracts', ContractViewSet, basename='contract')
router.register(r'milestones', MilestoneViewSet, basename='milestone')


urlpatterns = router.urls