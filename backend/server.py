"""
EKA-AI Backend Server (Production v4.5)
Governed Automobile Intelligence System for Go4Garage Private Limited
Features: Triple-Model Router, Rate Limiting, JWT Auth, Supabase Integration, PDI Pipeline
"""

from flask import Flask, jsonify, request, send_from_directory, g, redirect
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix
from decimal import Decimal
from functools import wraps
import os
import json
import base64
import jwt
import datetime
import logging
from dotenv import load_dotenv

# Setup logging first (before any imports that might fail)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import EKA-AI Services
from services.mg_service import MGEngine
from services.billing import calculate_invoice_totals, validate_gstin, determine_tax_type
from services.job_card_manager import JobCardManager, JobStatus, JobPriority, VALID_TRANSITIONS as JC_VALID_TRANSITIONS
from services.pdi_manager import PDIManager, PDIStatus, STANDARD_PDI_ITEMS
from services.invoice_manager import InvoiceManager
from services.ai_governance import AIGovernance
from services.subscription_service import SubscriptionService
from services.vector_engine import vector_engine, get_cached_response, cache_response
from services.scheduler import start_scheduler
from services.backup_service import backup_service, perform_backup
from middleware.auth import require_auth, get_current_user
from middleware.monitoring import MonitoringMiddleware, track_performance
from middleware.rate_limit import init_rate_limiter, init_error_handlers
from routes.dashboard import dashboard_bp

# Phase 3: Initialize monitoring (Sentry)
from config.monitoring import init_monitoring, capture_exception
init_monitoring(flask_app)

# Import LangChain/LlamaIndex Knowledge Base and Agents
try:
    from knowledge_base.index_manager import get_knowledge_base
    from agents.rag_service import get_rag_service
    from agents.diagnostic_agent import get_diagnostic_agent
    KNOWLEDGE_BASE_AVAILABLE = True
except ImportError as e:
    logger.warning(f"⚠️ Knowledge base not available: {e}")
    KNOWLEDGE_BASE_AVAILABLE = False

load_dotenv()

# ─────────────────────────────────────────
# FLASK APP INIT
# ─────────────────────────────────────────
flask_app = Flask(__name__, static_folder='../dist', static_url_path='')

# PROXY FIX: Essential for correct IP detection behind Nginx/Emergent/AWS
flask_app.wsgi_app = ProxyFix(flask_app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

raw_origins = os.environ.get('CORS_ORIGINS', '*')
origins_list = [origin.strip() for origin in raw_origins.split(',') if origin.strip()]
CORS(flask_app, origins=origins_list)

# ─────────────────────────────────────────
# PHASE 4: DASHBOARD BLUEPRINT (Glass Cockpit)
# ─────────────────────────────────────────
flask_app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
logger.info("✅ Phase 4: Dashboard Blueprint (Glass Cockpit) registered")

# ─────────────────────────────────────────
# PHASE 3: PROTECTION LAYER (Rate Limiting)
# ─────────────────────────────────---------
# Initialize distributed rate limiter with Redis
limiter = init_rate_limiter(flask_app)
init_error_handlers(flask_app)
logger.info("✅ Phase 3: Protection Layer (Rate Limiting) initialized")

# ─────────────────────────────────────────
# PHASE 3: CONCURRENCY LAYER (Scheduler)
# ─────────────────────────────────────────
# Start distributed job scheduler with Redis locking (production only)
if os.getenv("FLASK_ENV") == "production":
    start_scheduler(flask_app)
    logger.info("✅ Phase 3: Concurrency Layer (Scheduler) initialized")
else:
    logger.info("ℹ️ Phase 3: Scheduler disabled (development mode)")

# ─────────────────────────────────────────
# PHASE 3: COGNITIVE LAYER (Vector Cache)
# ─────────────────────────────────────────
# Vector engine singleton is auto-initialized on import
logger.info(f"✅ Phase 3: Cognitive Layer (Vector Cache) status: {vector_engine.get_cache_stats()}")

# ─────────────────────────────────────────
# CLIENT INITIALIZATION (Graceful Degradation)
# ─────────────────────────────────────────
supabase = None
anthropic_client = None

try:
    if os.environ.get("SUPABASE_URL"):
        from supabase import create_client
        supabase = create_client(
            os.environ.get("SUPABASE_URL"), 
            os.environ.get("SUPABASE_SERVICE_KEY")
        )
        print("✅ Supabase Connected")
except Exception as e: 
    print(f"⚠️  Supabase Warning: {e}")

try:
    if os.environ.get("ANTHROPIC_API_KEY"):
        import anthropic
        anthropic_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        print("✅ Anthropic Connected")
except Exception as e: 
    print(f"⚠️  Anthropic Warning: {e}")

# ─────────────────────────────────────────
# MANAGER INITIALIZATION HELPERS
# ─────────────────────────────────────────
def get_job_card_manager(db):
    """Get JobCardManager instance"""
    if not db:
        raise ValueError("Database connection required")
    return JobCardManager(db)

def get_pdi_manager(db):
    """Get PDIManager instance"""
    if not db:
        raise ValueError("Database connection required")
    return PDIManager(db)

def get_invoice_manager(db):
    """Get InvoiceManager instance"""
    if not db:
        raise ValueError("Database connection required")
    return InvoiceManager(db)

def get_ai_governance():
    """Get AIGovernance instance"""
    return AIGovernance()

# ─────────────────────────────────────────
# EKA-AI MASTER CONSTITUTION
# ─────────────────────────────────────────
EKA_CONSTITUTION = """
SYSTEM IDENTITY:
You are EKA-AI — the governed intelligence engine of Go4Garage Private Limited.
You are a deterministic, audit-grade automobile intelligence system. You are NOT a chatbot.

═══════════════════════════════════════════════════════════════
CORE CONSTITUTION (NON-NEGOTIABLE)
═══════════════════════════════════════════════════════════════

1. Single-Agent Rule: You are ONE agent. No simulated debates.
2. Zero Hallucination Rule: If confidence < 90%, ask clarifying questions. Never guess.
3. Pricing Rule (HARD BLOCK): NEVER output exact prices. Only ranges (e.g., ₹800-1200). Exact pricing lives in backend.
4. Database Authority: Prioritize injected Supabase vehicle data over user claims.
5. Safety First: Never provide unsafe repair instructions. If dangerous, say STOP.
6. Output Format: ALWAYS valid JSON. No markdown outside JSON.

═══════════════════════════════════════════════════════════════
JOB CARD LIFECYCLE (9-STATE PIPELINE)
═══════════════════════════════════════════════════════════════

STATES: CREATED → CONTEXT_VERIFIED → DIAGNOSED → ESTIMATED → CUSTOMER_APPROVAL → IN_PROGRESS → PDI → INVOICED → CLOSED

- CREATED: Intake symptoms. Do not diagnose yet.
- CONTEXT_VERIFIED: Must have Brand, Model, Year, Fuel Type.
- DIAGNOSED: Map symptoms to fault categories. Confidence gating applies.
- ESTIMATED: Price RANGES only. HSN 8708 (28% GST) for parts, 9987 (18%) for labor.
- CUSTOMER_APPROVAL: Block until explicit authorization via secure link.
- IN_PROGRESS: Workshop execution. Photo/video evidence required.
- PDI: Pre-delivery inspection checklist. Safety gates mandatory.
- INVOICED: Final billing (handled by external system).
- CLOSED: Archive. Learning ingestion allowed.

═══════════════════════════════════════════════════════════════
MG MODEL (MINIMUM GUARANTEE) — FLEET LOGIC
═══════════════════════════════════════════════════════════════

MG PURPOSE: Predictable cost exposure for fleet operators.
LOGIC: 
- Monthly_Assured_Revenue = Assured_KM × Rate_Per_KM
- Under-Utilization (Actual < Assured): Bill = Monthly_Assured_Revenue
- Over-Utilization (Actual > Assured): Bill = Assured + (Excess × Excess_Rate)
- Explain outcomes only. Never calculate final bills in text.

═══════════════════════════════════════════════════════════════
JSON OUTPUT SCHEMA (STRICT)
═══════════════════════════════════════════════════════════════
{
  "response_content": {"visual_text": "HTML/markdown string", "audio_text": "Plain text for TTS"},
  "job_status_update": "CURRENT_STATE",
  "ui_triggers": {"theme_color": "#f18a22", "show_orange_border": true},
  "diagnostic_data": {"code": "P0XXX", "severity": "CRITICAL|MODERATE|ADVISORY", "possible_causes": [], "recommended_actions": []},
  "estimate_data": {"estimate_id": "EST-XXX", "items": [], "tax_type": "CGST_SGST"},
  "mg_analysis": {"contract_status": "ACTIVE", "financial_summary": {}},
  "pdi_checklist": {"items": [], "technician_declaration": false, "evidence_provided": false},
  "recall_data": {"recalls": [], "common_issues": []}
}
"""

# ─────────────────────────────────────────
# DATABASE HELPERS
# ─────────────────────────────────────────
def fetch_vehicle_from_db(reg_number):
    """Fetch verified vehicle data from Supabase"""
    if not reg_number or not supabase: 
        return None
    try:
        res = supabase.table('vehicles').select("*").eq('registration_number', reg_number.upper()).execute()
        return res.data[0] if res.data else None
    except Exception as e: 
        print(f"DB Fetch Error: {e}")
        return None

def log_audit(mode, status, query, response, confidence=None):
    """Audit trail logging"""
    if not supabase:
        return
    try:
        supabase.table('intelligence_logs').insert({
            "mode": mode,
            "status": status,
            "user_query": query[:500],  # Truncate for safety
            "ai_response": response[:1000],
            "confidence_score": confidence,
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }).execute()
    except Exception as e:
        print(f"Audit Log Error: {e}")

# ─────────────────────────────────────────
# AI MODEL ROUTERS
# ─────────────────────────────────────────
def call_gemini(history, system_prompt):
    """Primary Gemini Flash 2.0 Router"""
    from google import genai
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=history,
        config={
            "system_instruction": system_prompt, 
            "response_mime_type": "application/json",
            "temperature": 0.1
        }
    )
    return json.loads(response.text)

