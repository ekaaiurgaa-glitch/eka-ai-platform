#!/usr/bin/env python3
"""
EKA-AI Platform - End-to-End Workflow Testing
Tests the complete flow: Job Card → PDI → Invoice
"""

import requests
import json
from datetime import datetime, timedelta
import jwt
import time

# Configuration
BASE_URL = "http://localhost:8001/api"
JWT_SECRET = "9pOPM8OgvBPhCnxQorVsT3LlFdxIYaPAAz371QcGS7E5AcSI4p34DO31WTQ="

# Test data
TEST_USER_ID = "test-user-001"
TEST_WORKSHOP_ID = "test-workshop-001"
TEST_EMAIL = "admin@go4garage.com"

def generate_token(user_id=TEST_USER_ID, role="OWNER", workshop_id=TEST_WORKSHOP_ID):
    """Generate JWT token for testing"""
    payload = {
        "sub": user_id,
        "role": role,
        "workshop_id": workshop_id,
        "email": TEST_EMAIL,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def print_section(title):
    """Print section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def print_result(test_name, success, response_data=None, error=None):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status} - {test_name}")
    if response_data:
        print(f"Response: {json.dumps(response_data, indent=2)}")
    if error:
        print(f"Error: {error}")

class WorkflowTester:
    def __init__(self):
        self.token = generate_token()
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        self.job_card_id = None
        self.pdi_checklist_id = None
        self.invoice_id = None
    
    def test_health(self):
        """Test 0: Health Check"""
        print_section("TEST 0: HEALTH CHECK")
        try:
            response = requests.get(f"{BASE_URL}/health")
            success = response.status_code == 200
            print_result("Health Check", success, response.json())
            return success
        except Exception as e:
            print_result("Health Check", False, error=str(e))
            return False
    
    def test_create_job_card(self):
        """Test 1: Create Job Card"""
        print_section("TEST 1: CREATE JOB CARD")
        
        data = {
            "registration_number": "MH01AB1234",
            "symptoms": ["Engine making unusual noise", "Brake feels soft"],
            "customer_name": "Rahul Sharma",
            "customer_phone": "+91-9876543210",
            "customer_email": "rahul@example.com",
            "odometer_reading": 45000,
            "fuel_level": "HALF",
            "reported_issues": "Customer reports engine noise at high RPM and soft brake pedal"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/job-cards", json=data, headers=self.headers)
            
            if response.status_code == 200 or response.status_code == 201:
                result = response.json()
                self.job_card_id = result.get('id') or result.get('job_card_id')
                print_result("Create Job Card", True, result)
                return True
            else:
                error_msg = response.text[:300]
                print_result("Create Job Card", False, error=f"Status {response.status_code}: {error_msg}")
                return False
        except Exception as e:
            print_result("Create Job Card", False, error=str(e))
            return False
    
    def test_get_job_card(self):
        """Test 2: Get Job Card Details"""
        print_section("TEST 2: GET JOB CARD DETAILS")
        
        if not self.job_card_id:
            print_result("Get Job Card", False, error="No job card ID available")
            return False
        
        try:
            response = requests.get(f"{BASE_URL}/job-cards/{self.job_card_id}", headers=self.headers)
            
            if response.status_code == 200:
                result = response.json()
                print_result("Get Job Card", True, result)
                return True
            else:
                print_result("Get Job Card", False, error=f"Status {response.status_code}: {response.text[:300]}")
                return False
        except Exception as e:
            print_result("Get Job Card", False, error=str(e))
            return False
    
    def test_get_valid_transitions(self):
        """Test 3: Get Valid FSM Transitions"""
        print_section("TEST 3: GET VALID FSM TRANSITIONS")
        
        if not self.job_card_id:
            print_result("Get Valid Transitions", False, error="No job card ID available")
            return False
        
        try:
            response = requests.get(f"{BASE_URL}/job-cards/{self.job_card_id}/transitions", headers=self.headers)
            
            if response.status_code == 200:
                result = response.json()
                print_result("Get Valid Transitions", True, result)
                return True
            else:
                print_result("Get Valid Transitions", False, error=f"Status {response.status_code}")
                return False
        except Exception as e:
            print_result("Get Valid Transitions", False, error=str(e))
            return False
    
    def test_transition_state(self, target_state, notes):
        """Test 4: Transition Job Card State"""
        print_section(f"TEST 4: TRANSITION TO {target_state}")
        
        if not self.job_card_id:
            print_result(f"Transition to {target_state}", False, error="No job card ID available")
            return False
        
        data = {
            "target_state": target_state,
            "notes": notes
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/job-cards/{self.job_card_id}/transition",
                json=data,
                headers=self.headers
            )
            
            if response.status_code == 200:
                result = response.json()
                print_result(f"Transition to {target_state}", True, result)
                return True
            else:
                print_result(f"Transition to {target_state}", False, error=f"Status {response.status_code}: {response.text[:300]}")
                return False
        except Exception as e:
            print_result(f"Transition to {target_state}", False, error=str(e))
            return False
    
    def test_create_pdi_checklist(self):
        """Test 5: Create PDI Checklist"""
        print_section("TEST 5: CREATE PDI CHECKLIST")
        
        if not self.job_card_id:
            print_result("Create PDI Checklist", False, error="No job card ID available")
            return False
        
        data = {
            "job_card_id": self.job_card_id,
            "category": "STANDARD"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/pdi/checklists", json=data, headers=self.headers)
            
            if response.status_code == 200 or response.status_code == 201:
                result = response.json()
                self.pdi_checklist_id = result.get('id') or result.get('checklist_id')
                print_result("Create PDI Checklist", True, result)
                return True
            else:
                print_result("Create PDI Checklist", False, error=f"Status {response.status_code}: {response.text[:300]}")
                return False
        except Exception as e:
            print_result("Create PDI Checklist", False, error=str(e))
            return False
    
    def test_update_pdi_items(self):
        """Test 6: Update PDI Checklist Items"""
        print_section("TEST 6: UPDATE PDI ITEMS")
        
        if not self.pdi_checklist_id:
            print_result("Update PDI Items", False, error="No PDI checklist ID available")
            return False
        
        # Update a few items
        items_to_update = [
            ("EXT_BODY_PAINT", True, "Paint condition good"),
            ("EXT_LIGHTS", True, "All lights working"),
            ("INT_DASHBOARD", True, "Dashboard clean and functional"),
            ("MECH_ENGINE_OIL", True, "Oil level good")
        ]
        
        all_success = True
        for item_code, checked, notes in items_to_update:
            data = {
                "checked": checked,
                "notes": notes
            }
            
            try:
                response = requests.put(
                    f"{BASE_URL}/pdi/checklists/{self.pdi_checklist_id}/items/{item_code}",
                    json=data,
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    print(f"  ✅ Updated {item_code}")
                else:
                    print(f"  ❌ Failed to update {item_code}: {response.status_code}")
                    all_success = False
            except Exception as e:
                print(f"  ❌ Error updating {item_code}: {str(e)}")
                all_success = False
        
        print_result("Update PDI Items", all_success)
        return all_success
    
    def test_complete_pdi(self):
        """Test 7: Complete PDI with Technician Declaration"""
        print_section("TEST 7: COMPLETE PDI")
        
        if not self.pdi_checklist_id:
            print_result("Complete PDI", False, error="No PDI checklist ID available")
            return False
        
        data = {
            "technician_declaration": True,
            "completion_notes": "All checks completed. Vehicle is in good condition and ready for delivery."
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/pdi/checklists/{self.pdi_checklist_id}/complete",
                json=data,
                headers=self.headers
            )
            
            if response.status_code == 200:
                result = response.json()
                print_result("Complete PDI", True, result)
                return True
            else:
                print_result("Complete PDI", False, error=f"Status {response.status_code}: {response.text[:300]}")
                return False
        except Exception as e:
            print_result("Complete PDI", False, error=str(e))
            return False
    
    def test_create_invoice(self):
        """Test 8: Create Invoice"""
        print_section("TEST 8: CREATE INVOICE")
        
        if not self.job_card_id:
            print_result("Create Invoice", False, error="No job card ID available")
            return False
        
        data = {
            "job_card_id": self.job_card_id,
            "parts": [
                {
                    "part_code": "BRK-PAD-F-SW",
                    "description": "Brake Pads Front - Maruti Swift",
                    "hsn_code": "87083010",
                    "quantity": 1,
                    "unit_price": 2000.00,
                    "gst_rate": 28.0
                },
                {
                    "part_code": "OIL-ENG-5W30",
                    "description": "Engine Oil 5W-30 Synthetic (4L)",
                    "hsn_code": "27101990",
                    "quantity": 1,
                    "unit_price": 2500.00,
                    "gst_rate": 28.0
                }
            ],
            "labor": [
                {
                    "service_code": "SRV-BRK-SVC",
                    "description": "Brake Service Complete",
                    "sac_code": "998714",
                    "hours": 2.0,
                    "rate": 1200.00,
                    "gst_rate": 18.0
                },
                {
                    "service_code": "SRV-OIL-CHG",
                    "description": "Engine Oil Change Service",
                    "sac_code": "998714",
                    "hours": 0.5,
                    "rate": 500.00,
                    "gst_rate": 18.0
                }
            ],
            "customer_state": "27",
            "notes": "Work completed as per customer requirements"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/invoices", json=data, headers=self.headers)
            
            if response.status_code == 200 or response.status_code == 201:
                result = response.json()
                self.invoice_id = result.get('id') or result.get('invoice_id')
                print_result("Create Invoice", True, result)
                return True
            else:
                error_msg = response.text[:300]
                print_result("Create Invoice", False, error=f"Status {response.status_code}: {error_msg}")
                return False
        except Exception as e:
            print_result("Create Invoice", False, error=str(e))
            return False
    
    def test_get_invoice(self):
        """Test 9: Get Invoice Details"""
        print_section("TEST 9: GET INVOICE DETAILS")
        
        if not self.invoice_id:
            print_result("Get Invoice", False, error="No invoice ID available")
            return False
        
        try:
            response = requests.get(f"{BASE_URL}/invoices/{self.invoice_id}", headers=self.headers)
            
            if response.status_code == 200:
                result = response.json()
                print_result("Get Invoice", True, result)
                return True
            else:
                print_result("Get Invoice", False, error=f"Status {response.status_code}")
                return False
        except Exception as e:
            print_result("Get Invoice", False, error=str(e))
            return False
    
    def run_all_tests(self):
        """Run complete end-to-end workflow"""
        print("\n" + "🚀" * 40)
        print("  EKA-AI PLATFORM - END-TO-END WORKFLOW TESTING")
        print("🚀" * 40)
        
        results = {}
        
        # Test 0: Health Check
        results['health'] = self.test_health()
        
        # Test 1: Create Job Card
        results['create_job_card'] = self.test_create_job_card()
        
        if results['create_job_card']:
            # Test 2: Get Job Card
            results['get_job_card'] = self.test_get_job_card()
            
            # Test 3: Get Valid Transitions
            results['get_transitions'] = self.test_get_valid_transitions()
            
            # Test 4: Transition through states
            results['transition_confidence'] = self.test_transition_state(
                "CONFIDENCE_CONFIRMED",
                "Customer confirmed understanding of diagnosis"
            )
            
            if results['transition_confidence']:
                results['transition_context'] = self.test_transition_state(
                    "VEHICLE_CONTEXT_COLLECTED",
                    "Vehicle details and history collected"
                )
            
            # Test 5: Create PDI Checklist
            results['create_pdi'] = self.test_create_pdi_checklist()
            
            if results['create_pdi']:
                # Test 6: Update PDI Items
                results['update_pdi'] = self.test_update_pdi_items()
                
                # Test 7: Complete PDI
                results['complete_pdi'] = self.test_complete_pdi()
            
            # Test 8: Create Invoice
            results['create_invoice'] = self.test_create_invoice()
            
            if results['create_invoice']:
                # Test 9: Get Invoice
                results['get_invoice'] = self.test_get_invoice()
        
        # Print Summary
        print_section("TEST SUMMARY")
        
        total = len(results)
        passed = sum(1 for v in results.values() if v)
        failed = total - passed
        
        print(f"\nTotal Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        print("\nDetailed Results:")
        for test, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status} - {test}")
        
        # Diagnosis
        if not results.get('create_job_card'):
            print("\n" + "⚠️" * 40)
            print("  DIAGNOSIS: Database Schema Not Deployed")
            print("⚠️" * 40)
            print("\nThe job card creation failed, which indicates the database")
            print("schema has not been deployed to Supabase yet.")
            print("\nTo fix this:")
            print("1. Open Supabase Dashboard: https://gymkrbjujghwvphessns.supabase.co")
            print("2. Navigate to SQL Editor")
            print("3. Copy and run: /app/backend/database/schema_complete.sql")
            print("4. Create workshop and user as per documentation")
            print("5. Re-run this test")
        
        return passed == total

if __name__ == "__main__":
    tester = WorkflowTester()
    success = tester.run_all_tests()
    
    exit(0 if success else 1)
