#!/bin/bash
# ==========================================
# EKA-AI Platform - Deploy via EC2 Instance Connect
# Instance ID: i-04f5a307385106aef
# ==========================================

INSTANCE_ID="i-04f5a307385106aef"
EC2_USER="ubuntu"
EC2_IP="13.235.33.124"
AWS_REGION="ap-south-1"

echo "🚀 EKA-AI Deployment via EC2 Instance Connect"
echo "=============================================="
echo "Instance: $INSTANCE_ID"
echo "IP: $EC2_IP"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found"
    exit 1
fi

# Generate temporary SSH key pair
TEMP_KEY_DIR=$(mktemp -d)
TEMP_KEY="$TEMP_KEY_DIR/temp_key"

echo "🔑 Generating temporary SSH key..."
ssh-keygen -t rsa -b 4096 -f "$TEMP_KEY" -N "" -C "temporary-deploy-key" 2>/dev/null

# Get public key
PUBLIC_KEY=$(cat "$TEMP_KEY.pub")
echo "✅ Temporary key generated"
echo ""

# Send public key to EC2 Instance Connect
echo "📤 Sending key via EC2 Instance Connect..."
aws ec2-instance-connect send-ssh-public-key \
    --instance-id "$INSTANCE_ID" \
    --instance-os-user "$EC2_USER" \
    --ssh-public-key "$PUBLIC_KEY" \
    --region "$AWS_REGION" \
    --availability-zone "ap-south-1a" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "⚠️  EC2 Instance Connect failed. Trying direct SSH..."
    echo ""
    echo "Make sure you have:"
    echo "  1. AWS credentials configured (aws configure)"
    echo "  2. IAM permissions for ec2-instance-connect:SendSSHPublicKey"
    echo "  3. EC2 Instance Connect installed on the instance"
    rm -rf "$TEMP_KEY_DIR"
    exit 1
fi

echo "✅ Key sent successfully (valid for 60 seconds)"
echo ""

# Build frontend
echo "📦 Building frontend..."
npm run build 2>&1 | tail -3
echo ""

# Create deployment package
echo "📁 Creating deployment package..."
tar -czf /tmp/deploy-pkg.tar.gz \
    dist/ backend/ nginx/ docker-compose.prod.yml \
    Dockerfile init-letsencrypt.sh .env.production \
    --exclude='backend/__pycache__' --exclude='backend/venv' 2>/dev/null

echo "✅ Package ready: $(du -h /tmp/deploy-pkg.tar.gz | cut -f1)"
echo ""

# Upload and deploy via SSH
echo "⬆️  Uploading to EC2..."
scp -i "$TEMP_KEY" -o StrictHostKeyChecking=no \
    /tmp/deploy-pkg.tar.gz "$EC2_USER@$EC2_IP:/home/ubuntu/deploy.tar.gz" 2>&1 | grep -v "Warning"

echo "🖥️  Deploying..."
ssh -i "$TEMP_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << 'REMOTECMD'
    cd /home/ubuntu
    tar -xzf deploy.tar.gz && rm deploy.tar.gz
    mv .env.production backend/.env
    
    # Check/install Docker
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        sudo apt-get update -qq && sudo apt-get install -y -qq docker.io docker-compose
        sudo usermod -aG docker ubuntu
    fi
    
    # Deploy
    sudo docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    sudo docker-compose -f docker-compose.prod.yml up -d --build
    
    sleep 10
    curl -sf http://localhost:8001/api/health && echo "✅ Backend healthy"
    
    sudo docker-compose -f docker-compose.prod.yml ps 2>/dev/null | head -5
REMOTECMD

# Cleanup
rm -rf "$TEMP_KEY_DIR" /tmp/deploy-pkg.tar.gz

echo ""
echo "=============================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=============================================="
echo ""
echo "🌐 Platform: http://$EC2_IP"
echo ""
echo "📋 Next: Setup SSL"
echo "   Run: ./setup-ssl-via-connect.sh"
