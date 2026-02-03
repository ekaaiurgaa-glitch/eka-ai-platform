# Flask Backend Architecture

## Before (Insecure)
```
┌─────────────────────────────────────────┐
│         Browser / Client                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   React + TypeScript Frontend    │ │
│  │   (Port 3000)                    │ │
│  │                                  │ │
│  │  - geminiService.ts              │ │
│  │  - Direct Gemini API calls       │ │
│  │  - API key in vite.config.ts     │ │
│  │    (EXPOSED IN BROWSER! 🔓)     │ │
│  └───────────────────────────────────┘ │
│             │                           │
│             │ HTTPS                     │
│             ▼                           │
│  ┌───────────────────────────────────┐ │
│  │    Google Gemini API             │ │
│  │    (External Service)            │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘

❌ Security Issues:
- API key exposed in browser
- Visible in DevTools
- Can be extracted by users
- No rate limiting
- No request validation
```

## After (Secure)
```
┌─────────────────────────────────────────┐
│         Browser / Client                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   React + TypeScript Frontend    │ │
│  │   (Port 3000)                    │ │
│  │                                  │ │
│  │  - backendService.ts             │ │
│  │  - Calls Flask backend           │ │
│  │  - NO API key ✅                 │ │
│  └───────────────────────────────────┘ │
│             │                           │
│             │ HTTP (localhost)          │
│             │ or HTTPS (production)     │
└─────────────┼───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Server                          │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Flask Backend API              │ │
│  │   (Port 5000)                    │ │
│  │                                  │ │
│  │  - app.py                        │ │
│  │  - API key in .env 🔒           │ │
│  │  - Request validation            │ │
│  │  - Error handling                │ │
│  │                                  │ │
│  │  Endpoints:                      │ │
│  │  - GET  /health                  │ │
│  │  - POST /api/chat                │ │
│  │  - POST /api/tts                 │ │
│  └───────────────────────────────────┘ │
│             │                           │
│             │ HTTPS                     │
│             ▼                           │
│  ┌───────────────────────────────────┐ │
│  │    Google Gemini API             │ │
│  │    (External Service)            │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘

✅ Security Improvements:
- API key secure on server
- Never exposed to browser
- Request validation on server
- Proper error handling
- Can add rate limiting
- Can add authentication
- Production-ready with gunicorn
```

## Data Flow

### Chat Request Flow
```
1. User types message in browser
   │
   ▼
2. App.tsx calls backendService.sendMessage()
   │
   ▼
3. backendService makes POST to /api/chat
   │
   ▼
4. Flask app.py receives request
   │
   ▼
5. Flask validates and processes request
   │
   ▼
6. Flask calls Gemini API with server API key
   │
   ▼
7. Gemini processes and returns response
   │
   ▼
8. Flask formats and returns JSON
   │
   ▼
9. backendService receives response
   │
   ▼
10. App.tsx displays message to user
```

### TTS Request Flow
```
1. User clicks audio button
   │
   ▼
2. App.tsx calls backendService.generateSpeech()
   │
   ▼
3. backendService makes POST to /api/tts
   │
   ▼
4. Flask app.py receives text
   │
   ▼
5. Flask calls Gemini TTS API
   │
   ▼
6. Gemini returns audio data (base64)
   │
   ▼
7. Flask returns audio data
   │
   ▼
8. backendService decodes audio
   │
   ▼
9. App.tsx plays audio through AudioContext
```

## File Structure
```
eka-ai-platform/
├── App.tsx                      # Frontend main component
├── services/
│   ├── backendService.ts       # NEW: Backend API client
│   └── geminiService.ts        # OLD: Direct Gemini API (not used)
│
├── server/                      # NEW: Flask backend
│   ├── app.py                  # Flask application
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example           # Environment template
│   ├── .gitignore             # Python ignores
│   └── README.md              # Backend documentation
│
├── start.sh                    # NEW: Startup script
├── README.md                   # Updated: Setup instructions
├── TESTING.md                  # NEW: Testing guide
├── IMPLEMENTATION_SUMMARY.md   # NEW: Summary document
└── package.json               # Updated: Added scripts
```

## Environment Variables

### Server (.env)
```bash
GEMINI_API_KEY=your_actual_api_key_here  # 🔒 Secure
PORT=5000                                # Optional
FLASK_ENV=development                    # development/production
```

### Frontend (.env.local) - Optional
```bash
VITE_BACKEND_URL=http://localhost:5000   # Optional, defaults to localhost:5000
```

## Dependencies

### Backend (Python)
- Flask 3.1.0 - Web framework
- flask-cors 5.0.0 - CORS support
- google-genai 1.39.0 - Gemini API client
- python-dotenv 1.0.1 - Environment variables
- gunicorn 23.0.0 - Production WSGI server

### Frontend (Node.js)
- No new dependencies added
- Removed: API key from build config
- Removed: Direct Gemini API dependency

## Security Audit Results

✅ **CodeQL Scan**: 0 vulnerabilities
✅ **Dependency Check**: All clean
✅ **Code Review**: All issues addressed

## Production Checklist

- [ ] Set GEMINI_API_KEY in server .env
- [ ] Set FLASK_ENV=production
- [ ] Use gunicorn instead of Flask dev server
- [ ] Configure CORS for specific domains (not *)
- [ ] Add rate limiting middleware
- [ ] Add request logging
- [ ] Set up HTTPS/TLS
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Add health check monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure proper log rotation
- [ ] Add authentication if needed
