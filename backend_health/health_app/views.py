from rest_framework import viewsets, serializers
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model 

from django.contrib.auth.password_validation import validate_password
from django.http import StreamingHttpResponse
from .utils.openai_helper import stream_ai_diagnosis, stream_ai_image_analysis
import logging

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
class DiagnoseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        symptom_names = request.data.get('symptom_names', [])
        cleaned_symptoms = [s.strip() for s in symptom_names if s.strip()]

        symptoms = []
        for name in cleaned_symptoms:
            symptom, _ = Symptom.objects.get_or_create(name__iexact=name, defaults={"name": name})
            symptoms.append(symptom)

        user_message = ", ".join(cleaned_symptoms)

        # ✅ Save user message first
        user_log = ChatLog.objects.create(
            user=request.user,
            message=user_message,
            is_user=True
        )
        user_log.symptom_references.set(symptoms)

        def stream_response():
            bot_response = ""
            try:
                stream = stream_ai_diagnosis([s.name for s in symptoms])
                for chunk in stream:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta
                    if hasattr(delta, "content") and delta.content:
                        bot_response += delta.content
                        yield delta.content

                # ✅ Save bot response with symptoms
                bot_log = ChatLog.objects.create(
                    user=request.user,
                    message=bot_response,
                    is_user=False
                )
                bot_log.symptom_references.set(symptoms)

            except Exception as e:
                error_msg = f"\n[Error] {str(e)}"
                yield error_msg
                ChatLog.objects.create(
                    user=request.user,
                    message=error_msg,
                    is_user=False
                )

        return StreamingHttpResponse(stream_response(), content_type="text/plain")

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

            def generate():
                bot_response = ""
                try:
                    stream = stream_ai_image_analysis(image_file)
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
        chats = ChatLog.objects.filter(user=request.user).order_by('timestamp')
        serializer = ChatLogSerializer(chats, many=True, context={'request': request})
        return Response(serializer.data)
    
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