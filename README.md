<div align="center">

# EKA-AI Platform

### Governed Automobile Intelligence by Go4Garage Private Limited

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## 📋 Overview

EKA-AI is a **governed, audit-grade artificial intelligence platform** designed exclusively for the automobile ecosystem. It provides intelligent diagnostics, service management, and fleet governance capabilities.

### Key Features

- 🔧 **Intelligent Diagnostics** - AI-powered vehicle issue analysis and root cause identification
- 📋 **Digital Job Cards** - Structured workflow from intake to invoice
- 🚗 **Fleet Management** - Minimum Guarantee (MG) model for fleet operators
- 📊 **Visual Analytics** - Real-time metrics and telemetry dashboards
- 🔒 **Audit-Grade Compliance** - GST-compliant estimates with HSN codes

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **Python** 3.11 or higher
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/ekaaiurgaa-glitch/eka-ai-platform.git
cd eka-ai-platform

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### Configuration

1. **Frontend Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your GEMINI_API_KEY
   ```

2. **Backend Environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env and add your GEMINI_API_KEY
   ```

### Development

```bash
# Terminal 1: Start the backend
cd backend
python app.py

# Terminal 2: Start the frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001

---

## 🐳 Docker Deployment

### Production Build

```bash
# Build and run the production container
docker build -t eka-ai-platform .
docker run -p 8001:8001 -e GEMINI_API_KEY=your_key_here eka-ai-platform
```

### Using Docker Compose

```bash
# Set your API key
export GEMINI_API_KEY=your_key_here

# Run production build
docker-compose up -d

# Run development mode
docker-compose --profile dev up
```

---

## 📁 Project Structure

```
eka-ai-platform/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── services/           # API services
│   ├── styles/             # CSS styles
│   └── types/              # TypeScript type definitions
├── backend/                # Python Flask backend
│   ├── app.py              # Main Flask application
│   └── requirements.txt    # Python dependencies
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── Dockerfile              # Docker build configuration
└── docker-compose.yml      # Docker Compose configuration
```

---

## 🔧 Available Scripts

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Type-check with TypeScript |

### Backend

| Command | Description |
|---------|-------------|
| `python app.py` | Start Flask development server |
| `gunicorn app:flask_app` | Start production server |

---

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/chat` | POST | AI chat interface |
| `/api/speak` | POST | Text-to-speech synthesis |

---

## ⚙️ Environment Variables

### Frontend (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `VITE_API_URL` | Backend API URL | No (default: http://localhost:8001) |

### Backend (backend/.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `PORT` | Server port | No (default: 8001) |
| `FLASK_DEBUG` | Enable debug mode | No (default: false) |
| `CORS_ORIGINS` | Allowed CORS origins | No (default: *) |

---

## 🔐 Security

- API keys are never exposed to the frontend
- All AI processing happens server-side
- CORS is configurable for production deployments
- No sensitive data is logged

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🏢 About Go4Garage

Go4Garage Private Limited is the creator and maintainer of EKA-AI, providing innovative solutions for the automobile service industry.

---

<div align="center">

**Built with ❤️ by Go4Garage Private Limited**

</div>
