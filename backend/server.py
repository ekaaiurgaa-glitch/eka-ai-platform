"""
EKA-AI Backend Server
The Brain of Go4Garage's Governed Automobile Intelligence System

This Flask server contains:
- Master Constitution for governed AI behavior
- Triple-Model Router (Gemini 2.0 Flash + Claude 3.5 Sonnet + Kimi K2.5)
- Supabase integration for vehicle lookup and audit logging
- Rate limiting for security
- File upload handling for PDI evidence
- JWT-based customer approval endpoints
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import json
import base64
import jwt
import datetime
from dotenv import load_dotenv

load_dotenv()

flask_app = Flask(__name__, static_folder='../dist', static_url_path='')
CORS(flask_app, origins=os.environ.get('CORS_ORIGINS', '*').split(','))

# Rate Limiting
limiter = Limiter(
    app=flask_app,
    key_func=get_remote_address,
    default_limits=["10 per minute"]
)

# Anthropic client (optional - for THINKING mode)
anthropic_client = None
try:
    anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY")
    if anthropic_api_key:
        import anthropic
        anthropic_client = anthropic.Anthropic(api_key=anthropic_api_key)
except ImportError:
    print("Anthropic client not installed, THINKING mode will use Gemini fallback")
except Exception as e:
    print(f"Anthropic initialization error: {e}")

# Moonshot/Kimi client (optional - for DEEP_CONTEXT mode)
moonshot_client = None
try:
    moonshot_api_key = os.environ.get("MOONSHOT_API_KEY")
    if moonshot_api_key:
        import openai
        moonshot_client = openai.OpenAI(
            api_key=moonshot_api_key,
            base_url="https://api.moonshot.cn/v1"
        )
except ImportError:
    print("OpenAI client not installed, DEEP_CONTEXT mode will use fallback")
except Exception as e:
    print(f"Moonshot initialization error: {e}")

# Supabase client (optional - graceful degradation if not configured)
supabase = None
try:
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    if supabase_url and supabase_key:
        from supabase import create_client, Client
        supabase: Client = create_client(supabase_url, supabase_key)
except ImportError:
    print("Supabase client not installed, running without database integration")
except Exception as e:
    print(f"Supabase initialization error: {e}")

# EKA-AI Master Constitution
EKA_CONSTITUTION = """
SYSTEM IDENTITY:
You are EKA-AI — the governed intelligence engine of Go4Garage Private Limited.
You are NOT a chatbot. You are a deterministic, audit-grade automobile intelligence system.

════════════════════════════════════
CORE CONSTITUTION (NON-NEGOTIABLE)
════════════════════════════════════

1. Single-Agent Rule
   You are ONE agent. You do not simulate multiple personalities. You reason deterministically.

2. Zero Hallucination Rule
   If confidence < 90%, you MUST ask clarifying questions.
   You NEVER guess. You NEVER assume missing data.

3. Pricing Rule (HARD BLOCK)
   You MAY retrieve pricing ranges.
   You MUST NOT output exact prices in conversational text.
   Exact pricing logic lives outside the LLM (in the Backend).
   Violation = hard refusal.

4. Database Authority Rule
   Prioritize injected vehicle details from the database over user claims.
   If database has vehicle info, use it as the source of truth.

5. Audit & Safety Rule
   Every step must be explainable, traceable, and reversible.
   If any compliance, safety, or legality is unclear → STOP.

════════════════════════════════════
JOB CARD LIFECYCLE (STRICT 9-STATE PIPELINE)
════════════════════════════════════

CREATED -> CONTEXT_VERIFIED -> DIAGNOSED -> ESTIMATED -> CUSTOMER_APPROVED -> IN_PROGRESS -> PDI_COMPLETED -> INVOICED -> CLOSED

STATE 1: CREATED
   - Intake vehicle issue (text/voice). Normalize symptoms.
   - Ask clarifying questions if needed. Do NOT diagnose yet.

STATE 2: CONTEXT_VERIFIED
   - Required: Brand, Model, Year, Fuel Type.
   - If ANY missing → block progression.

STATE 3: DIAGNOSED
   - Analyze symptoms. Map to known failure categories.
   - Output POSSIBLE causes. Confidence gating applies.

