from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import datetime
import os
import json
import google.genai as genai

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///eka.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Enable CORS for the React frontend
CORS(app, origins=["http://localhost:3000"])

# Gemini model configuration
GEMINI_FAST_MODEL = 'gemini-2.0-flash'
GEMINI_THINKING_MODEL = 'gemini-2.0-flash-thinking-exp'


# Database Models
class JobCard(db.Model):
    """JobCard model for storing job card information."""
    id = db.Column(db.Integer, primary_key=True)
    registration_number = db.Column(db.String(20))
    customer_name = db.Column(db.String(100))
    status = db.Column(db.String(50), default='OPEN')
    complaints = db.Column(db.JSON)
    fuel_level = db.Column(db.Integer)
    inventory = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert JobCard to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'registration_number': self.registration_number,
            'customer_name': self.customer_name,
            'status': self.status,
            'complaints': self.complaints,
            'fuel_level': self.fuel_level,
            'inventory': self.inventory,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ServiceHistory(db.Model):
    """ServiceHistory model for storing service history information."""
    id = db.Column(db.Integer, primary_key=True)
    registration_number = db.Column(db.String(20))
    service_type = db.Column(db.String(100))
    date = db.Column(db.String(50))
    odometer = db.Column(db.Integer)
    notes = db.Column(db.Text)

    def to_dict(self):
        """Convert ServiceHistory to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'registration_number': self.registration_number,
            'service_type': self.service_type,
            'date': self.date,
            'odometer': self.odometer,
            'notes': self.notes
        }


# Create database tables
with app.app_context():
    db.create_all()


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"}), 200


@app.route('/api/job-cards', methods=['POST'])
def create_job_card():
    """Create a new Job Card."""
    data = request.get_json()

    if data is None:
        return jsonify({"error": "Invalid JSON data"}), 400

    try:
        job_card = JobCard(
            registration_number=data.get('registration_number'),
            customer_name=data.get('customer_name'),
            status=data.get('status', 'OPEN'),
            complaints=data.get('complaints'),
            fuel_level=data.get('fuel_level'),
            inventory=data.get('inventory')
        )

        db.session.add(job_card)
        db.session.commit()

        return jsonify(job_card.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route('/api/job-cards', methods=['GET'])
def get_job_cards():
    """Get all Job Cards."""
    job_cards = JobCard.query.all()
    return jsonify([job_card.to_dict() for job_card in job_cards]), 200


# GST/HSN Registry (moved from frontend constants.ts)
GST_HSN_REGISTRY = {
    "PARTS": {
        "HSN_PREFIX": "8708",
        "NAME": "Automotive Components",
        "COMMON_CODES": {
            "87083000": "Brake System Components",
            "87081010": "Bumpers & Protection Systems",
            "87089900": "General Chassis Architecture",
            "87087011": "Wheels / Rims / Hubs",
            "87082900": "Body Structure Parts"
        },
        "DEFAULT_GST": 28,
        "REGULATORY_REF": "GST Notification 1/2017"
    },
    "LABOR": {
        "HSN_PREFIX": "9987",
        "NAME": "Maintenance & Repair Services",
        "COMMON_CODES": {
            "998711": "Motorcycle Maintenance Services",
            "998712": "Motor Car Maintenance Services",
            "998714": "General Mechanical Operations"
        },
        "DEFAULT_GST": 18,
        "REGULATORY_REF": "GST Notification 11/2017"
    }
}

# EKA Constitution (moved from frontend constants.ts)
EKA_CONSTITUTION = """
# EKA-Ai (Enterprise Knowledge Agent & Architect) v1.3
# CTO & Central OS for Go4Garage Private Limited (eka-ai.in)

────────────────────────────────────────────────────────────────
PRIME DIRECTIVE: COMPLETION & GOVERNANCE
────────────────────────────────────────────────────────────────

1. SILENT PROTOCOL (CRITICAL):
   - NO meta-commentary. Output ONLY the technical response required.

