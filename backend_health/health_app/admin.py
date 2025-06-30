from django.contrib import admin
from .models import (
    UserProfile,
    Symptom,
    MedicalCondition,
    UserSymptomLog,
    AIDiagnosisResponse,
    Medication,
    ChatLog
)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'age', 'gender', 'blood_group')
    search_fields = ('user__username', 'blood_group')
    list_filter = ('gender',)

@admin.register(Symptom)
class SymptomAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(MedicalCondition)
class MedicalConditionAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
    filter_horizontal = ('common_symptoms',)

@admin.register(UserSymptomLog)
class UserSymptomLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'symptom', 'severity', 'noted_at')
    list_filter = ('severity', 'noted_at')
    search_fields = ('user__username', 'symptom__name')

@admin.register(AIDiagnosisResponse)
class AIDiagnosisResponseAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username',)
    filter_horizontal = ('symptoms', 'probable_conditions')

@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
    filter_horizontal = ('used_for',)

@admin.register(ChatLog)
class ChatLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'timestamp')
    search_fields = ('user__username', 'prompt', 'response')
    list_filter = ('timestamp',)
