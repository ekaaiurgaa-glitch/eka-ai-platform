from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
from google import genai
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

EKA_CONSTITUTION = """
SYSTEM IDENTITY:
You are EKA-AI — the governed intelligence engine of Go4Garage.
You are a deterministic, audit-grade automobile intelligence system.
Rules:
1. Single-Agent Rule: You are ONE agent.
2. Pricing Rule: NEVER output exact prices. Only ranges.
3. Database Rule: Prioritize Supabase vehicle data over user claims.
"""

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    if not data:
        return jsonify({"response_content": {"visual_text": "Invalid request", "audio_text": "Error"}}), 400
    
    # Validate input types
    history = data.get('history', [])
    context = data.get('context', {})
    status = data.get('status', 'CREATED')
    
    if not isinstance(history, list):
        return jsonify({"response_content": {"visual_text": "Invalid history format", "audio_text": "Error"}}), 400
    if not isinstance(context, dict):
        return jsonify({"response_content": {"visual_text": "Invalid context format", "audio_text": "Error"}}), 400
    if not isinstance(status, str):
        return jsonify({"response_content": {"visual_text": "Invalid status format", "audio_text": "Error"}}), 400
    
    # 1. Fetch Vehicle Data from DB (if reg number exists)
    db_context = ""
    if context.get('registrationNumber') and supabase:
        try:
            res = supabase.table('vehicles').select("*").eq('registration_number', context['registrationNumber']).execute()
            if res.data:
                db_context = f" [DB VERIFIED VEHICLE: {res.data[0].get('brand')} {res.data[0].get('model')}]"
        except Exception as e:
            print(f"Database lookup error: {e}")

    # 2. Call Gemini
    if not GEMINI_API_KEY:
        return jsonify({"response_content": {"visual_text": "AI service not configured", "audio_text": "Error"}}), 500
    
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=history,
            config={
                "system_instruction": EKA_CONSTITUTION + db_context, 
                "response_mime_type": "application/json"
            }
        )
        return jsonify(json.loads(response.text))
    except Exception as e:
        return jsonify({"response_content": {"visual_text": f"Error: {str(e)}", "audio_text": "Error"}}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8001))
    app.run(host='0.0.0.0', port=port)
