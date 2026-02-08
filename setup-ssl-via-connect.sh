#!/bin/bash
# SSL Setup via EC2 Instance Connect
INSTANCE_ID="i-04f5a307385106aef"
EC2_USER="ubuntu"
EC2_IP="13.235.33.124"
AWS_REGION="ap-south-1"

echo "🔒 SSL Setup for app.eka-ai.in"
echo "==============================="

# Generate temp key
TEMP_KEY_DIR=$(mktemp -d)
TEMP_KEY="$TEMP_KEY_DIR/temp_key"
ssh-keygen -t rsa -b 4096 -f "$TEMP_KEY" -N "" 2>/dev/null

# Send key
aws ec2-instance-connect send-ssh-public-key \
    --instance-id "$INSTANCE_ID" \
    --instance-os-user "$EC2_USER" \
    --ssh-public-key "$(cat $TEMP_KEY.pub)" \
    --region "$AWS_REGION" \
    --availability-zone "ap-south-1a" 2>/dev/null

# Run SSL setup
ssh -i "$TEMP_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << 'SSLCMD'
    cd /home/ubuntu
    
    # Start nginx if not running
    sudo docker-compose -f docker-compose.prod.yml up -d nginx
    sleep 3
    
    # Request certificate
    sudo docker run -it --rm \
        -v "/home/ubuntu/certbot/conf:/etc/letsencrypt" \
        -v "/home/ubuntu/certbot/www:/var/www/certbot" \
        -p 80:80 \
        certbot/certbot certonly \
        --standalone \
        --email legal@go4garage.in \
        -d app.eka-ai.in \
        --agree-tos \
        --force-renewal
    
    # Reload nginx
    sudo docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload 2>/dev/null || true
    
    echo "✅ SSL Certificate installed!"
SSLCMD

rm -rf "$TEMP_KEY_DIR"
echo "🌐 https://app.eka-ai.in is now secure!"
