#!/bin/bash
# EKA-AI Platform - Production Setup Script
# Run this after VPS provisioning

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          EKA-AI Production Setup                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "${RED}❌ Do not run this script as root${NC}"
   exit 1
fi

echo "${YELLOW}Step 1: Generating secure secrets...${NC}"
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "✅ Secrets generated"

echo ""
echo "${YELLOW}Step 2: Setting up environment files...${NC}"

# Check if user has filled in the template
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.production.template" ]; then
        cp backend/.env.production.template backend/.env
        echo "✅ Created backend/.env from template"
        echo "${YELLOW}⚠️  IMPORTANT: Edit backend/.env and fill in your actual values!${NC}"
    else
        echo "${RED}❌ backend/.env.production.template not found${NC}"
        exit 1
    fi
else
    echo "✅ backend/.env already exists"
fi

# Generate new secrets in .env
if grep -q "JWT_SECRET=REPLACE_WITH_GENERATED_SECRET" backend/.env; then
    sed -i "s/JWT_SECRET=REPLACE_WITH_GENERATED_SECRET/JWT_SECRET=$JWT_SECRET/" backend/.env
    echo "✅ JWT_SECRET updated in backend/.env"
else
    echo "${YELLOW}⚠️  JWT_SECRET already set. To regenerate, manually update backend/.env${NC}"
fi

echo ""
echo "${YELLOW}Step 3: Installing Docker (if not present)...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please log out and back in for group changes."
else
    echo "✅ Docker already installed"
fi

echo ""
echo "${YELLOW}Step 4: Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

echo ""
echo "${YELLOW}Step 5: Creating required directories...${NC}"
mkdir -p /var/log/eka-ai
mkdir -p /var/backups/eka-ai
mkdir -p /opt/eka-ai/certbot/conf
mkdir -p /opt/eka-ai/certbot/www
echo "✅ Directories created"

echo ""
echo "${YELLOW}Step 6: Building application...${NC}"
npm install
npm run build
echo "✅ Frontend built"

echo ""
echo "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo "${GREEN}║          SETUP COMPLETE                                    ║${NC}"
echo "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "${YELLOW}NEXT STEPS:${NC}"
echo "1. Edit backend/.env with your actual credentials"
echo "2. Purchase domain and point A record to this server IP"
echo "3. Run: sudo ./init-letsencrypt.sh"
echo "4. Run: docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "${YELLOW}TO START:${NC}"
echo "docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "${YELLOW}TO VIEW LOGS:${NC}"
echo "docker-compose -f docker-compose.prod.yml logs -f"
echo ""
