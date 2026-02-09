#!/bin/bash
# Quick Pre-Flight Check

echo "🔍 EKA-AI Deployment Pre-Flight Check"
echo ""

# 1. Check SSH key
if [ -f ~/.ssh/eka-ai-key.pem ]; then
    echo "✅ SSH key found"
    chmod 600 ~/.ssh/eka-ai-key.pem
elif [ -f ./eka.pem ]; then
    echo "✅ SSH key found (eka.pem)"
    chmod 600 ./eka.pem
else
    echo "❌ SSH key not found"
    echo "   Place your .pem file in ~/.ssh/eka-ai-key.pem"
    exit 1
fi

# 2. Check build files
if [ ! -d "dist" ]; then
    echo "⚠️  Frontend not built. Building now..."
    npm run build
fi

# 3. Check required files
REQUIRED_FILES=(
    "docker-compose.prod.yml"
    "Dockerfile"
    ".env.production"
    "nginx/conf.d/default.conf"
    "init-letsencrypt.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

echo ""
echo "✅ All checks passed! Ready to deploy."
echo ""
echo "Run: ./DEPLOY_NOW.sh"
