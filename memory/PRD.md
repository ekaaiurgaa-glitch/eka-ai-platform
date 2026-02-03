# EKA-AI Platform PRD

## Original Problem Statement
Deploy a monorepo as a single Web Service:
- React Frontend compiles into static dist folder
- Flask Backend serves static files alongside the API
- Build Command: `npm install && npm run build && pip install -r server/requirements.txt`
- Start Command: `gunicorn -b 0.0.0.0:8000 server.app:app`

## Architecture
- **Frontend**: React 19 with TypeScript, Vite bundler, Tailwind CSS
- **Backend**: Flask with ASGI wrapper (for uvicorn compatibility)
- **AI Integration**: Google Gemini API for chat and speech
- **Static Serving**: Flask serves built React app from `/dist` folder

## User Personas
1. **Automobile Technicians** - Use EKA-AI for diagnostics and service guidance
2. **Service Managers** - Monitor compliance, estimates, and governance
3. **Fleet Operators** - Track vehicle telemetry and service history

## Core Requirements (Static)
- AI-powered automobile diagnostics chat
- Job status management with governance
- Compliance tracking (HSN codes, GST rates)
- Real-time telemetry dashboard
- Text-to-speech for audio responses

## What's Been Implemented (Jan 2026)
- ✅ Flask backend with ASGI wrapper for uvicorn
- ✅ Static file serving from /dist folder
- ✅ /api/health endpoint
- ✅ /api/chat endpoint with Gemini AI integration
- ✅ /api/speak endpoint for text-to-speech
- ✅ React frontend built and bundled
- ✅ CORS configuration
- ✅ Environment variables setup

## Known Limitations
- Gemini API free tier quota limits may cause 429 errors
- Audio generation requires Gemini API plan with audio support

## Prioritized Backlog
### P0 (Critical)
- None (core functionality complete)

### P1 (Important)
- Upgrade Gemini API plan for production usage
- Implement rate limiting for API calls
- Add caching for repeated queries

### P2 (Nice to Have)
- PostgreSQL database integration for persistent storage
- User authentication system
- Webhook notifications for job status changes

## Next Tasks
1. Deploy to production environment
2. Configure production Gemini API key
3. Set up monitoring and logging
4. Implement database for session persistence
