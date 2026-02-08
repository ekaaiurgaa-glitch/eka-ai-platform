# AWS Deployment Guide for EKA-AI

> Domain registered in AWS Route 53

---

## 🎯 Quick Setup

### Your Details
- **Domain**: [YOUR_DOMAIN_HERE] (Update below)
- **Company**: Go4Garage Private Limited
- **CIN**: U34300UP2021PTC145107
- **GSTIN**: 10AAICG9768N1ZZ
- **Region**: Uttar Pradesh, India

---

## Step 1: AWS EC2 Setup

### Launch Instance
```
- AMI: Ubuntu 22.04 LTS (HVM), SSD Volume Type
- Instance Type: t3.medium (2 vCPU, 4GB RAM)
- Storage: 80GB gp2
- Security Group: 
  - SSH (22) - Your IP only
  - HTTP (80) - Anywhere
  - HTTPS (443) - Anywhere
```

### Connect via SSH
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

---

## Step 2: Route 53 DNS Configuration

### In AWS Console:
1. Go to Route 53 > Hosted Zones
2. Select your domain
3. Create A Record:
   ```
   Name: app (or @ for root)
   Type: A
   Value: YOUR_EC2_PUBLIC_IP
   TTL: 300
   ```

### Wait 2-5 minutes for propagation

---

## Step 3: SSL with Let's Encrypt

```bash
# On EC2 instance
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --standalone -d app.YOURDOMAIN.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Step 4: Deploy Application

```bash
# Clone repository
git clone https://github.com/ekaaiurgaa-glitch/eka-ai-platform.git
cd eka-ai-platform

# Run automated setup
chmod +x setup-production.sh
./setup-production.sh

# Edit environment
nano backend/.env

# Update these:
FRONTEND_URL=https://app.YOURDOMAIN.com
CORS_ORIGINS=https://app.YOURDOMAIN.com

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

## Step 5: AWS-Specific Optimizations

### Enable CloudWatch Monitoring
```bash
sudo apt install -y amazon-cloudwatch-agent
```

### Setup AWS S3 for Backups (Optional)
```bash
# Install AWS CLI
sudo apt install -y awscli
aws configure

# Add to .env
BACKUP_BUCKET_NAME=your-s3-bucket
BACKUP_ACCESS_KEY=your-aws-access-key
BACKUP_SECRET_KEY=your-aws-secret-key
BACKUP_REGION=ap-south-1
```

### Use AWS RDS instead of Supabase (Optional)
If you prefer AWS RDS PostgreSQL:
```
1. Create RDS instance (PostgreSQL 15)
2. Enable pgvector extension
3. Update SUPABASE_URL in .env to RDS endpoint
```

---

## AWS Cost Estimate

| Service | Monthly Cost |
|---------|-------------|
| EC2 t3.medium | ~₹1,800 |
| Route 53 | ~₹100 |
| Data Transfer | ~₹200 |
| **Total** | **~₹2,100** |

---

## Troubleshooting

### Issue: Domain not resolving
```bash
# Check DNS propagation
dig app.YOURDOMAIN.com
nslookup app.YOURDOMAIN.com
```

### Issue: SSL certificate error
```bash
# Check certbot logs
sudo cat /var/log/letsencrypt/letsencrypt.log

# Re-run certbot
sudo certbot delete -d app.YOURDOMAIN.com
sudo certbot certonly --standalone -d app.YOURDOMAIN.com
```

### Issue: EC2 connection timeout
```bash
# Check security group rules
# Ensure port 80, 443, 22 are open
```

---

## Next Steps

1. Update domain in all config files
2. Complete deployment
3. Test at https://app.YOURDOMAIN.com
