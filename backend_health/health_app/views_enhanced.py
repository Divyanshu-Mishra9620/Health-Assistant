"""
Enhanced chat views using LangChain with vector database memory
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import StreamingHttpResponse
from .models import ChatLog, Symptom, UserProfile, ConversationMemory
from .utils.langchain_helper import get_langchain_service
from .services.medical_knowledge_base import get_medical_knowledge_base
import logging
import uuid

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_with_memory_view(request):
    """
    Enhanced chat endpoint that uses LangChain and vector database for conversation memory
    """
    try:
        user_message = request.data.get('message', '').strip()
        session_id = request.data.get('session_id') or str(uuid.uuid4())
        
        if not user_message:
            return Response({"error": "Message is required"}, status=400)
        
        user_profile = None
        try:
            profile = UserProfile.objects.get(user=request.user)
            user_profile = {
                'age': profile.age,
                'gender': profile.gender,
                'height_cm': profile.height_cm,
                'weight_kg': profile.weight_kg,
                'blood_group': profile.blood_group,
                'allergies': profile.allergies
            }
        except UserProfile.DoesNotExist:
            pass
        
        user_chat = ChatLog.objects.create(
            user=request.user,
            message=user_message,
            is_user=True,
            session_id=session_id
        )
        
        ConversationMemory.objects.create(
            user=request.user,
            session_id=session_id,
            role='user',
            content=user_message,
            chat_log=user_chat,
            vectorized=False  
        )
        
        langchain_service = get_langchain_service()
        
        def stream_response():
            bot_response = ""
            try:
                for chunk in langchain_service.stream_chat_response(
                    user_id=request.user.id,
                    user_message=user_message,
                    session_id=session_id,
                    user_profile=user_profile
                ):
                    bot_response += chunk
                    yield chunk
                
                bot_chat = ChatLog.objects.create(
                    user=request.user,
                    message=bot_response,
                    is_user=False,
                    session_id=session_id
                )
                
                ConversationMemory.objects.create(
                    user=request.user,
                    session_id=session_id,
                    role='assistant',
                    content=bot_response,
                    chat_log=bot_chat,
                    vectorized=False  
                )
                
            except Exception as e:
                logger.exception("Error in chat with memory")
                error_msg = f"\n[Error] {str(e)}"
                yield error_msg
                
                ChatLog.objects.create(
                    user=request.user,
                    message=error_msg,
                    is_user=False,
                    session_id=session_id
                )
        
        return StreamingHttpResponse(stream_response(), content_type="text/plain")
        
    except Exception as outer_error:
        logger.exception("Outer error in chat_with_memory_view")
        return Response({"error": str(outer_error)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def diagnose_with_memory_view(request):
    """
    Enhanced symptom diagnosis endpoint with conversation memory
    """
    try:
        symptom_names = request.data.get('symptom_names', [])
        session_id = request.data.get('session_id') or str(uuid.uuid4())
        
        cleaned_symptoms = [s.strip() for s in symptom_names if s.strip()]
        
        if not cleaned_symptoms:
            return Response({"error": "At least one symptom is required"}, status=400)
        
        symptoms = []
        for name in cleaned_symptoms:
            symptom, _ = Symptom.objects.get_or_create(
                name__iexact=name,
                defaults={"name": name}
            )
            symptoms.append(symptom)
        
        user_profile = None
        try:
            profile = UserProfile.objects.get(user=request.user)
            user_profile = {
                'age': profile.age,
                'gender': profile.gender,
                'height_cm': profile.height_cm,
                'weight_kg': profile.weight_kg,
                'blood_group': profile.blood_group,
                'allergies': profile.allergies
            }
        except UserProfile.DoesNotExist:
            pass
        
        user_message = f"I'm experiencing: {', '.join(cleaned_symptoms)}"
        user_log = ChatLog.objects.create(
            user=request.user,
            message=user_message,
            is_user=True,
            session_id=session_id
        )
        user_log.symptom_references.set(symptoms)
        
        ConversationMemory.objects.create(
            user=request.user,
            session_id=session_id,
            role='user',
            content=user_message,
            chat_log=user_log,
            vectorized=False
        )
        
        langchain_service = get_langchain_service()
        
        def stream_response():
            bot_response = ""
            try:
                for chunk in langchain_service.stream_symptom_analysis(
                    user_id=request.user.id,
                    symptoms=cleaned_symptoms,
                    session_id=session_id,
                    user_profile=user_profile
                ):
                    bot_response += chunk
                    yield chunk
                
                bot_log = ChatLog.objects.create(
                    user=request.user,
                    message=bot_response,
                    is_user=False,
                    session_id=session_id
                )
                bot_log.symptom_references.set(symptoms)
                
                ConversationMemory.objects.create(
                    user=request.user,
                    session_id=session_id,
                    role='assistant',
                    content=bot_response,
                    chat_log=bot_log,
                    vectorized=False
                )
                
            except Exception as e:
                logger.exception("Error in diagnose with memory")
                error_msg = f"\n[Error] {str(e)}"
                yield error_msg
                
                ChatLog.objects.create(
                    user=request.user,
                    message=error_msg,
                    is_user=False,
                    session_id=session_id
                )
        
        return StreamingHttpResponse(stream_response(), content_type="text/plain")
        
    except Exception as outer_error:
        logger.exception("Outer error in diagnose_with_memory_view")
        return Response({"error": str(outer_error)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation_insights_view(request):
    """
    Get insights about user's conversation history
    """
    try:
        total_conversations = ConversationMemory.objects.filter(
            user=request.user
        ).count()
        
        unique_sessions = ConversationMemory.objects.filter(
            user=request.user
        ).values('session_id').distinct().count()
        
        recent_messages = ConversationMemory.objects.filter(
            user=request.user,
            role='user'
        ).order_by('-timestamp')[:10]
        
        return Response({
            'total_messages': total_conversations,
            'unique_sessions': unique_sessions,
            'recent_conversations': [
                {
                    'session_id': msg.session_id,
                    'content': msg.content[:100] + '...' if len(msg.content) > 100 else msg.content,
                    'timestamp': msg.timestamp
                }
                for msg in recent_messages
            ]
        })
        
    except Exception as e:
        logger.exception("Error getting conversation insights")
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_medical_research_view(request):
    """
    Search medical knowledge base for health information
    """
    try:
        query = request.data.get('query', '').strip()
        max_results = request.data.get('max_results', 3)
        category = request.data.get('category')
        
        if not query:
            return Response({"error": "Query is required"}, status=400)
        
        medical_kb = get_medical_knowledge_base()
        
        results = medical_kb.search_medical_knowledge(
            query=query,
            k=max_results,
            category=category
        )
        
        return Response({
            'query': query,
            'results_count': len(results),
            'results': results,
            'available_categories': medical_kb.get_available_categories()
        })
        
    except Exception as e:
        logger.exception("Error searching medical research")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_medical_categories_view(request):
    """
    Get available medical research categories
    """
    try:
        medical_kb = get_medical_knowledge_base()
        categories = medical_kb.get_available_categories()
        
        return Response({
            'categories': categories,
            'total_count': len(categories)
        })
        
    except Exception as e:
        logger.exception("Error getting medical categories")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_summary_view(request):
    """
    Get summary of a specific conversation session
    """
    try:
        session_id = request.query_params.get('session_id')
        
        if not session_id:
            return Response({"error": "session_id is required"}, status=400)
        
        langchain_service = get_langchain_service()
        summary = langchain_service.get_session_summary(
            user_id=request.user.id,
            session_id=session_id
        )
        
        return Response(summary)
        
    except Exception as e:
        logger.exception("Error getting session summary")
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_conversation_memory_view(request):
    """
    Clear conversation memory for a user (optional: specific session)
    """
    try:
        session_id = request.data.get('session_id')
        
        if session_id:
            # Clear specific session
            deleted_count = ConversationMemory.objects.filter(
                user=request.user,
                session_id=session_id
            ).delete()[0]
            message = f"Cleared {deleted_count} messages from session {session_id}"
        else:
            # Clear all conversations
            deleted_count = ConversationMemory.objects.filter(
                user=request.user
            ).delete()[0]
            message = f"Cleared all {deleted_count} conversation messages"
        
        return Response({
            'success': True,
            'message': message,
            'deleted_count': deleted_count
        })
        
    except Exception as e:
        logger.exception("Error clearing conversation memory")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_sessions_view(request):
    """
    Get all active conversation sessions for the user
    """
    try:
        from django.db.models import Count, Max
        
        sessions = ConversationMemory.objects.filter(
            user=request.user
        ).values('session_id').annotate(
            message_count=Count('id'),
            last_activity=Max('timestamp')
        ).order_by('-last_activity')[:10]
        
        return Response({
            'total_sessions': sessions.count() if hasattr(sessions, 'count') else len(sessions),
            'sessions': list(sessions)
        })
        
    except Exception as e:
        logger.exception("Error getting active sessions")
        return Response({"error": str(e)}, status=500)

