"""
EKA-AI Platform: Structured Logging Configuration (2026 Enterprise Standard)
Implements structlog for JSON logs in production, readable logs in development.
"""

import logging
import sys
import os
from typing import List, Any

# Try to import structlog, fallback to standard logging if not available
try:
    import structlog
    from structlog.types import Processor
    STRUCTLOG_AVAILABLE = True
except ImportError:
    STRUCTLOG_AVAILABLE = False

# Determine environment
ENV = os.getenv("FLASK_ENV", "development")


def configure_logging() -> None:
    """
    Configures structured logging with request_id support for distributed tracing.
    """
    
    if not STRUCTLOG_AVAILABLE:
        # Fallback to standard logging
        logging.basicConfig(
            level=logging.INFO if ENV == "production" else logging.DEBUG,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            stream=sys.stdout,
        )
        logger = logging.getLogger(__name__)
        logger.warning("structlog not available, using standard logging")
        return
    
    # Shared Processors (Timestamps, Log Level)
    shared_processors: List[Processor] = [
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
    ]
    
    # Environment-Specific Processors
    if ENV == "production":
        # In production: strictly structured JSON for Datadog/CloudWatch
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]
        log_level = logging.INFO
    else:
        # In development: readable colored logs
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]
        log_level = logging.DEBUG
    
    # Configure Structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Integrate with Standard Library (Capture Flask/SQLAlchemy logs)
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )
    
    # Redirect standard loggers to structlog
    def forward_to_structlog(logger_name: str):
        std_logger = logging.getLogger(logger_name)
        std_logger.setLevel(log_level)
        # Remove existing handlers to avoid duplicates
        std_logger.handlers = []
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter("%(message)s"))
        std_logger.addHandler(handler)
    
    # Capture Flask and Werkzeug logs
    forward_to_structlog("werkzeug")
    forward_to_structlog("flask.app")
    forward_to_structlog("sqlalchemy.engine")


def get_logger(name: str = None):
    """Get a structured logger instance."""
    if STRUCTLOG_AVAILABLE:
        return structlog.get_logger(name)
    else:
        return logging.getLogger(name)


# Bind context variables for distributed tracing
def bind_request_context(request_id: str, user_id: str = None, workshop_id: str = None):
    """Bind request context to all subsequent log entries."""
    if STRUCTLOG_AVAILABLE:
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            user_id=user_id,
            workshop_id=workshop_id,
        )


def clear_context():
    """Clear bound context variables."""
    if STRUCTLOG_AVAILABLE:
        structlog.contextvars.clear_contextvars()
