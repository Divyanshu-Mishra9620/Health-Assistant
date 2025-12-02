"""
Custom exception handlers for enterprise-grade error handling
Provides detailed error responses with error codes and tracking
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging
import traceback
import uuid

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler with detailed error responses
    Includes error tracking ID for support purposes
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # Generate unique error ID for tracking
    error_id = str(uuid.uuid4())
    
    # Log the error with full context
    logger.error(
        f"Error ID: {error_id} | "
        f"Exception: {exc.__class__.__name__} | "
        f"Message: {str(exc)} | "
        f"View: {context.get('view', 'Unknown')} | "
        f"Request: {context.get('request', 'Unknown')}",
        exc_info=True
    )
    
    # If the exception was not handled by DRF
    if response is None:
        # Handle unexpected exceptions
        error_data = {
            'error': {
                'code': 'INTERNAL_SERVER_ERROR',
                'message': 'An unexpected error occurred. Please contact support.',
                'error_id': error_id,
                'type': exc.__class__.__name__
            }
        }
        
        if logger.isEnabledFor(logging.DEBUG):
            error_data['error']['details'] = str(exc)
            error_data['error']['traceback'] = traceback.format_exc()
        
        return Response(error_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Customize the response data
    custom_response_data = {
        'error': {
            'code': get_error_code(exc),
            'message': get_error_message(exc, response),
            'error_id': error_id,
        }
    }
    
    # Add details in debug mode
    if logger.isEnabledFor(logging.DEBUG):
        custom_response_data['error']['details'] = response.data
    
    response.data = custom_response_data
    
    return response


def get_error_code(exc):
    """Get error code from exception"""
    error_codes = {
        'ValidationError': 'VALIDATION_ERROR',
        'PermissionDenied': 'PERMISSION_DENIED',
        'NotAuthenticated': 'NOT_AUTHENTICATED',
        'AuthenticationFailed': 'AUTHENTICATION_FAILED',
        'NotFound': 'NOT_FOUND',
        'MethodNotAllowed': 'METHOD_NOT_ALLOWED',
        'Throttled': 'RATE_LIMIT_EXCEEDED',
    }
    
    exc_name = exc.__class__.__name__
    return error_codes.get(exc_name, 'UNKNOWN_ERROR')


def get_error_message(exc, response):
    """Get user-friendly error message"""
    # Use the default detail if available
    if hasattr(response, 'data'):
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                return response.data['detail']
            if 'non_field_errors' in response.data:
                return response.data['non_field_errors'][0]
    
    # Fallback to exception message
    return str(exc)


class APIException(Exception):
    """Base exception for custom API errors"""
    default_code = 'API_ERROR'
    default_message = 'An error occurred'
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    
    def __init__(self, message=None, code=None, status_code=None):
        self.message = message or self.default_message
        self.code = code or self.default_code
        if status_code:
            self.status_code = status_code


class RateLimitExceeded(APIException):
    """Raised when rate limit is exceeded"""
    default_code = 'RATE_LIMIT_EXCEEDED'
    default_message = 'Rate limit exceeded. Please try again later.'
    status_code = status.HTTP_429_TOO_MANY_REQUESTS


class AccountLockedException(APIException):
    """Raised when account is locked"""
    default_code = 'ACCOUNT_LOCKED'
    default_message = 'Account is locked due to too many failed login attempts.'
    status_code = status.HTTP_403_FORBIDDEN


class InvalidPasswordException(APIException):
    """Raised when password doesn't meet requirements"""
    default_code = 'INVALID_PASSWORD'
    default_message = 'Password does not meet security requirements.'
    status_code = status.HTTP_400_BAD_REQUEST


class DataExportException(APIException):
    """Raised when data export fails"""
    default_code = 'DATA_EXPORT_FAILED'
    default_message = 'Failed to export data. Please try again.'
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR


class ServiceUnavailableException(APIException):
    """Raised when external service is unavailable"""
    default_code = 'SERVICE_UNAVAILABLE'
    default_message = 'The requested service is temporarily unavailable.'
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
