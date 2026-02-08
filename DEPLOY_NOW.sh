#!/bin/bash
# ==========================================
# EKA-AI Platform - FULL Production Deployment
# Server: 13.235.33.124
# ==========================================

EC2_IP="13.235.33.124"
EC2_USER="ubuntu"
KEY_PATH="${1:-~/.ssh/eka-ai-key.pem}"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     🚀 EKA-AI PLATFORM - PRODUCTION DEPLOYMENT          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Target Server: $EC2_IP"
echo "  Domain: app.eka-ai.in"
echo "  Company: Go4Garage Private Limited"
echo ""

# Check SSH key
if [ ! -f "$KEY_PATH" ]; then
    echo "❌ ERROR: SSH key not found at $KEY_PATH"
    echo ""
    echo "Download your .pem file from AWS EC2 Console:"
    echo "  1. Go to https://console.aws.amazon.com/ec2/"
    echo "  2. Click 'Instances' → Select your instance"
    echo "  3. Click 'Connect' → 'SSH client'"
    echo "  4. Download or locate your .pem file"
    echo ""
    echo "Then run: chmod 600 /path/to/your-key.pem"
    exit 1
fi

chmod 600 "$KEY_PATH"

echo "✅ SSH key validated"
echo ""

# Build frontend
echo "📦 Step 1/5: Building frontend..."
npm run build 2>&1 | tail -5
echo "✅ Frontend built"
echo ""

# Create package
echo "📦 Step 2/5: Creating deployment package..."
tar -czf deploy-package.tar.gz \
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
    2>/dev/null

PACKAGE_SIZE=$(du -h deploy-package.tar.gz | cut -f1)
echo "✅ Package created: $PACKAGE_SIZE"
echo ""

# Test SSH connection
echo "🔌 Step 3/5: Testing SSH connection..."
if ! ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=10 $EC2_USER@$EC2_IP "echo 'SSH OK'" 2>/dev/null; then
    echo "❌ ERROR: Cannot connect to EC2 instance"
    echo ""
    echo "Check:"
    echo "  - EC2 instance is running"
    echo "  - Security group allows inbound SSH (port 22)"
    echo "  - Key file permissions: chmod 600 $KEY_PATH"
    exit 1
fi
echo "✅ SSH connection successful"
echo ""

# Upload
echo "⬆️  Step 4/5: Uploading to server..."
if ! scp -i "$KEY_PATH" -o StrictHostKeyChecking=no deploy-package.tar.gz $EC2_USER@$EC2_IP:/home/ubuntu/; then
    echo "❌ ERROR: Upload failed"
    exit 1
fi
echo "✅ Upload complete"
echo ""

# Deploy
echo "🖥️  Step 5/5: Installing on server..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP << 'REMOTESCRIPT'
    cd /home/ubuntu
    
    echo "  📂 Extracting files..."
    tar -xzf deploy-package.tar.gz
    rm deploy-package.tar.gz
    
    echo "  🔧 Setting up environment..."
    mv .env.production backend/.env
    mkdir -p certbot/conf certbot/www logs
    
    echo "  🐳 Checking Docker..."
    if ! command -v docker &> /dev/null; then
        echo "  📥 Installing Docker..."
        sudo apt-get update -qq
        sudo apt-get install -y -qq docker.io docker-compose
        sudo usermod -aG docker ubuntu
        echo "  ✅ Docker installed (reconnect may be needed)"
    fi
    
    echo "  🛑 Stopping old containers..."
    sudo docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    echo "  🚀 Starting services..."
    sudo docker-compose -f docker-compose.prod.yml up -d --build
    
    echo "  ⏳ Waiting for startup..."
    sleep 10
    
    echo "  🏥 Health check..."
    if curl -sf http://localhost:8001/api/health > /dev/null 2>&1; then
        echo "  ✅ Backend: HEALTHY"
    else
        echo "  ⏳ Backend: Starting up..."
    fi
    
    echo ""
    echo "  📊 Active Containers:"
    sudo docker-compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || \
    sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
REMOTESCRIPT

echo ""
echo "🧹 Cleaning up..."
rm -f deploy-package.tar.gz

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              ✅ DEPLOYMENT SUCCESSFUL!                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 PLATFORM URLS:"
echo "   HTTP:   http://13.235.33.124"
echo "   Domain: http://app.eka-ai.in (after DNS propagation)"
echo ""
echo "⚠️  IMPORTANT - NEXT STEPS:"
echo ""
echo "1️⃣  SSL Certificate (HTTPS):"
echo "   ssh -i $KEY_PATH $EC2_USER@$EC2_IP"
echo "   sudo ./init-letsencrypt.sh"
echo ""
echo "2️⃣  Monitor logs:"
echo "   ssh -i $KEY_PATH $EC2_USER@$EC2_IP 'sudo docker-compose -f docker-compose.prod.yml logs -f'"
echo ""
echo "3️⃣  Update Supabase credentials:"
echo "   Edit backend/.env with actual Supabase service key"
echo ""
echo "📞 Company: Go4Garage Private Limited"
echo "   GSTIN: 10AAICG9768N1ZZ"
echo "   CIN: U34300UP2021PTC145107"
