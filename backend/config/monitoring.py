"""
config/monitoring.py
Observability and monitoring configuration for EKA-AI Platform.
Initializes Sentry for error tracking and performance monitoring.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Try to import Sentry
try:
    import sentry_sdk
    from sentry_sdk.integrations.flask import FlaskIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False
    logger.warning("Sentry SDK not available. Error tracking disabled.")


def init_monitoring(app) -> Optional[object]:
    """
    Initialize Sentry monitoring for Flask application.
    
    Args:
        app: Flask application instance
        
    Returns:
        Sentry client or None if not configured
    """
    if not SENTRY_AVAILABLE:
        logger.info("ℹ️ Sentry not available (install sentry-sdk[flask])")
        return None
    
    sentry_dsn = os.environ.get('SENTRY_DSN')
    environment = os.environ.get('FLASK_ENV', 'development')
    
    if not sentry_dsn:
        logger.info("ℹ️ Sentry not configured (set SENTRY_DSN env var)")
        return None
    
    try:
        # Configure Sentry with Flask and Redis integrations
        sentry_sdk.init(
            dsn=sentry_dsn,
            environment=environment,
            integrations=[
                FlaskIntegration(),
                RedisIntegration(),
            ],
            # Performance monitoring
            traces_sample_rate=float(os.environ.get('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
            # Profiling (Python 3.11+)
            profiles_sample_rate=float(os.environ.get('SENTRY_PROFILES_SAMPLE_RATE', '0.1')),
            # Attach stack traces to log messages
            attach_stacktrace=True,
            # Send default PII (user IP, etc.) - adjust based on privacy requirements
            send_default_pii=False,
            # Release tracking
            release=os.environ.get('GIT_COMMIT_SHA', 'unknown'),
            # Server name
            server_name=os.environ.get('HOSTNAME', 'eka-ai-server'),
        )
        
        logger.info(f"✅ Sentry monitoring initialized (env={environment})")
        
        # Set tags for easier filtering in Sentry dashboard
        sentry_sdk.set_tag("service", "eka-ai-backend")
        sentry_sdk.set_tag("version", "4.5")
        
        return sentry_sdk
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize Sentry: {e}")
        return None


def capture_exception(exception: Exception, context: dict = None):
    """
    Manually capture an exception in Sentry.
    
    Args:
        exception: The exception to capture
        context: Optional context dictionary
    """
    if not SENTRY_AVAILABLE:
        return
    
    try:
        if context:
            with sentry_sdk.push_scope() as scope:
                for key, value in context.items():
                    scope.set_extra(key, value)
                sentry_sdk.capture_exception(exception)
        else:
            sentry_sdk.capture_exception(exception)
    except Exception:
        pass  # Fail silently if Sentry fails


def capture_message(message: str, level: str = "info"):
    """
    Capture a message in Sentry.
    
    Args:
        message: Message to log
        level: Severity level (info, warning, error, fatal)
    """
    if not SENTRY_AVAILABLE:
        return
    
    try:
        sentry_sdk.capture_message(message, level=level)
    except Exception:
        pass


class PerformanceMonitor:
    """
    Context manager for performance monitoring.
    Tracks execution time and reports slow operations to Sentry.
    """
    
    def __init__(self, operation: str, slow_threshold_ms: int = 1000):
        self.operation = operation
        self.slow_threshold_ms = slow_threshold_ms
        self.start_time = None
        
    def __enter__(self):
        import time
        self.start_time = time.time()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        if self.start_time:
            elapsed_ms = (time.time() - self.start_time) * 1000
            
            # Log slow operations
            if elapsed_ms > self.slow_threshold_ms:
                logger.warning(f"Slow operation: {self.operation} took {elapsed_ms:.2f}ms")
                if SENTRY_AVAILABLE:
                    sentry_sdk.set_extra(f"slow_{self.operation}", elapsed_ms)
                    sentry_sdk.capture_message(
                        f"Slow operation: {self.operation}", 
                        level="warning"
                    )


def init_error_tracking(app):
    """
    Additional error tracking setup (if needed beyond Sentry).
    Can be extended for other providers.
    """
    # Log all unhandled exceptions
    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.error(f"Unhandled exception: {e}", exc_info=True)
        capture_exception(e)
        # Re-raise to let Flask handle it
        raise e
