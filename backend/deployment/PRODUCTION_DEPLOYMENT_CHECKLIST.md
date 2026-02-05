# EKA-AI Production Deployment Checklist

## Pre-Deployment Verification

### 1. Code Verification
- [ ] All tests passing (33/33)
- [ ] Code review completed
- [ ] No hardcoded secrets in code
- [ ] Environment variables documented

### 2. Database Preparation
- [ ] Run `schema_complete.sql` in production Supabase
- [ ] Verify all RLS policies enabled
- [ ] Create initial workshop record
- [ ] Create admin user profile
- [ ] Test database connections

### 3. Environment Configuration

Create `/opt/eka-ai/.env.production`:

```bash
# Application
FLASK_ENV=production
PORT=8001

# Security
JWT_SECRET=<generate-strong-secret>
CORS_ORIGINS=https://eka-ai.go4garage.in,https://admin.go4garage.in

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>

# AI APIs
GEMINI_API_KEY=<gemini-key>
ANTHROPIC_API_KEY=<anthropic-key>

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379/0

# Monitoring
SENTRY_DSN=<sentry-dsn>
DD_API_KEY=<datadog-key>
```

## Deployment Steps

### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3-pip python3-venv nginx redis-server

# Create application directory
sudo mkdir -p /opt/eka-ai
sudo chown $USER:$USER /opt/eka-ai

# Clone repository
git clone https://github.com/ekaaiurgaa-glitch/eka-ai-platform.git /opt/eka-ai

# Create virtual environment
cd /opt/eka-ai/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 2: SSL Configuration

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d eka-ai.go4garage.in

# Verify auto-renewal
sudo certbot renew --dry-run
```

### Step 3: Application Configuration

```bash
# Copy environment file
cp /opt/eka-ai/backend/.env.example /opt/eka-ai/backend/.env.production
nano /opt/eka-ai/backend/.env.production  # Edit with production values

# Run database migrations
# Execute schema_complete.sql in Supabase SQL Editor
```

### Step 4: Systemd Service

Create `/etc/systemd/system/eka-ai.service`:

```ini
[Unit]
Description=EKA-AI Backend Service
After=network.target redis.service

[Service]
Type=simple
User=eka-ai
Group=eka-ai
WorkingDirectory=/opt/eka-ai/backend
Environment=PATH=/opt/eka-ai/backend/venv/bin
EnvironmentFile=/opt/eka-ai/backend/.env.production
ExecStart=/opt/eka-ai/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:8001 wsgi:flask_app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable eka-ai
sudo systemctl start eka-ai
sudo systemctl status eka-ai
```

### Step 5: Nginx Configuration

Create `/etc/nginx/sites-available/eka-ai`:

```nginx
upstream eka_ai_backend {
    server 127.0.0.1:8001;
    keepalive 32;
}

server {
    listen 80;
    server_name eka-ai.go4garage.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name eka-ai.go4garage.in;

    # SSL
    ssl_certificate /etc/letsencrypt/live/eka-ai.go4garage.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eka-ai.go4garage.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Logging
    access_log /var/log/nginx/eka-ai-access.log;
    error_log /var/log/nginx/eka-ai-error.log;

    # API proxy
    location /api {
        proxy_pass http://eka_ai_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # Static files
    location / {
        root /opt/eka-ai/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/eka-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Database Backup Setup

```bash
# Install AWS CLI
pip install awscli
aws configure

# Set up backup script
sudo mkdir -p /opt/eka-ai/scripts /opt/eka-ai/backups
sudo cp /opt/eka-ai/backend/deployment/backup.py /opt/eka-ai/scripts/
sudo chmod +x /opt/eka-ai/scripts/backup.py

# Add to crontab
sudo crontab -e
# Add: 0 3 * * * /opt/eka-ai/scripts/backup.py >> /var/log/eka-ai-backup.log 2>&1
```

### Step 7: Monitoring Setup

```bash
# Install DataDog agent (optional)
DD_API_KEY=your-key bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Configure log monitoring
sudo mkdir -p /etc/datadog-agent/conf.d/eka-ai.d
cat <<EOF | sudo tee /etc/datadog-agent/conf.d/eka-ai.d/conf.yaml
logs:
  - type: file
    path: /var/log/eka-ai/app.log
    service: eka-ai
    source: python
EOF

sudo systemctl restart datadog-agent
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Test health endpoint
curl https://eka-ai.go4garage.in/api/health

# Expected response:
# {"status":"healthy","service":"eka-ai-brain","version":"4.5",...}
```

### 2. SSL Verification

```bash
# Check SSL certificate
curl -vI https://eka-ai.go4garage.in 2>&1 | grep -E "(SSL|TLS|certificate)"

# SSL Labs test
# https://www.ssllabs.com/ssltest/analyze.html?d=eka-ai.go4garage.in
```

### 3. Load Testing

```bash
cd /opt/eka-ai/backend/load-tests

# Quick smoke test
python load_test.py --endpoint /api/health --users 10 --duration 30

# Full load test
python load_test.py --all --users 50 --duration 300 --token <jwt-token>
```

### 4. End-to-End Testing

```bash
# Test complete job card flow
1. Create job card via UI
2. Upload PDI evidence
3. Generate approval link
4. Approve via link
5. Generate invoice
6. Verify MG calculation
```

## Rollback Plan

If deployment fails:

```bash
# 1. Stop new service
sudo systemctl stop eka-ai

# 2. Switch to previous version
cd /opt/eka-ai
git checkout <previous-commit>

# 3. Restart with old version
sudo systemctl start eka-ai

# 4. Verify rollback
curl https://eka-ai.go4garage.in/api/health
```

## Monitoring Checklist

### Application Metrics
- [ ] Response time P95 < 2s
- [ ] Error rate < 1%
- [ ] CPU usage < 70%
- [ ] Memory usage < 80%
- [ ] Database connections < 80% of max

### Business Metrics
- [ ] Job cards created per hour
- [ ] MG calculations completed
- [ ] Invoices generated
- [ ] AI response accuracy

### Infrastructure Metrics
- [ ] SSL certificate expiry > 30 days
- [ ] Backup completion daily
- [ ] Disk usage < 80%
- [ ] Log rotation working

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| CTO | | | |
| DevOps Lead | | | |
| QA Lead | | | |
| Security Officer | | | |

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Version:** 4.5
**Status:** PRODUCTION READY ✅
