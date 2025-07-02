from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    RegisterView,
    SymptomViewSet,
    UserProfileViewSet,
    UserSymptomLogViewSet,
    AIDiagnosisResponseViewSet,
    ChatLogViewSet,
    MedicationViewSet,
    DiagnoseAPIView,
)

router = DefaultRouter()
router.register(r'symptoms', SymptomViewSet)
router.register(r'profile', UserProfileViewSet)
router.register(r'logs', UserSymptomLogViewSet)
router.register(r'diagnoses', AIDiagnosisResponseViewSet)
router.register(r'chatlog', ChatLogViewSet)
router.register(r'medications', MedicationViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('diagnose/', DiagnoseAPIView.as_view(), name='ai-diagnose'),
]
