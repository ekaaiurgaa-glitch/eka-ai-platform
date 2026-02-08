"""
EKA-AI Platform: API Gateway
Enables third-party integrations (Insurance, Fleet, Parts suppliers).
This transforms EKA-AI from an app to a PLATFORM.
"""

from flask import Blueprint, request, jsonify, g
from functools import wraps
import time
from datetime import datetime

api_gateway = Blueprint('api_gateway', __name__, url_prefix='/platform/v1')


# Rate limiting per API key
API_RATE_LIMITS = {
    "insurance": 10000,  # Insurance companies need high volume
    "fleet": 50000,
    "parts_supplier": 25000,
    "integration_partner": 5000
}


def require_api_key(f):
    """Validate API key and set tenant context"""
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({"error": "API key required"}), 401
        
        # Validate key and get tenant
        key_data = validate_api_key(api_key)
        if not key_data:
            return jsonify({"error": "Invalid API key"}), 401
        
        # Set context for this request
        g.tenant_id = key_data['tenant_id']
        g.api_key = api_key
        g.api_tier = key_data['tier']
        
        # Check rate limit
        if not check_rate_limit(api_key, key_data['tier']):
            return jsonify({"error": "Rate limit exceeded"}), 429
        
        return f(*args, **kwargs)
    return decorated


def validate_api_key(key: str) -> dict:
    """Validate API key from database"""
    # Implementation: Check against api_keys table
    return {
        "tenant_id": "tenant_123",
        "tier": "insurance",
        "permissions": ["read:job_cards", "write:claims"]
    }


def check_rate_limit(api_key: str, tier: str) -> bool:
    """Check if request is within rate limit"""
    # Implementation using Redis
    return True


# ═════════════════════════════════════════════════════════════════
# INSURANCE COMPANY INTEGRATIONS
# ═════════════════════════════════════════════════════════════════

