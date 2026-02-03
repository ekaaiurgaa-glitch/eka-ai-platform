# EKA-AI Flask Backend

Flask backend server for the EKA-AI Gemini chatbot platform.

## Features

- Secure API key management (server-side only)
- Gemini AI chat integration
- Text-to-speech (TTS) support
- CORS enabled for frontend integration
- Health check endpoint

## Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Configuration**
   
   Copy `.env.example` to `.env` and set your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=5000
   FLASK_ENV=development
   ```

3. **Run the Server**
   
   Development mode:
   ```bash
   python app.py
   ```
   
   Production mode with Gunicorn:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

## API Endpoints

### Health Check
```
GET /health
```
Returns server health status.

### Chat
```
POST /api/chat
Content-Type: application/json

{
  "history": [...],
  "context": {...},
  "currentStatus": "CREATED",
  "intelMode": "FAST",
  "opMode": 0,
  "ekaConstitution": "...",
  "gstHsnRegistry": {...}
}
```
Processes chat messages through Gemini AI.

### Text-to-Speech
```
POST /api/tts
Content-Type: application/json

{
  "text": "Text to convert to speech"
}
```
Converts text to speech using Gemini TTS.

## Environment Variables

- `GEMINI_API_KEY` - Your Gemini API key (required)
- `PORT` - Server port (default: 5000)
- `FLASK_ENV` - Environment mode (development/production)

## Security

The API key is stored server-side only and never exposed to the client. All Gemini API calls are proxied through this backend.
