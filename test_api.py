#!/usr/bin/env python3
"""
EKA-AI API Testing Script
Tests all major endpoints without authentication first, then with JWT
"""

import requests
import json
from datetime import datetime, timedelta
import jwt

BASE_URL = "http://localhost:8001/api"

# JWT Configuration (from backend/.env)
JWT_SECRET = "9pOPM8OgvBPhCnxQorVsT3LlFdxIYaPAAz371QcGS7E5AcSI4p34DO31WTQ="

def generate_test_token(user_id="test-user", role="OWNER", workshop_id="test-workshop"):
    """Generate a test JWT token"""
    payload = {
        "sub": user_id,
        "role": role,
        "workshop_id": workshop_id,
        "email": "test@example.com",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def test_health():
    """Test health endpoint (no auth required)"""
    print("\n🧪 Testing: GET /health")
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_mg_calculate_with_auth():
    """Test MG calculation with authentication"""
    print("\n🧪 Testing: POST /mg/calculate (with auth)")
    
    token = generate_test_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "assured_km": 12000,
        "rate": 10.5,
        "actual_km": 10500,
        "months_in_cycle": 1
    }
    
    response = requests.post(f"{BASE_URL}/mg/calculate", json=data, headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_billing_calculate_with_auth():
    """Test billing calculation with authentication"""
    print("\n🧪 Testing: POST /billing/calculate (with auth)")
    
    token = generate_test_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "items": [
            {"quantity": 2, "unit_price": 1000, "gst_rate": 18},
            {"quantity": 1, "unit_price": 500, "gst_rate": 28}
        ],
        "workshop_state": "27",
        "customer_state": "27"
    }
    
    response = requests.post(f"{BASE_URL}/billing/calculate", json=data, headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_job_cards_without_db():
    """Test job card endpoint (will fail without DB schema)"""
    print("\n🧪 Testing: POST /job-cards (without DB)")
    
    token = generate_test_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "registration_number": "MH01AB1234",
        "symptoms": ["Engine making noise"],
        "customer_phone": "+91-9876543210"
    }
    
    response = requests.post(f"{BASE_URL}/job-cards", json=data, headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
        return True
    else:
        print(f"   Error: {response.text[:200]}")
        print("   ⚠️  Expected - Database schema not deployed yet")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("EKA-AI API Testing")
    print("=" * 60)
    
    results = {
        "health": test_health(),
        "mg_calculate": test_mg_calculate_with_auth(),
        "billing_calculate": test_billing_calculate_with_auth(),
        "job_cards": test_job_cards_without_db()
    }
    
    print("\n" + "=" * 60)
    print("Test Results:")
    print("=" * 60)
    for test, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test}")
    
    print("\n" + "=" * 60)
    passed_count = sum(results.values())
    total_count = len(results)
    print(f"Summary: {passed_count}/{total_count} tests passed")
    print("=" * 60)
    
    if not results["job_cards"]:
        print("\n⚠️  Note: Job card tests failed because database schema")
        print("   needs to be deployed. This is expected.")
        print("   Deploy schema first, then re-run tests.")

if __name__ == "__main__":
    main()
