"""
GDPR Compliance Endpoints
Handles data export, deletion, and privacy requests
"""
from flask import Blueprint, jsonify, request, current_app
from middleware.auth import require_auth
import json
from datetime import datetime

gdpr_bp = Blueprint('gdpr', __name__, url_prefix='/api/gdpr')

@gdpr_bp.route('/export-data', methods=['GET'])
@require_auth()
def export_user_data():
    """
    Export all data associated with the authenticated user
    Returns JSON with all personal data for GDPR data portability
    """
    try:
        user = request.user
        user_id = user.get('id')
        workshop_id = user.get('workshop_id')
        
        # Initialize data package
        data_package = {
            "export_date": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "workshop_id": workshop_id,
            "user_profile": {},
            "job_cards": [],
            "invoices": [],
            "subscription_history": [],
            "activity_logs": []
        }
        
        # Get Supabase client
        supabase = current_app.config.get('supabase')
        if not supabase:
            return jsonify({"error": "Database not configured"}), 500
        
        # Fetch user profile
        profile = supabase.table('user_profiles').select('*').eq('user_id', user_id).execute()
        if profile.data:
            data_package['user_profile'] = profile.data[0]
        
        # Fetch job cards for this user's workshop
        jobs = supabase.table('job_cards').select('*').eq('workshop_id', workshop_id).execute()
        data_package['job_cards'] = jobs.data
        
        # Fetch invoices
        invoices = supabase.table('invoices').select('*').eq('workshop_id', workshop_id).execute()
        data_package['invoices'] = invoices.data
        
        # Fetch subscription logs
        subs = supabase.table('subscription_logs').select('*').eq('workshop_id', workshop_id).execute()
        data_package['subscription_history'] = subs.data
        
        # Fetch audit logs
        logs = supabase.table('audit_logs').select('*').eq('user_id', user_id).execute()
        data_package['activity_logs'] = logs.data
        
        return jsonify({
            "success": True,
            "data": data_package,
            "format": "JSON",
            "note": "This export contains all personal data as per GDPR Article 20"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@gdpr_bp.route('/delete-account', methods=['POST'])
@require_auth()
def delete_user_account():
    """
    Delete user account and all associated data
    GDPR Right to be Forgotten (Article 17)
    """
    try:
        user = request.user
        user_id = user.get('id')
        workshop_id = user.get('workshop_id')
        
        supabase = current_app.config.get('supabase')
        if not supabase:
            return jsonify({"error": "Database not configured"}), 500
        
        # Soft delete - anonymize instead of hard delete for audit purposes
        # 1. Anonymize user profile
        supabase.table('user_profiles').update({
            'full_name': 'DELETED_USER',
            'email': f'deleted_{user_id}@deleted.com',
            'phone': None,
            'is_active': False,
            'deleted_at': datetime.utcnow().isoformat()
        }).eq('user_id', user_id).execute()
        
        # 2. Mark job cards as deleted
        supabase.table('job_cards').update({
            'customer_phone': 'DELETED',
            'notes': 'User account deleted',
            'updated_at': datetime.utcnow().isoformat()
        }).eq('workshop_id', workshop_id).execute()
        
        # 3. Log the deletion
        supabase.table('audit_logs').insert({
            'user_id': user_id,
            'action': 'ACCOUNT_DELETED',
            'entity_type': 'USER',
            'entity_id': user_id,
            'new_values': {'deleted_at': datetime.utcnow().isoformat()}
        }).execute()
        
        return jsonify({
            "success": True,
            "message": "Account and associated data have been deleted",
            "note": "Some anonymized records may be retained for legal compliance"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@gdpr_bp.route('/privacy-request', methods=['POST'])
@require_auth()
def submit_privacy_request():
    """
    Submit a privacy-related request
    Handles GDPR requests: access, rectification, erasure, restriction, objection
    """
    try:
        data = request.get_json()
        request_type = data.get('type')  # 'access', 'rectification', 'erasure', 'restriction', 'objection'
        details = data.get('details', '')
        
        user = request.user
        
        valid_types = ['access', 'rectification', 'erasure', 'restriction', 'objection']
        if request_type not in valid_types:
            return jsonify({"error": f"Invalid request type. Must be one of: {valid_types}"}), 400
        
        # Store the request
        supabase = current_app.config.get('supabase')
        if supabase:
            supabase.table('privacy_requests').insert({
                'user_id': user.get('id'),
                'request_type': request_type,
                'details': details,
                'status': 'PENDING',
                'created_at': datetime.utcnow().isoformat()
            }).execute()
        
        return jsonify({
            "success": True,
            "message": f"Your {request_type} request has been received",
            "request_type": request_type,
            "timeline": "We will respond within 30 days as per GDPR requirements"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
