# mrl_assessment/urls.py
from django.urls import path
from .views import MRLAssessmentView

urlpatterns = [
    path('assess/', MRLAssessmentView.as_view(), name='mrl_assess'),
]