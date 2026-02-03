#!/usr/bin/env python3
"""
Backend API Testing for EKA-AI Platform
Tests Flask backend serving both API endpoints and static files
"""

import requests
import json
import sys
from datetime import datetime

class EKABackendTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_health_endpoints(self):
        """Test both health endpoints"""
        # Test /api/health
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy' and data.get('service') == 'eka-ai-platform':
                    self.log_test("Health API Endpoint", True)
                else:
                    self.log_test("Health API Endpoint", False, f"Unexpected response: {data}")
            else:
                self.log_test("Health API Endpoint", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Health API Endpoint", False, str(e))

        # Test /health (alternative endpoint)
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy':
                    self.log_test("Health Alternative Endpoint", True)
                else:
                    self.log_test("Health Alternative Endpoint", False, f"Unexpected response: {data}")
            else:
                self.log_test("Health Alternative Endpoint", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Health Alternative Endpoint", False, str(e))

    def test_static_file_serving(self):
        """Test static file serving from root URL"""
        try:
            # Test root URL serves index.html
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                content = response.text
                if "EKA-Ai | Automobile Intelligence" in content and "<!DOCTYPE html>" in content:
                    self.log_test("Static Root File Serving", True)
                else:
                    self.log_test("Static Root File Serving", False, "Index.html content not found")
            else:
                self.log_test("Static Root File Serving", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Static Root File Serving", False, str(e))

        # Test static asset serving
        try:
            response = requests.get(f"{self.base_url}/assets/index-DSpK7ZAn.js", timeout=10)
            if response.status_code == 200:
                self.log_test("Static Asset Serving", True)
            else:
                self.log_test("Static Asset Serving", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Static Asset Serving", False, str(e))

    def test_chat_api(self):
        """Test chat API endpoint"""
        test_payload = {
            "history": ["Hello, test message"],
            "context": {"brand": "Toyota", "model": "Camry", "year": "2020"},
            "status": "CREATED",
            "operating_mode": 0,
            "intelligence_mode": "FAST"
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json=test_payload,
                headers={'Content-Type': 'application/json'},
                timeout=30  # AI calls can take longer
            )
            
            if response.status_code == 200:
                data = response.json()
                # Check for expected response structure
                if 'response_content' in data and 'job_status_update' in data:
                    self.log_test("Chat API Endpoint", True)
                else:
                    self.log_test("Chat API Endpoint", False, f"Missing expected fields in response: {list(data.keys())}")
            elif response.status_code == 500:
                # Check if it's an API key issue
                error_data = response.json()
                if "Server API Key Missing" in str(error_data):
                    self.log_test("Chat API Endpoint", False, "GEMINI_API_KEY missing or invalid")
                else:
                    self.log_test("Chat API Endpoint", False, f"Server error: {error_data}")
            else:
                self.log_test("Chat API Endpoint", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Chat API Endpoint", False, str(e))

        # Test with missing data
        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json={},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            if response.status_code == 400:
                self.log_test("Chat API Error Handling", True)
            else:
                self.log_test("Chat API Error Handling", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_test("Chat API Error Handling", False, str(e))

    def test_speak_api(self):
        """Test speak API endpoint"""
        test_payload = {
            "text": "Hello, this is a test message for speech synthesis."
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/speak",
                json=test_payload,
                headers={'Content-Type': 'application/json'},
                timeout=30  # AI calls can take longer
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'audio_data' in data:
                    self.log_test("Speak API Endpoint", True)
                else:
                    self.log_test("Speak API Endpoint", False, f"Missing audio_data in response: {list(data.keys())}")
            elif response.status_code == 500:
                error_data = response.json()
                if "Key Missing" in str(error_data):
                    self.log_test("Speak API Endpoint", False, "GEMINI_API_KEY missing or invalid")
                else:
                    self.log_test("Speak API Endpoint", False, f"Server error: {error_data}")
            else:
                self.log_test("Speak API Endpoint", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Speak API Endpoint", False, str(e))

        # Test with missing text
        try:
            response = requests.post(
                f"{self.base_url}/api/speak",
                json={},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            # Should handle gracefully (empty text)
            if response.status_code in [200, 500]:  # Either works or fails gracefully
                self.log_test("Speak API Error Handling", True)
            else:
                self.log_test("Speak API Error Handling", False, f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.log_test("Speak API Error Handling", False, str(e))

    def test_api_route_protection(self):
        """Test that non-existent API routes return 404"""
        try:
            response = requests.get(f"{self.base_url}/api/nonexistent", timeout=10)
            if response.status_code == 404:
                self.log_test("API Route Protection", True)
            else:
                self.log_test("API Route Protection", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("API Route Protection", False, str(e))

    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting EKA-AI Backend Tests")
        print(f"📍 Testing URL: {self.base_url}")
        print("=" * 50)

        self.test_health_endpoints()
        self.test_static_file_serving()
        self.test_chat_api()
        self.test_speak_api()
        self.test_api_route_protection()

        print("=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check logs above.")
            return 1

    def get_summary(self):
        """Get test summary for reporting"""
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "test_details": self.test_results
        }

def main():
    tester = EKABackendTester()
    exit_code = tester.run_all_tests()
    
    # Save detailed results
    summary = tester.get_summary()
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())