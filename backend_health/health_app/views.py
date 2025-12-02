from rest_framework import viewsets, serializers
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model 

from django.contrib.auth.password_validation import validate_password
from django.http import StreamingHttpResponse
from .utils.gemini_helper import stream_ai_diagnosis, stream_ai_image_analysis

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
import logging
import uuid
from datetime import datetime

# Import vector store for learning capabilities
from .services.vector_store_service import get_vector_store

logger = logging.getLogger(__name__)

from .models import (
    Symptom,
    UserProfile,
    UserSymptomLog,
    AIDiagnosisResponse,
    ChatLog,
    Medication,
    CustomUser
)
from .serializers import (
    SymptomSerializer,
    UserProfileSerializer,
    UserSymptomLogSerializer,
    AIDiagnosisResponseSerializer,
    ChatLogSerializer,
    MedicationSerializer
)
User = get_user_model()

# ──────── Registration ────────
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    full_name = serializers.CharField(write_only=True)
    email = serializers.EmailField()

    age = serializers.IntegerField(write_only=True)
    gender = serializers.ChoiceField(choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], write_only=True)
    height_cm = serializers.FloatField(required=False, write_only=True)
    weight_kg = serializers.FloatField(required=False, write_only=True)
    blood_group = serializers.CharField(required=False, allow_blank=True, write_only=True)
    allergies = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = CustomUser 
        fields = [
            'email', 'password', 'full_name',
            'age', 'gender', 'height_cm', 'weight_kg',
            'blood_group', 'allergies'
        ]

    def create(self, validated_data):
        profile_data = {
            'age': validated_data.pop('age'),
            'gender': validated_data.pop('gender'),
            'height_cm': validated_data.pop('height_cm', None),
            'weight_kg': validated_data.pop('weight_kg', None),
            'blood_group': validated_data.pop('blood_group', ''),
            'allergies': validated_data.pop('allergies', ''),
        }

        full_name = validated_data.pop("full_name")
        email = validated_data["email"]
        password = validated_data["password"]

        user = CustomUser.objects.create_user(email=email, password=password, full_name=full_name)
        UserProfile.objects.create(user=user, **profile_data)
        return user

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            profile = UserProfile.objects.get(user=user)

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "email": user.email,
                    "full_name": user.full_name,
                    "age": profile.age,
                    "gender": profile.gender,
                    "height_cm": profile.height_cm,
                    "weight_kg": profile.weight_kg,
                    "blood_group": profile.blood_group,
                    "allergies": profile.allergies,
                }
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# ──────── UserProfile ────────

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ──────── Symptom ────────

class SymptomViewSet(viewsets.ModelViewSet):
    queryset = Symptom.objects.all()
    serializer_class = SymptomSerializer


# ──────── UserSymptomLog ────────

class UserSymptomLogViewSet(viewsets.ModelViewSet):
    queryset = UserSymptomLog.objects.all()
    serializer_class = UserSymptomLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserSymptomLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ──────── AIDiagnosisResponse ────────

class AIDiagnosisResponseViewSet(viewsets.ModelViewSet):
    queryset = AIDiagnosisResponse.objects.all()
    serializer_class = AIDiagnosisResponseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AIDiagnosisResponse.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ──────── ChatLog ────────

class ChatLogViewSet(viewsets.ModelViewSet):
    queryset = ChatLog.objects.all()
    serializer_class = ChatLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ──────── Medication ────────

class MedicationViewSet(viewsets.ModelViewSet):
    queryset = Medication.objects.all()
    serializer_class = MedicationSerializer


