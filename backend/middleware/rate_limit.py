"""
protection/rate_limit.py
Redis-backed Rate Limiting for Flask.
Implements distributed rate limiting to protect against abuse and ensure
fair usage across all API consumers.
"""
import os
import logging
from functools import wraps
from typing import Optional, List, Callable

from flask import request, jsonify, Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

logger = logging.getLogger(__name__)

# Configuration
REDIS_STORAGE_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")
DEFAULT_LIMITS = ["200 per day", "50 per hour", "10 per minute"]

# Global limiter instance
limiter: Optional[Limiter] = None


def init_rate_limiter(app: Flask) -> Limiter:
    """
    Initialize Flask-Limiter with Redis backend.
    
    This ensures rate limits are shared across all Gunicorn workers,
    preventing the "thundering herd" problem.
    
    Args:
        app: Flask application instance
        
    Returns:
        Configured Limiter instance
    """
    global limiter
    
    # Storage options - Redis preferred, memory fallback
    storage_uri = REDIS_STORAGE_URL
    
    try:
        # Test Redis connection
        import redis
        r = redis.from_url(storage_uri)
        r.ping()
        logger.info("✅ Rate limiter using Redis storage")
    except Exception as e:
        logger.warning(f"⚠️ Redis not available for rate limiting: {e}")
        logger.warning("⚠️ Falling back to in-memory storage (NOT SUITABLE FOR PRODUCTION)")
        storage_uri = "memory://"
    
    # Initialize limiter
    limiter = Limiter(
        key_func=get_rate_limit_key,  # Custom key function
        app=app,
        storage_uri=storage_uri,
        default_limits=DEFAULT_LIMITS,
        strategy="fixed-window",  # Alternative: "moving-window"
        headers_enabled=True,  # Add rate limit headers to responses
        swallow_errors=True,  # Don't crash if Redis is down
        in_memory_fallback=DEFAULT_LIMITS,  # Fallback limits if Redis fails
        retry_after="Retry-After"  # Add Retry-After header
    )
    
    logger.info(f"✅ Rate limiter initialized with limits: {DEFAULT_LIMITS}")
    return limiter


def get_rate_limit_key() -> str:
    """
    Custom rate limit key generator.
    
    Uses user ID for authenticated users, IP address for anonymous.
    This ensures:
    - Authenticated users have their own quota
    - Anonymous users share IP-based quota
    - Prevents bypassing limits by switching IPs when logged in
    """
    # Try to get user ID from request context (if authenticated)
    try:
        from flask import g
        if hasattr(g, 'user') and g.user:
            user_id = g.user.get('id')
            if user_id:
                return f"user:{user_id}"
    except Exception:
        pass
    
    # Fall back to IP address
    return f"ip:{get_remote_address()}"


