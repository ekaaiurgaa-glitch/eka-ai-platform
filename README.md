# 🚀 EKA-AI Platform

**Governed Automobile Intelligence System**  
**Go4Garage Private Limited**

[![Production Ready](https://img.shields.io/badge/status-production%20ready-success)](https://github.com/ekaaiurgaa-glitch/eka-ai-platform)
[![Firebase](https://img.shields.io/badge/deploy-Firebase-orange)](https://console.firebase.google.com)
[![Tests](https://img.shields.io/badge/tests-25%2F25%20passing-success)](./docs/verify-production.sh)

---

## 📋 Quick Start

### Deploy to Firebase Studio

```bash
npm install
npm run build
```

Then upload `dist/` folder to [Firebase Console](https://console.firebase.google.com)

### Deploy via CLI

```bash
npm install
npm run build
firebase deploy --only hosting
```

---

## 🏗️ Project Structure

```
eka-ai-platform/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   ├── pages/                   # Application pages
│   ├── services/                # API services
│   └── lib/                     # Utilities
├── backend/                      # Python backend
│   ├── services/                # Business logic
│   ├── database/                # SQL migrations
│   └── prompts/                 # AI system prompts
├── docs/                        # Documentation
├── firebase.json                # Firebase configuration
└── dist/                        # Build output (deploy this)
```

---

## 🔧 Tech Stack

**Frontend:** React 19 + TypeScript + Tailwind CSS + Vite  
**Backend:** Python (FastAPI) + PostgreSQL (Supabase)  
**Deployment:** Firebase Hosting + GitHub Actions  
**Monitoring:** Sentry

---

## 🎨 Design System

**3-Color Palette:**
- `#FFFFFF` - Backgrounds
- `#000000` - Text & Borders
- `#FF8C00` - Brand (Buttons, AI text)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Firebase Studio Guide](./docs/FIREBASE_STUDIO_CHECKLIST.md) | Step-by-step deployment |
| [Firebase Deployment](./docs/FIREBASE_DEPLOYMENT.md) | Complete Firebase guide |
| [Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md) | Code reference |
| [Production Checklist](./docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md) | Full audit |

---

## ⚙️ Environment Variables

Create `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://api.go4garage.com
VITE_SENTRY_DSN=https://your-sentry-dsn
```

See [.env.example](./.env.example) for complete list.

---

## ✅ Production Features

- ✅ 3-Color Design System
- ✅ Dual-Pane Login with Video Scroller
- ✅ AI Chat (Automobile-only)
- ✅ Job Card Workflow
- ✅ MG Fleet Management
- ✅ Invoice Generation (GST)
- ✅ Error Tracking (Sentry)
- ✅ Rate Limiting
- ✅ Health Monitoring

---

## 🚀 Deployment Status

**Production Readiness:** 100% ✅

All components tested and ready for deployment.

---

## 📞 Support

**Go4Garage Private Limited**
- Technical: tech@go4garage.com
- Support: support@go4garage.com

---

## 📄 License

© 2024 Go4Garage Private Limited. All rights reserved.

**EKA-AI - Governed Automobile Intelligence**
