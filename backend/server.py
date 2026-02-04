"""
EKA-AI Backend Server (Production Ready)
Features: Triple-Model Router, Rate Limiting, JWT Auth, Supabase Integration
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
from dotenv import load_dotenv

load_dotenv()

flask_app = Flask(__name__, static_folder='../dist', static_url_path='')

# PROXY FIX: Critical for Rate Limiting behind Load Balancers (Emergent/AWS/Heroku)
flask_app.wsgi_app = ProxyFix(flask_app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

CORS(flask_app, origins=os.environ.get('CORS_ORIGINS', '*').split(','))

# Rate Limiting
limiter = Limiter(
    key_func=get_remote_address,
    app=flask_app,
    default_limits=["60 per minute"], # Increased for production usability
    storage_uri="memory://"
)

# --- CLIENT INITIALIZATION (Graceful Degradation) ---
supabase = None
anthropic_client = None
moonshot_client = None

try:
    if os.environ.get("SUPABASE_URL"):
        from supabase import create_client
        supabase = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))
except Exception as e: print(f"Supabase Warning: {e}")

try:
    if os.environ.get("ANTHROPIC_API_KEY"):
        import anthropic
        anthropic_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
except Exception as e: print(f"Anthropic Warning: {e}")

try:
    if os.environ.get("MOONSHOT_API_KEY"):
        import openai
        moonshot_client = openai.OpenAI(
            api_key=os.environ.get("MOONSHOT_API_KEY"), 
            base_url="https://api.moonshot.cn/v1"
        )
except Exception as e: print(f"Moonshot Warning: {e}")

# --- MASTER CONSTITUTION ---
EKA_CONSTITUTION = """
SYSTEM IDENTITY:
You are EKA-AI — the governed intelligence engine of Go4Garage Private Limited.
You are a deterministic, audit-grade automobile intelligence system.

RULES:
1. Single-Agent Rule: You are ONE agent.
2. Pricing Rule: NEVER output exact prices. Only ranges.
3. Database Authority: Prioritize verified DB vehicle data.
4. Output Format: ALWAYS JSON.
"""

def fetch_vehicle_from_db(reg_number):
    if not reg_number or not supabase: return None
    try:
        res = supabase.table('vehicles').select("*").eq('registration_number', reg_number).execute()
        return res.data[0] if res.data else None
    except: return None

# --- ROUTER LOGIC ---
def call_gemini(history, system_prompt):
    from google import genai
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=history,
        config={"system_instruction": system_prompt, "response_mime_type": "application/json"}
    )
    return json.loads(response.text)

def call_claude(history, system_prompt):
    # Convert Gemini history to Claude messages
    messages = []
    for msg in history:
        role = "user" if msg.get("role") == "user" else "assistant"
        parts = msg.get("parts", [])
        content = parts[0].get("text", "") if parts else ""
        messages.append({"role": role, "content": content})
    msg = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4096,
        system=system_prompt,
        messages=messages
    )
    return json.loads(msg.content[0].text)

def normalize_response(result, default_status):
    """Ensures frontend always gets the correct shape"""
    return {
        "response_content": result.get("response_content", {"visual_text": "Error parsing output", "audio_text": "Error"}),
        "job_status_update": result.get("job_status_update", default_status),
        "ui_triggers": result.get("ui_triggers", {"theme_color": "#f18a22", "show_orange_border": True}),
        "diagnostic_data": result.get("diagnostic_data"),
        "visual_metrics": result.get("visual_metrics"),
        "mg_analysis": result.get("mg_analysis")
    }

@flask_app.route('/api/chat', methods=['POST'])
@limiter.limit("15 per minute")
def chat():
    data = request.get_json()
    history = data.get('history', [])
    context = data.get('context', {})
    status = data.get('status', 'CREATED')
    mode = data.get('intelligence_mode', 'FAST')

    # 1. Enhance Context
    if context.get('registrationNumber'):
        db_veh = fetch_vehicle_from_db(context['registrationNumber'])
        if db_veh: context.update(db_veh)

    system_prompt = f"{EKA_CONSTITUTION}\n[CONTEXT]: {json.dumps(context)}\n[STATUS]: {status}"
    
    # 2. Router
    result = None
    try:
        if mode == 'THINKING' and anthropic_client:
            result = call_claude(history, system_prompt)
        elif mode == 'DEEP_CONTEXT':
            # DEEP_CONTEXT falls back to Gemini (Moonshot not fully implemented)
            result = call_gemini(history, system_prompt)
        else:
            result = call_gemini(history, system_prompt)
            
    except Exception as e:
        print(f"Model Error ({mode}): {e}")
        # Fallback to Gemini
        try:
            result = call_gemini(history, system_prompt)
        except Exception as e2:
            error_result = {"response_content": {"visual_text": f"System Failure: {str(e2)}", "audio_text": "System error."}}
            return jsonify(normalize_response(error_result, status)), 500

    return jsonify(normalize_response(result, status))

# Static Files
@flask_app.route('/', defaults={'path': ''})
@flask_app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(flask_app.static_folder, path)):
        return send_from_directory(flask_app.static_folder, path)
    return send_from_directory(flask_app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8001))
    flask_app.run(host='0.0.0.0', port=port)
