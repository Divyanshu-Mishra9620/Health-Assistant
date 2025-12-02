"""
Enterprise logging and monitoring middleware
Tracks all requests, responses, and errors with detailed context
"""
import logging
import json
import time
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log all incoming requests and outgoing responses
    Includes timing, user info, IP address, and error tracking
    """
    
    def process_request(self, request):
        """Log request details"""
        request.start_time = time.time()
        
        # Get client IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        # Prepare log data
        log_data = {
            'method': request.method,
            'path': request.path,
            'ip_address': ip,
            'user_agent': request.META.get('HTTP_USER_AGENT', 'Unknown'),
            'user': str(request.user) if request.user.is_authenticated else 'Anonymous'
        }
        
        logger.info(f"Request started: {json.dumps(log_data)}")
    
    def process_response(self, request, response):
        """Log response details with timing"""
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            log_data = {
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'duration_ms': round(duration * 1000, 2),
                'user': str(request.user) if request.user.is_authenticated else 'Anonymous'
            }
            
            if response.status_code >= 400:
                logger.warning(f"Request failed: {json.dumps(log_data)}")
            else:
                logger.info(f"Request completed: {json.dumps(log_data)}")
        
        return response
    
    def process_exception(self, request, exception):
        """Log exceptions with full context"""
        log_data = {
            'method': request.method,
            'path': request.path,
            'exception_type': type(exception).__name__,
            'exception_message': str(exception),
            'user': str(request.user) if request.user.is_authenticated else 'Anonymous'
        }
        
        logger.error(f"Request exception: {json.dumps(log_data)}", exc_info=True)
        
        return None


class AuditLogMiddleware(MiddlewareMixin):
    """
    Audit logging for sensitive operations
    Tracks CREATE, UPDATE, DELETE operations
    """
    
    SENSITIVE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
    SENSITIVE_PATHS = ['/api/profile/', '/user/profile/', '/api/register/']
    
    def process_response(self, request, response):
        """Log sensitive operations"""
        if request.method in self.SENSITIVE_METHODS:
            # Check if this is a sensitive path
            is_sensitive = any(path in request.path for path in self.SENSITIVE_PATHS)
            
            if is_sensitive or request.method == 'DELETE':
                audit_data = {
                    'timestamp': time.time(),
                    'user': str(request.user) if request.user.is_authenticated else 'Anonymous',
                    'user_id': request.user.id if request.user.is_authenticated else None,
                    'method': request.method,
                    'path': request.path,
                    'status_code': response.status_code,
                    'success': 200 <= response.status_code < 300
                }
                
                logger.info(f"AUDIT: {json.dumps(audit_data)}")
        
        return response


class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """
    Monitor slow requests and database queries
    Alerts when requests exceed performance thresholds
    """
    
    SLOW_REQUEST_THRESHOLD = 2.0  # seconds
    
    def process_request(self, request):
        request.start_time = time.time()
    
    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            if duration > self.SLOW_REQUEST_THRESHOLD:
                logger.warning(
                    f"SLOW REQUEST: {request.method} {request.path} "
                    f"took {round(duration, 2)}s for user {request.user}"
                )
        
        return response


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers to all responses
    Implements OWASP security best practices
    """
    
    def process_response(self, request, response):
        # Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'
        
        # Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Enable XSS protection
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Strict Transport Security (HTTPS only)
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Content Security Policy
        response['Content-Security-Policy'] = "default-src 'self'"
        
        # Referrer Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Permissions Policy
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        return response
