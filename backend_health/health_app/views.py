from rest_framework import viewsets, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

from .models import (
    Symptom,
    UserProfile,
    UserSymptomLog,
    AIDiagnosisResponse,
    ChatLog,
    Medication
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


# ──────── Registration ────────

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['username', 'password']

    def create(self, validated_data):
        user = User(username=validated_data['username'])
        user.set_password(validated_data['password'])
        user.save()
        return user

class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


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
        symptom_ids = request.data.get('symptom_ids', [])
        symptoms = Symptom.objects.filter(id__in=symptom_ids)
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
