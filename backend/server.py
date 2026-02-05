"""
EKA-AI Backend Server (Production v4.5)
Governed Automobile Intelligence System for Go4Garage Private Limited
Features: Triple-Model Router, Rate Limiting, JWT Auth, Supabase Integration, PDI Pipeline
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix
import os
import json
import base64
import jwt
import datetime
import logging
from dotenv import load_dotenv

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────
# FLASK APP INIT
# ─────────────────────────────────────────
flask_app = Flask(__name__, static_folder='../dist', static_url_path='')

# PROXY FIX: Essential for correct IP detection behind Nginx/Emergent/AWS
flask_app.wsgi_app = ProxyFix(flask_app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

raw_origins = os.environ.get('CORS_ORIGINS', '*')
origins_list = [origin.strip() for origin in raw_origins.split(',') if origin.strip()]
CORS(flask_app, origins=origins_list)

# Production Rate Limiting (Redis-backed)
redis_url = os.environ.get('REDIS_URL')
if redis_url:
    limiter = Limiter(
        key_func=get_remote_address,
        app=flask_app,
        default_limits=["60 per minute"],
        storage_uri=redis_url,
        strategy="fixed-window"
    )
    logger.info("✅ Redis Rate Limiter Connected")
else:
    limiter = Limiter(
        key_func=get_remote_address,
        app=flask_app,
        default_limits=["60 per minute"],
        storage_uri="memory://"
    )
    logger.warning("⚠️ Using In-Memory Rate Limiter (Development Only)")

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
    """Main intelligence endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        history = data.get('history', [])
        context = data.get('context', {})
        status = data.get('status', 'CREATED')
        mode = data.get('intelligence_mode', 'FAST')
        op_mode = data.get('operating_mode', 0)

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
        
        base_url = os.environ.get('FRONTEND_URL', 'https://eka-ai.go4garage.in')
        approval_url = f"{base_url}/customer-approval?token={token}"
        
        return jsonify({
            'success': True,
            'approval_url': approval_url, 
            'token': token, 
            'expires_at': expiry.isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
