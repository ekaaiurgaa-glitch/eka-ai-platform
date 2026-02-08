#!/bin/bash
# Quick SSH test

echo "Testing SSH connection to 13.235.33.124..."
if ssh -i eka.pem -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@13.235.33.124 "echo '✅ SSH WORKS!'" 2>&1 | grep -q "WORKS"; then
    echo ""
    echo "✅ SSH connection successful!"
    echo "You can now run: ./DEPLOY_NOW.sh ./eka.pem"
else
    echo ""
    echo "❌ SSH still blocked"
    echo "Please update Security Group in AWS Console first"
fi
