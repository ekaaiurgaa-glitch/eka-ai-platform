# 🚀 EKA-AI Platform - Database Deployment Guide

## ⚠️ CRITICAL: Database Schema Must Be Deployed First

Your Supabase connection is working, but the tables need to be created.

---

## 📋 Deployment Steps

### Step 1: Open Supabase SQL Editor

1. Go to: https://gymkrbjujghwvphessns.supabase.co
2. Navigate to: **SQL Editor** (left sidebar)
3. Click: **New Query**

### Step 2: Run Schema Deployment

Copy and paste the ENTIRE contents of `/app/backend/database/schema_complete.sql` into the SQL editor.

**File location:** `/app/backend/database/schema_complete.sql` (526 lines)

**What it creates:**
- ✅ 19 tables with proper relationships
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Triggers for auto-updates
- ✅ Audit logging functions

### Step 3: Execute the Query

Click **Run** or press `Ctrl+Enter`

You should see:
```
Success. No rows returned
```

### Step 4: Verify Tables Created

Run this verification query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected tables (19 total):**
1. audit_logs
2. credit_debit_notes
3. intelligence_logs
4. invoice_items
5. invoice_sequences
6. invoices
7. job_card_states
8. job_cards
9. labor_catalog
10. mg_calculation_logs
11. mg_contracts
12. mg_vehicle_logs
13. parts_catalog
14. pdi_checklists
15. pdi_evidence
16. pricing_access_logs
17. user_profiles
18. vehicles
19. workshops

---

## 🔧 After Schema Deployment

### Create First Workshop (Required)

Run this in SQL Editor to create your first workshop:
```sql
INSERT INTO workshops (name, gstin, state_code, address, city, email)
VALUES (
    'ABC Motors',
    '27AABCU9603R1ZX',
    '27',
    'Mumbai, Maharashtra',
    'Mumbai',
    'contact@abcmotors.com'
)
RETURNING id, name;
```

Save the returned `id` - you'll need it for creating users.

### Create First User (Required for API Access)

First, create a user in Supabase Auth:
1. Go to **Authentication** > **Users**
2. Click **Add user**
3. Enter email and password
4. Copy the user ID

Then create the user profile:
```sql
INSERT INTO user_profiles (user_id, workshop_id, role, full_name, phone)
VALUES (
    '<user_id_from_auth>',
    '<workshop_id_from_above>',
    'OWNER',
    'Admin User',
    '+91-9876543210'
);
```

### Generate JWT Token for Testing

You'll need to generate a JWT token with this payload:
```json
{
  "sub": "<user_id>",
  "role": "OWNER",
  "workshop_id": "<workshop_id>",
  "email": "admin@workshop.com"
}
```

Use the JWT_SECRET from your .env file:
```
9pOPM8OgvBPhCnxQorVsT3LlFdxIYaPAAz371QcGS7E5AcSI4p34DO31WTQ=
```

Or test without auth on public endpoints first.

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] All 19 tables exist
- [ ] At least one workshop exists
- [ ] At least one user_profile exists
- [ ] RLS policies are enabled (check each table)
- [ ] Backend can connect (test with /api/health)

---

## 🚨 Common Issues

### Issue 1: Foreign Key Errors
**Problem:** Tables reference auth.users which may not exist  
**Solution:** Supabase Auth is pre-configured, this should work

### Issue 2: RLS Policy Errors
**Problem:** Policies reference functions that don't exist  
**Solution:** Run the schema in order - functions are defined before policies

### Issue 3: Duplicate Key Errors
**Problem:** Tables already partially exist  
**Solution:** Drop existing tables first:
```sql
DROP TABLE IF EXISTS workshops CASCADE;
DROP TABLE IF EXISTS job_cards CASCADE;
-- etc for all tables
```

---

## 🎯 Next Steps After Schema Deployment

1. ✅ Schema deployed
2. ✅ Workshop created
3. ✅ User created
4. ➡️ Start backend server
5. ➡️ Test API endpoints
6. ➡️ Deploy frontend

---

## 📞 Need Help?

If you encounter errors during deployment:
1. Copy the full error message
2. Share it for troubleshooting
3. Common errors are usually about foreign key order or missing auth tables
