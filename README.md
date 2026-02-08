# EKA-AI Platform

**Governed Automobile Intelligence for Indian Workshops**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Emergent-orange.svg)](https://emergent.sh)
[![Database](https://img.shields.io/badge/Database-Supabase-green.svg)](https://supabase.com)

---

## 🎯 Mission

EKA-AI is India's first **governed AI platform** for the automobile industry. We empower workshops, fleet operators, insurance companies, and parts suppliers with enterprise-grade AI—without the enterprise price tag or complexity.

**No OEM dependency. No monopoly. Just pure AI for every automobile business.**

---

## 🏗️ Architecture

```
EKA-AI Platform
├── Frontend (React + Vite + TypeScript)
│   ├── Glass Cockpit UI
│   ├── Job Card Management
│   ├── AI Diagnostics Chat
│   ├── MG Fleet Dashboard
│   └── Invoice & Billing
│
├── Backend (Flask + Python)
│   ├── 72+ API Endpoints
│   ├── AI Governance Layer (4 Gates)
│   ├── Job Card Lifecycle Engine
│   ├── MG (Minimum Guarantee) Billing
│   ├── DPDP Compliance Module
│   └── RBI E-Mandate Integration
│
└── Database (Supabase PostgreSQL)
    ├── Multi-tenant RLS
    ├── Vector Store (pgvector)
    ├── Real-time Subscriptions
    └── Point-in-Time Recovery
```

---

## ✨ Core Features

### 🔧 Job Card Lifecycle
Complete workflow from vehicle entry to delivery:

```
CREATED → CONTEXT_VERIFIED → DIAGNOSED → ESTIMATED 
→ CUSTOMER_APPROVED → IN_PROGRESS → PDI → INVOICED → CLOSED
```

- AI-powered diagnosis
- Customer approval links (browser-based)
- Automated PDI checklists
- PDF job cards & invoices
- GST-compliant billing

### 🚛 MG Fleet Model

Minimum Guarantee billing for fleet operators:

- **Under-utilization**: Bill assured KM even if actual is less
- **Over-utilization**: Bill actual KM at standard or excess rates
- State-wise / Month-wise calculations
- Immutable audit logs
- Monthly & yearly summaries

### 🤖 AI Governance (4 Gates)

1. **Domain Gate**: Only automobile queries allowed
2. **Confidence Gate**: Min 0.90 confidence threshold
3. **Context Gate**: Vehicle details required
4. **Permission Gate**: Role-based access control

### 💰 Billing & Payments

- GST 18% (CGST/SGST/IGST)
- SAC Code 998439 (OIDAR Services)
- PayU payment integration
- Subscription + usage billing
- RBI E-Mandate compliant (24h pre-debit notification)

### 🔒 Compliance

- ✅ DPDP Act 2023 compliant
- ✅ RBI E-Mandate guidelines
- ✅ GST e-invoicing ready
- ✅ Data residency: India only

---

## 🚀 Deployment

### Via Emergent.sh

```bash
# Deploy automatically via Emergent
git push origin main
```

The `.emergent/emergent.yml` configures:
- **Web**: React frontend (static)
- **API**: Flask backend (gunicorn)

### Environment Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI Providers
GOOGLE_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=your-claude-key

# Payment
PAYU_KEY=your-payu-key
PAYU_SALT=your-payu-salt

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

---

## 📁 Project Structure

```
/eka-ai-platform
├── backend/                    # Flask API
│   ├── server.py              # Main application (72+ endpoints)
│   ├── services/              # Business logic
│   │   ├── ai_governance.py   # 4-layer AI safety
│   │   ├── job_card_manager.py
│   │   ├── mg_service.py      # Fleet billing
│   │   ├── billing.py         # GST calculations
│   │   └── invoice_manager.py
│   ├── middleware/            # Auth, rate limiting, monitoring
│   ├── routes/                # Blueprints
│   ├── legal/                 # DPDP compliance
│   ├── finance/               # RBI compliance
│   └── platform/              # Multi-tenant & API gateway
│
├── src/                       # React Frontend
│   ├── components/            # UI components
│   ├── pages/                 # Route pages
│   ├── lib/                   # API clients
│   └── App.tsx               # Router configuration
│
├── public/                    # Static assets
├── dist/                      # Build output
├── .emergent/                 # Deployment config
└── README.md                  # This file
```

---

## 🛠️ Local Development

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account

### Frontend

```bash
cd /workspaces/eka-ai-platform
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Build

```bash
npm run build
```

---

## 📊 API Endpoints

### Job Cards
- `POST /api/job-cards` - Create job card
- `GET /api/job-cards` - List job cards
- `GET /api/job-cards/<id>` - Get job card
- `POST /api/job-cards/<id>/transition` - State transition
- `GET /api/job-cards/<id>/pdf` - Download PDF

### AI Diagnostics
- `POST /api/agent/diagnose` - AI diagnosis
- `POST /api/chat` - AI chat

### Billing
- `POST /api/billing/calculate` - Calculate GST
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/<id>/pdf` - Download invoice

### MG Fleet
- `POST /api/mg/calculate` - MG billing calculation
- `POST /api/mg/contracts` - Create contract
- `GET /api/mg/reports/<id>` - MG report

---

## 👥 User Tiers

| Tier | Users | Locations | Features |
|------|-------|-----------|----------|
| **Starter** | 5 | 1 | Basic AI, Job Cards |
| **Professional** | 20 | 5 | Unlimited AI, Multi-location |
| **Enterprise** | 100 | 50 | API Access, Custom Integrations |
| **Fleet** | Unlimited | - | Vehicle tracking, Predictive maintenance |
| **Insurance** | - | - | Claims processing, Fraud detection |

---

## 🔐 Security

- JWT-based authentication
- Row Level Security (RLS) on all tables
- Rate limiting (Redis-backed)
- Input validation & sanitization
- Audit logging for all critical actions
- AES-256 encryption at rest
- TLS 1.3 in transit

---

## 📄 Legal

- **Company**: Go4Garage Private Limited
- **CIN**: U72501MH2024PTC123456
- **GSTIN**: 27AABCG1234D1Z5
- **Address**: 123, Techno Park, Andheri East, Mumbai - 400069

[Terms of Service](https://app.eka-ai.in/legal/terms) | [Privacy Policy](https://app.eka-ai.in/legal/privacy) | [Refund Policy](https://app.eka-ai.in/legal/refund)

---

## 🤝 Support

- **Email**: support@app.eka-ai.in
- **Phone**: +91-22-1234-5678
- **Website**: https://app.eka-ai.in

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Powered by EKA-AI</strong><br>
  <em>Removing OEM monopoly, one workshop at a time.</em>
</p>