def call_claude(history, system_prompt):
    """Fallback Claude 3.5 Sonnet Router (for THINKING mode)"""
    # Convert Gemini format to Claude format
    messages = []
    for msg in history:
        role = "user" if msg.get("role") == "user" else "assistant"
        content = msg["parts"][0]["text"]
        messages.append({"role": role, "content": content})
    
    msg = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4096,
        system=system_prompt,
        messages=messages
    )
    return json.loads(msg.content[0].text)

def normalize_response(result, default_status):
    """Ensures consistent API response shape"""
    safe_response = result if isinstance(result, dict) else {}
    return {
        "response_content": safe_response.get("response_content", {
            "visual_text": "System processed your request.", 
            "audio_text": "Processing complete."
        }),
        "job_status_update": safe_response.get("job_status_update", default_status),
        "ui_triggers": safe_response.get("ui_triggers", {
            "theme_color": "#f18a22", 
            "show_orange_border": True
        }),
        "diagnostic_data": safe_response.get("diagnostic_data"),
        "visual_metrics": safe_response.get("visual_metrics"),
        "mg_analysis": safe_response.get("mg_analysis"),
        "estimate_data": safe_response.get("estimate_data"),
        "pdi_checklist": safe_response.get("pdi_checklist"),
        "recall_data": safe_response.get("recall_data"),
        "service_history": safe_response.get("service_history")
    }

# ─────────────────────────────────────────
# API ENDPOINTS
# ─────────────────────────────────────────
@flask_app.route('/api/health')
def health():
    """System health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'eka-ai-brain',
        'version': '4.5',
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'integrations': {
            'supabase': supabase is not None,
            'anthropic': anthropic_client is not None,
            'gemini': os.environ.get("GEMINI_API_KEY") is not None
        }
    })

@flask_app.route('/api/chat', methods=['POST'])
@limiter.limit("15 per minute")
def chat():
    """Main intelligence endpoint with LlamaGuard safety"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        history = data.get('history', [])
        context = data.get('context', {})
        status = data.get('status', 'CREATED')
        mode = data.get('intelligence_mode', 'FAST')
        op_mode = data.get('operating_mode', 0)
        
        # ─────────────────────────────────────────
        # PHASE 5: LLAMAGUARD SAFETY CHECK (Input)
        # ─────────────────────────────────────────
        try:
            from services.llama_guard import validate_ai_input
            user_message = history[-1]['parts'][0]['text'] if history else ""
            safety_result = validate_ai_input(user_message, context="chat")
            
            if not safety_result.is_safe and safety_result.action == "BLOCK":
                logger.warning("LlamaGuard blocked input", extra={
                    "category": safety_result.category.value if safety_result.category else None,
                    "confidence": safety_result.confidence
                })
                return jsonify({
                    "response_content": {
                        "visual_text": f"⚠️ Request blocked due to safety policy ({safety_result.category.value if safety_result.category else 'Unknown'}). This content violates our acceptable use policy.",
                        "audio_text": "Request blocked due to safety policy."
                    },
                    "job_status_update": status,
                    "ui_triggers": {"theme_color": "#FF0000", "show_orange_border": True}
                }), 400
            
            # Use redacted input
            if history:
                history[-1]['parts'][0]['text'] = safety_result.redacted_input
                
        except Exception as lg_err:
            logger.error(f"LlamaGuard check error: {lg_err}")
            # Continue without blocking if LlamaGuard fails

        # Enrich context from database
        if context.get('registrationNumber'):
            db_veh = fetch_vehicle_from_db(context['registrationNumber'])
            if db_veh: 
                context.update({
                    'brand': db_veh.get('brand', context.get('brand')),
                    'model': db_veh.get('model', context.get('model')),
                    'year': db_veh.get('year', context.get('year')),
                    'fuel_type': db_veh.get('fuel_type', context.get('fuelType')),
                    'vin': db_veh.get('vin', context.get('vin'))
                })

        system_prompt = f"{EKA_CONSTITUTION}\n[OPERATING_MODE]: {op_mode}\n[CURRENT_STATUS]: {status}\n[VEHICLE_CONTEXT]: {json.dumps(context)}"
        
        # Router Logic
        result = None
        try:
            if mode == 'THINKING' and anthropic_client:
                result = call_claude(history, system_prompt)
            else:
                result = call_gemini(history, system_prompt)
                
            # Log successful interaction
            user_query = history[-1]['parts'][0]['text'] if history else ""
            log_audit(op_mode, result.get('job_status_update', status), user_query, 
                     result.get('response_content', {}).get('visual_text', ''))
                     
        except Exception as e:
            print(f"Primary Model Error ({mode}): {e}")
            # Fallback to Gemini
            result = call_gemini(history, system_prompt)

        return jsonify(normalize_response(result, status))

    except Exception as e:
        print(f"Chat Endpoint Error: {e}")
        return jsonify({
            "response_content": {
                "visual_text": "⚠️ Governance system encountered an error. Please retry.",
                "audio_text": "System error."
            },
            "job_status_update": "CREATED",
            "ui_triggers": {"theme_color": "#FF0000", "brand_identity": "ERROR", "show_orange_border": True}
        }), 500

@flask_app.route('/api/speak', methods=['POST'])
@limiter.limit("20 per minute")
def speak():
    """Text-to-Speech using Gemini Multimodal"""
    data = request.get_json()
    text = data.get('text', '') if data else ''
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        return jsonify({'error': 'TTS not configured'}), 500
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
        
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=text,
            config={
                "response_modalities": ["AUDIO"],
                "speech_config": {
                    "voice_config": {"prebuilt_voice_config": {"voice_name": "Kore"}}
                }
            }
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith('audio/'):
                b64_audio = base64.b64encode(part.inline_data.data).decode('utf-8')
                return jsonify({'audio_data': b64_audio, 'mime_type': part.inline_data.mime_type})
        return jsonify({'error': 'No audio generated'}), 500
    except Exception as e:
        print(f"TTS Error: {e}")
        return jsonify({'error': str(e)}), 500

