#!/bin/bash
# Open SSH port 22 on EC2 Security Group

INSTANCE_ID="i-0a1b2c3d4e5f6g7h8"  # Replace with actual instance ID
REGION="ap-south-1"

echo "🔓 Opening SSH port 22..."

# Get security group ID
SG_ID=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
  --output text 2>/dev/null)

if [ -z "$SG_ID" ]; then
  echo "❌ Cannot find security group. Configure AWS CLI first:"
  echo "   aws configure"
  echo "   AWS Access Key ID: [from IAM]"
  echo "   AWS Secret Access Key: [from IAM]"
  echo "   Default region: ap-south-1"
  exit 1
fi

echo "Security Group: $SG_ID"

# Add SSH rule
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0 \
  --region $REGION 2>/dev/null

echo "✅ Port 22 opened"
