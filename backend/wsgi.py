"""
WSGI Entry Point for EKA-AI Platform (Production v4.5)
This file is used by Gunicorn to serve the Flask application.

Usage:
    gunicorn --bind 0.0.0.0:8001 --workers 3 --threads 4 --worker-class gthread --timeout 120 wsgi:flask_app
"""
import os
import sys
import logging

# Configure logging before importing app
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from server import flask_app
    logger.info("✅ WSGI: Flask application loaded successfully")
except Exception as e:
    logger.error(f"❌ WSGI: Failed to load Flask application: {e}")
    raise

# Export the application object for Gunicorn
application = flask_app

if __name__ == "__main__":
    # Development server (not for production)
    flask_app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8001)), debug=False)