# ──────── Diagnose  ──────── 
from rest_framework.decorators import api_view, permission_classes
from django.http import StreamingHttpResponse
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def diagnose_stream_view(request):
    try:
        symptom_names = request.data.get('symptom_names', [])
        cleaned_symptoms = [s.strip() for s in symptom_names if s.strip()]
        
        symptoms = []
        for name in cleaned_symptoms:
            symptom, _ = Symptom.objects.get_or_create(name__iexact=name, defaults={"name": name})
            symptoms.append(symptom)

        user_message = ", ".join(cleaned_symptoms)
        user_log = ChatLog.objects.create(
            user=request.user,
            message=user_message,
            is_user=True
        )
        user_log.symptom_references.set(symptoms)

        # Initialize vector store for learning
        try:
            vector_store = get_vector_store()
            session_id = str(uuid.uuid4())
            
            # Store user message in vector database
            vector_store.add_conversation(
                user_id=str(request.user.id),
                session_id=session_id,
                role="user",
                content=user_message,
                metadata={
                    "timestamp": datetime.now().isoformat(),
                    "symptom_count": len(symptoms),
                    "chat_log_id": user_log.id
                }
            )
            
            # Retrieve relevant historical context
            context = vector_store.get_conversation_context(
                user_id=str(request.user.id),
                current_message=user_message,
                max_context_items=3
            )
            
            logger.info(f"Retrieved context for user {request.user.id}: {len(context)} items")
        except Exception as ve:
            logger.warning(f"Vector store error (continuing without context): {ve}")
            vector_store = None
            session_id = None
            context = ""

        def stream_response():
            bot_response = ""
            try:
                # Pass context to AI for enhanced responses
                stream = stream_ai_diagnosis([s.name for s in symptoms], context=context)
                for chunk in stream:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta
                    if hasattr(delta, "content") and delta.content:
                        bot_response += delta.content
                        yield delta.content

                bot_log = ChatLog.objects.create(
                    user=request.user,
                    message=bot_response,
                    is_user=False
                )
                bot_log.symptom_references.set(symptoms)

                # Store bot response in vector database for future learning
                if vector_store and session_id:
                    try:
                        vector_store.add_conversation(
                            user_id=str(request.user.id),
                            session_id=session_id,
                            role="assistant",
                            content=bot_response,
                            metadata={
                                "timestamp": datetime.now().isoformat(),
                                "chat_log_id": bot_log.id,
                                "symptom_count": len(symptoms)
                            }
                        )
                        logger.info(f"Stored conversation in vector DB for user {request.user.id}")
                    except Exception as ve:
                        logger.warning(f"Failed to store bot response in vector DB: {ve}")

            except Exception as e:
                logger.exception("Error in streaming AI diagnosis")
                error_msg = f"\n[Error] {str(e)}"
                yield error_msg
                ChatLog.objects.create(
                    user=request.user,
                    message=error_msg,
                    is_user=False
                )

        return StreamingHttpResponse(stream_response(), content_type="text/plain")

    except Exception as outer_error:
        logger.exception("Outer error in diagnose_stream_view")
        return Response({"error": str(outer_error)}, status=500)



class DiagnoseImageAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            if 'image' not in request.FILES:
                return Response({'error': 'No image provided'}, status=400)

            image_file = request.FILES['image']
            
            user_chat_msg = ChatLog.objects.create(
                user=request.user,
                message="[Image Upload]",
                is_user=True,
                image=image_file
            )

            # Initialize vector store for learning
            try:
                vector_store = get_vector_store()
                session_id = str(uuid.uuid4())
                
                # Store user image upload in vector database
                vector_store.add_conversation(
                    user_id=str(request.user.id),
                    session_id=session_id,
                    role="user",
                    content="[Image Upload - Medical Image Analysis Request]",
                    metadata={
                        "timestamp": datetime.now().isoformat(),
                        "content_type": "image",
                        "chat_log_id": user_chat_msg.id,
                        "image_name": image_file.name
                    }
                )
                
                # Retrieve relevant historical context (previous image analyses)
                context = vector_store.get_conversation_context(
                    user_id=str(request.user.id),
                    current_message="medical image analysis",
                    max_context_items=2
                )
                
                logger.info(f"Retrieved image context for user {request.user.id}: {len(context)} items")
            except Exception as ve:
                logger.warning(f"Vector store error (continuing without context): {ve}")
                vector_store = None
                session_id = None
                context = ""

            def generate():
                bot_response = ""
                try:
                    # Pass context to AI for enhanced image analysis
                    stream = stream_ai_image_analysis(image_file, context=context)
                    for chunk in stream:
                        if chunk.choices and chunk.choices[0].delta.content:
                            content = chunk.choices[0].delta.content
                            bot_response += content
                            yield content
                    
                    diagnosis = AIDiagnosisResponse.objects.create(
                        user=request.user,
                        ai_notes=bot_response
                    )
                    
                    bot_chat_msg = ChatLog.objects.create(
                        user=request.user,
                        message=bot_response,
                        is_user=False,
                        diagnosis=diagnosis,
                        related_message=user_chat_msg
                    )
                    
                    user_chat_msg.diagnosis = diagnosis
                    user_chat_msg.save()
                    
                    # Store bot response in vector database for future learning
                    if vector_store and session_id:
                        try:
                            vector_store.add_conversation(
                                user_id=str(request.user.id),
                                session_id=session_id,
                                role="assistant",
                                content=bot_response,
                                metadata={
                                    "timestamp": datetime.now().isoformat(),
                                    "content_type": "image_analysis",
                                    "chat_log_id": bot_chat_msg.id,
                                    "diagnosis_id": diagnosis.id
                                }
                            )
                            logger.info(f"Stored image analysis in vector DB for user {request.user.id}")
                        except Exception as ve:
                            logger.warning(f"Failed to store image analysis in vector DB: {ve}")
                    
                except Exception as e:
                    error_msg = f"\n[Error] {str(e)}"
                    yield error_msg
                    ChatLog.objects.create(
                        user=request.user,
                        message=error_msg,
                        is_user=False
                    )

            return StreamingHttpResponse(generate(), content_type="text/plain")
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
class ChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Add pagination support and limit default to 100 most recent chats
        # Use select_related to optimize database queries
        limit = request.query_params.get('limit', 100)
        try:
            limit = int(limit)
            if limit > 500:  # Cap at 500 to prevent abuse
                limit = 500
        except ValueError:
            limit = 100
            
        chats = ChatLog.objects.filter(
            user=request.user
        ).select_related('user').order_by('timestamp')[:limit]
        
        serializer = ChatLogSerializer(chats, many=True, context={'request': request})
        return Response(serializer.data)

class ChatDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, chat_id):
        try:
            chat = ChatLog.objects.get(id=chat_id, user=request.user)
            chat.delete()
            return Response({'message': 'Chat deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except ChatLog.DoesNotExist:
            return Response({'error': 'Chat not found'}, status=status.HTTP_404_NOT_FOUND)
    
class HealthRecordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        
        profile = UserProfile.objects.get(user=request.user)
        symptoms = UserSymptomLog.objects.filter(user=request.user)
        diagnoses = AIDiagnosisResponse.objects.filter(user=request.user)
        chats = ChatLog.objects.filter(user=request.user).order_by('-timestamp')[:20]  

        profile_data = UserProfileSerializer(profile).data
        symptoms_data = UserSymptomLogSerializer(symptoms, many=True).data
        diagnoses_data = AIDiagnosisResponseSerializer(diagnoses, many=True).data
        chat_data = ChatLogSerializer(chats, many=True, context={'request': request}).data
        
        return Response({
            'profile': profile_data,
            'symptoms': symptoms_data,
            'diagnoses': diagnoses_data,
            'chat_history': chat_data
        })


class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        try:

            profile, created = UserProfile.objects.get_or_create(
                user=request.user,
                defaults={
                    'age': request.data.get('age', 0),
                    'gender': request.data.get('gender', 'Other'),
                    'height_cm': request.data.get('height_cm', 0),
                    'weight_kg': request.data.get('weight_kg', 0),
                    'blood_group': request.data.get('blood_group', ''),
                    'allergies': request.data.get('allergies', ''),
                }
            )
            
            if not created:
                profile.age = request.data.get('age', profile.age)
                profile.gender = request.data.get('gender', profile.gender)
                profile.height_cm = request.data.get('height_cm', profile.height_cm)
                profile.weight_kg = request.data.get('weight_kg', profile.weight_kg)
                profile.blood_group = request.data.get('blood_group', profile.blood_group)
                profile.allergies = request.data.get('allergies', profile.allergies)
                profile.save()
            
            if 'full_name' in request.data:
                request.user.full_name = request.data['full_name']
                request.user.save()
            
            serializer = UserProfileSerializer(profile)
            return Response({
                'message': 'Profile updated successfully',
                'profile': serializer.data,
                'user': {
                    'email': request.user.email,
                    'full_name': request.user.full_name,
                    'age': profile.age,
                    'gender': profile.gender,
                    'height_cm': profile.height_cm,
                    'weight_kg': profile.weight_kg,
                    'blood_group': profile.blood_group,
                    'allergies': profile.allergies,
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error updating profile: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)