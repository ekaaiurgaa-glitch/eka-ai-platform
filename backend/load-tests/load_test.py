#!/usr/bin/env python3
"""
EKA-AI Load Testing Suite
Tests API endpoints under various load conditions

Usage:
    python load_test.py --endpoint /api/chat --users 50 --duration 60
    python load_test.py --all --users 100 --duration 300
"""

import asyncio
import aiohttp
import time
import argparse
import json
import statistics
from datetime import datetime
from typing import List, Dict
import sys

# Configuration
BASE_URL = "https://eka-ai.go4garage.in"  # Production
# BASE_URL = "http://localhost:8001"      # Local

ENDPOINTS = {
    "/api/health": {
        "method": "GET",
        "payload": None,
        "auth_required": False,
        "expected_status": 200
    },
    "/api/chat": {
        "method": "POST",
        "payload": {
            "history": [{"role": "user", "parts": [{"text": "My car won't start"}]}],
            "context": {"brand": "Maruti", "model": "Swift", "year": "2020"},
            "status": "CREATED",
            "intelligence_mode": "FAST",
            "operating_mode": 0
        },
        "auth_required": True,
        "expected_status": 200
    },
    "/api/mg/calculate": {
        "method": "POST",
        "payload": {
            "assured_km": 12000,
            "rate": 10.50,
            "actual_km": 1500,
            "months_in_cycle": 1,
            "excess_rate": 15.00
        },
        "auth_required": True,
        "expected_status": 200
    },
    "/api/billing/calculate": {
        "method": "POST",
        "payload": {
            "items": [
                {"description": "Brake Pad", "quantity": 2, "unit_price": 500.00, "gst_rate": 28.0},
                {"description": "Labor", "quantity": 1, "unit_price": 800.00, "gst_rate": 18.0}
            ],
            "workshop_state": "27",
            "customer_state": "27"
        },
        "auth_required": True,
        "expected_status": 200
    },
    "/api/job/transitions": {
        "method": "GET",
        "payload": None,
        "auth_required": True,
        "expected_status": 200,
        "query_params": {"job_id": "test-job-id"}
    }
}

class LoadTestResult:
    def __init__(self):
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.response_times: List[float] = []
        self.errors: List[str] = []
        self.status_codes: Dict[int, int] = {}
        
    def add_result(self, success: bool, response_time: float, status_code: int = None, error: str = None):
        self.total_requests += 1
        if success:
            self.successful_requests += 1
            self.response_times.append(response_time)
        else:
            self.failed_requests += 1
            if error:
                self.errors.append(error)
        
        if status_code:
            self.status_codes[status_code] = self.status_codes.get(status_code, 0) + 1
    
    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return (self.successful_requests / self.total_requests) * 100
    
    @property
    def avg_response_time(self) -> float:
        if not self.response_times:
            return 0.0
        return statistics.mean(self.response_times)
    
    @property
    def p50_response_time(self) -> float:
        if not self.response_times:
            return 0.0
        return statistics.median(self.response_times)
    
    @property
    def p95_response_time(self) -> float:
        if not self.response_times:
            return 0.0
        sorted_times = sorted(self.response_times)
        index = int(len(sorted_times) * 0.95)
        return sorted_times[index]
    
    @property
    def p99_response_time(self) -> float:
        if not self.response_times:
            return 0.0
        sorted_times = sorted(self.response_times)
        index = int(len(sorted_times) * 0.99)
        return sorted_times[index]
    
    def print_summary(self, endpoint: str):
        print(f"\n{'='*60}")
        print(f"Load Test Results: {endpoint}")
        print(f"{'='*60}")
        print(f"Total Requests:      {self.total_requests}")
        print(f"Successful:          {self.successful_requests} ({self.success_rate:.2f}%)")
        print(f"Failed:              {self.failed_requests}")
        print(f"\nResponse Times:")
        print(f"  Average:           {self.avg_response_time:.3f}s")
        print(f"  Median (P50):      {self.p50_response_time:.3f}s")
        print(f"  P95:               {self.p95_response_time:.3f}s")
        print(f"  P99:               {self.p99_response_time:.3f}s")
        print(f"  Min:               {min(self.response_times):.3f}s" if self.response_times else "  Min:               N/A")
        print(f"  Max:               {max(self.response_times):.3f}s" if self.response_times else "  Max:               N/A")
        print(f"\nStatus Codes:")
        for code, count in sorted(self.status_codes.items()):
            print(f"  {code}: {count}")
        if self.errors:
            print(f"\nErrors (showing first 5):")
            for error in self.errors[:5]:
                print(f"  - {error}")


