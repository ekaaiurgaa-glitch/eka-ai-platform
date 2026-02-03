from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from google import genai
from google.genai.types import GenerateContentConfig, Tool, GoogleSearch, Part

app = Flask(__name__)
CORS(app)

# Initialize Gemini client
client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

# Model configurations
FAST_MODEL = 'gemini-3-flash-preview'
THINKING_MODEL = 'gemini-3-pro-preview'
TTS_MODEL = 'gemini-2.5-flash-preview-tts'

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'eka-ai-backend'})

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint for Gemini API
    Expects JSON body with:
    - history: array of message objects
    - context: vehicle context object
    - currentStatus: job status string
    - intelMode: 'FAST' or 'THINKING'
    - opMode: operating mode (0, 1, or 2)
    """
    try:
        data = request.json
        history = data.get('history', [])
        context = data.get('context', {})
        current_status = data.get('currentStatus', 'CREATED')
        intel_mode = data.get('intelMode', 'FAST')
        op_mode = data.get('opMode', 0)
        
        # Build system instruction
        mode_instruction = f"""
[GOVERNANCE CONTEXT]:
Active Operating Mode: {op_mode}
Current Logical State: {current_status}
Vehicle Context: {f"{context.get('year', '')} {context.get('brand', '')} {context.get('model', '')}" if context.get('brand') else 'Awaiting Context'}

[HSN/GST SOURCE OF TRUTH]:
Reference the following registry for all estimate generation:
{json.dumps(data.get('gstHsnRegistry', {}), indent=2)}

[VISUALIZATION MANDATE]:
- When currentStatus is 'SYMPTOM_RECORDING', you MUST include a 'visual_metrics' object of type 'PIE' showing complaint distribution across domains (e.g., Mechanical, Electrical, Body).
- When currentStatus is 'EXECUTION_QUALITY', you MUST include a 'visual_metrics' object of type 'PROGRESS' showing repair percentage.
- Use 'BAR' charts to compare estimate line items or part costs.
- Use 'RADAR' for multi-point system health equilibrium checks.
- Use 'RADIAL' for fuel/battery/health gauges.

[ESTIMATE COMPLIANCE]:
- PART items MUST use HSN starting with 8708 and 28% GST.
- LABOR/SERVICE items MUST use HSN starting with 9987 and 18% GST.
- Transition to 'APPROVAL_GATE' only if these rules are satisfied.

[RESPOND ONLY in valid JSON.]
"""
        
        eka_constitution = data.get('ekaConstitution', '')
        system_instruction = eka_constitution + mode_instruction
        
        # Build response schema
        response_schema = {
            "type": "object",
            "properties": {
                "response_content": {
                    "type": "object",
                    "properties": {
                        "visual_text": {"type": "string"},
                        "audio_text": {"type": "string"}
                    },
                    "required": ["visual_text", "audio_text"]
                },
                "job_status_update": {"type": "string"},
                "ui_triggers": {
                    "type": "object",
                    "properties": {
                        "theme_color": {"type": "string"},
                        "brand_identity": {"type": "string"},
                        "show_orange_border": {"type": "boolean"}
                    },
                    "required": ["theme_color", "brand_identity", "show_orange_border"]
                },
                "visual_assets": {
                    "type": "object",
                    "properties": {
                        "vehicle_display_query": {"type": "string"},
                        "part_display_query": {"type": "string"}
                    },
                    "required": ["vehicle_display_query", "part_display_query"]
                },
                "diagnostic_data": {
                    "type": "object",
                    "properties": {
                        "code": {"type": "string"},
                        "description": {"type": "string"},
                        "severity": {"type": "string"},
                        "possible_causes": {"type": "array", "items": {"type": "string"}},
                        "recommended_actions": {"type": "array", "items": {"type": "string"}},
                        "systems_affected": {"type": "array", "items": {"type": "string"}}
                    }
                },
                "visual_metrics": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string"},
                        "label": {"type": "string"},
                        "data": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "value": {"type": "number"},
                                    "color": {"type": "string"},
                                    "fullMark": {"type": "number"}
                                },
                                "required": ["name", "value"]
                            }
                        }
                    }
                },
                "service_history": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "date": {"type": "string"},
                            "service_type": {"type": "string"},
                            "odometer": {"type": "string"},
                            "notes": {"type": "string"}
                        }
                    }
                },
                "estimate_data": {
                    "type": "object",
                    "properties": {
                        "estimate_id": {"type": "string"},
                        "tax_type": {"type": "string"},
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string"},
                                    "description": {"type": "string"},
                                    "hsn_code": {"type": "string"},
                                    "unit_price": {"type": "number"},
                                    "quantity": {"type": "number"},
                                    "gst_rate": {"type": "number"},
                                    "type": {"type": "string"}
                                }
                            }
                        },
                        "currency": {"type": "string"}
                    }
                }
            },
            "required": ["response_content", "job_status_update", "ui_triggers", "visual_assets"]
        }
        
        # Build config
        config = GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.1,
            response_mime_type="application/json",
            tools=[Tool(google_search=GoogleSearch())],
            response_schema=response_schema
        )
        
        # Add thinking config for thinking mode
        if intel_mode == 'THINKING':
            config.max_output_tokens = 40000
            config.thinking_config = {"thinking_budget": 32768}
        
        # Select model
        model = THINKING_MODEL if intel_mode == 'THINKING' else FAST_MODEL
        
        # Generate response
        response = client.models.generate_content(
            model=model,
            contents=history,
            config=config
        )
        
        # Parse response
        raw_text = response.text or '{}'
        result = json.loads(raw_text)
        
        # Extract grounding chunks if available
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                grounding_chunks = candidate.grounding_metadata.grounding_chunks
                if grounding_chunks:
                    result['grounding_links'] = [
                        {
                            'uri': chunk.web.uri if hasattr(chunk, 'web') and chunk.web else '',
                            'title': chunk.web.title if hasattr(chunk, 'web') and chunk.web and hasattr(chunk.web, 'title') else 'External Logic Source'
                        }
                        for chunk in grounding_chunks
                        if hasattr(chunk, 'web') and chunk.web and hasattr(chunk.web, 'uri') and chunk.web.uri
                    ]
        
        return jsonify(result)
        
    except Exception as e:
        app.logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            'response_content': {
                'visual_text': f"CRITICAL: Logic gate failure. {str(e)}",
                'audio_text': "Logic failure."
            },
            'job_status_update': current_status,
            'ui_triggers': {
                'theme_color': '#FF0000',
                'brand_identity': 'OS_FAIL',
                'show_orange_border': True
            },
            'visual_assets': {
                'vehicle_display_query': 'Error',
                'part_display_query': ''
            }
        }), 500

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """
    Text-to-speech endpoint
    Expects JSON body with:
    - text: string to convert to speech
    """
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Generate speech
        response = client.models.generate_content(
            model=TTS_MODEL,
            contents=[Part.from_text(text)],
            config=GenerateContentConfig(
                response_modalities=['AUDIO'],
                speech_config={
                    'voice_config': {
                        'prebuilt_voice_config': {
                            'voice_name': 'Kore'
                        }
                    }
                }
            )
        )
        
        # Extract audio data
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        return jsonify({
                            'audio_data': part.inline_data.data,
                            'mime_type': part.inline_data.mime_type
                        })
        
        return jsonify({'error': 'No audio generated'}), 500
        
    except Exception as e:
        app.logger.error(f"Error in TTS endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
