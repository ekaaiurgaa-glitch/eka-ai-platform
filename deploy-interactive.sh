#!/bin/bash
# Interactive deployment helper

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     EKA-AI PLATFORM - INTERACTIVE DEPLOYMENT              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Target: AWS EC2 (13.235.33.124)"
echo "Domain: app.eka-ai.in"
echo ""

EC2_IP="13.235.33.124"
EC2_USER="ubuntu"

echo "Select deployment method:"
echo ""
echo "1) 🔑 I have an SSH key file (.pem)"
echo "2) ☁️  Use AWS EC2 Instance Connect (aws configure required)"
echo "3) 📤 Upload key file to codespace first"
echo "4) 🖥️  Manual SSH commands (copy-paste)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        read -p "Enter path to .pem file: " keypath
        if [ -f "$keypath" ]; then
            chmod 600 "$keypath"
            ./DEPLOY_NOW.sh "$keypath"
        else
            echo "❌ File not found: $keypath"
            exit 1
        fi
        ;;
    2)
        if command -v aws &> /dev/null; then
            echo "Checking AWS credentials..."
            if aws sts get-caller-identity &> /dev/null; then
                ./deploy-via-instance-connect.sh
            else
                echo "❌ AWS credentials not configured"
                echo "Run: aws configure"
                exit 1
            fi
        else
            echo "❌ AWS CLI not installed"
            exit 1
        fi
        ;;
    3)
        echo ""
        echo "📤 Please upload your .pem file:"
        echo ""
        echo "Option A - VS Code:"
        echo "  1. Click 'Explorer' in left sidebar"
        echo "  2. Right-click in file list → 'Upload'"
        echo "  3. Select your .pem file"
        echo ""
        echo "Option B - Terminal (from your local machine):"
        echo "  scp -i your-key.pem your-key.pem user@codespace:/workspaces/eka-ai-platform/"
        echo ""
        read -p "Press Enter after uploading..."
        
        # Look for uploaded pem files
        PEM=$(ls -t *.pem 2>/dev/null | head -1)
        if [ -n "$PEM" ]; then
            echo "Found: $PEM"
            chmod 600 "$PEM"
            ./DEPLOY_NOW.sh "./$PEM"
        else
            echo "❌ No .pem file found"
            exit 1
        fi
        ;;
    4)
        echo ""
        echo "════════════════════════════════════════════════════════════"
        echo "🖥️  MANUAL DEPLOYMENT COMMANDS"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        echo "Run these commands on your LOCAL machine:"
        echo ""
        echo "# 1. Build and package"
        echo "npm run build"
        echo "tar -czf deploy.tar.gz dist/ backend/ nginx/ docker-compose.prod.yml \\"
        echo "    Dockerfile init-letsencrypt.sh .env.production"
        echo ""
        echo "# 2. Upload (replace with your key path)"
        echo "scp -i ~/.ssh/eka-ai-key.pem deploy.tar.gz ubuntu@$EC2_IP:/home/ubuntu/"
        echo ""
        echo "# 3. SSH to server"
        echo "ssh -i ~/.ssh/eka-ai-key.pem ubuntu@$EC2_IP"
        echo ""
        echo "# 4. On server, run:"
        echo "cd /home/ubuntu"
        echo "tar -xzf deploy.tar.gz"
        echo "mv .env.production backend/.env"
        echo "sudo docker-compose -f docker-compose.prod.yml up -d --build"
        echo ""
        echo "# 5. Setup SSL"
        echo "sudo ./init-letsencrypt.sh"
        echo ""
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
