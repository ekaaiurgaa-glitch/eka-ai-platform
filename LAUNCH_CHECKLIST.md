# 🚀 EKA-AI MIDNIGHT LAUNCH CHECKLIST

## ⚠️ CRITICAL: MUST COMPLETE BEFORE LAUNCH

---

## ✅ PHASE 1: INFRASTRUCTURE (Need Your Action)

### 1.1 VPS Server Setup
- [ ] **Provision VPS** (Recommended: DigitalOcean/AWS/Linode)
  - Minimum specs: 4GB RAM, 2 vCPU, 80GB SSD
  - OS: Ubuntu 22.04 LTS
  - Estimated cost: $20-40/month

- [ ] **Domain Purchase**
  - Register domain: `app.eka-ai.com` or your preferred domain
  - Cost: ~$10-15/year
  - Point A record to VPS IP address

- [ ] **DNS Configuration**
  ```
  A Record: app.eka-ai.com → YOUR_VPS_IP
  A Record: www → YOUR_VPS_IP
  ```

### 1.2 SSL Certificate
- [ ] **Run SSL initialization on VPS:**
  ```bash
  cd /opt/eka-ai
  ./init-letsencrypt.sh
  ```

---

## 🔐 PHASE 2: PRODUCTION CREDENTIALS (Need Your Action)

### 2.1 PayU Payment Gateway (LIVE MODE)
- [ ] **Get Live Credentials from PayU Dashboard:**
  - Merchant Key: ___________________
  - Merchant Salt: ___________________
  - Update in: `backend/.env`

- [ ] **Configure PayU Webhook:**
  - Success URL: `https://your-domain.com/api/subscription/success`
  - Failure URL: `https://your-domain.com/api/subscription/failure`

### 2.2 Supabase Database
- [ ] **Verify Production Project:**
  - Project URL: ___________________
  - Service Role Key: ___________________
  - Anon Key: ___________________
  - Update in: `backend/.env`

- [ ] **Run SQL Migrations in Supabase Dashboard:**
  ```sql
  -- Run: backend/database/match_documents.sql
  -- Run: backend/database/migration_subscriptions.sql
  -- Run: backend/database/migration_subscriptions_safe.sql (if needed)
  ```

### 2.3 Communication Services
- [ ] **Resend (Email):**
  - API Key: ___________________
  - Verify domain in Resend dashboard
  - Update in: `backend/.env`

- [ ] **Interakt (WhatsApp):**
  - API Key: ___________________
  - Create templates in Meta Business Manager
  - Update in: `backend/.env`

### 2.4 AI Services
- [ ] **Gemini API:**
  - Production API Key: ___________________
  - Update in: `backend/.env`

---

## 🔧 PHASE 3: ENVIRONMENT CONFIGURATION (I Can Help)

### 3.1 Backend Environment
```bash
# File: backend/.env

# Already configured by me:
# - Secure JWT Secret (256-bit)
# - CORS origins
# - Feature flags
# - Timeouts

# YOU MUST UPDATE:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_KEY=your_anon_key_here

PAYU_MERCHANT_KEY=your_live_key
PAYU_MERCHANT_SALT=your_live_salt

RESEND_API_KEY=your_resend_key
INTERAKT_API_KEY=your_interakt_key

GEMINI_API_KEY=your_gemini_key

FRONTEND_URL=https://app.eka-ai.com
CORS_ORIGINS=https://app.eka-ai.com,https://www.eka-ai.com
```

### 3.2 Frontend Environment
```bash
# File: .env (root)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🧪 PHASE 4: TESTING (Critical Before Launch)

### 4.1 Payment Flow Test
- [ ] **Create test user account**
- [ ] **Login to application**
- [ ] **Navigate to Pricing page**
- [ ] **Click "Secure Payment with PayU"**
- [ ] **Complete ₹1 test transaction**
- [ ] **Verify PRO plan activated**

### 4.2 Core Features Test
- [ ] **User registration/login**
- [ ] **Create job card**
- [ ] **AI chat conversation**
- [ ] **Generate invoice**
- [ ] **Upload PDF (if RAG enabled)**

### 4.3 Security Test
- [ ] **Verify JWT authentication**
- [ ] **Test protected routes**
- [ ] **Check rate limiting**
- [ ] **Verify CORS headers**

---

## 📊 PHASE 5: MONITORING & BACKUPS (I Can Help)

### 5.1 Monitoring Setup
Already implemented by me:
- ✅ Health check endpoint: `/api/monitoring/health`
- ✅ Metrics endpoint: `/api/monitoring/metrics`
- ✅ Request tracking
- ✅ Error logging

### 5.2 Backup Configuration
Already implemented by me:
- ✅ Automated backup script: `scripts/backup_database.sh`
- ✅ Cron job setup (daily at 2 AM)
- ✅ 30-day retention policy

### 5.3 Admin Endpoints
Already implemented by me:
- ✅ `/api/admin/users` - List all users
- ✅ `/api/admin/subscriptions` - List all subscriptions
- ✅ `/api/monitoring/metrics` - System metrics

---

## 🌐 PHASE 6: DEPLOYMENT (I Can Help)

### 6.1 Run Deployment Script
```bash
# On your VPS:
ssh root@your-vps-ip

# Clone and deploy
git clone https://github.com/ekaaiurgaa-glitch/eka-ai-platform.git /opt/eka-ai
cd /opt/eka-ai
chmod +x deploy.sh
./deploy.sh
```

### 6.2 Verify Deployment
```bash
# Check status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test health
curl https://app.eka-ai.com/api/health
```

---

## 📋 FINAL VERIFICATION CHECKLIST

### Pre-Launch (T-2 Hours)
- [ ] All credentials updated in `.env` files
- [ ] Domain DNS propagated (check with `dig app.eka-ai.com`)
- [ ] SSL certificate installed
- [ ] Database migrations executed
- [ ] Test payment completed successfully

### Launch (T-0)
- [ ] Run deployment script
- [ ] Verify all containers running
- [ ] Test login flow
- [ ] Test payment flow
- [ ] Monitor error logs

### Post-Launch (T+1 Hour)
- [ ] Monitor server metrics
- [ ] Check for errors in logs
- [ ] Test all critical paths
- [ ] Announce launch

---

## 🚨 ROLLBACK PLAN

If something goes wrong:
```bash
# Quick rollback
cd /opt/eka-ai
docker-compose -f docker-compose.prod.yml down
git checkout previous-commit-hash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📞 EMERGENCY CONTACTS

- **Server Issues:** Check `docker-compose logs`
- **Payment Issues:** Check PayU dashboard
- **Database Issues:** Check Supabase dashboard

---

## ✅ SIGN-OFF

Before launching, confirm:
- [ ] All Phase 1 tasks completed
- [ ] All Phase 2 credentials provided
- [ ] All Phase 4 tests passed
- [ ] Rollback plan understood

**LAUNCH AUTHORIZED BY:** _________________ **DATE:** _________________
