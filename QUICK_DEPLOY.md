# 🚀 Quick Deployment Guide

## Prerequisites

You need your AWS EC2 SSH key file (`.pem`). Download it from:
- AWS Console → EC2 → Instances → Connect → SSH Client

## Option 1: Upload Key to Codespace

1. Download your `.pem` file locally
2. Upload to codespace:
   ```bash
   # In your local terminal
   scp -i your-key.pem your-key.pem codespace@your-codespace-url:/home/codespace/.ssh/eka-ai-key.pem
   ```

3. Set permissions and deploy:
   ```bash
   chmod 600 ~/.ssh/eka-ai-key.pem
   ./DEPLOY_NOW.sh ~/.ssh/eka-ai-key.pem
   ```

## Option 2: Manual Deployment Steps

### Step 1: Create deployment package locally
```bash
# On your local machine with the code
npm run build
tar -czf deploy.tar.gz dist/ backend/ nginx/ docker-compose.prod.yml Dockerfile init-letsencrypt.sh .env.production
```

### Step 2: Upload to EC2
```bash
scp -i your-key.pem deploy.tar.gz ubuntu@13.235.33.124:/home/ubuntu/
```

### Step 3: SSH and deploy
```bash
ssh -i your-key.pem ubuntu@13.235.33.124
cd /home/ubuntu
tar -xzf deploy.tar.gz
mv .env.production backend/.env
sudo docker-compose -f docker-compose.prod.yml up -d --build
```

### Step 4: Setup SSL
```bash
ssh -i your-key.pem ubuntu@13.235.33.124
sudo ./init-letsencrypt.sh
```

## Option 3: AWS Systems Manager (If key is lost)

If you lost the key, use AWS Systems Manager Session Manager:
```bash
# Install AWS CLI and Session Manager plugin
aws ssm start-session --target i-your-instance-id
```

Then run deployment commands directly on the instance.

---

## Post-Deployment URLs

| URL | Status |
|-----|--------|
| http://13.235.33.124 | ✅ Available now |
| http://app.eka-ai.in | ⏳ After DNS propagation |
| https://app.eka-ai.in | ⏳ After SSL setup |
