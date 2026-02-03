from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os

# Initialize Flask app with correct folder paths
app = Flask(__name__, static_folder='../dist', static_url_path='/')

# Configure CORS - in production, set CORS_ORIGINS environment variable
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
CORS(app, origins=cors_origins)


@app.route('/health')
def health():
    """Health check endpoint for deployment verification."""
    return jsonify({'status': 'healthy', 'service': 'eka-ai-platform'})


@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages (placeholder for future implementation)."""
    data = request.get_json()
    if data is None:
        return jsonify({'error': 'Invalid JSON payload'}), 400
    # Placeholder response - actual AI integration would go here
    return jsonify({
        'response_content': {
            'visual_text': 'Backend chat endpoint ready.',
            'audio_text': 'Backend chat endpoint ready.'
        },
        'job_status_update': 'CREATED',
        'ui_triggers': {
            'theme_color': '#f18a22',
            'brand_identity': 'EKA',
            'show_orange_border': False
        },
        'visual_assets': {
            'vehicle_display_query': '',
            'part_display_query': ''
        }
    })


@app.route('/api/speak', methods=['POST'])
def speak():
    """Handle text-to-speech requests (placeholder for future implementation)."""
    data = request.get_json()
    if data is None:
        return jsonify({'error': 'Invalid JSON payload'}), 400
    # Placeholder response - actual TTS integration would go here
    return jsonify({'audio_data': None, 'message': 'TTS endpoint ready'})


@app.route('/api/job-cards', methods=['GET', 'POST'])
def job_cards():
    """Handle job cards CRUD operations (placeholder for future implementation)."""
    if request.method == 'GET':
        # Return empty list as placeholder
        return jsonify([])
    elif request.method == 'POST':
        data = request.get_json()
        if data is None:
            return jsonify({'error': 'Invalid JSON payload'}), 400
        # Placeholder - would save to database
        return jsonify({'status': 'created', 'data': data})


# Catch-all route to serve React app for SPA routing
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_file_path = os.path.join(app.static_folder, path)
    if path != "" and os.path.exists(static_file_path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
