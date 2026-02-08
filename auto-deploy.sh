#!/bin/bash
# Auto-deploy when SSH becomes available

echo "⏳ Watching for SSH availability on 13.235.33.124..."
echo "   (Press Ctrl+C to cancel)"
echo ""

while true; do
    if ssh -i eka.pem -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@13.235.33.124 "echo 'READY'" 2>&1 | grep -q "READY"; then
        echo ""
        echo "✅ SSH CONNECTED!"
        echo "🚀 Starting deployment..."
        ./deploy-fast.sh
        exit 0
    fi
    echo -ne "\r   Waiting... $(date +%H:%M:%S)"
    sleep 5
done
