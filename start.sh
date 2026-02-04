#!/bin/bash

# EKA-AI Platform Startup Script
# This script starts both the Flask backend and React frontend for development

set -e

echo "🚀 Starting EKA-AI Platform..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: backend/.env file not found!${NC}"
    echo ""
    echo "   Please copy backend/.env.example to backend/.env and set your GEMINI_API_KEY"
    echo ""
    echo "   Example:"
    echo "   cp backend/.env.example backend/.env"
    echo "   # Then edit backend/.env and add your API key"
    echo ""
    exit 1
fi

# Check if Python dependencies are installed
echo "📦 Checking Python dependencies..."
if ! python3 -c "import flask" 2>/dev/null; then
    echo "Installing Python dependencies..."
    cd backend && pip install -r requirements.txt && cd ..
fi

# Check if Node dependencies are installed
echo "📦 Checking Node dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi

echo ""
echo -e "${GREEN}✅ All dependencies installed${NC}"
echo ""

# Start Flask backend in background
echo "🔧 Starting Flask backend on port 8001..."
cd backend
python3 app.py > /tmp/flask-backend.log 2>&1 &
FLASK_PID=$!
cd ..

# Give Flask time to start - retry health check
echo "⏳ Waiting for Flask backend to be ready..."
MAX_RETRIES=15
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Flask backend started successfully (PID: $FLASK_PID)${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}❌ Flask backend failed to start after $MAX_RETRIES attempts.${NC}"
        echo "   Check /tmp/flask-backend.log for details"
        kill $FLASK_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

echo ""
echo "🌐 Starting React frontend on port 3000..."
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  EKA-AI Platform is starting...${NC}"
echo -e "${GREEN}  Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}  Backend:  http://localhost:8001${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $FLASK_PID 2>/dev/null
    echo -e "${GREEN}✅ Shutdown complete${NC}"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Start React frontend (this will run in foreground)
npm run dev

# If npm exits, cleanup
cleanup
