from rest_framework import serializers
from .models import Symptom, UserProfile, UserSymptomLog, AIDiagnosisResponse, ChatLog,Medication

class SymptomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Symptom
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'

class UserSymptomLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSymptomLog
        fields = '__all__'

class AIDiagnosisResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIDiagnosisResponse
        fields = '__all__' 

class ChatLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatLog
        fields = '__all__'

class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = '__all__'