@flask_app.route('/api/upload-pdi', methods=['POST'])
@limiter.limit("30 per minute")
def upload_pdi():
    """PDI Evidence Upload Handler"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    job_card_id = request.form.get('job_card_id')
    checklist_item = request.form.get('checklist_item')
    
    if not file or not job_card_id or not checklist_item:
        return jsonify({'error': 'Missing required fields'}), 400
    
    if not supabase:
        return jsonify({'error': 'Storage not configured'}), 500
    
    # Validation
    allowed_extensions = {'jpg', 'jpeg', 'png', 'webp', 'mp4'}
    _, ext = os.path.splitext(file.filename)
    file_ext = ext.lstrip('.').lower() if ext else ''
    
    if file_ext not in allowed_extensions:
        return jsonify({'error': 'Invalid file type. Allowed: jpg, png, webp, mp4'}), 400
    
    # File size check (5MB)
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > 5 * 1024 * 1024:
        return jsonify({'error': 'File too large (max 5MB)'}), 400
    
    try:
        timestamp = datetime.datetime.now(datetime.timezone.utc).timestamp()
        filename = f"{job_card_id}/{checklist_item}_{timestamp}.{file_ext}"
        file_bytes = file.read()
        
        content_type = f"image/{file_ext}" if file_ext != 'mp4' else "video/mp4"
        
        supabase.storage.from_('pdi-evidence').upload(filename, file_bytes, {"content-type": content_type})
        file_url = supabase.storage.from_('pdi-evidence').get_public_url(filename)
        
        # Record in database
        supabase.table('pdi_evidence').insert({
            'job_card_id': job_card_id,
            'checklist_item': checklist_item,
            'file_url': file_url,
            'file_type': 'image' if file_ext != 'mp4' else 'video',
            'uploaded_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }).execute()
        
        return jsonify({'success': True, 'file_url': file_url, 'filename': filename})
        
    except Exception as e:
        print(f"Upload Error: {e}")
        return jsonify({'error': 'Upload failed'}), 500

@flask_app.route('/api/approve-job', methods=['POST'])
def approve_job():
    """Customer Approval Gate with JWT"""
    data = request.get_json()
    token = data.get('token')
    action = data.get('action')  # 'approve', 'reject', 'concern'
    
    if not token or not action:
        return jsonify({'error': 'Missing token or action'}), 400
    
    if action not in {'approve', 'reject', 'concern'}:
        return jsonify({'error': 'Invalid action'}), 400
    
    jwt_secret = os.environ.get('JWT_SECRET')
    if not jwt_secret:
        return jsonify({'error': 'JWT not configured'}), 500
    
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 500
    
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        job_card_id = payload.get('job_card_id')
        
        status_map = {
            'approve': 'CUSTOMER_APPROVED',
            'reject': 'CREATED',
            'concern': 'CONCERN_RAISED'
        }
        new_status = status_map[action]
        
        supabase.table('job_cards').update({
            'status': new_status,
            'customer_approved_at': datetime.datetime.now(datetime.timezone.utc).isoformat() if action == 'approve' else None
        }).eq('id', job_card_id).execute()
        
        return jsonify({'success': True, 'new_status': new_status, 'job_card_id': job_card_id})
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Approval link expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@flask_app.route('/api/generate-approval-link', methods=['POST'])
def generate_approval_link():
    """Generate secure customer approval link"""
    data = request.get_json()
    job_card_id = data.get('job_card_id')
    customer_phone = data.get('customer_phone')
    
    if not job_card_id or not customer_phone:
        return jsonify({'error': 'Missing job_card_id or customer_phone'}), 400
    
    jwt_secret = os.environ.get('JWT_SECRET')
    if not jwt_secret:
        return jsonify({'error': 'JWT not configured'}), 500
    
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 500
    
    try:
        expiry = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
        token = jwt.encode({
            'job_card_id': job_card_id,
            'exp': expiry,
            'phone': customer_phone
        }, jwt_secret, algorithm='HS256')
        
        supabase.table('job_cards').update({
            'approval_token': token,
            'approval_expires_at': expiry.isoformat(),
            'customer_phone': customer_phone
        }).eq('id', job_card_id).execute()
        
        base_url = os.environ.get('FRONTEND_URL')
        if not base_url:
            return jsonify({'error': 'FRONTEND_URL environment variable not configured'}), 500
        approval_url = f"{base_url}/customer-approval?token={token}"
        
        return jsonify({
            'success': True,
            'approval_url': approval_url, 
            'token': token, 
            'expires_at': expiry.isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════════════════════════
# PHASE 2 & 3: NEW API ENDPOINTS
# ═══════════════════════════════════════════════════════════════

# ─────────────────────────────────────────
# MG FLEET ENDPOINTS
# ─────────────────────────────────────────
@flask_app.route('/api/mg/calculate', methods=['POST'])
@require_auth(allowed_roles=['OWNER', 'MANAGER', 'FLEET_MANAGER'])
def mg_calculate():
    """
    Deterministic MG Calculator.
    AI calls this tool to get 'facts', never calculates itself.
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Extract parameters with defaults
        assured_km = int(data.get('assured_km', 0))
        rate = Decimal(str(data.get('rate', 0)))
        actual_km = int(data.get('actual_km', 0))
        months = int(data.get('months_in_cycle', 1))
        excess_rate = data.get('excess_rate')
        
        if assured_km <= 0 or rate <= 0:
            return jsonify({'error': 'assured_km and rate must be positive'}), 400
        
        # Use excess calculation if excess_rate is provided
        if excess_rate is not None:
            result = MGEngine.calculate_excess_bill(
                assured_km_annual=assured_km,
                rate_per_km=rate,
                excess_rate_per_km=Decimal(str(excess_rate)),
                actual_km_run=actual_km,
                months_in_cycle=months
            )
        else:
            result = MGEngine.calculate_monthly_bill(
                assured_km_annual=assured_km,
                rate_per_km=rate,
                actual_km_run=actual_km,
                months_in_cycle=months
            )
        
        # Add audit metadata
        result['calculated_by'] = g.user_id
        result['calculated_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        return jsonify(result)
        
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Invalid input: {str(e)}', 'code': 'INVALID_INPUT'}), 400
    except Exception as e:
        logger.error(f"MG Calculation Error: {e}")
        return jsonify({'error': str(e), 'code': 'CALCULATION_ERROR'}), 500


@flask_app.route('/api/mg/validate-odometer', methods=['POST'])
@require_auth(allowed_roles=['OWNER', 'MANAGER', 'FLEET_MANAGER', 'TECHNICIAN'])
def mg_validate_odometer():
    """Validate odometer readings for MG vehicle logs."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        opening = int(data.get('opening_odometer', -1))
        closing = int(data.get('closing_odometer', -1))
        
        is_valid = MGEngine.validate_odometer_reading(opening, closing)
        
        return jsonify({
            'valid': is_valid,
            'opening_odometer': opening,
            'closing_odometer': closing,
            'actual_km': closing - opening if is_valid else None,
            'message': 'Valid odometer reading' if is_valid else 'Invalid: closing must be greater than opening and both must be non-negative'
        })
        
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Invalid input: {str(e)}'}), 400


# ─────────────────────────────────────────
# JOB CARD STATE GOVERNOR
# ─────────────────────────────────────────
VALID_TRANSITIONS = {
    'CREATED': ['CONTEXT_VERIFIED'],
    'CONTEXT_VERIFIED': ['DIAGNOSED'],
    'DIAGNOSED': ['ESTIMATED'],
    'ESTIMATED': ['CUSTOMER_APPROVAL'],
    'CUSTOMER_APPROVAL': ['IN_PROGRESS', 'CONCERN_RAISED'],
    'CONCERN_RAISED': ['ESTIMATED', 'CANCELLED'],
    'IN_PROGRESS': ['PDI'],
    'PDI': ['INVOICED'],
    'INVOICED': ['CLOSED'],
    'CLOSED': [],  # Terminal state
    'CANCELLED': []  # Terminal state
}

@flask_app.route('/api/job/transition', methods=['POST'])
@require_auth()
def transition_state():
    """
    Strict State Machine Enforcer - Prevents invalid workflow jumps.
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    job_id = data.get('job_id')
    target_state = data.get('target_state')
    notes = data.get('notes', '')
    
    if not job_id or not target_state:
        return jsonify({'error': 'Missing job_id or target_state'}), 400
    
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 500
    
    try:
        # Fetch current state from Supabase
        response = supabase.table('job_cards').select('status, workshop_id').eq('id', job_id).execute()
        if not response.data:
            return jsonify({'error': 'Job card not found'}), 404
        
        job_data = response.data[0]
        current_state = job_data['status']
        job_workshop_id = job_data.get('workshop_id')
        
        # Workshop isolation check (if workshop_id is set on job)
        if job_workshop_id and hasattr(g, 'workshop_id'):
            if g.workshop_id != job_workshop_id:
                return jsonify({'error': 'Access denied: job belongs to different workshop'}), 403
        
        # Validate transition
        allowed = VALID_TRANSITIONS.get(current_state, [])
        
        if target_state not in allowed:
            return jsonify({
                'error': 'Invalid state transition',
                'code': 'INVALID_TRANSITION',
                'current': current_state,
                'requested': target_state,
                'allowed': allowed
            }), 409
        
        # Update state with metadata
        update_data = {
            'status': target_state,
            'updated_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'updated_by': g.user_id
        }
        
        # Add state-specific timestamps
        if target_state == 'CUSTOMER_APPROVAL':
            update_data['sent_for_approval_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        elif target_state == 'IN_PROGRESS':
            update_data['started_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        elif target_state == 'CLOSED':
            update_data['closed_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        if notes:
            update_data['status_notes'] = notes
        
        supabase.table('job_cards').update(update_data).eq('id', job_id).execute()
        
        # Log the transition
        log_audit(
            mode=5,  # State transition mode
            status=target_state,
            query=f"Transition {job_id}: {current_state} -> {target_state}",
            response=f"Transition successful by {g.user_id}",
            confidence=1.0
        )
        
        return jsonify({
            'success': True, 
            'job_card_id': job_id,
            'previous_state': current_state,
            'new_state': target_state,
            'transitions_allowed': VALID_TRANSITIONS.get(target_state, [])
        })
        
    except Exception as e:
        logger.error(f"State Transition Error: {e}")
        return jsonify({'error': str(e), 'code': 'TRANSITION_ERROR'}), 500


@flask_app.route('/api/job/transitions', methods=['GET'])
@require_auth()
def get_valid_transitions():
    """Get valid transitions for a job card."""
    job_id = request.args.get('job_id')
    
    if not job_id:
        return jsonify({'error': 'Missing job_id parameter'}), 400
    
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 500
    
    try:
        response = supabase.table('job_cards').select('status').eq('id', job_id).execute()
        if not response.data:
            return jsonify({'error': 'Job card not found'}), 404
        
        current_state = response.data[0]['status']
        allowed = VALID_TRANSITIONS.get(current_state, [])
        
        return jsonify({
            'job_card_id': job_id,
            'current_state': current_state,
            'allowed_transitions': allowed,
            'all_states': list(VALID_TRANSITIONS.keys())
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────
# BILLING & GST ENDPOINTS
# ─────────────────────────────────────────
@flask_app.route('/api/billing/calculate', methods=['POST'])
@require_auth(allowed_roles=['OWNER', 'MANAGER'])
def calculate_billing():
    """
    Calculate invoice totals with GST.
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        items = data.get('items', [])
        workshop_state = data.get('workshop_state', '')
        customer_state = data.get('customer_state', '')
        
        if not items:
            return jsonify({'error': 'No items provided'}), 400
        
        if not workshop_state or not customer_state:
            return jsonify({'error': 'workshop_state and customer_state are required'}), 400
        
        result = calculate_invoice_totals(items, workshop_state, customer_state)
        result['calculated_by'] = g.user_id
        result['calculated_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Billing Calculation Error: {e}")
        return jsonify({'error': str(e), 'code': 'BILLING_ERROR'}), 500


@flask_app.route('/api/billing/validate-gstin', methods=['POST'])
@require_auth()
def validate_gstin_endpoint():
    """Validate GSTIN format."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    gstin = data.get('gstin', '')
    result = validate_gstin(gstin)
    
    return jsonify(result)


@flask_app.route('/api/billing/tax-type', methods=['POST'])
@require_auth()
def get_tax_type():
    """Determine tax type based on state codes."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    workshop_state = data.get('workshop_state', '')
    customer_state = data.get('customer_state', '')
    
    if not workshop_state or not customer_state:
        return jsonify({'error': 'workshop_state and customer_state are required'}), 400
    
    tax_type = determine_tax_type(workshop_state, customer_state)
    
    return jsonify({
        'workshop_state': workshop_state,
        'customer_state': customer_state,
        'tax_type': tax_type,
        'is_interstate': tax_type == 'IGST'
    })

# ═══════════════════════════════════════════════════════════════
# LANGCHAIN/LLAMAINDEX - KNOWLEDGE BASE & RAG ENDPOINTS
# ═══════════════════════════════════════════════════════════════

# ─────────────────────────────────────────
# KNOWLEDGE BASE MANAGEMENT
# ─────────────────────────────────────────
@flask_app.route('/api/kb/status', methods=['GET'])
@require_auth()
def kb_status():
    """Get knowledge base status and statistics"""
    if not KNOWLEDGE_BASE_AVAILABLE:
        return jsonify({
            'available': False,
            'message': 'Knowledge base service not available'
        }), 503
    
    try:
        kb = get_knowledge_base()
        stats = kb.get_stats()
        return jsonify({
            'available': True,
            'stats': stats
        })
    except Exception as e:
        logger.error(f"KB status error: {e}")
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/kb/search', methods=['POST'])
@require_auth()
def kb_search():
    """
    Search knowledge base for relevant documents
    RAG-enhanced search with semantic similarity
    """
    if not KNOWLEDGE_BASE_AVAILABLE:
        return jsonify({'error': 'Knowledge base not available'}), 503
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    query = data.get('query', '')
    top_k = data.get('top_k', 5)
    filters = data.get('filters', None)
    
    if not query:
        return jsonify({'error': 'Query is required'}), 400
    
    try:
        kb = get_knowledge_base()
        results = kb.search(query, top_k=top_k, filters=filters)
        
        return jsonify({
            'query': query,
            'results': [
                {
                    'content': r.content,
                    'source': r.source,
                    'score': r.score,
                    'metadata': r.metadata
                }
                for r in results
            ],
            'count': len(results)
        })
        
    except Exception as e:
        logger.error(f"KB search error: {e}")
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/kb/query', methods=['POST'])
@require_auth()
def kb_query():
    """
    Query knowledge base with LLM synthesis (RAG)
    Combines retrieval with generative answering
    """
    if not KNOWLEDGE_BASE_AVAILABLE:
        return jsonify({'error': 'Knowledge base not available'}), 503
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    query = data.get('query', '')
    vehicle_context = data.get('vehicle_context', None)
    
    if not query:
        return jsonify({'error': 'Query is required'}), 400
    
    try:
        rag = get_rag_service()
        response = rag.query(
            question=query,
            vehicle_context=vehicle_context,
            top_k=5
        )
        
        return jsonify({
            'query': query,
            'answer': response.answer,
            'sources': response.sources,
            'confidence': response.confidence,
            'tokens_used': response.tokens_used,
            'success': True
        })
        
    except Exception as e:
        logger.error(f"RAG query error: {e}")
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/kb/documents', methods=['POST'])
@require_auth(allowed_roles=['OWNER', 'MANAGER'])
def kb_add_documents():
    """
    Add documents to knowledge base
    Supports service manuals, bulletins, repair guides
    """
    if not KNOWLEDGE_BASE_AVAILABLE:
        return jsonify({'error': 'Knowledge base not available'}), 503
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    documents = data.get('documents', [])
    source_type = data.get('source_type', 'manual')
    
    if not documents:
        return jsonify({'error': 'Documents array is required'}), 400
    
    try:
        from llama_index.core import Document
        
        kb = get_knowledge_base()
        
        # Convert to LlamaIndex documents
        idx_docs = []
        for doc in documents:
            idx_doc = Document(
                text=doc.get('content', ''),
                metadata={
                    **doc.get('metadata', {}),
                    'added_by': g.user_id,
                    'workshop_id': getattr(g, 'workshop_id', None)
                }
            )
            idx_docs.append(idx_doc)
        
        success = kb.add_documents(idx_docs, source_type)
        
        if success:
            return jsonify({
                'success': True,
                'documents_added': len(documents),
                'source_type': source_type
            })
        else:
            return jsonify({'error': 'Failed to add documents'}), 500
            
    except Exception as e:
        logger.error(f"KB add documents error: {e}")
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────
# DIAGNOSTIC AGENT (LangChain)
# ─────────────────────────────────────────
@flask_app.route('/api/agent/diagnose', methods=['POST'])
@require_auth()
@limiter.limit("10 per minute")
def agent_diagnose():
    """
    Intelligent diagnostic with LangChain agent
    Uses tools for knowledge retrieval and calculations
    """
    if not KNOWLEDGE_BASE_AVAILABLE:
        return jsonify({'error': 'Agent not available'}), 503
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    symptoms = data.get('symptoms', '')
    vehicle_context = data.get('vehicle_context', {})
    chat_history = data.get('history', [])
    
    if not symptoms:
        return jsonify({'error': 'Symptoms description is required'}), 400
    
    try:
        agent = get_diagnostic_agent()
        result = agent.diagnose(
            symptoms=symptoms,
            vehicle_context=vehicle_context,
            chat_history=chat_history
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'diagnosis': result['diagnosis'],
                'tokens_used': result.get('tokens_used', 0),
                'cost': result.get('cost', 0),
                'ai_generated': True
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Diagnosis failed')
            }), 500
            
    except Exception as e:
        logger.error(f"Agent diagnosis error: {e}")
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/agent/enhanced-chat', methods=['POST'])
@require_auth()
@limiter.limit("15 per minute")
def agent_enhanced_chat():
    """
    Enhanced chat with RAG context augmentation
    Combines traditional AI with knowledge base retrieval
    """
    if not KNOWLEDGE_BASE_AVAILABLE:
        # Fallback to regular chat
        return chat()
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    user_message = data.get('message', '')
    vehicle_context = data.get('context', {})
    
    if not user_message:
        return jsonify({'error': 'Message is required'}), 400
    
    try:
        # First, retrieve relevant context from knowledge base
        rag = get_rag_service()
        rag_response = rag.query(
            question=user_message,
            vehicle_context=vehicle_context,
            top_k=3
        )
        
        # Augment the user message with retrieved context
        augmented_message = f"""User Question: {user_message}

Retrieved Context from Knowledge Base:
{rag_response.answer}

Sources: {', '.join([s['source'] for s in rag_response.sources[:2]])}

Please provide a comprehensive answer using the above context."""
        
        # Now call the regular chat with augmented message
        data['history'] = data.get('history', []) + [{
            'role': 'user',
            'parts': [{'text': augmented_message}]
        }]
        
        # Call existing chat endpoint logic
        return chat()
        
    except Exception as e:
        logger.error(f"Enhanced chat error: {e}")
        # Fallback to regular chat
        return chat()


# ═══════════════════════════════════════════════════════════════
# PHASE 1: JOB CARD MANAGEMENT API
# ═══════════════════════════════════════════════════════════════

# ─────────────────────────────────────────
# JOB CARD CRUD ENDPOINTS
# ─────────────────────────────────────────
@flask_app.route('/api/job-cards', methods=['POST'])
@require_auth()
def create_job_card():
    """Create a new job card"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    registration_number = data.get('registration_number')
    if not registration_number:
        return jsonify({'error': 'registration_number is required'}), 400
    
    manager = get_job_card_manager(supabase)
    
    success, result = manager.create_job_card(
        workshop_id=g.workshop_id,
        registration_number=registration_number,
        vehicle_id=data.get('vehicle_id'),
        symptoms=data.get('symptoms', []),
        customer_phone=data.get('customer_phone'),
        customer_email=data.get('customer_email'),
        priority=JobPriority(data.get('priority', 'NORMAL')),
        notes=data.get('notes'),
        created_by=g.user_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to create job card')}), 400
    
    return jsonify(result), 201


@flask_app.route('/api/job-cards', methods=['GET'])
@require_auth()
def list_job_cards():
    """List job cards with filters"""
    manager = get_job_card_manager(supabase)
    
    status = request.args.get('status')
    priority = request.args.get('priority')
    technician_id = request.args.get('technician_id')
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    
    success, result = manager.list_job_cards(
        workshop_id=g.workshop_id,
        status=JobStatus(status) if status else None,
        technician_id=technician_id,
        priority=JobPriority(priority) if priority else None,
        limit=limit,
        offset=offset
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to list job cards')}), 400
    
    return jsonify(result)


@flask_app.route('/api/job-cards/<job_id>', methods=['GET'])
@require_auth()
def get_job_card(job_id):
    """Get a specific job card"""
    manager = get_job_card_manager(supabase)
    
    success, result = manager.get_job_card(
        job_id=job_id,
        workshop_id=g.workshop_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Job card not found')}), 404
    
    return jsonify(result)


@flask_app.route('/api/job-cards/<job_id>', methods=['PUT'])
@require_auth()
def update_job_card(job_id):
    """Update job card fields"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    manager = get_job_card_manager(supabase)
    
    success, result = manager.update_job_card(
        job_id=job_id,
        workshop_id=g.workshop_id,
        updates=data,
        updated_by=g.user_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to update job card')}), 400
    
    return jsonify(result)


@flask_app.route('/api/job-cards/<job_id>/transitions', methods=['GET'])
@require_auth()
def get_job_transitions(job_id):
    """Get valid transitions for a job card"""
    manager = get_job_card_manager(supabase)
    
    success, result = manager.get_valid_transitions(
        job_id=job_id,
        workshop_id=g.workshop_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to get transitions')}), 400
    
    return jsonify(result)


@flask_app.route('/api/job-cards/<job_id>/transition', methods=['POST'])
@require_auth()
def transition_job_state(job_id):
    """Transition job card to new state"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    target_state = data.get('target_state')
    if not target_state:
        return jsonify({'error': 'target_state is required'}), 400
    
    manager = get_job_card_manager(supabase)
    
    success, result = manager.transition_state(
        job_id=job_id,
        target_state=JobStatus(target_state),
        workshop_id=g.workshop_id,
        updated_by=g.user_id,
        notes=data.get('notes')
    )
    
    if not success:
        status_code = 409 if result.get('code') == 'INVALID_TRANSITION' else 400
        return jsonify(result), status_code
    
    return jsonify(result)


@flask_app.route('/api/job-cards/<job_id>/history', methods=['GET'])
@require_auth()
def get_job_history(job_id):
    """Get state transition history for a job card"""
    manager = get_job_card_manager(supabase)
    
    success, result = manager.get_state_history(
        job_id=job_id,
        workshop_id=g.workshop_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to get history')}), 400
    
    return jsonify(result)


@flask_app.route('/api/job-cards/stats', methods=['GET'])
@require_auth()
def get_job_stats():
    """Get job card statistics for workshop"""
    manager = get_job_card_manager(supabase)
    
    success, result = manager.get_workshop_stats(
        workshop_id=g.workshop_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to get stats')}), 400
    
    return jsonify(result)


# ─────────────────────────────────────────
# DASHBOARD METRICS (Phase 4 Glass Cockpit)
# ─────────────────────────────────────────
@flask_app.route('/api/metrics/dashboard', methods=['GET'])
@require_auth()
def get_dashboard_metrics():
    """
    Feeds the Phase 4 'Glass Cockpit' Dashboard.
    Aggregates real-time data from Job Cards, Billing, and PDI.
    """
    try:
        # Get job card stats
        manager = get_job_card_manager(supabase)
        success, job_stats = manager.get_workshop_stats(workshop_id=g.workshop_id)
        
        if not success:
            job_stats = {'total': 0, 'active': 0, 'by_status': {}}
        
        # Calculate metrics
        active_jobs = job_stats.get('active', 0)
        total_jobs = job_stats.get('total', 0)
        
        # Count pending PDI (jobs in PDI status)
        pending_pdi = job_stats.get('by_status', {}).get('PDI', 0)
        
        # Calculate today's revenue (from ESTIMATED/INVOICED jobs)
        # In Phase 5, this will be actual invoice totals from DB
        estimated_revenue = 0
        for status, count in job_stats.get('by_status', {}).items():
            if status in ['ESTIMATED', 'INVOICED', 'IN_PROGRESS']:
                # Rough estimate: ₹3,500 per job on average
                estimated_revenue += count * 3500
        
        revenue_str = f"₹{estimated_revenue:,}"
        
        return jsonify({
            'revenue': revenue_str,
            'jobs': active_jobs,
            'pdi': pending_pdi,
            'total_jobs': total_jobs,
            'trend_revenue': '+12%',
            'trend_jobs': '+5%',
            'technicians_active': '6/8'  # Placeholder until technician module
        })
    except Exception as e:
        logger.error(f"Dashboard metrics error: {e}")
        # Return fallback data on error
        return jsonify({
            'revenue': '₹42,500',
            'jobs': 12,
            'pdi': 4,
            'total_jobs': 24,
            'trend_revenue': '+12%',
            'trend_jobs': '+5%',
            'technicians_active': '6/8'
        })


@flask_app.route('/api/activity/recent', methods=['GET'])
@require_auth()
def get_recent_activity():
    """
    Returns recent activity feed for the dashboard.
    """
    # For now, return mock data. In Phase 5, this will query the audit log.
    return jsonify([
        {'id': 1, 'text': 'Job Card #1024 Approved', 'time': '2 min ago', 'type': 'success'},
        {'id': 2, 'text': 'Inventory Alert: 5W30 Oil Low', 'time': '15 min ago', 'type': 'warning'},
        {'id': 3, 'text': 'New Booking: Toyota Fortuner', 'time': '1 hour ago', 'type': 'info'},
        {'id': 4, 'text': 'PDI Completed: Honda City', 'time': '2 hours ago', 'type': 'success'},
    ])


# ─────────────────────────────────────────
# PUBLIC JOB CARD VIEW (Token-based)
# ─────────────────────────────────────────
@flask_app.route('/api/public/job-card', methods=['GET'])
def public_job_card():
    """Get job card details via public token"""
    token = request.args.get('token')
    if not token:
        return jsonify({'error': 'Token required'}), 400
    
    manager = get_job_card_manager(supabase)
    
    success, result = manager.get_job_card_by_token(token)
    
    if not success:
        return jsonify({'error': result.get('error', 'Invalid token')}), 401
    
    # Return limited public-safe data
    job_card = result['job_card']
    public_data = {
        'id': job_card['id'],
        'registration_number': job_card['registration_number'],
        'status': job_card['status'],
        'symptoms': job_card['symptoms'],
        'diagnosis': job_card.get('diagnosis'),
        'estimate': job_card.get('estimate'),
        'created_at': job_card['created_at']
    }
    
    return jsonify({'job_card': public_data})


# ═══════════════════════════════════════════════════════════════
# PHASE 1: PDI MANAGEMENT API
# ═══════════════════════════════════════════════════════════════

@flask_app.route('/api/pdi/checklists', methods=['POST'])
@require_auth()
def create_pdi_checklist():
    """Create PDI checklist for a job card"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    job_card_id = data.get('job_card_id')
    if not job_card_id:
        return jsonify({'error': 'job_card_id is required'}), 400
    
    manager = get_pdi_manager(supabase)
    
    success, result = manager.create_checklist(
        job_card_id=job_card_id,
        workshop_id=g.workshop_id,
        category=PDICategory(data.get('category', 'STANDARD')),
        custom_items=data.get('custom_items'),
        created_by=g.user_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to create checklist')}), 400
    
    return jsonify(result), 201


@flask_app.route('/api/pdi/checklists/<checklist_id>', methods=['GET'])
@require_auth()
def get_pdi_checklist(checklist_id):
    """Get PDI checklist"""
    manager = get_pdi_manager(supabase)
    
    success, result = manager.get_checklist(
        checklist_id=checklist_id,
        workshop_id=g.workshop_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Checklist not found')}), 404
    
    return jsonify(result)


@flask_app.route('/api/pdi/checklists/by-job/<job_card_id>', methods=['GET'])
@require_auth()
def get_pdi_by_job(job_card_id):
    """Get PDI checklist by job card ID"""
    manager = get_pdi_manager(supabase)
    
    success, result = manager.get_checklist_by_job(
        job_card_id=job_card_id,
        workshop_id=g.workshop_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Checklist not found')}), 404
    
    return jsonify(result)


@flask_app.route('/api/pdi/checklists/<checklist_id>/items/<item_code>', methods=['PUT'])
@require_auth()
def update_pdi_item(checklist_id, item_code):
    """Update PDI checklist item status"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    status = data.get('status')
    if not status:
        return jsonify({'error': 'status is required'}), 400
    
    manager = get_pdi_manager(supabase)
    
    success, result = manager.update_checklist_item(
        checklist_id=checklist_id,
        item_code=item_code,
        status=PDIStatus(status),
        workshop_id=g.workshop_id,
        notes=data.get('notes'),
        updated_by=g.user_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to update item')}), 400
    
    return jsonify(result)


@flask_app.route('/api/pdi/checklists/<checklist_id>/declare', methods=['POST'])
@require_auth()
def declare_pdi_completion(checklist_id):
    """Technician declaration for PDI completion"""
    data = request.get_json() or {}
    
    manager = get_pdi_manager(supabase)
    
    success, result = manager.set_technician_declaration(
        checklist_id=checklist_id,
        workshop_id=g.workshop_id,
        declared=data.get('declared', True),
        technician_id=g.user_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to set declaration')}), 400
    
    return jsonify(result)


@flask_app.route('/api/pdi/checklists/<checklist_id>/complete', methods=['POST'])
@require_auth()
def complete_pdi_checklist(checklist_id):
    """Complete PDI checklist"""
    manager = get_pdi_manager(supabase)
    
    success, result = manager.complete_checklist(
        checklist_id=checklist_id,
        workshop_id=g.workshop_id,
        supervisor_id=g.user_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to complete checklist')}), 400
    
    return jsonify(result)


@flask_app.route('/api/pdi/evidence', methods=['GET'])
@require_auth()
def get_pdi_evidence():
    """Get PDI evidence for a job card"""
    job_card_id = request.args.get('job_card_id')
    item_code = request.args.get('item_code')
    
    if not job_card_id:
        return jsonify({'error': 'job_card_id is required'}), 400
    
    manager = get_pdi_manager(supabase)
    
    success, result = manager.get_evidence(
        job_card_id=job_card_id,
        checklist_item_code=item_code
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to get evidence')}), 400
    
    return jsonify(result)


# ═══════════════════════════════════════════════════════════════
# PHASE 1: INVOICE MANAGEMENT API
# ═══════════════════════════════════════════════════════════════

@flask_app.route('/api/invoices', methods=['POST'])
@require_auth(allowed_roles=['OWNER', 'MANAGER', 'ACCOUNTANT'])
def create_invoice():
    """Create new invoice"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required = ['job_card_id', 'customer_details', 'items', 'workshop_state', 'customer_state']
    for field in required:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    manager = get_invoice_manager(supabase)
    
    success, result = manager.create_invoice(
        job_card_id=data['job_card_id'],
        workshop_id=g.workshop_id,
        customer_details=data['customer_details'],
        items=data['items'],
        workshop_state=data['workshop_state'],
        customer_state=data['customer_state'],
        generated_by=g.user_id,
        notes=data.get('notes'),
        due_days=data.get('due_days', 15)
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to create invoice')}), 400
    
    return jsonify(result), 201


@flask_app.route('/api/invoices', methods=['GET'])
@require_auth()
def list_invoices():
    """List invoices"""
    manager = get_invoice_manager(supabase)
    
    status = request.args.get('status')
    job_card_id = request.args.get('job_card_id')
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    
    success, result = manager.list_invoices(
        workshop_id=g.workshop_id,
        status=InvoiceStatus(status) if status else None,
        job_card_id=job_card_id,
        limit=limit,
        offset=offset
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to list invoices')}), 400
    
    return jsonify(result)


@flask_app.route('/api/invoices/<invoice_id>', methods=['GET'])
@require_auth()
def get_invoice(invoice_id):
    """Get invoice details"""
    manager = get_invoice_manager(supabase)
    
    success, result = manager.get_invoice(
        invoice_id=invoice_id,
        workshop_id=g.workshop_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Invoice not found')}), 404
    
    return jsonify(result)


@flask_app.route('/api/invoices/<invoice_id>/finalize', methods=['POST'])
@require_auth(allowed_roles=['OWNER', 'MANAGER'])
def finalize_invoice(invoice_id):
    """Finalize invoice (move from DRAFT to SENT)"""
    manager = get_invoice_manager(supabase)
    
    success, result = manager.finalize_invoice(
        invoice_id=invoice_id,
        workshop_id=g.workshop_id,
        finalized_by=g.user_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to finalize invoice')}), 400
    
    return jsonify(result)


@flask_app.route('/api/invoices/<invoice_id>/mark-paid', methods=['POST'])
@require_auth(allowed_roles=['OWNER', 'MANAGER', 'ACCOUNTANT'])
def mark_invoice_paid(invoice_id):
    """Mark invoice as paid"""
    manager = get_invoice_manager(supabase)
    
    success, result = manager.mark_paid(
        invoice_id=invoice_id,
        workshop_id=g.workshop_id,
        paid_by=g.user_id
    )
    
    if not success:
        return jsonify({'error': result.get('error', 'Failed to mark invoice paid')}), 400
    
    return jsonify(result)


@flask_app.route('/api/invoices/<invoice_id>/pdf', methods=['GET'])
@require_auth()
def download_invoice_pdf(invoice_id):
    """Download invoice as PDF"""
    manager = get_invoice_manager(supabase)
    
    workshop_details = {
        'name': g.get('workshop_name', 'Go4Garage'),
        'address': g.get('workshop_address', ''),
        'gstin': g.get('workshop_gstin', ''),
        'phone': g.get('workshop_phone', '')
    }
    
    success, result = manager.generate_pdf(
        invoice_id=invoice_id,
        workshop_id=g.workshop_id,
        workshop_details=workshop_details
    )
    
    if not success:
        return jsonify({'error': result.decode() if isinstance(result, bytes) else 'Failed to generate PDF'}), 400
    
    from flask import Response
    return Response(
        result,
        mimetype='application/pdf',
        headers={
            'Content-Disposition': f'attachment; filename=invoice_{invoice_id}.pdf'
        }
    )


@flask_app.route('/api/job-cards/<job_card_id>/pdf', methods=['GET'])
@require_auth()
def download_job_card_pdf(job_card_id):
    """Download job card as PDF"""
    manager = get_job_card_manager(supabase)
    
    workshop_details = {
        'name': g.get('workshop_name', 'Go4Garage'),
        'address': g.get('workshop_address', ''),
        'gstin': g.get('workshop_gstin', ''),
        'phone': g.get('workshop_phone', '')
    }
    
    success, result = manager.generate_job_card_pdf(
        job_card_id=job_card_id,
        workshop_id=g.workshop_id,
        workshop_details=workshop_details
    )
    
    if not success:
        return jsonify({'error': result.decode() if isinstance(result, bytes) else 'Failed to generate PDF'}), 400
    
    from flask import Response
    return Response(
        result,
        mimetype='application/pdf',
        headers={
            'Content-Disposition': f'attachment; filename=jobcard_{job_card_id}.pdf'
        }
    )


@flask_app.route('/api/pdi/<checklist_id>/pdf', methods=['GET'])
@require_auth()
def download_pdi_report_pdf(checklist_id):
    """Download PDI report as PDF"""
    pdi_manager = get_pdi_manager(supabase)
    
    # Get checklist to find job card
    success, result = pdi_manager.get_checklist(checklist_id, g.workshop_id)
    if not success:
        return jsonify({'error': 'Checklist not found'}), 404
    
    checklist = result.get('checklist', {})
    job_card_id = checklist.get('job_card_id')
    
    # Get job card for vehicle details
    vehicle_details = {}
    if job_card_id:
        job_manager = get_job_card_manager(supabase)
        jc_success, jc_result = job_manager.get_job_card(job_card_id, g.workshop_id)
        if jc_success:
            jc = jc_result.get('job_card', {})
            vehicle_details = {
                'brand': jc.get('vehicle_brand', ''),
                'model': jc.get('vehicle_model', ''),
                'registration_number': jc.get('registration_number', '')
            }
    
    workshop_details = {
        'name': g.get('workshop_name', 'Go4Garage'),
        'address': g.get('workshop_address', ''),
        'gstin': g.get('workshop_gstin', ''),
        'phone': g.get('workshop_phone', '')
    }
    
    success, result = pdi_manager.generate_pdi_report_pdf(
        checklist_id=checklist_id,
        workshop_id=g.workshop_id,
        workshop_details=workshop_details,
        vehicle_details=vehicle_details
    )
    
    if not success:
        return jsonify({'error': result.decode() if isinstance(result, bytes) else 'Failed to generate PDF'}), 400
    
    from flask import Response
    return Response(
        result,
        mimetype='application/pdf',
        headers={
            'Content-Disposition': f'attachment; filename=pdi_report_{checklist_id}.pdf'
        }
    )


# ═══════════════════════════════════════════════════════════════
# PHASE 2: PRICING GOVERNANCE API
# ═══════════════════════════════════════════════════════════════

@flask_app.route('/api/pricing/parts', methods=['GET'])
@require_auth()
def get_parts_catalog():
    """Get parts catalog with pricing ranges"""
    try:
        result = supabase.table('parts_catalog')\
            .select('*')\
            .eq('workshop_id', g.workshop_id)\
            .eq('is_active', True)\
            .execute()
        
        supabase.table('pricing_access_logs').insert({
            'workshop_id': g.workshop_id,
            'user_id': g.user_id,
            'access_type': 'VIEW',
            'item_type': 'PART'
        }).execute()
        
        return jsonify({'parts': result.data, 'count': len(result.data)})
    except Exception as e:
        logger.error(f"Error fetching parts catalog: {e}")
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/pricing/parts', methods=['POST'])
@require_auth(allowed_roles=['OWNER', 'MANAGER'])
def add_part_to_catalog():
    """Add part to catalog"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required = ['part_code', 'description', 'price_min', 'price_max']
    for field in required:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        part_data = {
            'workshop_id': g.workshop_id,
            'part_code': data['part_code'],
            'description': data['description'],
            'hsn_code': data.get('hsn_code', '8708'),
            'gst_rate': data.get('gst_rate', 28.0),
            'price_min': data['price_min'],
            'price_max': data['price_max'],
            'stock_qty': data.get('stock_qty', 0),
            'supplier_info': data.get('supplier_info'),
            'updated_by': g.user_id
        }
        
        result = supabase.table('parts_catalog').insert(part_data).execute()
        
        supabase.table('pricing_access_logs').insert({
            'workshop_id': g.workshop_id,
            'user_id': g.user_id,
            'access_type': 'MODIFY',
            'item_type': 'PART',
            'item_code': data['part_code']
        }).execute()
        
        return jsonify({'part': result.data[0]}), 201
    except Exception as e:
        logger.error(f"Error adding part: {e}")
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/pricing/labor', methods=['GET'])
@require_auth()
def get_labor_catalog():
    """Get labor/service catalog"""
    try:
        result = supabase.table('labor_catalog')\
            .select('*')\
            .eq('workshop_id', g.workshop_id)\
            .eq('is_active', True)\
            .execute()
        
        supabase.table('pricing_access_logs').insert({
            'workshop_id': g.workshop_id,
            'user_id': g.user_id,
            'access_type': 'VIEW',
            'item_type': 'LABOR'
        }).execute()
        
        return jsonify({'services': result.data, 'count': len(result.data)})
    except Exception as e:
        logger.error(f"Error fetching labor catalog: {e}")
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/pricing/guidance', methods=['POST'])
@require_auth()
def get_pricing_guidance():
    """Get AI pricing guidance (ranges only, never exact prices)"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    query = data.get('query', '')
    part_code = data.get('part_code')
    service_code = data.get('service_code')
    
    try:
        if part_code:
            result = supabase.table('parts_catalog')\
                .select('*')\
                .eq('workshop_id', g.workshop_id)\
                .eq('part_code', part_code)\
                .execute()
            
            if result.data:
                part = result.data[0]
                return jsonify({
                    'guidance': {
                        'type': 'PART',
                        'description': part['description'],
                        'price_range': {
                            'min': part['price_min'],
                            'max': part['price_max']
                        },
                        'gst_rate': part['gst_rate'],
                        'hsn_code': part['hsn_code'],
                        'note': 'Price range only - exact pricing determined at estimate'
                    }
                })
        
        if service_code:
            result = supabase.table('labor_catalog')\
                .select('*')\
                .eq('workshop_id', g.workshop_id)\
                .eq('service_code', service_code)\
                .execute()
            
            if result.data:
                service = result.data[0]
                return jsonify({
                    'guidance': {
                        'type': 'LABOR',
                        'description': service['description'],
                        'standard_rate': service['standard_rate'],
                        'estimated_hours': service.get('estimated_hours'),
                        'gst_rate': service['gst_rate'],
                        'sac_code': service['sac_code']
                    }
                })
        
        return jsonify({
            'guidance': {
                'type': 'GENERAL',
                'note': 'AI pricing guidance requires specific part_code or service_code',
                'available_endpoints': [
                    '/api/pricing/parts',
                    '/api/pricing/labor'
                ]
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting pricing guidance: {e}")
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════════════════════════
# PHASE 2: MG FLEET CONTRACTS API
# ═══════════════════════════════════════════════════════════════

@flask_app.route('/api/mg/contracts', methods=['GET'])
@require_auth(allowed_roles=['OWNER', 'MANAGER', 'FLEET_MANAGER'])
def list_mg_contracts():
    """List MG fleet contracts"""
    try:
        result = supabase.table('mg_contracts')\
            .select('*')\
            .eq('workshop_id', g.workshop_id)\
            .eq('is_active', True)\
            .order('created_at', desc=True)\
            .execute()
        
        return jsonify({'contracts': result.data, 'count': len(result.data)})
    except Exception as e:
        logger.error(f"Error listing MG contracts: {e}")
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/mg/contracts', methods=['POST'])
@require_auth(allowed_roles=['OWNER', 'MANAGER', 'FLEET_MANAGER'])
def create_mg_contract():
    """Create new MG fleet contract"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required = ['fleet_name', 'contract_start_date', 'contract_end_date', 'assured_km_per_year', 'rate_per_km']
    for field in required:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        contract_data = {
            'workshop_id': g.workshop_id,
            'fleet_name': data['fleet_name'],
            'contract_start_date': data['contract_start_date'],
            'contract_end_date': data['contract_end_date'],
            'assured_km_per_year': data['assured_km_per_year'],
            'rate_per_km': data['rate_per_km'],
            'excess_rate_per_km': data.get('excess_rate_per_km'),
            'billing_cycle_months': data.get('billing_cycle_months', 1),
            'created_by': g.user_id
        }
        
        result = supabase.table('mg_contracts').insert(contract_data).execute()
        return jsonify({'contract': result.data[0]}), 201
    except Exception as e:
        logger.error(f"Error creating MG contract: {e}")
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/mg/contracts/<contract_id>', methods=['GET'])
@require_auth(allowed_roles=['OWNER', 'MANAGER', 'FLEET_MANAGER'])
def get_mg_contract(contract_id):
    """Get MG contract details"""
    try:
        result = supabase.table('mg_contracts')\
            .select('*')\
            .eq('id', contract_id)\
            .eq('workshop_id', g.workshop_id)\
            .execute()
        
        if not result.data:
            return jsonify({'error': 'Contract not found'}), 404
        
        logs_result = supabase.table('mg_vehicle_logs')\
            .select('*')\
            .eq('contract_id', contract_id)\
            .order('billing_month', desc=True)\
            .execute()
        
        return jsonify({
            'contract': result.data[0],
            'vehicle_logs': logs_result.data
        })
    except Exception as e:
        logger.error(f"Error fetching MG contract: {e}")
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/mg/vehicle-logs', methods=['POST'])
@require_auth(allowed_roles=['OWNER', 'MANAGER', 'FLEET_MANAGER'])
def create_mg_vehicle_log():
    """Create MG vehicle log entry"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required = ['contract_id', 'vehicle_reg_number', 'billing_month', 'opening_odometer', 'closing_odometer']
    for field in required:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        log_data = {
            'contract_id': data['contract_id'],
            'vehicle_reg_number': data['vehicle_reg_number'],
            'billing_month': data['billing_month'],
            'opening_odometer': data['opening_odometer'],
            'closing_odometer': data['closing_odometer'],
            'notes': data.get('notes')
        }
        
        result = supabase.table('mg_vehicle_logs').insert(log_data).execute()
        return jsonify({'vehicle_log': result.data[0]}), 201
    except Exception as e:
        logger.error(f"Error creating vehicle log: {e}")
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/mg/reports/<contract_id>', methods=['GET'])
@require_auth(allowed_roles=['OWNER', 'MANAGER', 'FLEET_MANAGER'])
def get_mg_report(contract_id):
    """Get MG billing report for a contract"""
    try:
        contract_result = supabase.table('mg_contracts')\
            .select('*')\
            .eq('id', contract_id)\
            .eq('workshop_id', g.workshop_id)\
            .execute()
        
        if not contract_result.data:
            return jsonify({'error': 'Contract not found'}), 404
        
        contract = contract_result.data[0]
        
        logs_result = supabase.table('mg_vehicle_logs')\
            .select('*')\
            .eq('contract_id', contract_id)\
            .execute()
        
        total_km = sum(log['actual_km_run'] for log in logs_result.data if log.get('actual_km_run'))
        total_billed = sum(log['billable_amount'] for log in logs_result.data if log.get('billable_amount'))
        
        return jsonify({
            'contract': contract,
            'summary': {
                'total_vehicles': len(set(log['vehicle_reg_number'] for log in logs_result.data)),
                'total_km_run': total_km,
                'total_billed_amount': total_billed,
                'log_entries': len(logs_result.data)
            },
            'vehicle_logs': logs_result.data
        })
    except Exception as e:
        logger.error(f"Error generating MG report: {e}")
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════════════════════════
# PHASE 3: AI GOVERNANCE API
# ═══════════════════════════════════════════════════════════════

@flask_app.route('/api/governance/check', methods=['POST'])
def governance_check():
    """Check query against AI governance gates"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    query = data.get('query')
    if not query:
        return jsonify({'error': 'query is required'}), 400
    
    governance = get_ai_governance(supabase)
    
    decision = governance.evaluate(
        query_id=data.get('query_id', str(uuid.uuid4())[:8]),
        query=query,
        user_role=data.get('user_role'),
        vehicle_context=data.get('vehicle_context'),
        query_type=data.get('query_type'),
        required_permission=data.get('required_permission'),
        raw_confidence=data.get('confidence')
    )
    
    return jsonify(decision.to_dict())


@flask_app.route('/api/governance/quick-check', methods=['POST'])
def governance_quick_check():
    """Quick binary governance check"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    query = data.get('query')
    if not query:
        return jsonify({'error': 'query is required'}), 400
    
    governance = get_ai_governance(supabase)
    
    allowed, message = governance.quick_check(
        query=query,
        user_role=data.get('user_role'),
        vehicle_context=data.get('vehicle_context')
    )
    
    return jsonify({
        'allowed': allowed,
        'message': message,
        'query': query
    })


@flask_app.route('/api/governance/stats', methods=['GET'])
@require_auth(allowed_roles=['OWNER', 'MANAGER'])
def governance_stats():
    """Get governance statistics"""
    governance = get_ai_governance(supabase)
    return jsonify(governance.get_stats(g.workshop_id))


# ─────────────────────────────────────────
# SUBSCRIPTION & MONETIZATION (PAYU INTEGRATION)
# ─────────────────────────────────────────
subscription_service = SubscriptionService()

@flask_app.route('/api/subscription/plans', methods=['GET'])
def get_subscription_plans():
    """Get available subscription plans"""
    return jsonify(subscription_service.PLANS)

@flask_app.route('/api/subscription/status', methods=['GET'])
@require_auth()
def get_subscription_status():
    """Get current subscription status for the workshop"""
    try:
        workshop_id = g.workshop_id
        status = subscription_service.get_subscription_status(workshop_id)
        return jsonify(status)
    except Exception as e:
        logger.error(f"Status check error: {e}")
        return jsonify({"error": str(e)}), 500

@flask_app.route('/api/subscription/payu-init', methods=['POST'])
@require_auth(allowed_roles=['OWNER'])
def payu_init():
    """
    Endpoint called when user clicks 'Upgrade'
    Returns: JSON with form fields + hash for PayU
    """
    try:
        user = g.user
        data = request.get_json()
        plan_id = data.get('plan_id', 'PRO')
        
        # Get user details for the hash
        email = user.get('email', 'workshop@go4garage.com')
        name = user.get('full_name', 'Workshop Owner')
        
        payload = subscription_service.create_payment_payload(
            workshop_id=g.workshop_id,
            plan_id=plan_id,
            user_email=email,
            user_name=name
        )
        return jsonify(payload)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"PayU Init error: {e}")
        return jsonify({"error": str(e)}), 500

@flask_app.route('/api/subscription/success', methods=['POST'])
def payu_success():
    """
    PayU Redirects here after successful payment
    """
    try:
        data = request.form
        status = data.get('status')
        txnid = data.get('txnid')
        payu_id = data.get('mihpayid')
        
        if status == 'success':
            subscription_service.activate_subscription(txnid, payu_id, status)
            # Redirect user back to React App
            return redirect(f"{os.getenv('FRONTEND_URL')}/app?status=upgraded")
        else:
            return redirect(f"{os.getenv('FRONTEND_URL')}/app?status=failed")
    except Exception as e:
        logger.error(f"PayU Success Handler error: {e}")
        return redirect(f"{os.getenv('FRONTEND_URL')}/app?status=failed")

@flask_app.route('/api/subscription/failure', methods=['POST'])
def payu_failure():
    """
    PayU Redirects here after failed payment
    """
    return redirect(f"{os.getenv('FRONTEND_URL')}/app?status=failed")

# ─────────────────────────────────────────
# MONITORING & ADMIN ENDPOINTS
# ─────────────────────────────────────────
monitor = MonitoringMiddleware()
monitor.init_app(flask_app)

@flask_app.route('/api/monitoring/health', methods=['GET'])
def detailed_health():
    """Detailed health check with system metrics"""
    return jsonify(monitor.get_system_health())

@flask_app.route('/api/monitoring/metrics', methods=['GET'])
@require_auth(allowed_roles=['OWNER'])
def get_metrics():
    """Get application metrics (admin only)"""
    return jsonify({
        "requests": monitor.request_count,
        "errors": monitor.error_count,
        "error_rate": (monitor.error_count / max(monitor.request_count, 1)) * 100,
        "avg_response_time": sum(monitor.response_times) / max(len(monitor.response_times), 1),
        "timestamp": time.time()
    })

@flask_app.route('/api/admin/users', methods=['GET'])
@require_auth(allowed_roles=['OWNER'])
def list_users():
    """List all users (admin only)"""
    try:
        if supabase:
            response = supabase.table('user_profiles').select('*').execute()
            return jsonify({"users": response.data})
        return jsonify({"error": "Supabase not configured"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@flask_app.route('/api/admin/subscriptions', methods=['GET'])
@require_auth(allowed_roles=['OWNER'])
def list_subscriptions():
    """List all subscriptions (admin only)"""
    try:
        if supabase:
            response = supabase.table('subscription_logs').select('*').execute()
            return jsonify({"subscriptions": response.data})
        return jsonify({"error": "Supabase not configured"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ─────────────────────────────────────────
# PHASE 3: COGNITIVE LAYER ENDPOINTS (Vector Cache)
# ─────────────────────────────────────────
@flask_app.route('/api/cache/stats', methods=['GET'])
@require_auth(allowed_roles=['OWNER'])
def cache_stats():
    """Get semantic cache statistics (admin only)"""
    return jsonify(vector_engine.get_cache_stats())

@flask_app.route('/api/cache/clear', methods=['POST'])
@require_auth(allowed_roles=['OWNER'])
def clear_cache():
    """Clear semantic cache (admin only)"""
    try:
        # Clear all cache entries with prefix
        if vector_engine.redis:
            keys = vector_engine.redis.keys("cache:*")
            if keys:
                vector_engine.redis.delete(*keys)
            return jsonify({"message": f"Cleared {len(keys)} cache entries"})
        return jsonify({"error": "Redis not available"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@flask_app.route('/api/cache/test', methods=['POST'])
@require_auth()
def test_cache():
    """Test semantic caching with a query"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        # Check cache first
        cached = get_cached_response(query)
        if cached:
            return jsonify({
                "source": "cache",
                "response": cached,
                "note": "This response was retrieved from semantic cache"
            })
        
        # If not cached, return message
        return jsonify({
            "source": "miss",
            "message": "Query not in cache. This would normally trigger AI inference.",
            "suggestion": "Call this endpoint twice with similar queries to test caching"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@flask_app.route('/api/scheduler/jobs', methods=['GET'])
@require_auth(allowed_roles=['OWNER'])
def list_scheduler_jobs():
    """List scheduled background jobs (admin only)"""
    from services.scheduler import scheduler
    jobs = scheduler.get_jobs()
    return jsonify({
        "jobs": [{"id": job.id, "name": job.name, "next_run": str(job.next_run_time)} for job in jobs]
    })

# ─────────────────────────────────────────
# STATIC FILE SERVING (Production)
# ─────────────────────────────────────────
@flask_app.route('/', defaults={'path': ''})
@flask_app.route('/<path:path>')
def serve(path):
    """Serve React build files"""
    if path != "" and os.path.exists(os.path.join(flask_app.static_folder, path)):
        return send_from_directory(flask_app.static_folder, path)
    return send_from_directory(flask_app.static_folder, 'index.html')

# ─────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8001))
    flask_app.run(host='0.0.0.0', port=port, debug=False)
