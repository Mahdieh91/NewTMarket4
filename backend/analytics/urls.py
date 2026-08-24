from django.urls import path

from .views import MarketIntelligenceAPIView, DashboardAPIView


urlpatterns = [
    path(
        'market-intelligence/',
        MarketIntelligenceAPIView.as_view(),
        name='market-intelligence'
    ),

    path(
        'dashboard/',
        DashboardAPIView.as_view(),
        name='dashboard'
    ),

    path(
        'services/',
        MarketIntelligenceAPIView.as_view(),
        name='services'
    ),
]