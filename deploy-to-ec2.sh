#!/bin/bash
# ==========================================
# EKA-AI Platform - EC2 Deployment Script
# Target: 13.235.33.124
# ==========================================

set -e

EC2_IP="13.235.33.124"
EC2_USER="ubuntu"
KEY_PATH="${1:-~/.ssh/eka-ai-key.pem}"

echo "🚀 Deploying EKA-AI Platform to EC2: $EC2_IP"
echo "================================================"

# Check SSH key exists
if [ ! -f "$KEY_PATH" ]; then
    echo "❌ SSH key not found: $KEY_PATH"
    echo "Usage: ./deploy-to-ec2.sh [path-to-ssh-key]"
    exit 1
fi

echo "📦 Step 1: Building frontend..."
npm run build

echo "📁 Step 2: Creating deployment archive..."
tar -czf deploy.tar.gz \
    dist/ \
    backend/ \
    nginx/ \
    docker-compose.prod.yml \
    Dockerfile \
    start.sh \
    init-letsencrypt.sh \
    .env.production \
    --exclude='backend/__pycache__' \
    --exclude='backend/.env' \
    --exclude='backend/venv' \
    --exclude='backend/.pytest_cache'

echo "⬆️  Step 3: Uploading to EC2..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no deploy.tar.gz $EC2_USER@$EC2_IP:/home/ubuntu/

echo "🖥️  Step 4: Deploying on EC2..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP << 'REMOTE_COMMANDS'
    cd /home/ubuntu
    
    echo "Extracting archive..."
    tar -xzf deploy.tar.gz
    
    echo "Installing Docker & Docker Compose (if needed)..."
    if ! command -v docker &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y docker.io docker-compose
        sudo usermod -aG docker ubuntu
    fi
    
    echo "Setting up environment..."
    mv .env.production backend/.env
    
    echo "Starting services..."
    sudo docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    sudo docker-compose -f docker-compose.prod.yml up -d --build
    
    echo "Waiting for services..."
    sleep 10
    
    echo "Checking health..."
    curl -sf http://localhost:5000/api/health && echo "✅ Backend healthy" || echo "❌ Backend not responding"
    
    echo "Deployment complete!"
REMOTE_COMMANDS

echo "🧹 Cleaning up..."
rm deploy.tar.gz

echo ""
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. SSH to server: ssh -i $KEY_PATH $EC2_USER@$EC2_IP"
echo "2. Setup SSL: sudo ./init-letsencrypt.sh"
echo "3. Check logs: sudo docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "URLs:"
echo "  - Platform: https://app.eka-ai.in"
echo "  - Health:   http://$EC2_IP:5000/api/health"
