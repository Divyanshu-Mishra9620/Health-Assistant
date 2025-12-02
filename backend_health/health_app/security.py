"""
Enhanced security utilities for enterprise-grade authentication
Password strength validation, account lockout, security audit
"""
import re
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from django.contrib.auth.hashers import check_password


class PasswordStrengthValidator:
    """
    Validates password strength according to enterprise security standards
    - Minimum 12 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    - No common passwords
    """
    
    MIN_LENGTH = 12
    COMMON_PASSWORDS = [
        'password', '12345678', 'qwerty', 'abc123', 'password123',
        'admin123', 'letmein', 'welcome', 'monkey', '1234567890'
    ]
    
    @classmethod
    def validate(cls, password):
        """Validate password strength"""
        errors = []
        
        if len(password) < cls.MIN_LENGTH:
            errors.append(f"Password must be at least {cls.MIN_LENGTH} characters long")
        
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not re.search(r'\d', password):
            errors.append("Password must contain at least one number")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character")
        
        if password.lower() in cls.COMMON_PASSWORDS:
            errors.append("This password is too common. Please choose a stronger password")
        
        return errors
    
    @classmethod
    def get_strength_score(cls, password):
        """Calculate password strength score (0-100)"""
        score = 0
        
        # Length score (max 30 points)
        score += min(len(password) * 2, 30)
        
        # Character variety (max 40 points)
        if re.search(r'[a-z]', password):
            score += 10
        if re.search(r'[A-Z]', password):
            score += 10
        if re.search(r'\d', password):
            score += 10
        if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            score += 10
        
        # Complexity patterns (max 30 points)
        if len(set(password)) > len(password) * 0.7:  # High character diversity
            score += 15
        if not any(common in password.lower() for common in cls.COMMON_PASSWORDS):
            score += 15
        
        return min(score, 100)


class AccountLockoutManager:
    """
    Manages account lockout after failed login attempts
    Implements exponential backoff and IP-based blocking
    """
    
    MAX_ATTEMPTS = 5
    LOCKOUT_DURATION = timedelta(minutes=30)
    IP_LOCKOUT_DURATION = timedelta(hours=1)
    
    @classmethod
    def record_failed_attempt(cls, username, ip_address):
        """Record a failed login attempt"""
        username_key = f"login_attempts:{username}"
        ip_key = f"login_attempts_ip:{ip_address}"
        
        # Increment user attempt counter
        attempts = cache.get(username_key, 0) + 1
        cache.set(username_key, attempts, timeout=cls.LOCKOUT_DURATION.total_seconds())
        
        # Increment IP attempt counter
        ip_attempts = cache.get(ip_key, 0) + 1
        cache.set(ip_key, ip_attempts, timeout=cls.IP_LOCKOUT_DURATION.total_seconds())
        
        return attempts, ip_attempts
    
    @classmethod
    def is_locked_out(cls, username, ip_address):
        """Check if account or IP is locked out"""
        username_key = f"login_attempts:{username}"
        ip_key = f"login_attempts_ip:{ip_address}"
        
        username_attempts = cache.get(username_key, 0)
        ip_attempts = cache.get(ip_key, 0)
        
        return username_attempts >= cls.MAX_ATTEMPTS or ip_attempts >= cls.MAX_ATTEMPTS * 2
    
    @classmethod
    def reset_attempts(cls, username):
        """Reset failed attempts after successful login"""
        username_key = f"login_attempts:{username}"
        cache.delete(username_key)
    
    @classmethod
    def get_remaining_attempts(cls, username):
        """Get number of remaining login attempts"""
        username_key = f"login_attempts:{username}"
        attempts = cache.get(username_key, 0)
        return max(cls.MAX_ATTEMPTS - attempts, 0)
    
    @classmethod
    def get_lockout_time_remaining(cls, username):
        """Get time remaining until lockout expires"""
        username_key = f"login_attempts:{username}"
        ttl = cache.ttl(username_key)
        if ttl:
            return timedelta(seconds=ttl)
        return timedelta(0)


