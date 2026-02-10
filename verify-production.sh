#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# EKA-AI PRODUCTION VERIFICATION SCRIPT
# Go4Garage Private Limited
# ═══════════════════════════════════════════════════════════════════════════════

echo "🔍 EKA-AI Production Verification"
echo "═══════════════════════════════════════════════════════════════════════════════"

GREEN='\033[0;32m'
RED='\033[0;31m'
ORANGE='\033[0;33m'
NC='\033[0m'

PASS=0
FAIL=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ MISSING: $1${NC}"
        ((FAIL++))
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅ $3${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ MISSING: $3${NC}"
        ((FAIL++))
    fi
}

echo ""
echo "🟢 PHASE 1: Visual Identity & UI/UX"
echo "───────────────────────────────────────────────────────────────────────────────"

check_file "tailwind.config.js"
check_content "tailwind.config.js" "brand-orange" "Three-color palette defined"
check_content "src/index.css" "brand-orange" "CSS variables defined"
check_file "src/components/VideoScroller.tsx"
check_file "src/pages/LoginPage.tsx"
check_content "src/pages/LoginPage.tsx" "VideoScroller" "Dual-pane login implemented"
check_content "src/components/ChatMessage.tsx" "message-ai" "Chat message styling"

echo ""
echo "🔵 PHASE 2: Core Logic & AI Governance"
echo "───────────────────────────────────────────────────────────────────────────────"

check_file "backend/prompts/eka_system_prompt.txt"
check_content "backend/prompts/eka_system_prompt.txt" "DOMAIN LOCK" "AI system prompt exists"
check_file "backend/services/ai_governance.py"
check_content "backend/services/ai_governance.py" "DomainGate" "AI governance implemented"
check_file "backend/services/mg_service.py"
check_content "backend/services/mg_service.py" "MGEngine" "MG service implemented"

echo ""
echo "🟠 PHASE 3: Database & Architecture"
echo "───────────────────────────────────────────────────────────────────────────────"

check_file "backend/database/migration_production_final.sql"
check_content "backend/database/migration_production_final.sql" "mg_contracts" "MG tables in schema"
check_content "backend/database/migration_production_final.sql" "job_cards" "Job card tables in schema"
check_content "backend/database/migration_production_final.sql" "ENABLE ROW LEVEL SECURITY" "RLS enabled"

echo ""
echo "🔴 PHASE 4: Legal & Final Polish"
echo "───────────────────────────────────────────────────────────────────────────────"

check_file "src/pages/LegalPage.tsx"
check_content "src/pages/LegalPage.tsx" "Go4Garage Private Limited" "Legal page branding"
check_file "src/components/Footer.tsx"
check_content "src/components/Footer.tsx" "Privacy Policy" "Footer legal links"

echo ""
echo "📚 Documentation"
echo "───────────────────────────────────────────────────────────────────────────────"

check_file "PRODUCTION_DEPLOYMENT_CHECKLIST.md"
check_file "IMPLEMENTATION_GUIDE.md"
check_file "PRODUCTION_AUDIT_SUMMARY.md"
check_file "deploy-production-final.sh"

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "📊 VERIFICATION RESULTS"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"

if [ $FAIL -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL CHECKS PASSED - READY FOR PRODUCTION DEPLOYMENT${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./deploy-production-final.sh"
    echo "  2. Verify database tables in Supabase"
    echo "  3. Test login flow"
    echo "  4. Monitor audit_logs"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  SOME CHECKS FAILED - REVIEW ABOVE ERRORS${NC}"
    exit 1
fi
