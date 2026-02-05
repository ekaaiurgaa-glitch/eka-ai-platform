"""
EKA-AI Production Configuration
Redis-backed rate limiting for multi-instance deployments
"""

import os

# Rate Limiting Configuration
RATELIMIT_STORAGE_URI = os.getenv("REDIS_URL", "redis://localhost:6379/0")
RATELIMIT_STRATEGY = "fixed-window"  # Options: "fixed-window", "sliding-window-counter"
RATELIMIT_DEFAULT = "60 per minute"
RATELIMIT_HEADERS_ENABLED = True

# Rate limits by endpoint category
RATE_LIMITS = {
    'ai_chat': "15 per minute",      # AI intelligence endpoint
    'tts': "20 per minute",          # Text-to-speech
    'pdi_upload': "30 per minute",   # PDI evidence upload
    'auth': "10 per minute",         # Login attempts
    'billing': "30 per minute",      # MG billing calculations
}

# Security Configuration
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

# Database
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",")
