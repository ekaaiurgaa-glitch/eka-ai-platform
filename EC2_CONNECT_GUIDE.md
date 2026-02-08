# EC2 Connection Troubleshooting Guide

## Current Status
- ✅ SSH Key found: `eka.pem`
- ✅ Permissions set correctly (600)
- ❌ SSH connection timed out to 13.235.33.124

## Root Cause
The EC2 Security Group is blocking SSH (port 22) connections from your current IP address.

## Solution Options

### Option 1: Fix Security Group (Recommended - 2 minutes)

1. **Go to AWS Console**: https://console.aws.amazon.com/ec2/

2. **Find your instance**:
   - Click "Instances" in left menu
   - Find instance with IP `13.235.33.124`
   - Note the "Security groups" name (e.g., `launch-wizard-1`)

3. **Update Security Group**:
   - Click on the security group name
   - Click "Edit inbound rules"
   - Click "Add rule"
   - Select:
     - Type: `SSH`
     - Protocol: `TCP`
     - Port range: `22`
     - Source: `My IP` (or `0.0.0.0/0` for any IP - less secure)
   - Click "Save rules"

4. **Retry deployment**:
   ```bash
   ./DEPLOY_NOW.sh ./eka.pem
   ```

---

### Option 2: AWS Systems Manager Session Manager

If Session Manager is enabled on the instance, you can connect without opening port 22:

```bash
# Install Session Manager plugin first
# Then connect
aws ssm start-session --target i-04f5a307385106aef

# Once connected, run deployment manually
cd /home/ubuntu
git clone https://github.com/ekaaiurgaa-glitch/eka-ai-platform.git
cd eka-ai-platform
git checkout main
# Copy .env.production content and continue deployment
```

---

### Option 3: Deploy Locally Then Upload

Run these on your **local machine** where you have the key:

```bash
# On your local machine
git clone https://github.com/ekaaiurgaa-glitch/eka-ai-platform.git
cd eka-ai-platform
git checkout SSH-KEY  # Has the eka.pem file

# Switch to main for deployment
git checkout main

# Build
npm run build

# Create package
tar -czf deploy.tar.gz dist/ backend/ nginx/ docker-compose.prod.yml \
    Dockerfile init-letsencrypt.sh .env.production

# Upload
scp -i eka.pem deploy.tar.gz ubuntu@13.235.33.124:/home/ubuntu/

# SSH and deploy
ssh -i eka.pem ubuntu@13.235.33.124

# Then on server:
cd /home/ubuntu
tar -xzf deploy.tar.gz
mv .env.production backend/.env
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo docker-compose -f docker-compose.prod.yml up -d --build
sudo ./init-letsencrypt.sh
```

---

## Quick Check Command

After fixing the security group, test with:
```bash
ssh -i eka.pem -o StrictHostKeyChecking=no ubuntu@13.235.33.124 "echo 'SUCCESS'"
```

If you see "SUCCESS", the deployment will work!

---

## Need Help?

1. **Check instance state**: In EC2 console, ensure instance shows "running"
2. **Check security group**: Verify inbound rule for port 22 exists
3. **Check key pair**: Ensure `eka.pem` matches the key pair assigned to instance

Instance ID for reference: `i-04f5a307385106aef`
