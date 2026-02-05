"""
JWT Authentication Middleware for EKA-AI Platform
Implements RBAC for protected endpoints
"""

from functools import wraps
from flask import request, g, jsonify
import jwt
import os
from datetime import datetime, timezone

def get_jwt_secret():
    secret = os.getenv('JWT_SECRET')
    if not secret:
        raise ValueError("JWT_SECRET environment variable not set")
    return secret

def require_auth(allowed_roles=None):
    """
    Authentication decorator with optional role-based access control.
    
    Usage:
        @require_auth()  # Any authenticated user
        @require_auth(allowed_roles=['OWNER', 'MANAGER'])  # Specific roles only
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Extract token from Authorization header
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Authentication required', 'code': 'NO_TOKEN'}), 401
            
            token = auth_header.replace('Bearer ', '')
            if not token:
                return jsonify({'error': 'Authentication required', 'code': 'EMPTY_TOKEN'}), 401
            
            try:
                # Decode and validate token
                payload = jwt.decode(
                    token, 
                    get_jwt_secret(), 
                    algorithms=['HS256'],
                    options={"require": ["sub", "role", "workshop_id", "exp", "iat"]}
                )
                
                # Store user context in Flask g object
                g.user_id = payload['sub']
                g.user_role = payload['role']
                g.workshop_id = payload['workshop_id']
                g.user_email = payload.get('email')
                g.token_exp = payload['exp']
                
                # Role-based access control
                if allowed_roles and payload['role'] not in allowed_roles:
                    return jsonify({
                        'error': 'Insufficient privileges',
                        'code': 'FORBIDDEN',
                        'required_roles': allowed_roles,
                        'user_role': payload['role']
                    }), 403
                
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token expired', 'code': 'TOKEN_EXPIRED'}), 401
            except jwt.InvalidTokenError as e:
                return jsonify({'error': 'Invalid token', 'code': 'INVALID_TOKEN', 'detail': str(e)}), 401
            except ValueError as e:
                return jsonify({'error': 'Server configuration error', 'code': 'CONFIG_ERROR'}), 500
            
            return f(*args, **kwargs)
        return decorated
    return decorator


def generate_token(user_id: str, role: str, workshop_id: str, email: str = None, expiry_hours: int = 24) -> str:
    """
    Generate a JWT token for a user.
    
    Args:
        user_id: UUID of the user
        role: User role (OWNER, MANAGER, TECHNICIAN, FLEET, CUSTOMER)
        workshop_id: UUID of the user's workshop
        email: Optional user email
        expiry_hours: Token validity in hours (default 24)
    
    Returns:
        JWT token string
    """
    from datetime import timedelta
    
    now = datetime.now(timezone.utc)
    exp_time = now + timedelta(hours=expiry_hours)
    
    payload = {
        'sub': user_id,
        'role': role,
        'workshop_id': workshop_id,
        'email': email,
        'iat': int(now.timestamp()),
        'exp': int(exp_time.timestamp())
    }
    
    return jwt.encode(payload, get_jwt_secret(), algorithm='HS256')


def get_current_user():
    """
    Get the current authenticated user from Flask g object.
    Must be called within a request context after @require_auth.
    
    Returns:
        dict with user_id, role, workshop_id, email
    """
    return {
        'user_id': getattr(g, 'user_id', None),
        'role': getattr(g, 'user_role', None),
        'workshop_id': getattr(g, 'workshop_id', None),
        'email': getattr(g, 'user_email', None)
    }


def workshop_isolation_check(entity_workshop_id: str) -> bool:
    """
    Verify that the current user has access to the specified workshop's data.
    Prevents cross-tenant data access.
    
    Args:
        entity_workshop_id: Workshop ID of the entity being accessed
    
    Returns:
        True if access is allowed, False otherwise
    """
    current_workshop = getattr(g, 'workshop_id', None)
    if not current_workshop:
        return False
    return current_workshop == entity_workshop_id
