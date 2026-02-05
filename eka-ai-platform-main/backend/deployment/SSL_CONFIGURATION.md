# EKA-AI SSL/TLS Configuration Guide

## Production SSL Requirements

### Option 1: Let's Encrypt (Recommended for Cloud)

#### Using Certbot with Nginx

```bash
# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d eka-ai.go4garage.in -d www.eka-ai.go4garage.in

# Auto-renewal test
sudo certbot renew --dry-run
```

#### Nginx Configuration with SSL

```nginx
# /etc/nginx/sites-available/eka-ai
server {
    listen 80;
    server_name eka-ai.go4garage.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name eka-ai.go4garage.in;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/eka-ai.go4garage.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eka-ai.go4garage.in/privkey.pem;

    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to Flask backend
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Serve React frontend
    location / {
        root /var/www/eka-ai/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
}
```

### Option 2: Cloudflare (Recommended for DDoS Protection)

1. **Update DNS:** Point `eka-ai.go4garage.in` to Cloudflare
2. **Enable SSL/TLS:**
   - Mode: Full (strict)
   - Always Use HTTPS: ON
   - Minimum TLS Version: 1.2
   - Automatic HTTPS Rewrites: ON

3. **Security Settings:**
   - Security Level: High
   - Challenge Passage: 30 minutes
   - Browser Integrity Check: ON

### Option 3: AWS ACM (For AWS Deployment)

```bash
# Request certificate in ACM
aws acm request-certificate \
    --domain-name eka-ai.go4garage.in \
    --validation-method DNS \
    --subject-alternative-names www.eka-ai.go4garage.in

# Add CNAME records to Route53/DNS provider
# Certificate ARN: arn:aws:acm:region:account-id:certificate/xxxxx
```

#### ALB Configuration

```yaml
# Application Load Balancer with SSL
Resources:
  EKAAILoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref EKAAILoadBalancer
      Port: 443
      Protocol: HTTPS
      SslPolicy: ELBSecurityPolicy-TLS13-1-2-2021-06
      Certificates:
        - CertificateArn: arn:aws:acm:region:account-id:certificate/xxxxx
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref EKAAITargetGroup
```

### SSL Verification

```bash
# Check SSL certificate
curl -vI https://eka-ai.go4garage.in 2>&1 | grep -E "(SSL|TLS|certificate)"

# SSL Labs Test
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=eka-ai.go4garage.in
# Target Grade: A+

# Verify HSTS
curl -s -D- https://eka-ai.go4garage.in | grep -i strict-transport

# Check certificate expiry
echo | openssl s_client -servername eka-ai.go4garage.in -connect eka-ai.go4garage.in:443 2>/dev/null | openssl x509 -noout -dates
```

### Auto-Renewal Setup

```bash
# Add to crontab
0 3 * * * /usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"

# Or use systemd timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### SSL Monitoring

```bash
#!/bin/bash
# /usr/local/bin/ssl-check.sh

DOMAIN="eka-ai.go4garage.in"
EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt 7 ]; then
    echo "CRITICAL: SSL certificate expires in $DAYS_UNTIL_EXPIRY days" | mail -s "SSL Expiry Alert" admin@go4garage.in
elif [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    echo "WARNING: SSL certificate expires in $DAYS_UNTIL_EXPIRY days" | mail -s "SSL Expiry Warning" admin@go4garage.in
fi
```

Add to crontab:
```bash
0 9 * * * /usr/local/bin/ssl-check.sh
```
