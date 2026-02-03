# Testing Guide for Flask Backend Integration

## Testing Checklist

### 1. Backend Testing

#### Start the Flask Backend
```bash
cd server
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
python3 app.py
```

#### Test Health Endpoint
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "eka-ai-backend"
}
```

#### Test Chat Endpoint (with real API key)
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "history": [
      {"role": "user", "parts": [{"text": "Hello"}]}
    ],
    "context": {},
    "currentStatus": "CREATED",
    "intelMode": "FAST",
    "opMode": 0,
    "ekaConstitution": "Test constitution",
    "gstHsnRegistry": {}
  }'
```

### 2. Frontend Testing

#### Start the Frontend
```bash
# In project root directory
npm install
npm run dev
```

The frontend should connect to the backend at http://localhost:5000.

#### Test the Full Integration
1. Open http://localhost:3000 in your browser
2. Try sending a message in the chat
3. Verify the response comes from the Flask backend
4. Check browser console for any errors
5. Check Flask backend logs for request processing

### 3. Using the Startup Script

The easiest way to run both services:
```bash
./start.sh
```

This will:
1. Check dependencies
2. Start Flask backend on port 5000
3. Start React frontend on port 3000
4. Automatically shut down both when you exit

### 4. Security Verification

✅ **Security Improvements:**
- API key is no longer in the frontend code
- API key is stored only in server/.env (which is gitignored)
- All Gemini API calls go through the backend
- Frontend cannot access the API key

❌ **Before:**
- API key was in vite.config.ts and exposed in the browser
- Direct client-side calls to Gemini API
- API key visible in browser dev tools

### 5. Common Issues

#### Issue: "Connection refused" error
**Solution:** Make sure Flask backend is running on port 5000

#### Issue: "GEMINI_API_KEY not set"
**Solution:** Create server/.env file with your API key

#### Issue: CORS errors
**Solution:** flask-cors is already configured - check if backend is running

#### Issue: 404 on API endpoints
**Solution:** Verify backend URL in frontend (VITE_BACKEND_URL)

### 6. Environment Configuration

**Backend (.env in server/):**
```
GEMINI_API_KEY=your_actual_api_key_here
PORT=5000
FLASK_ENV=development
```

**Frontend (.env.local in root - optional):**
```
VITE_BACKEND_URL=http://localhost:5000
```

If not set, frontend defaults to http://localhost:5000

## Manual Testing Checklist

- [ ] Flask backend starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Frontend loads at localhost:3000
- [ ] Chat messages are sent successfully
- [ ] Responses are received from backend
- [ ] TTS (text-to-speech) works if tested
- [ ] No API key exposed in browser dev tools
- [ ] No CORS errors in browser console
- [ ] Flask backend logs show incoming requests
- [ ] Error handling works (test with invalid input)

## Production Deployment Notes

For production deployment:
1. Use gunicorn instead of Flask dev server:
   ```bash
   cd server
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

2. Set proper environment variables
3. Use HTTPS for all connections
4. Configure proper CORS origins (not *)
5. Add rate limiting and authentication as needed
