<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EKA-AI Platform

> A production-ready automobile intelligence platform powered by Google Gemini AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI/CD](https://github.com/ekaaiurgaa-glitch/eka-ai-platform/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/ekaaiurgaa-glitch/eka-ai-platform/actions)
[![CodeQL](https://github.com/ekaaiurgaa-glitch/eka-ai-platform/workflows/CodeQL/badge.svg)](https://github.com/ekaaiurgaa-glitch/eka-ai-platform/security/code-scanning)

EKA-AI is a single-agent automobile intelligence platform for Go4Garage Private Limited, providing expert diagnostics, service guidance, and intelligent automotive assistance.

View your app in AI Studio: https://ai.studio/apps/drive/1aF2sK92GDy8nDzLt1A4puNAqdSkMIIPf

## ✨ Features

- 🤖 **AI-Powered Diagnostics**: Intelligent vehicle problem analysis using Google Gemini
- 🔊 **Text-to-Speech**: Natural voice responses for hands-free operation
- 📊 **Real-time Telemetry**: Visual dashboard for vehicle metrics
- 🚗 **Multi-Vehicle Support**: Works with cars, bikes, and electric vehicles
- 🔒 **Secure by Design**: API keys stored server-side, never exposed to client
- 🐳 **Docker Ready**: Containerized deployment for easy scaling
- 📱 **Responsive UI**: Works seamlessly on desktop and mobile devices

## Architecture

The application consists of two main components:
- **Frontend**: React + TypeScript + Vite application (port 3000)
- **Backend**: Flask API server for Gemini integration (port 5000)

## Run Locally

**Prerequisites:**  Node.js and Python 3.8+

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Set the `GEMINI_API_KEY` in `.env` to your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

5. Start the Flask backend:
   ```bash
   python app.py
   ```
   The backend will run on http://localhost:5000

### Frontend Setup

1. From the root directory, install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Configure backend URL in `.env.local`:
   ```
   VITE_BACKEND_URL=http://localhost:5000
   ```
   If not set, defaults to `http://localhost:5000`

3. Run the frontend:
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:3000

## 🚀 Quick Start

### Using Docker (Recommended)

The fastest way to get started:

```bash
# Clone the repository
git clone https://github.com/ekaaiurgaa-glitch/eka-ai-platform.git
cd eka-ai-platform

# Set up your API key
cp server/.env.example server/.env
# Edit server/.env and add your GEMINI_API_KEY

# Run with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Using Startup Script

```bash
# Make script executable
chmod +x start.sh

# Run both services
./start.sh
```

The application will start:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT.md)** - Complete deployment instructions for production
- **[Architecture](ARCHITECTURE.md)** - System architecture and design decisions
- **[Security Policy](SECURITY.md)** - Security features and best practices
- **[Contributing](CONTRIBUTING.md)** - How to contribute to the project
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Testing Guide](TESTING.md)** - How to test the application
- **[Launch Checklist](LAUNCH_CHECKLIST.md)** - Pre-launch verification checklist

## 🛠️ Technology Stack

**Frontend:**
- React 19.2.4
- TypeScript 5.8.2
- Vite 6.2.0
- Recharts for visualizations
- Tailwind CSS

**Backend:**
- Flask 3.1.0
- Python 3.11+
- Google Gemini AI API
- Gunicorn for production

**DevOps:**
- Docker & Docker Compose
- GitHub Actions CI/CD
- Nginx reverse proxy
- CodeQL security scanning

## 🔒 Security

- ✅ **API Key Protection**: Gemini API key stored server-side only
- ✅ **Environment Variables**: All secrets in `.env` files (gitignored)
- ✅ **CORS Configuration**: Configurable cross-origin policies
- ✅ **Security Headers**: Production-ready HTTP security headers
- ✅ **Code Scanning**: Automated security analysis with CodeQL
- ✅ **Dependency Scanning**: Regular vulnerability checks

See [SECURITY.md](SECURITY.md) for detailed security information.

## 📦 Deployment Options

### Docker Deployment

```bash
# Production with nginx
docker-compose --profile prod up -d
```

### Cloud Platforms

- **Google Cloud Run**: One-command deployment
- **AWS ECS/EC2**: Full ECS task definitions included
- **Azure App Service**: Container-based deployment
- **Heroku**: Docker container support

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions for each platform.

## 🧪 Testing

```bash
# Backend tests
cd server
python -m pytest

# Frontend tests
npm test

# E2E tests
npm run test:e2e
```

## 📈 Monitoring

Configure monitoring and alerting:

- **Health Check**: `GET /health`
- **Metrics**: Integration with Prometheus/Grafana
- **Logging**: Structured JSON logs
- **Error Tracking**: Sentry integration ready

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powering the intelligence
- Go4Garage Private Limited for project sponsorship
- All contributors who have helped shape this project

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ekaaiurgaa-glitch/eka-ai-platform/issues)
- **Security**: See [SECURITY.md](SECURITY.md) for vulnerability reporting
- **Documentation**: Check our [docs](DEPLOYMENT.md) for detailed guides

---

**Built with ❤️ for the automotive industry**