2. OPERATIONAL GOVERNANCE (MODE 1: JOB CARD / ESTIMATE):
   - Every estimate line item MUST include:
     - DESCRIPTION: Precise technical component/service name.
     - HSN_CODE: Strictly 8708 (Parts) or 9987 (Labor).
     - GST_RATE: 28% for Parts (HSN 8708), 18% for Labor (HSN 9987).
   - GATEKEEPING: Status MUST NOT reach 'APPROVAL_GATE' without valid HSN/GST mapping from the GST_HSN_REGISTRY.
   - AUDIT: Transition to 'APPROVAL_GATE' is blocked if logic gates fail.

3. COMPLIANCE:
   - Stay in 'ESTIMATE_GOVERNANCE' if HSN mapping is ambiguous. Ask for technician clarification.
"""


def build_mode_instruction(context, current_status, operating_mode):
    """Build the mode-specific instruction for the Gemini model."""
    vehicle_context_str = "Awaiting Context"
    if context and context.get("brand"):
        vehicle_context_str = f"{context.get('year', '')} {context.get('brand', '')} {context.get('model', '')}"
    
    return f"""
[GOVERNANCE CONTEXT]:
Active Operating Mode: {operating_mode}
Current Logical State: {current_status}
Vehicle Context: {vehicle_context_str}

[HSN/GST SOURCE OF TRUTH]:
Reference the following registry for all estimate generation:
{json.dumps(GST_HSN_REGISTRY, indent=2)}

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


# Response schema for Gemini API
RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "response_content": {
            "type": "OBJECT",
            "properties": {
                "visual_text": {"type": "STRING"},
                "audio_text": {"type": "STRING"}
            },
            "required": ["visual_text", "audio_text"]
        },
        "job_status_update": {"type": "STRING"},
        "ui_triggers": {
            "type": "OBJECT",
            "properties": {
                "theme_color": {"type": "STRING"},
                "brand_identity": {"type": "STRING"},
                "show_orange_border": {"type": "BOOLEAN"}
            },
            "required": ["theme_color", "brand_identity", "show_orange_border"]
        },
        "visual_assets": {
            "type": "OBJECT",
            "properties": {
                "vehicle_display_query": {"type": "STRING"},
                "part_display_query": {"type": "STRING"}
            },
            "required": ["vehicle_display_query", "part_display_query"]
        },
        "diagnostic_data": {
            "type": "OBJECT",
            "properties": {
                "code": {"type": "STRING"},
                "description": {"type": "STRING"},
                "severity": {"type": "STRING"},
                "possible_causes": {"type": "ARRAY", "items": {"type": "STRING"}},
                "recommended_actions": {"type": "ARRAY", "items": {"type": "STRING"}},
                "systems_affected": {"type": "ARRAY", "items": {"type": "STRING"}}
            }
        },
        "visual_metrics": {
            "type": "OBJECT",
            "properties": {
                "type": {"type": "STRING"},
                "label": {"type": "STRING"},
                "data": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "name": {"type": "STRING"},
                            "value": {"type": "NUMBER"},
                            "color": {"type": "STRING"},
                            "fullMark": {"type": "NUMBER"}
                        },
                        "required": ["name", "value"]
                    }
                }
            }
        },
        "service_history": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "date": {"type": "STRING"},
                    "service_type": {"type": "STRING"},
                    "odometer": {"type": "STRING"},
                    "notes": {"type": "STRING"}
                }
            }
        },
        "estimate_data": {
            "type": "OBJECT",
            "properties": {
                "estimate_id": {"type": "STRING"},
                "tax_type": {"type": "STRING"},
                "items": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "id": {"type": "STRING"},
                            "description": {"type": "STRING"},
                            "hsn_code": {"type": "STRING"},
                            "unit_price": {"type": "NUMBER"},
                            "quantity": {"type": "NUMBER"},
                            "gst_rate": {"type": "NUMBER"},
                            "type": {"type": "STRING"}
                        }
                    }
                },
                "currency": {"type": "STRING"}
            }
        }
    },
    "required": ["response_content", "job_status_update", "ui_triggers", "visual_assets"]
}


