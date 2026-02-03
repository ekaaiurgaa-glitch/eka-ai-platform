# Deployment Guide

This guide covers various deployment options for the EKA-AI Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Deployment](#local-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Cloud Platforms](#cloud-platforms)
6. [Environment Configuration](#environment-configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

### Required Software

- **Node.js**: 18+ (for frontend)
- **Python**: 3.8+ (for backend)
- **Docker**: 20+ (optional, for containerized deployment)
- **Git**: Latest version

### Required API Keys

- **Google Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Local Deployment

### Quick Start

The fastest way to run locally:

```bash
# 1. Clone the repository
git clone https://github.com/ekaaiurgaa-glitch/eka-ai-platform.git
cd eka-ai-platform

# 2. Set up backend environment
cp server/.env.example server/.env
# Edit server/.env and add your GEMINI_API_KEY

# 3. Run with startup script
chmod +x start.sh
./start.sh
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Manual Setup

If you prefer to run services separately:

**Terminal 1 - Backend:**
```bash
cd server
pip install -r requirements.txt
python3 app.py
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

## Docker Deployment

### Development with Docker Compose

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production with Docker Compose

```bash
# Use production profile with nginx
docker-compose --profile prod up -d

# Stop services
docker-compose --profile prod down
```

### Single Container Deployment

```bash
# Build image
docker build -t eka-ai-platform .

# Run container
docker run -d \
  -p 5000:5000 \
  -e GEMINI_API_KEY=your_api_key_here \
  -e FLASK_ENV=production \
  --name eka-ai \
  eka-ai-platform

# Check status
docker ps
docker logs eka-ai

# Stop container
docker stop eka-ai
docker rm eka-ai
```

## Production Deployment

### Step 1: Server Setup

**For Ubuntu/Debian:**

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install dependencies
sudo apt-get install -y python3-pip python3-venv nginx git

# Create application user
sudo useradd -m -s /bin/bash eka-ai
sudo su - eka-ai

# Clone repository
git clone https://github.com/ekaaiurgaa-glitch/eka-ai-platform.git
cd eka-ai-platform
```

### Step 2: Backend Setup

```bash
# Create virtual environment
cd server
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
nano .env  # Add your GEMINI_API_KEY
```

### Step 3: Frontend Build

```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Build frontend
cd ..
npm install
npm run build
```

### Step 4: Systemd Service

Create `/etc/systemd/system/eka-ai.service`:

```ini
[Unit]
Description=EKA-AI Backend Service
After=network.target

[Service]
Type=simple
User=eka-ai
WorkingDirectory=/home/eka-ai/eka-ai-platform/server
Environment="PATH=/home/eka-ai/eka-ai-platform/server/venv/bin"
EnvironmentFile=/home/eka-ai/eka-ai-platform/server/.env
ExecStart=/home/eka-ai/eka-ai-platform/server/venv/bin/gunicorn \
    --bind 127.0.0.1:5000 \
    --workers 4 \
    --timeout 120 \
    --access-logfile /var/log/eka-ai/access.log \
    --error-logfile /var/log/eka-ai/error.log \
    app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start service:

```bash
sudo mkdir -p /var/log/eka-ai
sudo chown eka-ai:eka-ai /var/log/eka-ai
sudo systemctl daemon-reload
sudo systemctl enable eka-ai
sudo systemctl start eka-ai
sudo systemctl status eka-ai
```

### Step 5: Nginx Configuration

Create `/etc/nginx/sites-available/eka-ai`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Frontend
    location / {
        root /home/eka-ai/eka-ai-platform/dist;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:5000;
        access_log off;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        root /home/eka-ai/eka-ai-platform/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/eka-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: SSL/TLS Setup (Certbot)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

## Cloud Platforms

### Google Cloud Platform (Cloud Run)

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/eka-ai

# Deploy to Cloud Run
gcloud run deploy eka-ai \
  --image gcr.io/PROJECT_ID/eka-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key
```

### AWS (EC2 + ECS)

**EC2 Deployment:**
Follow the [Production Deployment](#production-deployment) steps on your EC2 instance.

**ECS Deployment:**
```bash
# Push image to ECR
aws ecr create-repository --repository-name eka-ai
docker tag eka-ai-platform:latest ACCOUNT.dkr.ecr.REGION.amazonaws.com/eka-ai:latest
docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/eka-ai:latest

# Create ECS task definition and service
# (Use AWS Console or CLI)
```

### Azure (App Service)

```bash
# Create resource group
az group create --name eka-ai-rg --location eastus

# Create App Service plan
az appservice plan create --name eka-ai-plan --resource-group eka-ai-rg --sku B1 --is-linux

# Deploy container
az webapp create --resource-group eka-ai-rg --plan eka-ai-plan --name eka-ai --deployment-container-image-name eka-ai-platform:latest
```

### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create eka-ai-platform

# Set environment variables
heroku config:set GEMINI_API_KEY=your_key

# Deploy with Docker
heroku container:push web
heroku container:release web
```

## Environment Configuration

### Backend Environment Variables

Create `server/.env`:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
PORT=5000
FLASK_ENV=production
FLASK_DEBUG=0

# Logging (optional)
LOG_LEVEL=INFO
LOG_FILE=/var/log/eka-ai/app.log
```

### Frontend Environment Variables

Create `.env.local`:

```bash
# Backend API URL
VITE_BACKEND_URL=http://localhost:5000  # Development
# VITE_BACKEND_URL=https://api.your-domain.com  # Production
```

### Security Configuration

**Production Checklist:**

- [ ] Set `FLASK_ENV=production`
- [ ] Set `FLASK_DEBUG=0`
- [ ] Use strong API keys
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for specific origins
- [ ] Set up rate limiting
- [ ] Enable request logging
- [ ] Configure security headers
- [ ] Set up firewall rules
- [ ] Use environment-specific configurations

## Monitoring & Maintenance

### Health Checks

Test backend health:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "eka-ai-backend"
}
```

### Logging

**View application logs:**
```bash
# Systemd service logs
sudo journalctl -u eka-ai -f

# Direct log files
tail -f /var/log/eka-ai/access.log
tail -f /var/log/eka-ai/error.log

# Docker logs
docker logs -f eka-ai
```

### Monitoring Tools

**Recommended:**
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Performance**: New Relic, DataDog
- **Logs**: ELK Stack, Splunk

### Backup Strategy

**What to backup:**
- Environment variables (`.env` files)
- Database (if added in future)
- Configuration files
- SSL certificates

**Backup script:**
```bash
#!/bin/bash
BACKUP_DIR="/backup/eka-ai-$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
cp server/.env $BACKUP_DIR/
tar -czf $BACKUP_DIR/config.tar.gz /etc/nginx/sites-available/eka-ai
```

### Updates and Maintenance

**Update application:**
```bash
cd /home/eka-ai/eka-ai-platform
git pull origin main
npm install
npm run build
cd server
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart eka-ai
```

**Security updates:**
```bash
# System updates
sudo apt-get update && sudo apt-get upgrade -y

# Python dependencies
pip install --upgrade -r requirements.txt

# Node dependencies
npm audit fix
```

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check GEMINI_API_KEY is set in `.env`
- Verify Python version (3.8+)
- Check port 5000 is available
- Review logs for errors

**Frontend can't connect to backend:**
- Verify backend is running on port 5000
- Check VITE_BACKEND_URL is correct
- Verify CORS configuration
- Check firewall rules

**Docker build fails:**
- Ensure Docker version is 20+
- Check internet connection for dependencies
- Verify Dockerfile syntax

**High memory usage:**
- Reduce gunicorn workers
- Check for memory leaks in application
- Monitor with `htop` or `docker stats`

### Performance Optimization

**Backend:**
- Increase gunicorn workers (recommended: 2-4 × CPU cores)
- Use caching (Redis) for repeated requests
- Optimize API calls to Gemini
- Enable gzip compression

**Frontend:**
- Enable production build optimizations
- Use CDN for static assets
- Enable browser caching
- Lazy load components

**Database (future):**
- Add connection pooling
- Use read replicas
- Enable query caching
- Regular index optimization

## Support

For issues and questions:
- GitHub Issues: https://github.com/ekaaiurgaa-glitch/eka-ai-platform/issues
- Documentation: README.md, ARCHITECTURE.md
- Security: See SECURITY.md

---

**Remember**: Always test in a staging environment before deploying to production!