class LoadTester:
    def __init__(self, base_url: str, jwt_token: str = None):
        self.base_url = base_url
        self.jwt_token = jwt_token
        self.results = {}
        
    def get_headers(self, auth_required: bool) -> Dict:
        headers = {"Content-Type": "application/json"}
        if auth_required and self.jwt_token:
            headers["Authorization"] = f"Bearer {self.jwt_token}"
        return headers
    
    async def make_request(self, session: aiohttp.ClientSession, endpoint: str, config: Dict) -> tuple:
        """Make a single request and return (success, response_time, status_code, error)"""
        url = f"{self.base_url}{endpoint}"
        method = config["method"]
        payload = config.get("payload")
        auth_required = config["auth_required"]
        expected_status = config["expected_status"]
        query_params = config.get("query_params")
        
        headers = self.get_headers(auth_required)
        
        start_time = time.time()
        try:
            async with session.request(
                method=method,
                url=url,
                headers=headers,
                json=payload,
                params=query_params,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                await response.text()
                response_time = time.time() - start_time
                
                success = response.status == expected_status
                return success, response_time, response.status, None
                
        except asyncio.TimeoutError:
            response_time = time.time() - start_time
            return False, response_time, None, "Timeout"
        except Exception as e:
            response_time = time.time() - start_time
            return False, response_time, None, str(e)
    
    async def user_session(self, session: aiohttp.ClientSession, endpoint: str, config: Dict, duration: int):
        """Simulate a user session making requests for a duration"""
        result = LoadTestResult()
        end_time = time.time() + duration
        
        while time.time() < end_time:
            success, resp_time, status, error = await self.make_request(session, endpoint, config)
            result.add_result(success, resp_time, status, error)
            
            # Small delay between requests (think time)
            await asyncio.sleep(0.1)
        
        return result
    
    async def run_load_test(self, endpoint: str, num_users: int, duration: int):
        """Run load test for an endpoint"""
        if endpoint not in ENDPOINTS:
            print(f"Unknown endpoint: {endpoint}")
            return
        
        config = ENDPOINTS[endpoint]
        print(f"\nStarting load test for {endpoint}")
        print(f"Users: {num_users}, Duration: {duration}s")
        print(f"Expected RPS: ~{num_users * 10:.0f}")
        
        connector = aiohttp.TCPConnector(limit=1000, limit_per_host=100)
        async with aiohttp.ClientSession(connector=connector) as session:
            # Create user tasks
            tasks = [
                self.user_session(session, endpoint, config, duration)
                for _ in range(num_users)
            ]
            
            # Run all users concurrently
            results = await asyncio.gather(*tasks)
            
            # Merge results
            merged = LoadTestResult()
            for r in results:
                merged.total_requests += r.total_requests
                merged.successful_requests += r.successful_requests
                merged.failed_requests += r.failed_requests
                merged.response_times.extend(r.response_times)
                merged.errors.extend(r.errors)
                for code, count in r.status_codes.items():
                    merged.status_codes[code] = merged.status_codes.get(code, 0) + count
            
            merged.print_summary(endpoint)
            self.results[endpoint] = merged
            
            # Return pass/fail
            return merged.success_rate >= 95 and merged.p95_response_time < 5.0
    
    async def run_all_tests(self, num_users: int, duration: int):
        """Run load tests for all endpoints"""
        print(f"\n{'#'*60}")
        print(f"# EKA-AI LOAD TEST SUITE")
        print(f"# Target: {self.base_url}")
        print(f"# Users: {num_users}, Duration: {duration}s")
        print(f"# Time: {datetime.now().isoformat()}")
        print(f"{'#'*60}")
        
        all_passed = True
        
        for endpoint in ENDPOINTS:
            passed = await self.run_load_test(endpoint, num_users, duration)
            all_passed = all_passed and passed
            await asyncio.sleep(2)  # Cool down between tests
        
        # Print final summary
        print(f"\n{'#'*60}")
        print(f"# FINAL SUMMARY")
        print(f"{'#'*60}")
        for endpoint, result in self.results.items():
            status = "✅ PASS" if result.success_rate >= 95 and result.p95_response_time < 5.0 else "❌ FAIL"
            print(f"{status} {endpoint}: {result.success_rate:.1f}% @ P95={result.p95_response_time:.3f}s")
        
        return all_passed


def main():
    parser = argparse.ArgumentParser(description='EKA-AI Load Testing')
    parser.add_argument('--endpoint', type=str, help='Single endpoint to test')
    parser.add_argument('--all', action='store_true', help='Test all endpoints')
    parser.add_argument('--users', type=int, default=10, help='Number of concurrent users')
    parser.add_argument('--duration', type=int, default=60, help='Test duration in seconds')
    parser.add_argument('--url', type=str, default=BASE_URL, help='Base URL')
    parser.add_argument('--token', type=str, help='JWT token for authenticated endpoints')
    
    args = parser.parse_args()
    
    if not args.endpoint and not args.all:
        print("Error: Specify --endpoint or --all")
        parser.print_help()
        sys.exit(1)
    
    tester = LoadTester(args.url, args.token)
    
    try:
        if args.all:
            passed = asyncio.run(tester.run_all_tests(args.users, args.duration))
        else:
            passed = asyncio.run(tester.run_load_test(args.endpoint, args.users, args.duration))
        
        sys.exit(0 if passed else 1)
        
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)


if __name__ == '__main__':
    main()
