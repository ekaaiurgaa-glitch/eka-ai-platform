#!/bin/bash
# ==========================================
# EKA-AI Platform - Production Deployment
# EC2: 13.235.33.124
# ==========================================

set -e

EC2_IP="13.235.33.124"
EC2_USER="ubuntu"
KEY_PATH="${1:-~/.ssh/eka-ai-key.pem}"

echo "🚀 EKA-AI Production Deployment"
echo "================================="
echo "Target: $EC2_IP"
echo ""

# Verify key exists
if [ ! -f "$KEY_PATH" ]; then
    echo "❌ SSH key not found: $KEY_PATH"
    echo "Download the .pem file from AWS EC2 console"
    exit 1
fi

chmod 600 "$KEY_PATH"

echo "📦 Building frontend..."
npm run build

echo ""
echo "📁 Creating deployment package..."
tar -czf eka-ai-deploy.tar.gz \
    dist/ \
    backend/ \
    nginx/ \
    docker-compose.prod.yml \
    Dockerfile \
    init-letsencrypt.sh \
    .env.production \
    --exclude='backend/__pycache__' \
    --exclude='backend/venv' \
    --exclude='backend/*.pyc' \
    --exclude='backend/.pytest_cache' 2>/dev/null || true

echo "📊 Package size: $(du -h eka-ai-deploy.tar.gz | cut -f1)"

echo ""
echo "⬆️  Uploading to EC2..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no \
    eka-ai-deploy.tar.gz $EC2_USER@$EC2_IP:/home/ubuntu/ || {
    echo "❌ Upload failed. Check:"
    echo "   - SSH key permissions (chmod 600)"
    echo "   - Security group allows port 22"
    echo "   - EC2 instance is running"
    exit 1
}

echo ""
echo "🖥️  Installing on EC2..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP << 'REMOTECMD'
    cd /home/ubuntu
    
    # Extract package
    echo "📂 Extracting..."
    tar -xzf eka-ai-deploy.tar.gz
    
    # Install Docker if not present
    if ! command -v docker &> /dev/null; then
        echo "🐳 Installing Docker..."
        sudo apt-get update
        sudo apt-get install -y docker.io docker-compose
        sudo usermod -aG docker ubuntu
        echo "⚠️  Docker installed. You may need to reconnect and re-run."
        exit 0
    fi
    
    # Move env file to backend
    mv .env.production backend/.env
    
    # Create necessary directories
    mkdir -p certbot/conf certbot/www logs
    
    # Stop existing containers
    echo "🛑 Stopping existing services..."
    sudo docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Build and start
    echo "🔨 Building and starting..."
    sudo docker-compose -f docker-compose.prod.yml up -d --build
    
    # Wait for startup
    echo "⏳ Waiting for services..."
    sleep 15
    
    # Health check
    echo "🏥 Health check..."
    if curl -sf http://localhost:8001/api/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy"
    else
        echo "⚠️  Backend not responding yet (may need more time)"
    fi
    
    echo ""
    echo "📊 Container status:"
    sudo docker-compose -f docker-compose.prod.yml ps
    
REMOTECMD

echo ""
echo "🧹 Cleaning up..."
rm -f eka-ai-deploy.tar.gz

echo ""
echo "================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================="
echo ""
echo "🌐 Your platform is live at:"
echo "   http://13.235.33.124"
echo ""
echo "⚠️  NEXT STEP - SSL Certificate:"
echo "   ssh -i $KEY_PATH $EC2_USER@$EC2_IP"
echo "   sudo ./init-letsencrypt.sh"
echo ""
echo "📋 Useful commands:"
echo "   Logs:    ssh -i $KEY_PATH $EC2_USER@$EC2_IP 'sudo docker-compose -f docker-compose.prod.yml logs -f'"
echo "   Restart: ssh -i $KEY_PATH $EC2_USER@$EC2_IP 'sudo docker-compose -f docker-compose.prod.yml restart'"