@api_gateway.route('/insurance/claims', methods=['POST'])
@require_api_key
def create_claim():
    """
    Insurance company creates a new claim.
    Links to workshop for repair authorization.
    """
    data = request.json
    
    claim = {
        "claim_id": f"CLM_{int(time.time())}",
        "insurance_tenant_id": g.tenant_id,
        "policy_number": data.get('policy_number'),
        "vehicle_reg": data.get('vehicle_registration'),
        "garage_id": data.get('assigned_garage_id'),
        "damage_description": data.get('damage_description'),
        "estimated_amount": data.get('estimated_amount'),
        "status": "pending_surveyor",
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Notify assigned garage
    notify_garage(claim['garage_id'], {
        "type": "new_claim",
        "claim": claim
    })
    
    return jsonify({
        "success": True,
        "claim": claim,
        "message": "Claim created and garage notified"
    })


@api_gateway.route('/insurance/claims/<claim_id>/status', methods=['GET'])
@require_api_key
def get_claim_status(claim_id: str):
    """Insurance company checks repair status"""
    # Fetch from database
    status = {
        "claim_id": claim_id,
        "status": "in_progress",
        "garage_updates": [
            {
                "timestamp": "2026-02-08T10:00:00Z",
                "status": "vehicle_received",
                "notes": "Initial inspection complete"
            },
            {
                "timestamp": "2026-02-08T14:30:00Z",
                "status": "repair_in_progress",
                "notes": "Parts ordered, ETA 2 days"
            }
        ],
        "estimated_completion": "2026-02-12",
        "current_cost": 45000
    }
    return jsonify(status)


@api_gateway.route('/insurance/garages', methods=['GET'])
@require_api_key
def list_cashless_garages():
    """
    Get list of network garages (cashless claim partners).
    Insurance companies maintain their network on EKA-AI.
    """
    garages = [
        {
            "garage_id": "G123",
            "name": "Sharma Motors",
            "address": "Mumbai, Maharashtra",
            "rating": 4.5,
            "specialization": ["Maruti", "Hyundai"],
            "cashless_enabled": True,
            "turnaround_time_days": 3
        }
    ]
    return jsonify({"garages": garages})


# ═════════════════════════════════════════════════════════════════
# FLEET OPERATOR INTEGRATIONS
# ═════════════════════════════════════════════════════════════════

@api_gateway.route('/fleet/vehicles', methods=['GET'])
@require_api_key
def get_fleet_vehicles():
    """Fleet company gets all their vehicles with maintenance status"""
    vehicles = [
        {
            "vehicle_id": "VH001",
            "registration": "MH12AB1234",
            "make": "Tata",
            "model": "Ace",
            "current_odometer": 45000,
            "next_service_due": 50000,
            "service_due_date": "2026-03-15",
            "health_score": 85,  # AI-calculated
            "last_service": "2025-12-01",
            "assigned_driver": "Driver 1",
            "status": "active"
        }
    ]
    return jsonify({"vehicles": vehicles})


@api_gateway.route('/fleet/vehicles/<vehicle_id>/predictive-maintenance', methods=['GET'])
@require_api_key
def get_predictive_maintenance(vehicle_id: str):
    """
    AI predicts which parts will fail and when.
    Helps fleet companies plan maintenance budgets.
    """
    predictions = {
        "vehicle_id": vehicle_id,
        "ai_analysis_date": datetime.utcnow().isoformat(),
        "predicted_issues": [
            {
                "component": "Brake Pads",
                "current_condition": "70%",
                "predicted_failure_km": 52000,
                "predicted_failure_date": "2026-04-10",
                "recommended_action": "Replace in next service",
                "estimated_cost": 3500,
                "urgency": "medium"
            },
            {
                "component": "Clutch Plate",
                "current_condition": "45%",
                "predicted_failure_km": 48000,
                "predicted_failure_date": "2026-03-20",
                "recommended_action": "Schedule replacement",
                "estimated_cost": 12000,
                "urgency": "high"
            }
        ],
        "total_estimated_cost": 15500,
        "recommended_service_date": "2026-03-15"
    }
    return jsonify(predictions)


@api_gateway.route('/fleet/maintenance/bulk-schedule', methods=['POST'])
@require_api_key
def bulk_schedule_maintenance():
    """
    Schedule maintenance for multiple vehicles at once.
    Finds optimal garage based on location and availability.
    """
    data = request.json
    vehicle_ids = data.get('vehicle_ids', [])
    
    # AI optimizes scheduling
    schedule = {
        "batch_id": f"BATCH_{int(time.time())}",
        "vehicles_scheduled": len(vehicle_ids),
        "optimal_garage": "Sharma Motors",
        "garage_location": "Mumbai Central",
        "scheduled_date": "2026-02-15",
        "estimated_total_cost": 85000,
        "downtime_optimization": "Vehicles grouped to minimize fleet downtime"
    }
    
    return jsonify(schedule)


# ═════════════════════════════════════════════════════════════════
# PARTS SUPPLIER INTEGRATIONS
# ═════════════════════════════════════════════════════════════════

@api_gateway.route('/parts/catalog', methods=['GET', 'POST'])
@require_api_key
def manage_parts_catalog():
    """Parts supplier manages their catalog"""
    if request.method == 'GET':
        parts = [
            {
                "sku": "BOSCH-OIL-FILTER-001",
                "name": "Bosch Oil Filter",
                "category": "Filters",
                "compatible_vehicles": ["Maruti Swift", "Hyundai i20"],
                "price": 450,
                "stock_quantity": 500,
                "moq": 10,  # Minimum order quantity
                "delivery_time": "2 days"
            }
        ]
        return jsonify({"parts": parts})
    
    else:  # POST - Add new part
        data = request.json
        # Create part
        return jsonify({"success": True, "sku": data.get('sku')})


@api_gateway.route('/parts/inquiry', methods=['POST'])
@require_api_key
def receive_parts_inquiry():
    """
    Workshop inquires about parts availability.
    Routed to appropriate supplier.
    """
    data = request.json
    inquiry = {
        "inquiry_id": f"INQ_{int(time.time())}",
        "workshop_id": g.tenant_id,
        "parts_needed": data.get('parts'),
        "required_by_date": data.get('required_by'),
        "status": "sent_to_suppliers"
    }
    
    # Broadcast to relevant suppliers
    return jsonify({
        "inquiry_id": inquiry["inquiry_id"],
        "message": "Inquiry sent to 5 suppliers",
        "expected_responses": "Within 2 hours"
    })


@api_gateway.route('/parts/orders', methods=['POST'])
@require_api_key
def create_parts_order():
    """Workshop orders parts from supplier"""
    data = request.json
    
    order = {
        "order_id": f"ORD_{int(time.time())}",
        "supplier_id": data.get('supplier_id'),
        "workshop_id": g.tenant_id,
        "items": data.get('items'),
        "total_amount": sum(item['price'] * item['quantity'] for item in data.get('items', [])),
        "status": "confirmed",
        "estimated_delivery": "2026-02-10",
        "payment_terms": "Net 15 days"  # Industry standard
    }
    
    return jsonify(order)


# ═════════════════════════════════════════════════════════════════
# WORKSHOP NETWORK API
# ═════════════════════════════════════════════════════════════════

@api_gateway.route('/workshops/search', methods=['GET'])
def search_workshops():
    """
    Public API - Find workshops by location/specialization.
    Used by: Customers, Insurance apps, Fleet apps.
    """
    location = request.args.get('location')
    specialization = request.args.get('specialization')
    
    workshops = [
        {
            "workshop_id": "WS123",
            "name": "Sharma Motors",
            "address": "Andheri East, Mumbai",
            "coordinates": {"lat": 19.119, "lng": 72.847},
            "specialization": ["Maruti", "Hyundai", "Tata"],
            "services": ["General Service", "Accident Repair", "Painting"],
            "rating": 4.5,
            "review_count": 128,
            "estimated_cost": "Mid-range",
            "turnaround_time": "2-3 days",
            "ai_enabled": True,
            "contact": {"phone": "+91-9876543210"}
        }
    ]
    
    return jsonify({
        "workshops": workshops,
        "total": len(workshops),
        "search_params": {"location": location, "specialization": specialization}
    })


@api_gateway.route('/workshops/<workshop_id>/availability', methods=['GET'])
def check_workshop_availability(workshop_id: str):
    """Check real-time slot availability"""
    availability = {
        "workshop_id": workshop_id,
        "next_available_slot": "2026-02-09T10:00:00Z",
        "available_slots": [
            {"time": "10:00 AM", "available": True},
            {"time": "11:30 AM", "available": True},
            {"time": "2:00 PM", "available": False}
        ],
        "current_queue": 3,
        "estimated_wait": "30 minutes"
    }
    return jsonify(availability)


# ═════════════════════════════════════════════════════════════════
# WEBHOOK SYSTEM
# ═════════════════════════════════════════════════════════════════

@api_gateway.route('/webhooks/register', methods=['POST'])
@require_api_key
def register_webhook():
    """
    Register webhook URL for real-time notifications.
    Events: job_card_updated, invoice_generated, claim_status_changed
    """
    data = request.json
    
    webhook = {
        "webhook_id": f"WH_{int(time.time())}",
        "tenant_id": g.tenant_id,
        "url": data.get('url'),
        "events": data.get('events', []),
        "secret": generate_webhook_secret(),
        "active": True
    }
    
    return jsonify({
        "webhook_id": webhook["webhook_id"],
        "secret": webhook["secret"],
        "message": "Webhook registered successfully"
    })


def generate_webhook_secret():
    import secrets
    return secrets.token_urlsafe(32)


def notify_garage(garage_id: str, notification: dict):
    """Send notification to garage"""
    pass