STATE 4: ESTIMATED
   - Identify parts & labor. Fetch PRICE RANGES only.
   - No exact values. Explain assumptions.

STATE 5: CUSTOMER_APPROVED
   - Customer must approve via secure link.
   - No silent progression.

STATE 6: IN_PROGRESS
   - Workshop executes work. Mandatory photo/video evidence.

STATE 7: PDI_COMPLETED
   - Safety checklist completed. Technician declaration required.

STATE 8: INVOICED
   - Invoice generated outside LLM. GST handled by billing system.

STATE 9: CLOSED
   - Payment recorded. Job archived. Learning ingestion allowed.

════════════════════════════════════
MG MODEL (MINIMUM GUARANTEE) — FLEET LOGIC
════════════════════════════════════

MG PURPOSE: Ensures predictable cost exposure for fleet operators.

INPUTS: Vehicle ID, Contract Period, Assured KM (AK), Rate per KM (RPK), Actual KM (AR).

LOGIC:
1. Guaranteed Amount = AK × RPK
2. Actual Amount = AR × RPK
3. Under-Utilization (AR < AK): Bill = Guaranteed Amount.
4. Over-Utilization (AR > AK): Bill = Guaranteed Amount + Excess Slabs.

MG RULES:
- You explain MG outcomes (Shortfall vs. Excess).
- You NEVER change MG values or calculate the final bill in text.

════════════════════════════════════
OUTPUT FORMAT (JSON ONLY)
════════════════════════════════════

