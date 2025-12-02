"""
GDPR Compliance utilities for data export and deletion
Enterprise-grade data privacy features
"""
import json
from datetime import datetime
from django.http import HttpResponse
from django.core import serializers
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io.core.files.base import ContentFile


class DataExporter:
    """
    Export user data in GDPR-compliant formats (JSON, PDF)
    """
    
    @staticmethod
    def export_user_data_json(user):
        """Export all user data as JSON"""
        from .models import (
            UserProfile, ChatLog, UserSymptomLog, 
            AIDiagnosisResponse, SecurityAuditLog, UserActivityLog
        )
        
        data = {
            'export_date': datetime.now().isoformat(),
            'user_information': {
                'email': user.email,
                'full_name': user.full_name,
                'date_joined': user.date_joined.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
            }
        }
        
        # User profile
        try:
            profile = UserProfile.objects.get(user=user)
            data['profile'] = {
                'age': profile.age,
                'gender': profile.gender,
                'height_cm': profile.height_cm,
                'weight_kg': profile.weight_kg,
                'blood_group': profile.blood_group,
                'allergies': profile.allergies,
            }
        except UserProfile.DoesNotExist:
            data['profile'] = None
        
        # Chat history
        chats = ChatLog.objects.filter(user=user).values(
            'message', 'is_user', 'timestamp', 'image'
        )
        data['chat_history'] = list(chats)
        
        # Symptom logs
        symptoms = UserSymptomLog.objects.filter(user=user).values(
            'symptom__name', 'severity', 'noted_at'
        )
        data['symptom_logs'] = list(symptoms)
        
        # AI diagnoses
        diagnoses = AIDiagnosisResponse.objects.filter(user=user).values(
            'ai_notes', 'created_at'
        )
        data['diagnoses'] = list(diagnoses)
        
        # Security audit logs
        audit_logs = SecurityAuditLog.objects.filter(user=user).values(
            'event_type', 'success', 'timestamp', 'ip_address'
        )
        data['security_audit'] = list(audit_logs)
        
        # Activity logs
        activities = UserActivityLog.objects.filter(user=user).values(
            'activity_type', 'activity_details', 'timestamp'
        )
        data['activity_logs'] = list(activities)
        
        return json.dumps(data, indent=2, default=str)
    
    @staticmethod
    def export_user_data_pdf(user):
        """Export user data as PDF"""
        from .models import UserProfile, ChatLog, UserSymptomLog
        
        # Create PDF buffer
        from io import BytesIO
        buffer = BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#128C7E'),
            spaceAfter=30,
        )
        title = Paragraph("Health Assistant - Personal Data Export", title_style)
        elements.append(title)
        elements.append(Spacer(1, 0.2 * inch))
        
        # Export info
        info_text = f"""
        <b>Export Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br/>
        <b>User:</b> {user.full_name}<br/>
        <b>Email:</b> {user.email}<br/>
        """
        elements.append(Paragraph(info_text, styles['Normal']))
        elements.append(Spacer(1, 0.3 * inch))
        
        # User Profile
        try:
            profile = UserProfile.objects.get(user=user)
            profile_data = [
                ['Profile Information', ''],
                ['Age', str(profile.age)],
                ['Gender', profile.gender],
                ['Height (cm)', str(profile.height_cm) if profile.height_cm else 'N/A'],
                ['Weight (kg)', str(profile.weight_kg) if profile.weight_kg else 'N/A'],
                ['Blood Group', profile.blood_group or 'N/A'],
                ['Allergies', profile.allergies or 'None'],
            ]
            
            profile_table = Table(profile_data, colWidths=[3 * inch, 3 * inch])
            profile_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#128C7E')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(profile_table)
            elements.append(Spacer(1, 0.3 * inch))
        except UserProfile.DoesNotExist:
            pass
        
        # Chat History Summary
        chat_count = ChatLog.objects.filter(user=user).count()
        elements.append(Paragraph(f"<b>Chat History:</b> {chat_count} messages", styles['Heading2']))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Symptom Logs Summary
        symptom_count = UserSymptomLog.objects.filter(user=user).count()
        elements.append(Paragraph(f"<b>Symptom Logs:</b> {symptom_count} entries", styles['Heading2']))
        
        # Build PDF
        doc.build(elements)
        
        # Get PDF value
        pdf_value = buffer.getvalue()
        buffer.close()
        
        return pdf_value


class DataDeletionManager:
    """
    Manage GDPR-compliant data deletion requests
    """
    
    @staticmethod
    def request_account_deletion(user):
        """
        Initiate account deletion request
        Soft delete - marks for deletion after retention period
        """
        from .models import UserProfile
        
        # Mark user as inactive
        user.is_active = False
        user.save()
        
        # Log the deletion request
        from .security import SecurityAuditLogger
        SecurityAuditLogger.log_data_deletion(user, '0.0.0.0')
        
        return {
            'status': 'requested',
            'message': 'Your account deletion request has been received. '
                      'Your data will be permanently deleted in 30 days.',
            'deletion_date': (datetime.now() + timedelta(days=30)).isoformat()
        }
    
    @staticmethod
    def anonymize_user_data(user):
        """
        Anonymize user data instead of full deletion
        Retains data for analytics but removes PII
        """
        from .models import UserProfile, ChatLog, SecurityAuditLog
        
        # Anonymize user profile
        user.email = f"deleted_user_{user.id}@anonymized.com"
        user.full_name = f"Deleted User {user.id}"
        user.save()
        
        # Anonymize profile
        try:
            profile = UserProfile.objects.get(user=user)
            profile.allergies = "ANONYMIZED"
            profile.save()
        except UserProfile.DoesNotExist:
            pass
        
        # Remove images from chat logs
        ChatLog.objects.filter(user=user, image__isnull=False).update(image=None)
        
        return {
            'status': 'anonymized',
            'message': 'Your personal data has been anonymized.'
        }


class PrivacyPolicyManager:
    """
    Manage privacy policy acceptance and tracking
    """
    
    @staticmethod
    def record_policy_acceptance(user, policy_version, ip_address):
        """Record user acceptance of privacy policy"""
        from .models import UserActivityLog
        
        UserActivityLog.objects.create(
            user=user,
            activity_type='PRIVACY_POLICY_ACCEPTED',
            activity_details={
                'policy_version': policy_version,
                'ip_address': ip_address,
                'timestamp': datetime.now().isoformat()
            }
        )
    
    @staticmethod
    def get_latest_policy_acceptance(user):
        """Get user's latest privacy policy acceptance"""
        from .models import UserActivityLog
        
        latest = UserActivityLog.objects.filter(
            user=user,
            activity_type='PRIVACY_POLICY_ACCEPTED'
        ).order_by('-timestamp').first()
        
        return latest


from datetime import timedelta
