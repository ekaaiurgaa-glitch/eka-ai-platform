#!/usr/bin/env python3
"""
EKA-AI Stress Testing Suite
Finds breaking point of the system

Usage:
    python stress_test.py --endpoint /api/chat --start-users 10 --max-users 200 --step 20
"""

import asyncio
import aiohttp
import time
import argparse
import json
from datetime import datetime
from typing import List, Dict, Optional
import sys

BASE_URL = "https://eka-ai.go4garage.in"

class StressTestResult:
    def __init__(self, concurrent_users: int):
        self.concurrent_users = concurrent_users
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.response_times: List[float] = []
        self.errors: Dict[str, int] = {}
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
        
    @property
    def duration(self) -> float:
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return 0.0
    
    @property
    def rps(self) -> float:
        if self.duration > 0:
            return self.total_requests / self.duration
        return 0.0
    
    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return (self.successful_requests / self.total_requests) * 100
    
    @property
    def avg_response_time(self) -> float:
        if not self.response_times:
            return 0.0
        return sum(self.response_times) / len(self.response_times)
    
    @property
    def p95_response_time(self) -> float:
        if not self.response_times:
            return 0.0
        sorted_times = sorted(self.response_times)
        index = int(len(sorted_times) * 0.95)
        return sorted_times[index] if index < len(sorted_times) else sorted_times[-1]
    
    def is_healthy(self) -> bool:
        """Determine if system is healthy at this load level"""
        return (
            self.success_rate >= 95 and
            self.p95_response_time < 5.0 and
            self.avg_response_time < 2.0
        )


