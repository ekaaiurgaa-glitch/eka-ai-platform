# EKA-AI Platform - Production Deployment Guide

> **Prerequisites**: You need ₹3,000-5,000 for initial setup (Domain + VPS for 1 month)

---

## 📋 Pre-Deployment Checklist

### Accounts You Need
- [ ] **Cloudflare** (Free) - For DNS management
- [ ] **DigitalOcean/AWS/GCP** - For VPS
- [ ] **Supabase** (Free tier) - Database already configured
- [ ] **PayU** - Payment gateway (Live account)
- [ ] **GitHub** - For code deployment

---

## Step 1: Buy Domain (₹500-800/year)

**Recommended registrars:**
- Cloudflare Registrar (₹600-800/year, no markup)
- GoDaddy India
- Namecheap

**Suggested domains:**
- `app.eka-ai.com`
- `app.eka-ai.in`
- `eka-ai.in`

---

## Step 2: Provision VPS (₹2,500-4,000/month)

### Option A: DigitalOcean (Recommended for beginners)
```bash
# Droplet specs:
- Type: Basic (Regular CPU)
- Plan: 4GB RAM / 2 vCPU / 80GB SSD
- OS: Ubuntu 22.04 (LTS) x64
- Datacenter: Bangalore (BLR1)
- Cost: ~$24/month (~₹2,000)
```

### Option B: AWS EC2
```bash
# Instance specs:
- Type: t3.medium
- vCPU: 2
- RAM: 4GB
- Storage: 80GB gp2
- Cost: ~$30/month (~₹2,500)
```

### Option C: Google Cloud Platform
```bash
# VM specs:
- Machine type: e2-medium
- vCPU: 2
- RAM: 4GB
- Boot disk: 80GB balanced PD
- Cost: ~$25/month (~₹2,100)
```

**After VPS creation:**
1. Note the public IP address
2. Add SSH key for authentication
3. Enable firewall (allow ports 22, 80, 443)

---

## Step 3: Configure DNS

### In Cloudflare (or your DNS provider):

**A Records:**
```
Type: A
Name: @
Content: YOUR_VPS_IP
TTL: Auto
Proxy status: DNS only (grey cloud)

Type: A
Name: app
Content: YOUR_VPS_IP
TTL: Auto
Proxy status: DNS only (grey cloud)
```

**CNAME Record:**
```
Type: CNAME
Name: www
Target: yourdomain.com
TTL: Auto
```

**Wait 5-10 minutes for DNS propagation.**

---

## Step 4: Deploy to VPS

### 4.1 Connect to VPS
```bash
ssh root@YOUR_VPS_IP
```

### 4.2 Clone Repository
```bash
cd /opt
git clone https://github.com/ekaaiurgaa-glitch/eka-ai-platform.git
cd eka-ai-platform
```

### 4.3 Run Setup Script
```bash
chmod +x setup-production.sh
./setup-production.sh
```

### 4.4 Configure Environment
```bash
nano backend/.env
```

**Update these values:**
```bash
# Replace with your actual domain
FRONTEND_URL=https://app.yourdomain.com
CORS_ORIGINS=https://app.yourdomain.com,https://www.yourdomain.com

# Add your PayU live credentials
PAYU_MERCHANT_KEY=YOUR_LIVE_KEY
PAYU_MERCHANT_SALT=YOUR_LIVE_SALT

# Add your Gemini API key
GEMINI_API_KEY=AIzaSy...
```

### 4.5 Deploy Database Schema
```bash
cd backend
python deploy_schema.py --env production
```

### 4.6 Setup SSL (Let's Encrypt)
```bash
# Edit init-letsencrypt.sh and update domains
nano init-letsencrypt.sh

# Change these lines:
domains=(app.yourdomain.com yourdomain.com)
rsa_key_size=4096
data_path="./certbot"
email="your-email@example.com"

# Run the script
sudo ./init-letsencrypt.sh
```

### 4.7 Start Application
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Step 5: Verify Deployment

### Check services:
```bash
# Check containers
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test health endpoint
curl https://app.yourdomain.com/api/health
```

### Expected response:
```json
{
  "status": "healthy",
  "service": "eka-ai-brain",
  "version": "4.5"
}
```

---

## Step 6: Initial Setup

### 6.1 Create First Admin User
```bash
# Via Supabase Dashboard:
# 1. Go to Authentication > Users
# 2. Click "Add User"
# 3. Enter admin email and password
# 4. Set role to "OWNER"
```

### 6.2 Create Workshop
```sql
-- Run in Supabase SQL Editor
INSERT INTO workshops (name, license_number, address, gstin, owner_id)
VALUES (
  'Main Workshop', 
  'MH12345', 
  'Your Address', 
  '27XXXXXXXXXXZ5',
  'your-user-uuid-here'
);
```

---

## Step 7: Post-Deployment

### Setup Monitoring
1. **Uptime Monitoring**: Create account at [healthchecks.io](https://healthchecks.io)
2. **Add to .env**: `HEALTHCHECKS_URL=https://hc-ping.com/your-uuid`
3. **Error Tracking**: Create Sentry account and add DSN to .env

### Setup Backups
```bash
# Add to crontab (runs daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /opt/eka-ai-platform/scripts/backup_database.sh
```

---

## 🚨 Troubleshooting

### Issue: "Cannot connect to server"
```bash
# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check Docker
sudo systemctl status docker
docker-compose -f docker-compose.prod.yml logs
```

### Issue: "SSL certificate not working"
```bash
# Check certbot logs
cat /var/log/letsencrypt/letsencrypt.log

# Re-run certbot
sudo certbot certonly --webroot -w /opt/eka-ai-platform/certbot/www -d app.yourdomain.com
```

### Issue: "Database connection failed"
```bash
# Verify Supabase credentials
nano backend/.env

# Test connection
python -c "from supabase import create_client; import os; c = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY')); print(c.table('workshops').select('*').limit(1).execute())"
```

---

## 📊 Monthly Cost Breakdown

| Service | Cost (₹) |
|---------|----------|
| Domain (.com) | ₹800/year |
| VPS (DigitalOcean 4GB) | ₹2,000/month |
| Supabase (Free tier) | ₹0 |
| Cloudflare (Free) | ₹0 |
| **Total** | **~₹2,100/month** |

---

## 🎯 Next Steps After Deployment

1. **Test Payment Flow**: Complete a ₹1 test transaction
2. **Configure Email**: Set up Resend for transactional emails
3. **Setup WhatsApp**: Apply for WhatsApp Business API
4. **Add Monitoring**: Connect Sentry and Healthchecks
5. **Load Testing**: Test with 100 concurrent users
6. **Documentation**: Create API docs for customers

---

## 📞 Support

If deployment fails:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Check GitHub Issues
3. Contact: support@eka-ai.com

---

**Estimated Time**: 2-4 hours for first deployment