@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle Gemini API calls server-side."""
    data = request.get_json()
    
    if data is None:
        return jsonify({"error": "Invalid JSON data"}), 400
    
    history = data.get('history', [])
    context = data.get('context', {})
    status = data.get('status', 'CREATED')
    intelligence_mode = data.get('intelligence_mode', 'FAST')
    operating_mode = data.get('operating_mode', 0)
    
    # Get API key from environment
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({
            "error": "GEMINI_API_KEY not configured",
            "response_content": {
                "visual_text": "CRITICAL: API key not configured on server.",
                "audio_text": "API key not configured."
            },
            "job_status_update": status,
            "ui_triggers": {
                "theme_color": "#FF0000",
                "brand_identity": "OS_FAIL",
                "show_orange_border": True
            },
            "visual_assets": {
                "vehicle_display_query": "Error",
                "part_display_query": ""
            }
        }), 500
    
    try:
        # Configure the Gemini client
        client = genai.Client(api_key=api_key)
        
        # Build system instruction
        mode_instruction = build_mode_instruction(context, status, operating_mode)
        system_instruction = EKA_CONSTITUTION + mode_instruction
        
        # Select model based on intelligence mode
        model = GEMINI_THINKING_MODEL if intelligence_mode == 'THINKING' else GEMINI_FAST_MODEL
        
        # Build config
        config = {
            "system_instruction": system_instruction,
            "temperature": 0.1,
            "response_mime_type": "application/json",
            "response_schema": RESPONSE_SCHEMA
        }
        
        if intelligence_mode == 'THINKING':
            config["max_output_tokens"] = 40000
        
        # Generate content
        response = client.models.generate_content(
            model=model,
            contents=history,
            config=config
        )
        
        # Parse response
        raw_text = response.text or '{}'
        result = json.loads(raw_text)
        
        # Extract grounding metadata if available
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                grounding_chunks = getattr(candidate.grounding_metadata, 'grounding_chunks', None)
                if grounding_chunks:
                    result['grounding_links'] = [
                        {
                            'uri': getattr(getattr(chunk, 'web', None), 'uri', ''),
                            'title': getattr(getattr(chunk, 'web', None), 'title', 'External Logic Source')
                        }
                        for chunk in grounding_chunks
                        if getattr(getattr(chunk, 'web', None), 'uri', None)
                    ]
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "response_content": {
                "visual_text": f"CRITICAL: Logic gate failure. {str(e)}",
                "audio_text": "Logic failure."
            },
            "job_status_update": status,
            "ui_triggers": {
                "theme_color": "#FF0000",
                "brand_identity": "OS_FAIL",
                "show_orange_border": True
            },
            "visual_assets": {
                "vehicle_display_query": "Error",
                "part_display_query": ""
            }
        }), 500


@app.route('/api/speak', methods=['POST'])
def speak():
    """Handle Text-to-Speech generation server-side."""
    data = request.get_json()

    if data is None:
        return jsonify({"error": "Invalid JSON data"}), 400

    text = data.get('text', '')
    if not text:
        return jsonify({"error": "Missing 'text' field"}), 400

    # Get API key from environment
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"error": "GEMINI_API_KEY not configured"}), 500

    try:
        # Configure the Gemini client
        client = genai.Client(api_key=api_key)

        # TTS model configuration
        tts_model = 'gemini-2.5-flash-preview-tts'

        # Generate speech
        response = client.models.generate_content(
            model=tts_model,
            contents=[{"parts": [{"text": text}]}],
            config={
                "response_modalities": ["AUDIO"],
                "speech_config": {
                    "voice_config": {
                        "prebuilt_voice_config": {
                            "voice_name": "Kore"
                        }
                    }
                }
            }
        )

        # Extract audio data from response
        audio_data = None
        try:
            candidate = response.candidates[0] if response.candidates else None
            if candidate and candidate.content and candidate.content.parts:
                inline_data = candidate.content.parts[0].inline_data
                if inline_data:
                    audio_data = inline_data.data
        except (IndexError, AttributeError):
            pass
        
        if audio_data:
            return jsonify({"audio": audio_data}), 200
        else:
            return jsonify({"error": "No audio data in response"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
