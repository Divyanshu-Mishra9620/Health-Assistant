"""
Custom throttling classes for API rate limiting
Enterprise-grade rate limiting for different user tiers
"""
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class BurstRateThrottle(UserRateThrottle):
    """
    Allows burst requests - 60 requests per minute for authenticated users
    """
    scope = 'burst'
    rate = '60/min'


class SustainedRateThrottle(UserRateThrottle):
    """
    Sustained rate limiting - 1000 requests per hour for authenticated users
    """
    scope = 'sustained'
    rate = '1000/hour'


class AnonymousUserThrottle(AnonRateThrottle):
    """
    Rate limiting for anonymous users - 20 requests per hour
    """
    scope = 'anon'
    rate = '20/hour'


class PremiumUserThrottle(UserRateThrottle):
    """
    Higher limits for premium users - 5000 requests per hour
    """
    scope = 'premium'
    rate = '5000/hour'


class AIAnalysisThrottle(UserRateThrottle):
    """
    Special rate limiting for AI analysis endpoints - 20 requests per hour
    Prevents abuse of expensive AI operations
    """
    scope = 'ai_analysis'
    rate = '20/hour'


class ImageUploadThrottle(UserRateThrottle):
    """
    Rate limiting for image uploads - 10 uploads per hour
    """
    scope = 'image_upload'
    rate = '10/hour'


class AdminAPIThrottle(UserRateThrottle):
    """
    Relaxed throttling for admin users - 10000 requests per hour
    """
    scope = 'admin'
    rate = '10000/hour'
    
    def allow_request(self, request, view):
        if request.user and request.user.is_staff:
            return True
        return super().allow_request(request, view)
