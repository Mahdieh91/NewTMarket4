# analytics/urls.py

from django.urls import path
from .views import (
    MarketIntelligenceAPIView,
    CompetitorAnalysisAPIView,
    DashboardAPIView,
)

urlpatterns = [
    path('market-intelligence/', MarketIntelligenceAPIView.as_view(), name='market-intelligence'),
    path('competitor-analysis/', CompetitorAnalysisAPIView.as_view(), name='competitor-analysis'),
    path('dashboard/', DashboardAPIView.as_view(), name='dashboard'),
    path('services/', MarketIntelligenceAPIView.as_view(), name='services'),
]