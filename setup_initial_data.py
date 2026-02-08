#!/usr/bin/env python3
"""
Setup initial workshop and admin user for EKA-AI
"""

import os
import sys
from supabase import create_client
from datetime import datetime

def setup_initial_data():
    print("╔════════════════════════════════════════════════════════════╗")
    print("║     EKA-AI INITIAL DATA SETUP                              ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print()
    
    # Load from environment
    supabase_url = "https://gymkrbjujghwvphessns.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bWtyYmp1amdod3ZwaGVzc25zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyOTQzMCwiZXhwIjoyMDg1NzA1NDMwfQ.D_ENSCvPh_KVtIanESCe2tYYNNF_mhTgrHnudfJWqWI"
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Check if workshop exists
    print("🔍 Checking workshops...")
    workshops = supabase.table('workshops').select('*').execute()
    
    if workshops.data:
        workshop_id = workshops.data[0]['id']
        print(f"✅ Workshop exists: {workshops.data[0]['name']} (ID: {workshop_id})")
    else:
        print("🏢 Creating workshop...")
        workshop_data = {
            "name": "Go4Garage Main Workshop",
            "gstin": "10AAICG9768N1ZZ",
            "state_code": "10",
            "address": "Industrial Area, Patna, Bihar",
            "city": "Patna",
            "pincode": "800001",
            "phone": "+91-9876543210",
            "email": "legal@go4garage.in",
            "settings": {
                "currency": "INR",
                "timezone": "Asia/Kolkata",
                "invoice_prefix": "GG",
                "job_card_prefix": "JC"
            }
        }
        result = supabase.table('workshops').insert(workshop_data).execute()
        workshop_id = result.data[0]['id']
        print(f"✅ Workshop created (ID: {workshop_id})")
    
    print()
    print("👤 Creating admin user...")
    
    # Create auth user
    try:
        email = "admin@go4garage.in"
        password = "EkaAdmin@2025"
        
        # Check if user exists
        existing = supabase.auth.admin.list_users()
        admin_exists = any(u.email == email for u in existing.users if hasattr(existing, 'users'))
        
        if not admin_exists:
            auth_user = supabase.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True
            })
            user_id = auth_user.user.id
            print(f"✅ Auth user created: {email}")
        else:
            print(f"ℹ️  User already exists: {email}")
            # Get user ID from existing users
            user_id = next((u.id for u in existing.users if u.email == email), None)
    except Exception as e:
        print(f"⚠️  Auth user creation: {e}")
        user_id = None
    
    # Create user profile if user_id exists and profile doesn't
    if user_id:
        profile_check = supabase.table('user_profiles').select('*').eq('user_id', user_id).execute()
        
        if not profile_check.data:
            profile_data = {
                "user_id": user_id,
                "workshop_id": workshop_id,
                "role": "OWNER",
                "full_name": "Go4Garage Administrator",
                "phone": "+91-9876543210"
            }
            supabase.table('user_profiles').insert(profile_data).execute()
            print(f"✅ User profile created (OWNER)")
        else:
            print(f"ℹ️  User profile already exists")
    
    print()
    print("════════════════════════════════════════════════════════════")
    print("✅ INITIAL DATA SETUP COMPLETE")
    print("════════════════════════════════════════════════════════════")
    print()
    print("📋 Login Credentials:")
    print(f"   Email:    admin@go4garage.in")
    print(f"   Password: EkaAdmin@2025")
    print()
    print(f"   Workshop: Go4Garage Main Workshop")
    print(f"   GSTIN:    10AAICG9768N1ZZ")
    print()
    print("🌐 Platform URL:")
    print("   https://app.eka-ai.in (after deployment)")
    print()

if __name__ == "__main__":
    setup_initial_data()
