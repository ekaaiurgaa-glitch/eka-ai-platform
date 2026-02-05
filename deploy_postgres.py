#!/usr/bin/env python3
"""
EKA-AI Database Schema Deployment via PostgreSQL
Direct connection to deploy DDL operations
"""

import psycopg2
import os
import sys

# Supabase PostgreSQL connection details
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
PROJECT_REF = "gymkrbjujghwvphessns"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bWtyYmp1amdod3ZwaGVzc25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyOTQzMCwiZXhwIjoyMDg1NzA1NDMwfQ.D_ENSCvPh_KVtIanESCe2tYYNNF_mhTgrHnudfJWqWI"

def print_section(title):
    """Print section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def deploy_via_postgres():
    """Deploy schema using direct PostgreSQL connection"""
    print_section("ATTEMPTING POSTGRESQL DIRECT CONNECTION")
    
    print("\n⚠️  Connection Method:")
    print("   Supabase requires database password for direct PostgreSQL connection.")
    print("   The SERVICE_KEY (JWT) is for REST API only, not PostgreSQL auth.")
    
    print("\n📝 To get PostgreSQL password:")
    print("   1. Open Supabase Dashboard")
    print("   2. Go to Settings → Database")
    print("   3. Copy the 'Connection String' or 'Database Password'")
    
    print("\n❌ Cannot proceed without PostgreSQL credentials")
    print("   This deployment requires manual SQL execution via Supabase Dashboard")
    
    return False

def read_schema_file():
    """Read and parse schema SQL file"""
    schema_path = "/app/backend/database/schema_complete.sql"
    
    try:
        with open(schema_path, 'r') as f:
            sql_content = f.read()
        
        print(f"\n✅ Schema file loaded: {len(sql_content)} characters")
        
        # Count statements (rough estimate)
        create_statements = sql_content.count('CREATE TABLE')
        alter_statements = sql_content.count('ALTER TABLE')
        policy_statements = sql_content.count('CREATE POLICY')
        
        print(f"\n📊 Schema Statistics:")
        print(f"   CREATE TABLE statements: {create_statements}")
        print(f"   ALTER TABLE statements: {alter_statements}")
        print(f"   CREATE POLICY statements: {policy_statements}")
        
        return sql_content
        
    except Exception as e:
        print(f"\n❌ Error reading schema: {str(e)}")
        return None

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║              EKA-AI POSTGRESQL DIRECT DEPLOYMENT ATTEMPT                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)
    
    # Read schema file
    schema_sql = read_schema_file()
    
    if schema_sql:
        print_section("DEPLOYMENT STATUS")
        
        print("\n🔴 BLOCKER: PostgreSQL Direct Connection Not Available")
        print("\nReason:")
        print("  - Supabase REST API (service_role key) cannot execute DDL")
        print("  - PostgreSQL direct connection requires database password")
        print("  - Database password is not the same as service_role JWT")
        
        print("\n✅ SOLUTION: Use Supabase Dashboard SQL Editor")
        print("\nThis is the recommended and most reliable method:")
        
        print("\n📋 Step-by-Step Instructions:")
        print("\n1. Open Supabase Dashboard:")
        print("   https://gymkrbjujghwvphessns.supabase.co")
        
        print("\n2. Navigate to SQL Editor:")
        print("   Click 'SQL Editor' in the left sidebar")
        
        print("\n3. Create New Query:")
        print("   Click the 'New Query' button")
        
        print("\n4. Copy Schema SQL:")
        print("   The schema is ready at: /app/backend/database/schema_complete.sql")
        print("   You can view it with: cat /app/backend/database/schema_complete.sql")
        
        print("\n5. Execute Schema:")
        print("   - Paste the entire SQL content into the editor")
        print("   - Click 'Run' or press Ctrl+Enter")
        print("   - Wait ~10 seconds for completion")
        print("   - Should see: 'Success. No rows returned'")
        
        print("\n6. Verify Deployment:")
        print("   Run: python3 /app/deploy_schema.py")
        print("   Should show all tables existing")
        
        print("\n" + "=" * 80)
        print("\n💡 Alternative: Copy Schema to Clipboard")
        print("\nIf you're on the Emergent platform, here's the schema content:")
        print("Copy everything between the --- markers below:\n")
        print("--- START SCHEMA ---")
        print(schema_sql[:500] + "\n... (truncated for display) ...")
        print("\nFull schema: /app/backend/database/schema_complete.sql")
        print("--- END SCHEMA ---")
        
    sys.exit(1)