You MUST respond with valid JSON in this format:
{
  "response_content": {"visual_text": "...", "audio_text": "..."},
  "job_status_update": "CURRENT_STATE",
  "diagnostic_data": {"symptoms": [], "suspected_parts": []},
  "mg_analysis": {"contract_status": "ACTIVE", "financials": {}},
  "ui_triggers": {"theme_color": "#f18a22", "show_orange_border": true}
}
"""


def fetch_vehicle_from_db(reg_number: str):
    """Fetch vehicle context from Supabase"""
    if not reg_number or not supabase:
        return None
    try:
        response = supabase.table('vehicles').select("*").eq('registration_number', reg_number.upper()).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"DB Error: {e}")
        return None


def log_intelligence(mode, status, query, response, model_used=None, confidence=None):
    """Audit trail logging to Supabase"""
    if not supabase:
        return
    try:
        supabase.table('intelligence_logs').insert({
            "mode": mode,
            "status": status,
            "user_query": query,
            "ai_response": response,
            "ai_model": model_used,
            "confidence_score": confidence,
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }).execute()
    except Exception as e:
        print(f"Logging Error: {e}")


def call_gemini(history, system_prompt):
    """Gemini 2.0 Flash for FAST mode"""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not configured")
    
    from google import genai
    client = genai.Client(api_key=api_key)
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
    """Claude 3.5 Sonnet for THINKING mode"""
    if not anthropic_client:
        raise ValueError("Anthropic client not initialized")
    
    # Convert Gemini format to Claude format
    messages = []
    for msg in history:
        role = "user" if msg.get("role") == "user" else "assistant"
        parts = msg.get("parts", [])
        content = parts[0].get("text", "") if parts else ""
        messages.append({"role": role, "content": content})
    
    message = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4096,
        temperature=0.1,
        system=system_prompt,
        messages=messages
    )
    
    response_text = message.content[0].text
    
    # Strip markdown code blocks if present
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0]
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0]
    
    return json.loads(response_text.strip())


def call_kimi(history, system_prompt):
    """Kimi K2.5 (Moonshot AI) for DEEP_CONTEXT mode - 200K context window"""
    if not moonshot_client:
        raise ValueError("Moonshot client not initialized")
    
    # Convert Gemini format to OpenAI format
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        role = "user" if msg.get("role") == "user" else "assistant"
        parts = msg.get("parts", [])
        content = parts[0].get("text", "") if parts else ""
        messages.append({"role": role, "content": content})
    
    # moonshot-v1-auto: Automatically selects optimal model based on context length
    # Supports up to 200K tokens, handles long fleet contracts and documents
    response = moonshot_client.chat.completions.create(
        model="moonshot-v1-auto",
        messages=messages,
        temperature=0.1,
        max_tokens=4096
    )
    
    content = response.choices[0].message.content
    
    # Strip markdown code blocks if present
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]
    
    return json.loads(content.strip())


def normalize_response(result, default_status, model_used=None):
    """Ensure consistent response format regardless of AI model"""
    normalized = {
        "response_content": result.get("response_content", {
            "visual_text": result.get("content", "No response"),
            "audio_text": result.get("content", "No response")[:200] if result.get("content") else "No response"
        }),
        "job_status_update": result.get("job_status_update", default_status),
        "diagnostic_data": result.get("diagnostic_data"),
        "mg_analysis": result.get("mg_analysis"),
        "estimate_data": result.get("estimate_data"),
        "pdi_checklist": result.get("pdi_checklist"),
        "visual_metrics": result.get("visual_metrics"),
        "recall_data": result.get("recall_data"),
        "service_history": result.get("service_history"),
        "ui_triggers": result.get("ui_triggers", {
            "theme_color": "#f18a22",
            "brand_identity": "EKA-AI",
            "show_orange_border": True
        })
    }
    if model_used:
        normalized["_meta"] = {
            "model": model_used,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    return normalized


@flask_app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'eka-ai-brain',
        'version': '5.0',
        'models': {
            'gemini': bool(os.environ.get("GEMINI_API_KEY")),
            'claude': anthropic_client is not None,
            'kimi': moonshot_client is not None
        },
        'db_connected': supabase is not None
    })


@flask_app.route('/api/chat', methods=['POST'])
@limiter.limit("10 per minute")
def chat():
    """Main chat endpoint with Triple Model Router (Gemini/Claude/Kimi)"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    history = data.get('history', [])
    context = data.get('context', {})
    status = data.get('status', 'CREATED')
    op_mode = data.get('operating_mode', 0)
    intel_mode = data.get('intelligence_mode', 'FAST')  # FAST, THINKING, or DEEP_CONTEXT

    # Enhance context from database if reg number provided
    if context.get('registrationNumber'):
        db_vehicle = fetch_vehicle_from_db(context['registrationNumber'])
        if db_vehicle:
            context.update({
                'brand': db_vehicle.get('brand', context.get('brand')),
                'model': db_vehicle.get('model', context.get('model')),
                'year': db_vehicle.get('year', context.get('year')),
                'fuel_type': db_vehicle.get('fuel_type', context.get('fuelType')),
                'vin': db_vehicle.get('vin', context.get('vin'))
            })

    # Build system instruction with context
    system_prompt = f"""
{EKA_CONSTITUTION}

[CURRENT CONTEXT]:
Operating Mode: {op_mode}
Job Status: {status}
Vehicle Context: {json.dumps(context)}
AI Model Selected: {intel_mode}
"""

    # MODEL ROUTER with Fallback Chain
    result = None
    model_used = intel_mode
    errors = []

    try:
        if intel_mode == 'DEEP_CONTEXT' and moonshot_client:
            print(f"[{datetime.datetime.now()}] Using Kimi (Deep Context Mode)...")
            result = call_kimi(history, system_prompt)
            model_used = "kimi-moonshot"
            
        elif intel_mode == 'THINKING' and anthropic_client:
            print(f"[{datetime.datetime.now()}] Using Claude (Thinking Mode)...")
            result = call_claude(history, system_prompt)
            model_used = "claude-3.5-sonnet"
            
        else:
            # Default to Gemini for FAST mode
            print(f"[{datetime.datetime.now()}] Using Gemini (Fast Mode)...")
            result = call_gemini(history, system_prompt)
            model_used = "gemini-2.0-flash"
            
    except Exception as e:
        print(f"Primary model {intel_mode} failed: {e}")
        errors.append(f"{intel_mode}: {str(e)}")
        
        # FALLBACK CHAIN: DEEP_CONTEXT -> Claude -> Gemini
        if intel_mode == 'DEEP_CONTEXT' and anthropic_client and not result:
            try:
                print("Falling back to Claude...")
                result = call_claude(history, system_prompt)
                model_used = "claude-3.5-sonnet (fallback)"
            except Exception as e2:
                errors.append(f"claude: {str(e2)}")
                
        # FALLBACK: THINKING -> Gemini
        if intel_mode == 'THINKING' and not result:
            try:
                print("Falling back to Gemini...")
                result = call_gemini(history, system_prompt)
                model_used = "gemini-2.0-flash (fallback)"
            except Exception as e3:
                errors.append(f"gemini: {str(e3)}")
        
        # Final fallback to Gemini if still no result
        if not result and os.environ.get("GEMINI_API_KEY"):
            try:
                print("Final fallback to Gemini...")
                result = call_gemini(history, system_prompt)
                model_used = "gemini-2.0-flash (fallback)"
            except Exception as e4:
                errors.append(f"gemini final: {str(e4)}")

    if not result:
        return jsonify({
            "response_content": {
                "visual_text": f"⚠️ Governance Engine Error. All AI models failed. Errors: {'; '.join(errors)}",
                "audio_text": "System error."
            },
            "job_status_update": status,
            "ui_triggers": {"theme_color": "#FF0000", "brand_identity": "ERROR", "show_orange_border": True}
        }), 500

    normalized = normalize_response(result, status, model_used)
    
    # Add fallback notice if applicable
    if "fallback" in model_used:
        normalized['response_content']['visual_text'] += f"\n\n[Notice: {intel_mode} unavailable, used {model_used}]"

    # Log to audit trail
    user_query = history[-1]['parts'][0]['text'] if history else ""
    diagnostic_data = normalized.get('diagnostic_data')
    log_intelligence(
        op_mode,
        normalized['job_status_update'],
        user_query,
        normalized['response_content']['visual_text'],
        model_used,
        diagnostic_data.get('confidence_score') if diagnostic_data else None
    )
    
    return jsonify(normalized)


