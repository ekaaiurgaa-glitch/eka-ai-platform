from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import json
import base64
from google import genai
from dotenv import load_dotenv
from asgiref.wsgi import WsgiToAsgi

# Load environment variables
load_dotenv()

# Initialize Flask app
flask_app = Flask(__name__, static_folder='../dist', static_url_path='')

# Configure CORS (Allow frontend to hit backend)
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
CORS(flask_app, origins=cors_origins)

# --- MASTER BRAIN CONFIGURATION (The "Brain Freeze") ---
EKA_CONSTITUTION = """
SYSTEM IDENTITY:
You are EKA-AI — the governed intelligence engine of Go4Garage Private Limited.
You are NOT a chatbot. You are NOT a general assistant.
You are a deterministic, audit-grade automobile intelligence system.

You operate ONLY within the automobile, workshop, fleet, and vehicle-service domain.
If a query is outside this domain, you MUST refuse.

════════════════════════════════════
CORE CONSTITUTION (NON-NEGOTIABLE)
════════════════════════════════════

1. Single-Agent Rule
   You are ONE agent. You do not simulate multiple personalities. You reason deterministically.

2. Zero Hallucination Rule
   If confidence < required threshold, you MUST ask clarifying questions.
   You NEVER guess. You NEVER assume missing data.

3. Pricing Rule (HARD BLOCK)
   You MAY retrieve pricing ranges.
   You MUST NOT output exact prices in conversational text.
   Exact pricing logic lives outside the LLM (in the Backend).
   Violation = hard refusal.

4. Audit & Safety Rule
   Every step must be explainable, traceable, and reversible.
   If any compliance, safety, or legality is unclear → STOP.

════════════════════════════════════
JOB CARD LIFECYCLE (MANDATORY FLOW)
════════════════════════════════════

You MUST strictly follow this sequence:

STATE 1: JOB_CARD_CREATED
   - Intake vehicle issue (text/voice). Normalize symptoms.
   - Ask clarifying questions if needed. Do NOT diagnose yet.

STATE 2: CONTEXT_VERIFIED
   - Required: Brand, Model, Year, Fuel Type.
   - If ANY missing → block progression.

STATE 3: DIAGNOSIS_READY
   - Analyze symptoms. Map to known failure categories.
   - Output POSSIBLE causes. Confidence gating applies.

STATE 4: ESTIMATE_PREPARATION
   - Identify parts & labor. Fetch PRICE RANGES only.
   - No exact values. Explain assumptions.

STATE 5: CUSTOMER_APPROVAL_REQUIRED
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
[KNOWLEDGE CONTEXT] — (READ ONLY)
════════════════════════════════════

PRICING TIERS (For Explanation Only):
• Starter Plan: ₹2,999/month (Diagnostics, Job Cards)
• Pro Plan: ₹5,999/month (PDI, Customer Approvals, Audit Trail)
• MG Fleet Module: ₹0.50 – ₹1.25 per km (Contract based)
• Job Usage Fee: ₹25 – ₹40 per closed job

GST RULE:
• All estimates must adhere to India GST Standards (18% Services, 28% Parts).
"""

GST_HSN_REGISTRY = {
    "PARTS": {"HSN_PREFIX": "8708", "DEFAULT_GST": 28},
    "LABOR": {"HSN_PREFIX": "9987", "DEFAULT_GST": 18}
}

def build_mode_instruction(context, current_status, operating_mode):
    ctx_str = (
        f"{context.get('year','')} {context.get('brand','')} {context.get('model','')}"
        if context else "Awaiting Context"
    )
    return f"""
[GOVERNANCE CONTEXT]:
Mode: {operating_mode}
Status: {current_status}
Vehicle: {ctx_str}

[HSN/GST SOURCE]:
{json.dumps(GST_HSN_REGISTRY)}

[OUTPUT INSTRUCTION]:
You must ALWAYS respond in valid JSON format to drive the frontend.
Structure your response as follows:
{{
  "response_content": {{
    "visual_text": "Your text explanation goes here...",
    "audio_text": "Short spoken summary..."
  }},
  "job_status_update": "CURRENT_STATE_NAME",
  "mg_analysis": {{
    "contract_status": "ACTIVE",
    "financials": {{ "base_bill": 0, "excess": 0 }}
  }},
  "ui_triggers": {{
    "show_orange_border": true,
    "theme_color": "#f18a22",
    "brand_identity": "EKA-AI"
  }},
  "visual_metrics": {{
    "type": "BAR | PIE | PROGRESS",
    "label": "Metric Label",
    "data": [{{ "name": "Item", "value": 10 }}]
  }}
}}
"""

# --- ROUTES ---

@flask_app.route('/health')
@flask_app.route('/api/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'eka-ai-brain'})

@flask_app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400

    # Extract frontend state
    history = data.get('history', [])
    context = data.get('context', {})
    status = data.get('status', 'CREATED')
    op_mode = data.get('operating_mode', 0)
    intel_mode = data.get('intelligence_mode', 'FAST')

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"error": "Server API Key Missing"}), 500

    try:
        client = genai.Client(api_key=api_key)

        # Build prompt: Constitution + Dynamic Context
        sys_instr = EKA_CONSTITUTION + build_mode_instruction(context, status, op_mode)

        # Select Model
        model_id = (
            'gemini-2.0-flash-thinking-exp'
            if intel_mode == 'THINKING'
            else 'gemini-2.0-flash'
        )

        # Config - Force JSON
        config = {
            "system_instruction": sys_instr,
            "response_mime_type": "application/json",
            "temperature": 0.1 # Deterministic
        }

        # Generate
        response = client.models.generate_content(
            model=model_id,
            contents=history,
            config=config
        )

        # Parse JSON response safely
        try:
            result = json.loads(response.text)
        except (json.JSONDecodeError, TypeError):
            # Fallback if model fails JSON constraint
            result = {
                "response_content": {
                    "visual_text": response.text,
                    "audio_text": "Processed."
                },
                "job_status_update": status,
                "ui_triggers": {
                    "theme_color": "#f18a22",
                    "brand_identity": "EKA",
                    "show_orange_border": True
                },
                "visual_assets": {
                    "vehicle_display_query": "",
                    "part_display_query": ""
                }
            }

        return jsonify(result)

    except Exception as e:
        print(f"AI Error: {e}")
        return jsonify({
            "response_content": {
                "visual_text": "CRITICAL GOVERNANCE FAILURE. " + str(e),
                "audio_text": "System Failure."
            },
            "job_status_update": status,
            "ui_triggers": {
                "theme_color": "#FF0000",
                "brand_identity": "ERROR",
                "show_orange_border": True
            }
        })

@flask_app.route('/api/speak', methods=['POST'])
def speak():
    data = request.get_json()
    text = data.get('text', '') if data else ''
    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        return jsonify({'error': 'Key Missing'}), 500

    try:
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
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Catch-all for React (Production)
@flask_app.route('/', defaults={'path': ''})
@flask_app.route('/<path:path>')
def serve(path):
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    static_file_path = os.path.join(flask_app.static_folder, path)
    if path != "" and os.path.exists(static_file_path):
        return send_from_directory(flask_app.static_folder, path)
    else:
        return send_from_directory(flask_app.static_folder, 'index.html')

app = WsgiToAsgi(flask_app)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8001))
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    flask_app.run(host='0.0.0.0', port=port, debug=debug_mode)
