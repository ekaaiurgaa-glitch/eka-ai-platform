# AWS Credentials Setup for EC2 Instance Connect

## Option 1: AWS Access Keys (Quick Setup)

```bash
# Configure AWS CLI
aws configure

# Enter when prompted:
# AWS Access Key ID: [Your IAM Access Key]
# AWS Secret Access Key: [Your IAM Secret Key]
# Default region: ap-south-1
# Default output: json
```

**Get keys from:** AWS Console → IAM → Users → [Your User] → Security Credentials → Create Access Key

---

## Option 2: AWS SSO (If using AWS Organizations)

```bash
aws sso login
# Follow browser prompts
```

---

## Option 3: Environment Variables

```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=ap-south-1
```

---

## Required IAM Permissions

Your IAM user/role needs:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2-instance-connect:SendSSHPublicKey",
                "ec2:DescribeInstances"
            ],
            "Resource": "*"
        }
    ]
}
```

---

## Alternative: Use the .pem Key Directly

If you have the .pem file locally, you can upload it:

```bash
# From your local terminal
scp -i ~/.ssh/eka-ai-key.pem eka-ai-platform/deploy.tar.gz ubuntu@13.235.33.124:/home/ubuntu/
ssh -i ~/.ssh/eka-ai-key.pem ubuntu@13.235.33.124
# Then run deployment commands on the server
```

---

## Quick Test

After configuring credentials:

```bash
# Test AWS access
aws sts get-caller-identity

# Test Instance Connect
aws ec2-instance-connect send-ssh-public-key \
    --instance-id i-04f5a307385106aef \
    --instance-os-user ubuntu \
    --ssh-public-key "$(cat ~/.ssh/id_rsa.pub)" \
    --region ap-south-1 \
    --availability-zone ap-south-1a
```