class StressTester:
    def __init__(self, base_url: str, jwt_token: str = None):
        self.base_url = base_url
        self.jwt_token = jwt_token
        self.results: List[StressTestResult] = []
        
    def get_headers(self) -> Dict:
        headers = {"Content-Type": "application/json"}
        if self.jwt_token:
            headers["Authorization"] = f"Bearer {self.jwt_token}"
        return headers
    
    async def make_request(self, session: aiohttp.ClientSession, endpoint: str, payload: Dict) -> tuple:
        """Make a request and return (success, response_time, error_type)"""
        url = f"{self.base_url}{endpoint}"
        start_time = time.time()
        
        try:
            async with session.post(
                url,
                headers=self.get_headers(),
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                await response.text()
                response_time = time.time() - start_time
                
                success = 200 <= response.status < 300
                error_type = None if success else f"HTTP_{response.status}"
                return success, response_time, error_type
                
        except asyncio.TimeoutError:
            response_time = time.time() - start_time
            return False, response_time, "TIMEOUT"
        except aiohttp.ClientError as e:
            response_time = time.time() - start_time
            return False, response_time, f"CLIENT_ERROR: {type(e).__name__}"
        except Exception as e:
            response_time = time.time() - start_time
            return False, response_time, f"ERROR: {type(e).__name__}"
    
    async def user_worker(self, session: aiohttp.ClientSession, endpoint: str, payload: Dict, 
                          result: StressTestResult, duration: int, stop_event: asyncio.Event):
        """Worker that makes requests until duration expires or stop event is set"""
        end_time = time.time() + duration
        
        while time.time() < end_time and not stop_event.is_set():
            success, resp_time, error = await self.make_request(session, endpoint, payload)
            
            result.total_requests += 1
            if success:
                result.successful_requests += 1
                result.response_times.append(resp_time)
            else:
                result.failed_requests += 1
                result.errors[error] = result.errors.get(error, 0) + 1
            
            # Small delay to prevent hammering
            await asyncio.sleep(0.05)
    
    async def run_stress_level(self, endpoint: str, payload: Dict, 
                               concurrent_users: int, duration: int) -> StressTestResult:
        """Run stress test at a specific concurrency level"""
        result = StressTestResult(concurrent_users)
        stop_event = asyncio.Event()
        
        print(f"\nTesting with {concurrent_users} concurrent users...")
        
        connector = aiohttp.TCPConnector(limit=concurrent_users + 10)
        async with aiohttp.ClientSession(connector=connector) as session:
            result.start_time = time.time()
            
            # Create workers
            workers = [
                self.user_worker(session, endpoint, payload, result, duration, stop_event)
                for _ in range(concurrent_users)
            ]
            
            # Run for specified duration
            await asyncio.gather(*workers)
            
            result.end_time = time.time()
        
        return result
    
    def print_result(self, result: StressTestResult):
        """Print stress test result"""
        status = "✅ HEALTHY" if result.is_healthy() else "❌ DEGRADED"
        
        print(f"\n{'='*60}")
        print(f"Concurrent Users: {result.concurrent_users}")
        print(f"Status: {status}")
        print(f"{'='*60}")
        print(f"Total Requests:    {result.total_requests}")
        print(f"Successful:        {result.successful_requests} ({result.success_rate:.1f}%)")
        print(f"Failed:            {result.failed_requests}")
        print(f"Duration:          {result.duration:.2f}s")
        print(f"RPS:               {result.rps:.2f}")
        print(f"Avg Response:      {result.avg_response_time:.3f}s")
        print(f"P95 Response:      {result.p95_response_time:.3f}s")
        
        if result.errors:
            print(f"\nError Breakdown:")
            for error, count in sorted(result.errors.items(), key=lambda x: -x[1])[:5]:
                print(f"  {error}: {count}")
    
    async def find_breaking_point(self, endpoint: str, payload: Dict, 
                                   start_users: int, max_users: int, step: int):
        """Find the breaking point by gradually increasing load"""
        print(f"\n{'#'*60}")
        print(f"# EKA-AI STRESS TEST")
        print(f"# Endpoint: {endpoint}")
        print(f"# Range: {start_users} - {max_users} users, Step: {step}")
        print(f"# Time: {datetime.now().isoformat()}")
        print(f"{'#'*60}")
        
        breaking_point = None
        
        for users in range(start_users, max_users + 1, step):
            result = await self.run_stress_level(endpoint, payload, users, duration=60)
            self.results.append(result)
            self.print_result(result)
            
            if not result.is_healthy() and breaking_point is None:
                breaking_point = users
                print(f"\n⚠️  BREAKING POINT DETECTED at {users} users")
                
                # Ask if user wants to continue
                response = input("Continue testing? (y/n): ")
                if response.lower() != 'y':
                    break
        
        self.print_summary(breaking_point)
        return breaking_point
    
    def print_summary(self, breaking_point: Optional[int]):
        """Print final summary of all stress levels"""
        print(f"\n{'#'*60}")
        print(f"# STRESS TEST SUMMARY")
        print(f"{'#'*60}")
        print(f"{'Users':<10} {'RPS':<10} {'Success%':<10} {'Avg RT':<10} {'P95 RT':<10} {'Status':<10}")
        print("-" * 60)
        
        for result in self.results:
            status = "HEALTHY" if result.is_healthy() else "DEGRADED"
            print(f"{result.concurrent_users:<10} {result.rps:<10.1f} {result.success_rate:<10.1f} "
                  f"{result.avg_response_time:<10.3f} {result.p95_response_time:<10.3f} {status:<10}")
        
        if breaking_point:
            print(f"\n⚠️  System breaking point: ~{breaking_point} concurrent users")
            print(f"    Recommendation: Set max capacity at {int(breaking_point * 0.7)} users (70% of breaking point)")
        else:
            print(f"\n✅ System handled all tested load levels successfully")


def main():
    parser = argparse.ArgumentParser(description='EKA-AI Stress Testing')
    parser.add_argument('--endpoint', type=str, default='/api/chat',
                        help='Endpoint to stress test')
    parser.add_argument('--start-users', type=int, default=10,
                        help='Starting number of concurrent users')
    parser.add_argument('--max-users', type=int, default=200,
                        help='Maximum number of concurrent users')
    parser.add_argument('--step', type=int, default=20,
                        help='Increment step for users')
    parser.add_argument('--url', type=str, default=BASE_URL,
                        help='Base URL')
    parser.add_argument('--token', type=str,
                        help='JWT token for authentication')
    
    args = parser.parse_args()
    
    # Default payload for chat endpoint
    payload = {
        "history": [{"role": "user", "parts": [{"text": "My car won't start"}]}],
        "context": {"brand": "Maruti", "model": "Swift", "year": "2020"},
        "status": "CREATED",
        "intelligence_mode": "FAST",
        "operating_mode": 0
    }
    
    if args.endpoint == '/api/mg/calculate':
        payload = {
            "assured_km": 12000,
            "rate": 10.50,
            "actual_km": 1500,
            "months_in_cycle": 1
        }
    elif args.endpoint == '/api/billing/calculate':
        payload = {
            "items": [
                {"description": "Brake Pad", "quantity": 2, "unit_price": 500.00, "gst_rate": 28.0}
            ],
            "workshop_state": "27",
            "customer_state": "27"
        }
    
    tester = StressTester(args.url, args.token)
    
    try:
        breaking_point = asyncio.run(tester.find_breaking_point(
            args.endpoint,
            payload,
            args.start_users,
            args.max_users,
            args.step
        ))
        
        sys.exit(0 if breaking_point is None else 1)
        
    except KeyboardInterrupt:
        print("\n\nStress test interrupted")
        sys.exit(1)


if __name__ == '__main__':
    main()