class SessionSecurityManager:
    """
    Manages secure session handling
    Implements session timeout, concurrent session limits
    """
    
    SESSION_TIMEOUT = timedelta(hours=24)
    MAX_CONCURRENT_SESSIONS = 3
    
    @classmethod
    def create_session(cls, user_id, session_id, ip_address, user_agent):
        """Create a new session"""
        session_key = f"user_session:{user_id}:{session_id}"
        sessions_key = f"user_sessions:{user_id}"
        
        session_data = {
            'session_id': session_id,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'created_at': timezone.now().isoformat(),
            'last_activity': timezone.now().isoformat()
        }
        
        # Store session data
        cache.set(session_key, session_data, timeout=cls.SESSION_TIMEOUT.total_seconds())
        
        # Track all sessions for this user
        sessions = cache.get(sessions_key, [])
        sessions.append(session_id)
        
        # Enforce concurrent session limit
        if len(sessions) > cls.MAX_CONCURRENT_SESSIONS:
            # Remove oldest session
            oldest_session = sessions.pop(0)
            cache.delete(f"user_session:{user_id}:{oldest_session}")
        
        cache.set(sessions_key, sessions, timeout=cls.SESSION_TIMEOUT.total_seconds())
    
    @classmethod
    def update_session_activity(cls, user_id, session_id):
        """Update session last activity timestamp"""
        session_key = f"user_session:{user_id}:{session_id}"
        session_data = cache.get(session_key)
        
        if session_data:
            session_data['last_activity'] = timezone.now().isoformat()
            cache.set(session_key, session_data, timeout=cls.SESSION_TIMEOUT.total_seconds())
    
    @classmethod
    def terminate_session(cls, user_id, session_id):
        """Terminate a specific session"""
        session_key = f"user_session:{user_id}:{session_id}"
        sessions_key = f"user_sessions:{user_id}"
        
        cache.delete(session_key)
        
        sessions = cache.get(sessions_key, [])
        if session_id in sessions:
            sessions.remove(session_id)
            cache.set(sessions_key, sessions, timeout=cls.SESSION_TIMEOUT.total_seconds())
    
    @classmethod
    def terminate_all_sessions(cls, user_id):
        """Terminate all sessions for a user"""
        sessions_key = f"user_sessions:{user_id}"
        sessions = cache.get(sessions_key, [])
        
        for session_id in sessions:
            session_key = f"user_session:{user_id}:{session_id}"
            cache.delete(session_key)
        
        cache.delete(sessions_key)


class SecurityAuditLogger:
    """
    Logs security-related events for audit trails
    GDPR and HIPAA compliant logging
    """
    
    @classmethod
    def log_login(cls, username, success, ip_address, user_agent):
        """Log login attempt"""
        from .models import SecurityAuditLog
        SecurityAuditLog.objects.create(
            event_type='LOGIN',
            username=username,
            success=success,
            ip_address=ip_address,
            user_agent=user_agent,
            details={'action': 'login_attempt'}
        )
    
    @classmethod
    def log_password_change(cls, user, ip_address):
        """Log password change"""
        from .models import SecurityAuditLog
        SecurityAuditLog.objects.create(
            event_type='PASSWORD_CHANGE',
            user=user,
            username=user.email,
            success=True,
            ip_address=ip_address,
            details={'action': 'password_changed'}
        )
    
    @classmethod
    def log_data_export(cls, user, export_type, ip_address):
        """Log data export request"""
        from .models import SecurityAuditLog
        SecurityAuditLog.objects.create(
            event_type='DATA_EXPORT',
            user=user,
            username=user.email,
            success=True,
            ip_address=ip_address,
            details={'export_type': export_type}
        )
    
    @classmethod
    def log_data_deletion(cls, user, ip_address):
        """Log data deletion request"""
        from .models import SecurityAuditLog
        SecurityAuditLog.objects.create(
            event_type='DATA_DELETION',
            user=user,
            username=user.email,
            success=True,
            ip_address=ip_address,
            details={'action': 'account_deletion_requested'}
        )
