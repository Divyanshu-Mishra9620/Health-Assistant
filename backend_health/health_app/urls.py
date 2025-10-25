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
    ChatDeleteView,
    CustomTokenObtainPairView,
    diagnose_stream_view,
    UserProfileUpdateView,
    HealthRecordView,
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
    path('chat/delete/<int:chat_id>/', ChatDeleteView.as_view(), name='chat-delete'),
    path('user/profile/', UserProfileUpdateView.as_view(), name='user-profile-update'),
    path('health/records/', HealthRecordView.as_view(), name='health-records'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
]
