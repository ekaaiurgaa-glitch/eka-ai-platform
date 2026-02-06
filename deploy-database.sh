#!/bin/bash
# EKA-AI Database Schema Deployment Script
# This script guides you through deploying the database schema to Supabase

set -e

echo "🗄️  EKA-AI Database Schema Deployment"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}📋 MANUAL DEPLOYMENT REQUIRED${NC}"
echo ""
echo "Supabase requires SQL to be executed via their dashboard."
echo ""
echo "Please follow these steps:"
echo ""
echo "1. Open Supabase Dashboard:"
echo "   https://gymkrbjujghwvphessns.supabase.co"
echo ""
echo "2. Navigate to: SQL Editor (left sidebar)"
echo ""
echo "3. Click: 'New Query'"
echo ""
echo "4. Copy the SQL from:"
echo "   /app/backend/database/schema_complete.sql"
echo ""
echo "5. Paste into SQL Editor and click 'Run'"
echo ""
echo "6. Verify success (should see 'Success. No rows returned')"
echo ""
echo -e "${GREEN}After deployment, press ENTER to continue with data setup...${NC}"
read

echo ""
echo "✅ Assuming schema is deployed..."
echo ""
echo "🔧 Next: Creating initial workshop and user data"
echo ""
echo "Copy and run these SQL statements in Supabase SQL Editor:"
echo ""
echo "-- Create Workshop"
cat << 'EOSQL'
INSERT INTO workshops (name, gstin, state_code, address, city, email, phone)
VALUES (
    'Go4Garage Demo Workshop',
    '27AABCU9603R1ZX',
    '27',
    'Mumbai, Maharashtra, India',
    'Mumbai',
    'admin@go4garage.com',
    '+91-9876543210'
)
RETURNING id, name, created_at;
EOSQL
echo ""
echo "-- Save the workshop ID from above, then create user"
echo "-- First: Go to Authentication → Users → Add User"
echo "-- Email: admin@go4garage.com, Password: (your choice)"
echo "-- Copy the user ID, then run:"
echo ""
cat << 'EOSQL'
INSERT INTO user_profiles (user_id, workshop_id, role, full_name, phone)
VALUES (
    '<paste_user_id_here>',
    '<paste_workshop_id_here>',
    'OWNER',
    'Admin User',
    '+91-9876543210'
)
RETURNING user_id, workshop_id, role, full_name;
EOSQL
echo ""
echo -e "${GREEN}After creating workshop and user, press ENTER to test APIs...${NC}"
read

echo ""
echo "🧪 Testing Backend APIs..."
echo ""

# Test health endpoint
if curl -s http://localhost:8001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend not responding${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Database schema deployment guide complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Execute the SQL statements shown above"
echo "2. Generate JWT token for API testing"
echo "3. Test job card creation endpoint"
echo ""
