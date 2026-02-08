"""
Monitoring and observability middleware for EKA-AI
Tracks performance, errors, and system health
"""
import time
import logging
from functools import wraps
from flask import request, g, jsonify
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    psutil = None
    
import os

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('eka-ai-monitor')

class MonitoringMiddleware:
    """Tracks request metrics and system health"""
    
    def __init__(self, app=None):
        self.app = app
        self.request_count = 0
        self.error_count = 0
        self.response_times = []
        
    def init_app(self, app):
        """Initialize with Flask app"""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        
    def before_request(self):
        """Start timing before each request"""
        g.start_time = time.time()
        g.request_id = f"req_{int(time.time() * 1000)}"
        
    def after_request(self, response):
        """Log metrics after each request"""
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            self.response_times.append(duration)
            
            # Keep only last 1000 response times
            if len(self.response_times) > 1000:
                self.response_times = self.response_times[-1000:]
            
            self.request_count += 1
            if response.status_code >= 400:
                self.error_count += 1
            
            # Log slow requests (> 2 seconds)
            if duration > 2.0:
                logger.warning(f"Slow request: {request.endpoint} took {duration:.2f}s")
            
            # Add headers for debugging
            response.headers['X-Request-ID'] = g.request_id
            response.headers['X-Response-Time'] = f"{duration:.3f}s"
            
        return response
    
    def get_system_health(self):
        """Get comprehensive system health metrics"""
        try:
            if PSUTIL_AVAILABLE and psutil:
                cpu_percent = psutil.cpu_percent(interval=1)
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                
                return {
                    "status": "healthy" if cpu_percent < 80 and memory.percent < 90 else "degraded",
                    "timestamp": time.time(),
                    "system": {
                        "cpu_percent": cpu_percent,
                        "memory_percent": memory.percent,
                        "memory_available_mb": memory.available // (1024 * 1024),
                        "disk_percent": disk.percent,
                        "disk_free_gb": disk.free // (1024 * 1024 * 1024)
                    },
                    "application": {
                        "request_count": self.request_count,
                        "error_count": self.error_count,
                        "error_rate": (self.error_count / max(self.request_count, 1)) * 100,
                        "avg_response_time": sum(self.response_times) / max(len(self.response_times), 1),
                        "uptime_seconds": time.time() - psutil.Process().create_time()
                    }
                }
            else:
                # Fallback without psutil
                return {
                    "status": "healthy",
                    "timestamp": time.time(),
                    "system": {"note": "psutil not available"},
                    "application": {
                        "request_count": self.request_count,
                        "error_count": self.error_count,
                        "error_rate": (self.error_count / max(self.request_count, 1)) * 100,
                        "avg_response_time": sum(self.response_times) / max(len(self.response_times), 1)
                    }
                }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)}

def track_performance(f):
    """Decorator to track function performance"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start = time.time()
        try:
            result = f(*args, **kwargs)
            duration = time.time() - start
            logger.info(f"Function {f.__name__} completed in {duration:.3f}s")
            return result
        except Exception as e:
            duration = time.time() - start
            logger.error(f"Function {f.__name__} failed after {duration:.3f}s: {e}")
            raise
    return decorated_function
