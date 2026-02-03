from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import json
import base64
from google import genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='../dist', static_url_path='/')

# Configure CORS
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
CORS(app, origins=cors_origins)

# --- BRAIN CONFIGURATION (Moved from Frontend) ---
EKA_CONSTITUTION = """
# EKA-Ai (Enterprise Knowledge Agent & Architect)
# CTO & Central OS for Go4Garage Private Limited

PRIME DIRECTIVE: COMPLETION & GOVERNANCE.
1. SILENT PROTOCOL: NO meta-commentary. Output ONLY the technical response.
2. OPERATIONAL GOVERNANCE:
   - Estimate line items MUST have: DESCRIPTION, HSN_CODE, GST_RATE.
   - GATEKEEPING: Status 'APPROVAL_GATE' requires valid HSN (8708/9987).
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

[VISUALIZATION]:
- Status 'SYMPTOM_RECORDING': Include 'visual_metrics' (PIE).
- Status 'EXECUTION_QUALITY': Include 'visual_metrics' (PROGRESS).

[RESPOND ONLY IN VALID JSON]
"""


# --- ROUTES ---

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'eka-ai-platform'})


@app.route('/api/chat', methods=['POST'])
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

        # Build prompt
        sys_instr = EKA_CONSTITUTION + build_mode_instruction(context, status, op_mode)

        # Select Model
        model_id = (
            'gemini-2.0-flash-thinking-exp'
            if intel_mode == 'THINKING'
            else 'gemini-2.0-flash'
        )

        # Config
        config = {
            "system_instruction": sys_instr,
            "response_mime_type": "application/json",
            "temperature": 0.1
        }

        # Generate
        response = client.models.generate_content(
            model=model_id,
            contents=history,
            config=config
        )

        # Parse JSON response
        try:
            result = json.loads(response.text)
        except (json.JSONDecodeError, TypeError):
            # Fallback if model returns raw text instead of JSON
            result = {
                "response_content": {
                    "visual_text": response.text,
                    "audio_text": "Processed."
                },
                "job_status_update": status,
                "ui_triggers": {
                    "theme_color": "#f18a22",
                    "brand_identity": "EKA",
                    "show_orange_border": False
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
                "visual_text": "CRITICAL: Logic gate failure. Check Server Logs.",
                "audio_text": "System Failure."
            },
            "job_status_update": status,
            "ui_triggers": {
                "theme_color": "#FF0000",
                "brand_identity": "ERROR",
                "show_orange_border": True
            },
            "visual_assets": {
                "vehicle_display_query": "",
                "part_display_query": ""
            }
        })


@app.route('/api/speak', methods=['POST'])
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

        # Extract audio bytes
        # The SDK returns binary data in parts[0].inline_data.data
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type and part.inline_data.mime_type.startswith('audio/'):
                # Convert bytes to base64 string for JSON transport
                b64_audio = base64.b64encode(part.inline_data.data).decode('utf-8')
                return jsonify({'audio_data': b64_audio})

        return jsonify({'error': 'No audio generated'}), 500
    except Exception as e:
        print(f"TTS Error: {e}")
        return jsonify({'error': str(e)}), 500


# Catch-all for React
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_file_path = os.path.join(app.static_folder, path)
    if path != "" and os.path.exists(static_file_path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8001))
    app.run(host='0.0.0.0', port=port, debug=False)
