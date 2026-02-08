#!/bin/bash
# Fast deployment with timeout handling

set -e

EC2_IP="13.235.33.124"
EC2_USER="ubuntu"
KEY="./eka.pem"

echo "🚀 EKA-AI Fast Deployment"
echo "Target: $EC2_IP"
echo ""

# Build
echo "📦 Building..."
npm run build 2>&1 | grep -E "(built|error)" || true

# Package
echo "📦 Packaging..."
tar -czf /tmp/eka-deploy.tar.gz dist/ backend/ nginx/ docker-compose.prod.yml Dockerfile init-letsencrypt.sh .env.production 2>/dev/null
echo "✅ Package: $(du -h /tmp/eka-deploy.tar.gz | cut -f1)"

# Upload with retry
echo "⬆️  Uploading..."
for i in 1 2 3; do
    if scp -i $KEY -o StrictHostKeyChecking=no -o ConnectTimeout=30 /tmp/eka-deploy.tar.gz $EC2_USER@$EC2_IP:/home/ubuntu/ 2>&1 | grep -v "Warning"; then
        echo "✅ Uploaded"
        break
    fi
    echo "   Retry $i..."
    sleep 5
done

# Deploy
echo "🖥️  Deploying..."
ssh -i $KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP "
    cd /home/ubuntu
    tar -xzf eka-deploy.tar.gz && rm eka-deploy.tar.gz
    mv .env.production backend/.env 2>/dev/null || true
    sudo docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    sudo docker-compose -f docker-compose.prod.yml up -d --build 2>&1 | tail -10
    sleep 10
    curl -s http://localhost:8001/api/health | head -1 || echo 'Starting...'
    sudo docker ps --format 'table {{.Names}}\t{{.Status}}'
"

rm -f /tmp/eka-deploy.tar.gz
echo ""
echo "✅ Done! Check http://$EC2_IP"
