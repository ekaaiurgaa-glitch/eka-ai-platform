# Local Machine Deployment Guide

Since SSH from GitHub Codespace is being blocked by AWS Security Group,
deploy from your local machine where SSH works.

## Prerequisites
- Node.js 18+ and npm
- Your SSH key (eka.pem)
- AWS EC2 instance accessible via SSH

## Step-by-Step Deployment

### 1. Clone Repository (On Your Local Machine)

```bash
git clone https://github.com/ekaaiurgaa-glitch/eka-ai-platform.git
cd eka-ai-platform
```

### 2. Copy Environment Variables

Create `backend/.env` with this content:

```env
# AI Services
GEMINI_API_KEY=AIzaSyCO_BKzvmeqk6Gjeui-9f4EGe1uf9k06KA
GEMINI_MODEL=gemini-2.0-flash
KIMI_API_KEY=sk-kimi-RugeLQmanL1E3zKxoBwvwl5U6BidWI1RRStIEuQgLhbAV5DVMILhpDtgVhylYweI
AWS_BEDROCK_ACCESS_KEY=ABSKQmVkcm9ja0FQSUtleS0xMXB2LWF0LTY3NTAwMzY4Mjg5MzpiRC9uc2FyQnN0YmlOUDgwdndMN29kSWtUV3pSM2JqZlJnSTZmbFdueUNQYzJSNHd1ZmV4WHRDRi85TT0=
AWS_REGION=ap-south-1

# Database (Supabase)
SUPABASE_URL=https://gymkrbjujghwvphessns.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bWtyYmp1amdod3ZwaGVzc25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyOTQzMCwiZXhwIjoyMDg1NzA1NDMwfQ.D_ENSCvPh_KVtIanESCe2tYYNNF_mhTgrHnudfJWqWI
DATABASE_URL=postgresql://postgres.gymkrbjujghwvphessns@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require

# Security
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# CORS & Frontend
FRONTEND_URL=https://app.eka-ai.in
CORS_ORIGINS=https://app.eka-ai.in,https://www.eka-ai.in,https://go4garage.in

# Payment Gateway (PayU LIVE)
PAYU_MERCHANT_KEY=QmHDwA
PAYU_MERCHANT_SALT=BxwsyDpFd7JJgn1D3ja6xvfjeMpq5xtX
PAYU_BASE_URL=https://secure.payu.in
PAYU_MODE=live

# Company Information
COMPANY_CIN=U34300UP2021PTC145107
COMPANY_GSTIN=10AAICG9768N1ZZ
COMPANY_NAME=Go4Garage Private Limited
COMPANY_EMAIL=legal@go4garage.in

# Server Configuration
PORT=5000
HOST=0.0.0.0
DEBUG=False
ENVIRONMENT=production
```

### 3. Build and Package

```bash
npm install
npm run build
tar -czf deploy.tar.gz dist/ backend/ nginx/ docker-compose.prod.yml \
    Dockerfile init-letsencrypt.sh backend/.env
```

### 4. Upload to EC2

```bash
scp -i /path/to/eka.pem deploy.tar.gz ubuntu@13.235.33.124:/home/ubuntu/
```

### 5. Deploy on EC2

```bash
ssh -i /path/to/eka.pem ubuntu@13.235.33.124
```

Once logged in:

```bash
cd /home/ubuntu
tar -xzf deploy.tar.gz

# Install Docker if not present
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# Deploy
sudo docker-compose -f docker-compose.prod.yml up -d --build

# Check status
sudo docker-compose -f docker-compose.prod.yml ps

# Setup SSL (after DNS propagation)
sudo ./init-letsencrypt.sh
```

### 6. Verify Deployment

```bash
# Test health endpoint
curl http://13.235.33.124/api/health

# Check logs
sudo docker-compose -f docker-compose.prod.yml logs -f
```

## URLs After Deployment

- http://13.235.33.124 (immediate)
- http://app.eka-ai.in (after DNS propagation)
- https://app.eka-ai.in (after SSL setup)

## Troubleshooting

If deployment fails:
1. Check Docker logs: `sudo docker logs eka_backend_prod`
2. Verify environment variables: `cat backend/.env`
3. Restart services: `sudo docker-compose restart`
