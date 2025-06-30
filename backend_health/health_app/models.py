from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=10, choices=[('Male','Male'), ('Female','Female'), ('Other','Other')])
    height_cm = models.FloatField(null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)
    blood_group = models.CharField(max_length=5, blank=True)
    allergies = models.TextField(blank=True)

    def __str__(self):
        return self.user.username

class Symptom(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class MedicalCondition(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    common_symptoms = models.ManyToManyField(Symptom, related_name='related_conditions')

    def __str__(self):
        return self.name

class UserSymptomLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    symptom = models.ForeignKey(Symptom, on_delete=models.CASCADE)
    severity = models.IntegerField(choices=[(i, str(i)) for i in range(1, 11)])
    noted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.symptom.name}"

class AIDiagnosisResponse(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    symptoms = models.ManyToManyField(Symptom)
    probable_conditions = models.ManyToManyField(MedicalCondition, blank=True)
    ai_notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Diagnosis for {self.user.username} on {self.created_at.date()}"

class Medication(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    used_for = models.ManyToManyField(MedicalCondition)

    def __str__(self):
        return self.name

class ChatLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    prompt = models.TextField()
    response = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat with {self.user.username} at {self.timestamp}"