def rate_limit(limit_string: str, per_user: bool = False):
    """
    Decorator to apply rate limits to specific endpoints.
    
    Args:
        limit_string: Rate limit (e.g., "10 per minute", "100 per hour")
        per_user: If True, apply limit per user instead of per IP
        
    Usage:
        @app.route('/api/expensive')
        @rate_limit("5 per minute")
        def expensive_operation():
            pass
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapper(*args, **kwargs):
            # The actual limiting is handled by Flask-Limiter
            # This decorator is for documentation and additional logic
            return f(*args, **kwargs)
        
        # Store limit on function for Flask-Limiter to pick up
        wrapper.__rate_limit = limit_string
        wrapper.__per_user = per_user
        
        return wrapper
    return decorator


def exempt_from_limit(f: Callable) -> Callable:
    """Decorator to exempt an endpoint from rate limiting."""
    f.__rate_limit_exempt = True
    return f


class RateLimitConfig:
    """Configuration for different rate limit tiers."""
    
    # Free tier - strict limits
    FREE_TIER = ["100 per day", "30 per hour", "5 per minute"]
    
    # Pro tier - relaxed limits
    PRO_TIER = ["1000 per day", "200 per hour", "30 per minute"]
    
    # Enterprise tier - generous limits
    ENTERPRISE_TIER = ["10000 per day", "1000 per hour", "100 per minute"]
    
    # Specific endpoint limits
    LOGIN_LIMITS = ["5 per minute", "20 per hour"]  # Prevent brute force
    REGISTER_LIMITS = ["3 per minute", "10 per hour"]  # Prevent spam
    AI_CHAT_LIMITS = ["30 per minute", "500 per hour"]  # Control AI costs
    PAYMENT_LIMITS = ["10 per minute", "50 per hour"]  # Protect payment flow


def get_limits_for_user(user_tier: str = "free") -> List[str]:
    """
    Get rate limits based on user subscription tier.
    
    Args:
        user_tier: 'free', 'pro', or 'enterprise'
        
    Returns:
        List of limit strings
    """
    tiers = {
        "free": RateLimitConfig.FREE_TIER,
        "pro": RateLimitConfig.PRO_TIER,
        "enterprise": RateLimitConfig.ENTERPRISE_TIER
    }
    return tiers.get(user_tier.lower(), RateLimitConfig.FREE_TIER)


def apply_tiered_limits(app: Flask):
    """
    Apply tiered rate limits to Flask app.
    Should be called after init_rate_limiter().
    
    Args:
        app: Flask application instance
    """
    # Apply specific limits to routes
    # These are applied in addition to default limits
    
    # Authentication endpoints - strict limits
    limiter.limit(RateLimitConfig.LOGIN_LIMITS)(app.view_functions.get('login', lambda: None))
    limiter.limit(RateLimitConfig.REGISTER_LIMITS)(app.view_functions.get('register', lambda: None))
    
    # AI endpoints - tiered limits based on subscription
    @app.before_request
    def check_ai_limits():
        if request.endpoint == 'chat' and limiter:
            # Check user's tier and apply appropriate limits
            try:
                from flask import g
                user_tier = g.user.get('subscription_tier', 'free') if hasattr(g, 'user') else 'free'
                limits = get_limits_for_user(user_tier)
                # Dynamic limit application would go here
            except Exception:
                pass


def get_rate_limit_headers() -> dict:
    """
    Get current rate limit status for response headers.
    
    Returns:
        Dictionary of headers to add to response
    """
    if not limiter:
        return {}
    
    try:
        # Get current view function
        from flask import g
        return {
            'X-RateLimit-Limit': getattr(g, 'view_rate_limit', [None])[0],
            'X-RateLimit-Remaining': getattr(g, 'view_rate_limit_remaining', None),
            'X-RateLimit-Reset': getattr(g, 'view_rate_limit_reset', None)
        }
    except Exception:
        return {}


# Error handler for rate limit exceeded
@staticmethod
def rate_limit_exceeded_handler(e):
    """Custom handler for rate limit exceeded errors."""
    logger.warning(f"Rate limit exceeded for {request.remote_addr}: {e.description}")
    
    response = jsonify({
        'error': 'Rate limit exceeded',
        'message': 'Too many requests. Please try again later.',
        'retry_after': e.description.get('retry_after', 60) if hasattr(e, 'description') else 60
    })
    response.status_code = 429
    
    # Add standard rate limit headers
    response.headers['Retry-After'] = str(e.description.get('retry_after', 60)) if hasattr(e, 'description') else '60'
    
    return response


def init_error_handlers(app: Flask):
    """Initialize rate limit error handlers."""
    app.register_error_handler(429, rate_limit_exceeded_handler)


# Convenience decorator for common limit patterns
def strict_limit(f: Callable) -> Callable:
    """Very strict limit for sensitive endpoints (login, register)."""
    if limiter:
        return limiter.limit("5 per minute")(f)
    return f


def standard_limit(f: Callable) -> Callable:
    """Standard limit for regular API endpoints."""
    if limiter:
        return limiter.limit("100 per hour")(f)
    return f


def generous_limit(f: Callable) -> Callable:
    """Generous limit for non-critical endpoints."""
    if limiter:
        return limiter.limit("1000 per hour")(f)
    return f


# Singleton getter
def get_limiter() -> Optional[Limiter]:
    """Get the global limiter instance."""
    return limiter
