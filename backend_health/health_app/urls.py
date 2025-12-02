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

from .views_enhanced import (
    chat_with_memory_view,
    diagnose_with_memory_view,
    get_conversation_insights_view,
    search_medical_research_view,
    get_medical_categories_view,
    get_session_summary_view,
    clear_conversation_memory_view,
    get_active_sessions_view,
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
    
    path('chat/', chat_with_memory_view, name='chat-with-memory'),
    path('diagnose/enhanced/', diagnose_with_memory_view, name='diagnose-with-memory'),
    path('chat/insights/', get_conversation_insights_view, name='conversation-insights'),
    path('chat/session/summary/', get_session_summary_view, name='session-summary'),
    path('chat/session/active/', get_active_sessions_view, name='active-sessions'),
    path('chat/memory/clear/', clear_conversation_memory_view, name='clear-memory'),
    path('research/search/', search_medical_research_view, name='search-medical-research'),
    path('research/categories/', get_medical_categories_view, name='medical-categories'),
    
    path('chat/history/', ChatHistoryView.as_view(), name='chat-history'),
    path('chat/delete/<int:chat_id>/', ChatDeleteView.as_view(), name='chat-delete'),
    
    path('user/profile/', UserProfileUpdateView.as_view(), name='user-profile-update'),
    path('health/records/', HealthRecordView.as_view(), name='health-records'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
]
