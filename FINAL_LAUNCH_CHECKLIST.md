# 🚀 EKA-AI Platform - Final Launch Checklist
# EC2 Target: 13.235.33.124

## ✅ Completed (Ready)

- [x] Frontend built (552KB JS, 82KB CSS)
- [x] Backend API (72 endpoints)
- [x] Database schema ready
- [x] CORS configured for production domains
- [x] AI governance (4-layer gates)
- [x] Legal pages with CIN/GSTIN
- [x] SEO meta tags and structured data
- [x] Deployment scripts ready

## ⏳ Pre-Launch (Do These Now)

### 1. DNS Setup (5 minutes)
```bash
# In AWS Route 53, create A record:
# app.eka-ai.in → 13.235.33.124
```

### 2. Environment Variables (10 minutes)
Edit `.env.production` and fill in:
- [ ] `DATABASE_URL` (Supabase connection string)
- [ ] `SUPABASE_KEY` (service role key)
- [ ] `JWT_SECRET` (run: openssl rand -base64 32)
- [ ] `GEMINI_API_KEY` (from Google AI Studio)
- [ ] `PAYU_MERCHANT_KEY` & `SALT`

### 3. SSH Key Setup (if not done)
```bash
chmod 600 ~/.ssh/eka-ai-key.pem
```

### 4. Deploy (5 minutes)
```bash
./deploy-to-ec2.sh ~/.ssh/eka-ai-key.pem
```

### 5. SSL Certificate (2 minutes)
```bash
ssh -i ~/.ssh/eka-ai-key.pem ubuntu@13.235.33.124
sudo ./init-letsencrypt.sh
```

## 🌐 Live URLs After Launch

| URL | Purpose |
|-----|---------|
| https://app.eka-ai.in | Main platform |
| https://app.eka-ai.in/login | Login page |
| https://go4garage.in | Company website |
| https://eka-ai.in | Product landing |

## 🔍 Post-Launch Verification

- [ ] Login works
- [ ] Dashboard loads with data
- [ ] Job cards CRUD works
- [ ] Invoices generate with GST
- [ ] AI chat responds
- [ ] PayU payment flows work
- [ ] SSL certificate valid (green lock)

## 📞 Support

- Server IP: 13.235.33.124
- SSH: `ssh -i ~/.ssh/eka-ai-key.pem ubuntu@13.235.33.124`
- Logs: `sudo docker-compose -f docker-compose.prod.yml logs -f`
