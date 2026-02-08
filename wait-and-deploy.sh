#!/bin/bash
# Wait for SSH to become available, then deploy

echo "⏳ Waiting for SSH connection to 13.235.33.124..."
echo "   (This will retry every 5 seconds)"
echo ""

RETRIES=0
MAX_RETRIES=60  # 5 minutes

while [ $RETRIES -lt $MAX_RETRIES ]; do
    if ssh -i eka.pem -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@13.235.33.124 "echo 'READY'" 2>&1 | grep -q "READY"; then
        echo ""
        echo "✅ SSH Connection established!"
        echo ""
        echo "🚀 Starting deployment..."
        echo ""
        ./DEPLOY_NOW.sh ./eka.pem
        exit $?
    fi
    
    RETRIES=$((RETRIES + 1))
    echo -ne "\r   Attempt $RETRIES/$MAX_RETRIES - Waiting for port 22 to open..."
    sleep 5
done

echo ""
echo ""
echo "❌ Timeout after 5 minutes"
echo "SSH port 22 is still blocked. Please update AWS Security Group."
