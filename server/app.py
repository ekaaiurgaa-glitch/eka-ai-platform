from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import datetime

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


if __name__ == '__main__':
    app.run(port=5000, debug=True)
