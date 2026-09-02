# trl_assessment/urls.py
from django.urls import path
from .views import TRLAssessmentView

urlpatterns = [
    path('assess/', TRLAssessmentView.as_view(), name='trl_assess'),
]