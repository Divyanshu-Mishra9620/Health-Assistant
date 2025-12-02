"""
LangChain-based chat helper with conversation memory using vector database
"""
import os
from typing import List, Dict, Generator, Optional, Any
from django.conf import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from health_app.services.vector_store_service import get_vector_store
from health_app.services.medical_knowledge_base import get_medical_knowledge_base
import uuid


class LangChainChatService:
    """Enhanced chat service with LangChain, RAG, and vector database memory"""
    
    def __init__(self):
        # Get Gemini API key from Django settings
        self.gemini_api_key = settings.GEMINI_API_KEY
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not configured in settings")
        
        self.chat_model = ChatGoogleGenerativeAI(
            google_api_key=self.gemini_api_key,
            model="gemini-1.5-flash",
            temperature=0.7,
            streaming=True
        )
        
        self.vector_store = get_vector_store()
        
        self.medical_kb = get_medical_knowledge_base()
        
        self.system_prompt = """You are an intelligent AI health assistant with access to medical research papers and clinical guidelines. You have access to both the user's conversation history and curated medical literature to provide evidence-based, personalized health advice.

Your responsibilities:
1. **Symptom Analysis**: Analyze symptoms thoroughly and provide preliminary health insights based on medical research
2. **Evidence-Based Guidance**: Reference relevant research papers and clinical guidelines in your responses with proper citations
3. **Conversation Continuity**: Remember and reference past conversations to provide personalized, continuous care
4. **Proactive Follow-up**: Ask relevant follow-up questions based on medical history and research findings
5. **Recommendations**: Provide evidence-based recommendations while emphasizing professional medical consultation
6. **Empathy & Support**: Be empathetic, supportive, and non-judgmental in all interactions
7. **Citation Format**: When citing research, use format: [Research: Title/Topic - Key Finding]

Important guidelines:
- Always remind users that your advice is for informational purposes only
- Encourage users to consult healthcare professionals for serious or persistent concerns
- If you notice recurring symptoms, mention them and suggest professional evaluation
- Maintain patient confidentiality and privacy at all times
- Base recommendations on provided medical research when available
- For emergency symptoms (chest pain, difficulty breathing, severe bleeding), immediately advise seeking emergency care
- When uncertain, acknowledge limitations and recommend professional consultation

Context Usage:
- **Patient Profile**: Use age, gender, allergies, and medical history for personalized responses
- **Conversation History**: Reference previous discussions to maintain continuity
- **Medical Literature**: Cite research papers to support your recommendations
- **Current Question**: Address the user's immediate concern comprehensively

Remember: You are a supportive first-line health resource, not a replacement for professional medical care."""
    
    def generate_session_id(self) -> str:
        """Generate a unique session ID"""
        return str(uuid.uuid4())
    
    def get_enhanced_prompt(
        self,
        user_id: int,
        user_message: str,
        user_profile: Optional[Dict] = None,
        include_research: bool = True
    ) -> str:
        """
        Create an enhanced prompt with conversation context, user profile, and medical research
        
        Args:
            user_id: User ID
            user_message: Current user message
            user_profile: User health profile data
            include_research: Whether to include medical research context
        
        Returns:
            Enhanced prompt with context and research
        """
        conversation_context = self.vector_store.get_conversation_context(
            user_id=user_id,
            current_message=user_message,
            max_context_items=5  # Increased from 3 for better context
        )
        
        research_context = None
        if include_research:
            research_context = self.medical_kb.get_research_context(
                query=user_message,
                max_results=3  # Increased from 2 for better coverage
            )
        
        prompt_parts = []
        
        # Add user profile first for personalization
        if user_profile:
            profile_text = self._format_user_profile(user_profile)
            prompt_parts.append(f"**Patient Profile:**\n{profile_text}\n")
        
        # Add conversation history for continuity
        if conversation_context:
            prompt_parts.append(f"**Conversation History:**\n{conversation_context}\n")
        
        # Add medical research for evidence-based responses
        if research_context:
            prompt_parts.append(f"**Relevant Medical Literature:**\n{research_context}\n")
        
        # Add current question with clear marker
        prompt_parts.append(f"**Current Question:**\n{user_message}\n")
        
        # Add instruction for the AI
        prompt_parts.append(
            "\n**Instructions:** Provide a comprehensive, evidence-based response that:\n"
            "1. References the patient's profile and history\n"
            "2. Cites relevant medical research when available\n"
            "3. Offers actionable health advice\n"
            "4. Maintains empathy and clarity"
        )
        
        return "\n".join(prompt_parts)
    
    def _format_user_profile(self, profile: Dict) -> str:
        """Format user profile data for prompt"""
        profile_lines = []
        
        if profile.get('age'):
            profile_lines.append(f"Age: {profile['age']}")
        if profile.get('gender'):
            profile_lines.append(f"Gender: {profile['gender']}")
        if profile.get('height_cm'):
            profile_lines.append(f"Height: {profile['height_cm']} cm")
        if profile.get('weight_kg'):
            profile_lines.append(f"Weight: {profile['weight_kg']} kg")
        if profile.get('blood_group'):
            profile_lines.append(f"Blood Group: {profile['blood_group']}")
        if profile.get('allergies'):
            profile_lines.append(f"Allergies: {profile['allergies']}")
        
        return "\n".join(profile_lines) if profile_lines else "No profile information available"
    
    def stream_chat_response(
        self,
        user_id: int,
        user_message: str,
        session_id: Optional[str] = None,
        user_profile: Optional[Dict] = None
    ) -> Generator[str, None, None]:
        """
        Stream chat response with conversation memory
        
        Args:
            user_id: User ID
            user_message: User's message
            session_id: Optional session ID (generates new one if not provided)
            user_profile: Optional user health profile
        
        Yields:
            Response chunks
        """
        if not session_id:
            session_id = self.generate_session_id()
        
        try:
            self.vector_store.add_conversation(
                user_id=user_id,
                session_id=session_id,
                role="user",
                content=user_message
            )
        except Exception as e:
            print(f"Error storing user message in vector DB: {e}")
        
        enhanced_prompt = self.get_enhanced_prompt(
            user_id=user_id,
            user_message=user_message,
            user_profile=user_profile
        )
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=enhanced_prompt)
        ]
        
        assistant_response = ""
        try:
            for chunk in self.chat_model.stream(messages):
                if hasattr(chunk, 'content') and chunk.content:
                    assistant_response += chunk.content
                    yield chunk.content
            
            try:
                self.vector_store.add_conversation(
                    user_id=user_id,
                    session_id=session_id,
                    role="assistant",
                    content=assistant_response
                )
            except Exception as e:
                print(f"Error storing assistant message in vector DB: {e}")
                
        except Exception as e:
            error_msg = f"Error generating response: {str(e)}"
            print(error_msg)
            yield f"\n[Error] {error_msg}"
    
    def stream_symptom_analysis(
        self,
        user_id: int,
        symptoms: List[str],
        session_id: Optional[str] = None,
        user_profile: Optional[Dict] = None
    ) -> Generator[str, None, None]:
        """
        Stream symptom analysis with conversation memory
        
        Args:
            user_id: User ID
            symptoms: List of symptoms
            session_id: Optional session ID
            user_profile: Optional user health profile
        
        Yields:
            Analysis chunks
        """
        symptoms_text = ", ".join(symptoms)
        symptom_message = f"I'm experiencing the following symptoms: {symptoms_text}"
        
        yield from self.stream_chat_response(
            user_id=user_id,
            user_message=symptom_message,
            session_id=session_id,
            user_profile=user_profile
        )
    
    def get_session_summary(self, user_id: int, session_id: str) -> Dict[str, Any]:
        """
        Get summary of a conversation session
        
        Args:
            user_id: User ID
            session_id: Session ID
        
        Returns:
            Session summary with message count, topics, and timeline
        """
        try:
            messages = self.vector_store.get_session_messages(user_id, session_id)
            
            return {
                'session_id': session_id,
                'message_count': len(messages),
                'duration_minutes': self._calculate_session_duration(messages),
                'topics_discussed': self._extract_topics(messages),
                'last_activity': messages[-1]['timestamp'] if messages else None
            }
        except Exception as e:
            print(f"Error getting session summary: {e}")
            return {'error': str(e)}
    
    def _calculate_session_duration(self, messages: List[Dict]) -> int:
        """Calculate session duration in minutes"""
        if len(messages) < 2:
            return 0
        
        from datetime import datetime
        try:
            first = datetime.fromisoformat(messages[0]['timestamp'].replace('Z', '+00:00'))
            last = datetime.fromisoformat(messages[-1]['timestamp'].replace('Z', '+00:00'))
            return int((last - first).total_seconds() / 60)
        except (ValueError, KeyError, AttributeError):
            return 0
    
    def _extract_topics(self, messages: List[Dict]) -> List[str]:
        """Extract main topics from messages"""
        topics = set()
        health_keywords = [
            'headache', 'fever', 'pain', 'cough', 'cold', 'flu', 
            'stomach', 'back', 'chest', 'throat', 'allergies',
            'sleep', 'stress', 'anxiety', 'medication', 'diet'
        ]
        
        for msg in messages:
            content = msg.get('content', '').lower()
            for keyword in health_keywords:
                if keyword in content:
                    topics.add(keyword)
        
        return list(topics)[:5]  # Return top 5 topics


_langchain_service = None


def get_langchain_service() -> LangChainChatService:
    """Get or create LangChain service singleton"""
    global _langchain_service
    if _langchain_service is None:
        _langchain_service = LangChainChatService()
    return _langchain_service