@flask_app.route('/api/speak', methods=['POST'])
@limiter.limit("20 per minute")
def speak():
    """Text-to-Speech endpoint"""
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
                    "voice_config": {
                        "prebuilt_voice_config": {"voice_name": "Kore"}
                    }
                }
            }
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith('audio/'):
                b64_audio = base64.b64encode(part.inline_data.data).decode('utf-8')
                return jsonify({'audio_data': b64_audio})
        return jsonify({'error': 'No audio generated'}), 500
    except ImportError:
        return jsonify({'error': 'TTS service not available'}), 500
    except Exception as e:
        print(f"TTS Error: {e}")
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/upload-pdi', methods=['POST'])
@limiter.limit("30 per minute")
def upload_pdi():
    """Handle PDI photo/video uploads to Supabase Storage"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    job_card_id = request.form.get('job_card_id')
    checklist_item = request.form.get('checklist_item')
    
    if not file or not job_card_id or not checklist_item:
        return jsonify({'error': 'Missing required fields'}), 400
    
    if not supabase:
        return jsonify({'error': 'Storage not configured'}), 500
    
    # Validate file type using os.path.splitext for robustness
    allowed_extensions = {'jpg', 'jpeg', 'png', 'webp', 'mp4'}
    _, ext = os.path.splitext(file.filename)
    file_ext = ext.lstrip('.').lower() if ext else ''
    
    if file_ext not in allowed_extensions:
        return jsonify({'error': 'Invalid file type. Allowed: jpg, jpeg, png, webp, mp4'}), 400
    
    # Try to validate with python-magic if available
    try:
        import magic
        allowed_types = {'image/jpeg', 'image/png', 'image/webp', 'video/mp4'}
        file_type = magic.from_buffer(file.read(1024), mime=True)
        file.seek(0)
        
        if file_type not in allowed_types:
            return jsonify({'error': f'Invalid file type: {file_type}'}), 400
    except ImportError:
        # Fallback to extension-based validation
        file_type = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp',
            'mp4': 'video/mp4'
        }.get(file_ext, 'application/octet-stream')
    
    # Validate file size (max 5MB)
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > 5 * 1024 * 1024:
        return jsonify({'error': 'File too large (max 5MB)'}), 400
    
    try:
        # Upload to Supabase Storage
        timestamp = datetime.datetime.now(datetime.timezone.utc).timestamp()
        filename = f"{job_card_id}/{checklist_item}_{timestamp}.{file_ext}"
        file_bytes = file.read()
        
        supabase.storage.from_('pdi-evidence').upload(
            filename,
            file_bytes,
            {"content-type": file_type}
        )
        
        # Get public URL
        file_url = supabase.storage.from_('pdi-evidence').get_public_url(filename)
        
        # Record in database
        supabase.table('pdi_evidence').insert({
            'job_card_id': job_card_id,
            'checklist_item': checklist_item,
            'file_url': file_url,
            'file_type': 'image' if file_type.startswith('image') else 'video',
            'uploaded_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }).execute()
        
        return jsonify({'file_url': file_url, 'success': True})
        
    except Exception as e:
        print(f"Upload Error: {e}")
        return jsonify({'error': 'Upload failed'}), 500


@flask_app.route('/api/approve-job', methods=['POST'])
def approve_job():
    """Customer approval endpoint with JWT validation"""
    data = request.get_json()
    token = data.get('token')
    action = data.get('action')  # 'approve', 'reject', 'concern'
    
    if not token or not action:
        return jsonify({'error': 'Missing token or action'}), 400
    
    # Validate action parameter
    valid_actions = {'approve', 'reject', 'concern'}
    if action not in valid_actions:
        return jsonify({'error': f'Invalid action. Must be one of: {", ".join(valid_actions)}'}), 400
    
    jwt_secret = os.environ.get('JWT_SECRET')
    if not jwt_secret:
        return jsonify({'error': 'JWT not configured'}), 500
    
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 500
    
    try:
        # Verify JWT
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        job_card_id = payload.get('job_card_id')
        
        if action == 'approve':
            new_status = 'CUSTOMER_APPROVED'
        elif action == 'reject':
            new_status = 'CREATED'  # Back to start
        else:
            new_status = 'CONCERN_RAISED'
        
        # Update job card
        supabase.table('job_cards').update({
            'status': new_status,
            'customer_approved_at': datetime.datetime.now(datetime.timezone.utc).isoformat() if action == 'approve' else None
        }).eq('id', job_card_id).execute()
        
        return jsonify({'success': True, 'new_status': new_status})
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Approval link expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        print(f"Approval Error: {e}")
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/generate-approval-link', methods=['POST'])
def generate_approval_link():
    """Generate secure approval link for customer"""
    data = request.get_json()
    job_card_id = data.get('job_card_id')
    customer_phone = data.get('customer_phone')
    
    if not job_card_id or not customer_phone:
        return jsonify({'error': 'Missing required fields'}), 400
    
    jwt_secret = os.environ.get('JWT_SECRET')
    if not jwt_secret:
        return jsonify({'error': 'JWT not configured'}), 500
    
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 500
    
    try:
        # Generate JWT with 24h expiry
        expiry = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
        token = jwt.encode({
            'job_card_id': job_card_id,
            'exp': expiry
        }, jwt_secret, algorithm='HS256')
        
        # Store token in job card
        supabase.table('job_cards').update({
            'approval_token': token,
            'approval_expires_at': expiry.isoformat()
        }).eq('id', job_card_id).execute()
        
        # Generate link (frontend URL + token)
        base_url = os.environ.get('FRONTEND_URL', 'https://eka-ai.go4garage.in')
        approval_url = f"{base_url}/customer-approval?token={token}"
        
        return jsonify({
            'approval_url': approval_url,
            'token': token,
            'expires_in': '24h'
        })
        
    except Exception as e:
        print(f"Approval Link Error: {e}")
        return jsonify({'error': str(e)}), 500


# Static file serving for production
@flask_app.route('/', defaults={'path': ''})
@flask_app.route('/<path:path>')
def serve(path):
    """Serve static files from the frontend build"""
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    static_file_path = os.path.join(flask_app.static_folder, path)
    if path and os.path.exists(static_file_path):
        return send_from_directory(flask_app.static_folder, path)
    return send_from_directory(flask_app.static_folder, 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8001))
    flask_app.run(host='0.0.0.0', port=port, debug=False)
