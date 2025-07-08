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
    DiagnoseImageAPIView,
    ChatHistoryView,
    CustomTokenObtainPairView,
    diagnose_stream_view
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
    path('diagnose/', diagnose_stream_view, name='ai-diagnose'),
    path('img-diagnose/', DiagnoseImageAPIView.as_view(), name='img-diagnose'),
    path('chat/history/', ChatHistoryView.as_view(), name='chat-history'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),

]
