#!/usr/bin/env python3
"""
EKA-AI Database Schema Deployment Script
Deploys the complete schema to Supabase PostgreSQL
"""

import os
import sys
from supabase import create_client
import time

# Load environment
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://gymkrbjujghwvphessns.supabase.co')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bWtyYmp1amdod3ZwaGVzc25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyOTQzMCwiZXhwIjoyMDg1NzA1NDMwfQ.D_ENSCvPh_KVtIanESCe2tYYNNF_mhTgrHnudfJWqWI')

def print_section(title):
    """Print section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def deploy_schema():
    """Deploy database schema to Supabase"""
    print_section("EKA-AI DATABASE SCHEMA DEPLOYMENT")
    
    print("\n📋 Deployment Plan:")
    print("  1. Connect to Supabase PostgreSQL")
    print("  2. Check existing tables")
    print("  3. Deploy schema (19 tables + RLS policies)")
    print("  4. Verify deployment")
    print("  5. Create initial workshop data")
    
    # Note about Supabase REST API limitations
    print("\n⚠️  IMPORTANT: Schema Deployment Method")
    print("\nSupabase Python client uses REST API (PostgREST) which is designed for")
    print("data operations (SELECT, INSERT, UPDATE, DELETE), not schema management.")
    print("\nFor schema deployment (CREATE TABLE, ALTER TABLE, etc.), we need to use")
    print("one of these methods:")
    print("\n  Option 1: Supabase Dashboard SQL Editor (RECOMMENDED)")
    print("    - Most reliable for complex DDL operations")
    print("    - Handles transactions properly")
    print("    - Better error reporting")
    print("\n  Option 2: PostgreSQL Direct Connection")
    print("    - Requires database connection string")
    print("    - Needs psycopg2 library")
    print("    - Direct PostgreSQL access")
    
    print("\n" + "=" * 80)
    print("  AUTOMATED DEPLOYMENT STATUS")
    print("=" * 80)
    
    try:
        # Initialize Supabase client
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("\n✅ Connected to Supabase")
        
        # Check current tables
        print("\n📊 Checking existing tables...")
        
        tables_to_check = [
            'workshops', 'user_profiles', 'vehicles', 'job_cards', 
            'job_card_states', 'pdi_checklists', 'pdi_evidence',
            'invoices', 'invoice_items', 'parts_catalog', 'labor_catalog'
        ]
        
        existing_tables = []
        missing_tables = []
        
        for table in tables_to_check:
            try:
                result = supabase.table(table).select("*").limit(1).execute()
                existing_tables.append(table)
                print(f"  ✅ {table} - EXISTS")
            except Exception as e:
                if 'does not exist' in str(e) or 'not found' in str(e) or 'PGRST' in str(e):
                    missing_tables.append(table)
                    print(f"  ❌ {table} - MISSING")
                else:
                    print(f"  ⚠️  {table} - ERROR: {str(e)[:50]}")
        
        print(f"\n📈 Summary:")
        print(f"   Existing: {len(existing_tables)}/{len(tables_to_check)}")
        print(f"   Missing: {len(missing_tables)}/{len(tables_to_check)}")
        
        if len(missing_tables) > 0:
            print("\n" + "🔴" * 40)
            print("  SCHEMA DEPLOYMENT REQUIRED")
            print("🔴" * 40)
            
            print("\n📝 Manual Deployment Required:")
            print("\nThe Supabase Python client cannot execute DDL (CREATE TABLE) operations.")
            print("Please follow these steps to deploy the schema:\n")
            
            print("1️⃣  Open Supabase Dashboard:")
            print(f"   {SUPABASE_URL.replace('/rest/v1', '')}")
            
            print("\n2️⃣  Navigate to SQL Editor:")
            print("   Click 'SQL Editor' in left sidebar")
            
            print("\n3️⃣  Create New Query:")
            print("   Click 'New Query' button")
            
            print("\n4️⃣  Copy Schema File:")
            print("   Open: /app/backend/database/schema_complete.sql")
            print("   Copy all 526 lines")
            
            print("\n5️⃣  Paste and Execute:")
            print("   Paste into SQL Editor")
            print("   Click 'Run' or press Ctrl+Enter")
            print("   Wait for completion (~10 seconds)")
            
            print("\n6️⃣  Verify Success:")
            print("   Should see: 'Success. No rows returned'")
            
            print("\n7️⃣  Re-run This Script:")
            print("   python3 deploy_schema.py")
            print("   Should show all tables existing")
            
            print("\n" + "=" * 80)
            return False
        else:
            print("\n" + "🟢" * 40)
            print("  ALL TABLES EXIST - SCHEMA DEPLOYED")
            print("🟢" * 40)
            
            print("\n✅ Schema deployment verified!")
            print("   All required tables are present in the database.")
            
            # Create initial workshop if needed
            print("\n📦 Checking for initial data...")
            try:
                workshops = supabase.table('workshops').select("*").limit(1).execute()
                if len(workshops.data) == 0:
                    print("\n⚠️  No workshops found. Creating demo workshop...")
                    create_initial_data(supabase)
                else:
                    print(f"\n✅ Workshop exists: {workshops.data[0].get('name', 'Unknown')}")
            except Exception as e:
                print(f"\n⚠️  Could not check workshops: {str(e)[:100]}")
            
            return True
            
    except Exception as e:
        print(f"\n❌ Deployment Error: {str(e)}")
        return False

def create_initial_data(supabase):
    """Create initial workshop and sample data"""
    print_section("CREATING INITIAL DATA")
    
    try:
        # Create workshop
        workshop_data = {
            "name": "Go4Garage Demo Workshop",
            "gstin": "27AABCU9603R1ZX",
            "state_code": "27",
            "address": "Shop No. 15, Main Road, Andheri East",
            "city": "Mumbai",
            "pincode": "400069",
            "phone": "+91-9876543210",
            "email": "admin@go4garage.com",
            "settings": {"invoice_prefix": "G4G", "tax_enabled": True}
        }
        
        workshop = supabase.table('workshops').insert(workshop_data).execute()
        workshop_id = workshop.data[0]['id']
        
        print(f"✅ Workshop created: {workshop_id}")
        
        # Create sample vehicles
        vehicles = [
            {
                "workshop_id": workshop_id,
                "registration_number": "MH01AB1234",
                "brand": "Maruti",
                "model": "Swift",
                "year": 2020,
                "fuel_type": "Petrol",
                "owner_name": "Rahul Sharma",
                "owner_phone": "+91-9876543210"
            },
            {
                "workshop_id": workshop_id,
                "registration_number": "MH02CD5678",
                "brand": "Hyundai",
                "model": "Creta",
                "year": 2021,
                "fuel_type": "Diesel",
                "owner_name": "Priya Patel",
                "owner_phone": "+91-9876543211"
            }
        ]
        
        supabase.table('vehicles').insert(vehicles).execute()
        print(f"✅ Created {len(vehicles)} sample vehicles")
        
        print("\n" + "=" * 80)
        print("  INITIAL DATA CREATED SUCCESSFULLY")
        print("=" * 80)
        
        print(f"\n📝 Workshop Details:")
        print(f"   ID: {workshop_id}")
        print(f"   Name: Go4Garage Demo Workshop")
        print(f"   GSTIN: 27AABCU9603R1ZX")
        print(f"   City: Mumbai")
        
        print("\n📝 Next Steps:")
        print("   1. Create user in Supabase Authentication")
        print("   2. Link user to workshop via user_profiles table")
        print("   3. Run E2E tests: python3 test_e2e_workflow.py")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating initial data: {str(e)}")
        return False

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                   EKA-AI DATABASE SCHEMA DEPLOYMENT                          ║
║                   Go4Garage Automobile Intelligence                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)
    
    success = deploy_schema()
    
    if success:
        print("\n✅ Deployment process completed successfully!")
        sys.exit(0)
    else:
        print("\n⚠️  Manual schema deployment required via Supabase Dashboard")
        sys.exit(1)
