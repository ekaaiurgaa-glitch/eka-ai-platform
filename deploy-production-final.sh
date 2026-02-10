#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# EKA-AI PRODUCTION DEPLOYMENT SCRIPT
# Go4Garage Private Limited
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "🚀 EKA-AI Production Deployment Starting..."
echo "═══════════════════════════════════════════════════════════════════════════════"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
ORANGE='\033[0;33m'
NC='\033[0m' # No Color

# Check environment
if [ ! -f .env ]; then
    echo -e "${RED}❌ ERROR: .env file not found${NC}"
    echo "Please create .env file with required variables"
    exit 1
fi

source .env

# Verify required variables
REQUIRED_VARS=("SUPABASE_URL" "SUPABASE_ANON_KEY" "VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ ERROR: $var not set in .env${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables verified${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1: DATABASE DEPLOYMENT
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${ORANGE}📊 PHASE 1: Deploying Database Schema${NC}"
echo "───────────────────────────────────────────────────────────────────────────────"

if command -v psql &> /dev/null; then
    echo "Deploying migration_production_final.sql..."
    psql "$SUPABASE_URL" -f backend/database/migration_production_final.sql
    echo -e "${GREEN}✅ Database schema deployed${NC}"
else
    echo -e "${ORANGE}⚠️  psql not found. Please deploy manually:${NC}"
    echo "   psql \$SUPABASE_URL -f backend/database/migration_production_final.sql"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2: BACKEND DEPLOYMENT
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${ORANGE}🔧 PHASE 2: Building Backend${NC}"
echo "───────────────────────────────────────────────────────────────────────────────"

cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "Installing Python dependencies..."
pip install -r requirements.txt --quiet

echo -e "${GREEN}✅ Backend dependencies installed${NC}"

cd ..

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 3: FRONTEND DEPLOYMENT
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${ORANGE}🎨 PHASE 3: Building Frontend${NC}"
echo "───────────────────────────────────────────────────────────────────────────────"

echo "Installing Node dependencies..."
npm install --silent

echo "Building production bundle..."
npm run build

if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
    echo "Build size: $(du -sh dist | cut -f1)"
else
    echo -e "${RED}❌ ERROR: Build failed${NC}"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 4: DEPLOYMENT VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${ORANGE}🔍 PHASE 4: Deployment Verification${NC}"
echo "───────────────────────────────────────────────────────────────────────────────"

# Check critical files
CRITICAL_FILES=(
    "dist/index.html"
    "backend/prompts/eka_system_prompt.txt"
    "backend/database/migration_production_final.sql"
    "src/components/VideoScroller.tsx"
    "src/pages/LegalPage.tsx"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
    fi
done

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 5: FIREBASE DEPLOYMENT (Optional)
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${ORANGE}🔥 PHASE 5: Firebase Deployment${NC}"
echo "───────────────────────────────────────────────────────────────────────────────"

if command -v firebase &> /dev/null; then
    read -p "Deploy to Firebase now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        firebase deploy --only hosting
        echo -e "${GREEN}✅ Deployed to Firebase${NC}"
    fi
else
    echo -e "${ORANGE}⚠️  Firebase CLI not found. Install with: npm install -g firebase-tools${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOYMENT SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE${NC}"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo "   1. Verify database tables in Supabase dashboard"
echo "   2. Test login flow at your deployment URL"
echo "   3. Configure PayU callback route"
echo "   4. Run load tests"
echo "   5. Monitor audit_logs table"
echo ""
echo "📚 Documentation:"
echo "   - Deployment Checklist: PRODUCTION_DEPLOYMENT_CHECKLIST.md"
echo "   - System Prompt: backend/prompts/eka_system_prompt.txt"
echo "   - Database Schema: backend/database/migration_production_final.sql"
echo ""
echo "🏢 Go4Garage Private Limited"
echo "🤖 EKA-AI - Governed Automobile Intelligence"
echo ""
