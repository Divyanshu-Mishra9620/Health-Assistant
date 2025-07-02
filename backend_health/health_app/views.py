from rest_framework import viewsets, serializers
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

from django.contrib.auth.password_validation import validate_password

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
from .utils.openai_helper import get_ai_diagnosis

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
        symptoms = Symptom.objects.filter        (name__in=symptom_names)

        if not symptoms.exists():
            return Response({"error": "No valid symptoms provided."}, status=400)

        ai_response = get_ai_diagnosis([s.name for s in symptoms])
        diagnosis = AIDiagnosisResponse.objects.create(
            user=request.user,
            ai_notes=ai_response
        )
        diagnosis.symptoms.set(symptoms)

        return Response({
            "message": "Diagnosis saved",
            "symptoms": [s.name for s in symptoms],
            "diagnosis": ai_response
        }, status=201)
