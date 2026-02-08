"""
EKA-AI Platform: Observability Middleware (2026 Enterprise Standard)
Implements X-Request-ID for distributed tracing and structured logging.
"""

import uuid
import time
from flask import request, g
from functools import wraps
import logging

# Try to import our custom logging config
try:
    from core.logging_config import get_logger, bind_request_context, clear_context
    logger = get_logger(__name__)
except ImportError:
    logger = logging.getLogger(__name__)


class ObservabilityMiddleware:
    """
    Flask middleware for request tracing and observability.
    Injects X-Request-ID header and logs request lifecycle.
    """
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize middleware with Flask app."""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        app.teardown_request(self.teardown_request)
    
    def before_request(self):
        """Execute before each request."""
        # Clear any existing context
        try:
            clear_context()
        except:
            pass
        
        # Generate or extract request ID
        request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))
        g.request_id = request_id
        g.start_time = time.perf_counter_ns()
        
        # Bind context for structured logging
        try:
            bind_request_context(
                request_id=request_id,
                user_id=getattr(g, 'user_id', None),
                workshop_id=getattr(g, 'workshop_id', None)
            )
        except:
            pass
        
        # Log request start
        logger.info(
            "request_started",
            extra={
                'request_id': request_id,
                'method': request.method,
                'path': request.path,
                'client_ip': request.remote_addr,
                'user_agent': request.user_agent.string if request.user_agent else None
            }
        )
    
    def after_request(self, response):
        """Execute after each request."""
        # Calculate duration
        duration_ms = 0
        if hasattr(g, 'start_time'):
            duration_ns = time.perf_counter_ns() - g.start_time
            duration_ms = duration_ns / 1_000_000
        
        # Inject request ID into response headers
        if hasattr(g, 'request_id'):
            response.headers['X-Request-ID'] = g.request_id
        
        # Log request completion (skip health checks)
        if request.path != '/health' and not request.path.startswith('/static/'):
            log_level = logger.error if response.status_code >= 500 else logger.info
            log_level(
                "request_completed",
                extra={
                    'request_id': getattr(g, 'request_id', 'unknown'),
                    'method': request.method,
                    'path': request.path,
                    'status_code': response.status_code,
                    'duration_ms': round(duration_ms, 2),
                    'content_length': response.content_length
                }
            )
        
        return response
    
    def teardown_request(self, exception=None):
        """Execute on request teardown."""
        if exception:
            # Log unhandled exceptions
            duration_ms = 0
            if hasattr(g, 'start_time'):
                duration_ns = time.perf_counter_ns() - g.start_time
                duration_ms = duration_ns / 1_000_000
            
            logger.exception(
                "request_crashed",
                extra={
                    'request_id': getattr(g, 'request_id', 'unknown'),
                    'method': request.method,
                    'path': request.path,
                    'duration_ms': round(duration_ms, 2),
                    'error': str(exception)
                }
            )
        
        # Clear context
        try:
            clear_context()
        except:
            pass


def require_request_id(f):
    """
    Decorator to ensure request has X-Request-ID.
    Useful for external-facing API endpoints.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        request_id = request.headers.get('X-Request-ID')
        if not request_id:
            # Generate one if missing
            request_id = str(uuid.uuid4())
            g.request_id = request_id
        return f(*args, **kwargs)
    return decorated_function
