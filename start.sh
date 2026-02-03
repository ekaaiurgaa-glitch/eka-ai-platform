#!/bin/bash

# Startup script for EKA-AI Platform
# This script starts both the Flask backend and React frontend

echo "🚀 Starting EKA-AI Platform..."
echo ""

# Check if .env exists in server directory
if [ ! -f "server/.env" ]; then
    echo "⚠️  Warning: server/.env file not found!"
    echo "   Please copy server/.env.example to server/.env and set your GEMINI_API_KEY"
    echo ""
    echo "   Example:"
    echo "   cd server"
    echo "   cp .env.example .env"
    echo "   # Then edit .env and add your API key"
    echo ""
    exit 1
fi

# Check if Python dependencies are installed
echo "📦 Checking Python dependencies..."
if ! python3 -c "import flask" 2>/dev/null; then
    echo "Installing Python dependencies..."
    cd server && pip install -r requirements.txt && cd ..
fi

# Check if Node dependencies are installed
echo "📦 Checking Node dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi

echo ""
echo "✅ All dependencies installed"
echo ""

# Start Flask backend in background
echo "🔧 Starting Flask backend on port 5000..."
cd server
python3 app.py > /tmp/flask-backend.log 2>&1 &
FLASK_PID=$!
cd ..

# Give Flask time to start - retry health check
echo "⏳ Waiting for Flask backend to be ready..."
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        echo "✅ Flask backend started successfully (PID: $FLASK_PID)"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "❌ Flask backend failed to start after $MAX_RETRIES attempts. Check /tmp/flask-backend.log for details"
        kill $FLASK_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

echo ""
echo "🌐 Starting React frontend on port 3000..."
echo ""

# Start React frontend (this will run in foreground)
npm run dev

# Cleanup: Kill Flask when React exits
echo ""
echo "🛑 Shutting down Flask backend..."
kill $FLASK_PID 2>/dev/null
echo "✅ Shutdown complete"
