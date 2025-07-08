from rest_framework import serializers
from .models import Symptom, UserProfile, UserSymptomLog, AIDiagnosisResponse, ChatLog,Medication

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = CustomUser.EMAIL_FIELD
    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        try:
            profile = UserProfile.objects.get(user=user)
            data['user'] = {
                'email': user.email,
                'full_name': user.full_name,
                'age': profile.age,
                'gender': profile.gender,
                'height_cm': profile.height_cm,
                'weight_kg': profile.weight_kg,
                'blood_group': profile.blood_group,
                'allergies': profile.allergies,
            }
        except UserProfile.DoesNotExist:
            data['user'] = {
                'email': user.email,
                'full_name': user.full_name,
                'profile': None
            }

        return data

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
    image_url = serializers.SerializerMethodField()
    related_message_id = serializers.SerializerMethodField()
    diagnosis_id = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatLog
        fields = ['id', 'message', 'is_user', 'timestamp', 'image_url',
                'symptom_references', 'diagnosis_references', 'related_message_id',
                'diagnosis_id']

    def get_image_url(self, obj):
        if obj.image:
            return self.context['request'].build_absolute_uri(obj.image.url)
        return None
        
    def get_related_message_id(self, obj):
        return obj.related_message.id if obj.related_message else None
        
    def get_diagnosis_id(self, obj):
        return obj.diagnosis.id if obj.diagnosis else None
class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = '__all__'
