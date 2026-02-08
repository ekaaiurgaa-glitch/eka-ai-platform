#!/bin/bash
# SSL Setup Script for EKA-AI Platform
EC2_IP="13.235.33.124"
EC2_USER="ubuntu"
KEY_PATH="${1:-~/.ssh/eka-ai-key.pem}"

echo "🔒 SSL Certificate Setup for app.eka-ai.in"
echo "=========================================="

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP << 'SSLSCRIPT'
    cd /home/ubuntu
    
    echo "📋 Checking prerequisites..."
    
    # Check if nginx is running
    if ! sudo docker ps | grep -q eka_nginx; then
        echo "❌ Nginx container not running. Starting services..."
        sudo docker-compose -f docker-compose.prod.yml up -d nginx
        sleep 5
    fi
    
    echo "🔐 Requesting SSL certificate from Let's Encrypt..."
    echo "   Domain: app.eka-ai.in"
    echo "   Email: legal@go4garage.in"
    echo ""
    
    # Run certbot
    sudo docker run -it --rm \
        -v "/home/ubuntu/certbot/conf:/etc/letsencrypt" \
        -v "/home/ubuntu/certbot/www:/var/www/certbot" \
        -v "/var/run/docker.sock:/var/run/docker.sock" \
        certbot/certbot certonly \
        --webroot -w /var/www/certbot \
        --email legal@go4garage.in \
        -d app.eka-ai.in \
        --rsa-key-size 4096 \
        --agree-tos \
        --force-renewal
    
    echo ""
    echo "🔄 Switching to HTTPS configuration..."
    
    # Switch to HTTPS config
    sudo cp nginx/conf.d/app.conf nginx/conf.d/app.conf.active
    
    echo "🔄 Reloading nginx..."
    sudo docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
    
    echo ""
    echo "✅ SSL Setup Complete!"
    echo ""
    echo "🌐 Your site is now available at:"
    echo "   https://app.eka-ai.in"
    echo ""
    echo "📅 Certificate will auto-renew via certbot container"
SSLSCRIPT
