#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# EKA-AI PRODUCTION DEPLOYMENT SCRIPT
# Run this on your VPS for automated deployment
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/eka-ai"
DOMAIN="${DOMAIN:-app.eka-ai.com}"
EMAIL="${EMAIL:-admin@eka-ai.com}"

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     EKA-AI PRODUCTION DEPLOYMENT SCRIPT                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

# Step 1: System updates
print_status "Step 1: Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y docker.io docker-compose nginx certbot python3-certbot-nginx

# Step 2: Create app directory
print_status "Step 2: Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Step 3: Clone repository (or pull if exists)
if [ -d "$APP_DIR/.git" ]; then
    print_status "Pulling latest code..."
    git pull origin main
else
    print_status "Cloning repository..."
    git clone https://github.com/ekaaiurgaa-glitch/eka-ai-platform.git .
fi

# Step 4: Environment setup
print_status "Step 3: Setting up environment..."
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.production.template" ]; then
        cp backend/.env.production.template backend/.env
        print_error "⚠️  PLEASE EDIT backend/.env WITH YOUR ACTUAL CREDENTIALS BEFORE CONTINUING"
        print_error "⚠️  Run: nano backend/.env"
        exit 1
    fi
fi

# Step 5: SSL Certificate setup
print_status "Step 4: Setting up SSL certificates..."
if [ ! -d "./certbot/conf/live/$DOMAIN" ]; then
    print_status "Running SSL initialization..."
    chmod +x init-letsencrypt.sh
    ./init-letsencrypt.sh
else
    print_success "SSL certificates already exist"
fi

# Step 6: Build and start containers
print_status "Step 5: Building and starting containers..."
docker-compose -f docker-compose.prod.yml down || true
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Step 7: Health check
print_status "Step 6: Running health checks..."
sleep 10

HEALTH_STATUS=$(curl -s http://localhost:8001/api/health | grep -o '"status":"healthy"' || echo "")

if [ ! -z "$HEALTH_STATUS" ]; then
    print_success "Application is healthy!"
else
    print_error "Health check failed. Check logs with: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

# Step 8: Setup backup cron job
print_status "Step 7: Setting up automated backups..."
chmod +x scripts/backup_database.sh
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/scripts/backup_database.sh >> /var/log/eka-ai-backup.log 2>&1") | crontab -

# Step 9: Setup log rotation
print_status "Step 8: Setting up log rotation..."
cat > /etc/logrotate.d/eka-ai << EOF
/var/log/eka-ai/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        docker-compose -f $APP_DIR/docker-compose.prod.yml exec -T eka-ai kill -HUP 1
    endscript
}
EOF

# Final status
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           DEPLOYMENT COMPLETED SUCCESSFULLY!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
print_success "Your application is now running at: https://$DOMAIN"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Restart: docker-compose -f docker-compose.prod.yml restart"
echo "  - Update: cd $APP_DIR && git pull && ./deploy.sh"
echo "  - Backup: ./scripts/backup_database.sh"
echo ""
