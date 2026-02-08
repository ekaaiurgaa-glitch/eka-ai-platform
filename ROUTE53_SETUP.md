# Route 53 DNS Configuration
# Target EC2 IP: 13.235.33.124

## A Records to Create:

| Record Name | Type | Value | TTL |
|-------------|------|-------|-----|
| app.eka-ai.in | A | 13.235.33.124 | 300 |
| www.app.eka-ai.in | A | 13.235.33.124 | 300 |
| go4garage.in | A | 13.235.34.125 | 300 |
| www.go4garage.in | A | 13.235.34.125 | 300 |
| eka-ai.in | A | 13.235.33.124 | 300 |
| www.eka-ai.in | A | 13.235.33.124 | 300 |

## AWS Console Steps:

1. Go to https://console.aws.amazon.com/route53/
2. Click "Hosted zones"
3. Select zone for "eka-ai.in"
4. Click "Create record"
5. Enter:
   - Record name: `app`
   - Record type: A
   - Value: `13.235.33.124`
   - TTL: 300
6. Click "Create records"
7. Repeat for other domains

## Verify DNS:
```bash
# Check propagation
nslookup app.eka-ai.in
dig app.eka-ai.in

# Should resolve to: 13.235.33.124
```

## SSL Certificate (Let's Encrypt):
```bash
# SSH to EC2
ssh -i ~/.ssh/eka-ai-key.pem ubuntu@13.235.33.124

# Run certbot
cd /home/ubuntu
sudo ./init-letsencrypt.sh
```
