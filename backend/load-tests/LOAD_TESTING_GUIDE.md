# EKA-AI Load Testing Guide

## Overview

This load testing suite validates the performance and stability of EKA-AI under various load conditions.

## Test Types

### 1. Load Test (`load_test.py`)
Simulates expected production load to verify system performance.

**Use Cases:**
- Pre-deployment validation
- Capacity planning
- Performance regression testing

**Criteria:**
- Success rate >= 95%
- P95 response time < 5 seconds
- P99 response time < 10 seconds
- No timeout errors

### 2. Stress Test (`stress_test.py`)
Gradually increases load to find the breaking point.

**Use Cases:**
- Find maximum capacity
- Identify performance degradation patterns
- Validate auto-scaling policies

**Criteria:**
- System remains healthy (success rate >= 95%, P95 < 5s) until breaking point
- Graceful degradation after breaking point
- No data corruption

## Installation

```bash
# Install dependencies
pip install aiohttp

# Make scripts executable
chmod +x load_test.py
chmod +x stress_test.py
```

## Running Tests

### Load Test - Single Endpoint

```bash
# Test /api/health with 50 users for 60 seconds
python load_test.py \
    --endpoint /api/health \
    --users 50 \
    --duration 60

# Test authenticated endpoint
python load_test.py \
    --endpoint /api/chat \
    --users 30 \
    --duration 120 \
    --token "your-jwt-token"
```

### Load Test - All Endpoints

```bash
# Test all endpoints sequentially
python load_test.py \
    --all \
    --users 20 \
    --duration 60 \
    --token "your-jwt-token"
```

### Stress Test

```bash
# Find breaking point starting from 10 users, up to 200, stepping by 20
python stress_test.py \
    --endpoint /api/chat \
    --start-users 10 \
    --max-users 200 \
    --step 20 \
    --token "your-jwt-token"
```

## Test Scenarios

### Scenario 1: Baseline Performance

```bash
python load_test.py --all --users 10 --duration 60
```

**Expected Results:**
- All endpoints respond < 500ms
- 100% success rate
- No errors

### Scenario 2: Normal Production Load

```bash
python load_test.py --all --users 50 --duration 300
```

**Expected Results:**
- P95 response time < 2s
- Success rate >= 99%
- Stable RPS

### Scenario 3: Peak Load

```bash
python load_test.py --endpoint /api/chat --users 100 --duration 300
```

**Expected Results:**
- P95 response time < 5s
- Success rate >= 95%
- No cascading failures

### Scenario 4: Breaking Point Analysis

```bash
python stress_test.py --endpoint /api/chat --start-users 50 --max-users 500 --step 50
```

**Expected Results:**
- Linear scaling until ~200 users
- Breaking point identified
- System recovers after load reduction

## Interpreting Results

### Example Output - Load Test

```
============================================================
Load Test Results: /api/chat
============================================================
Total Requests:      5000
Successful:          4950 (99.00%)
Failed:              50

Response Times:
  Average:           0.856s
  Median (P50):      0.742s
  P95:               2.134s
  P99:               3.567s
  Min:               0.234s
  Max:               5.123s

Status Codes:
  200: 4950
  429: 50

✅ PASS: Success rate >= 95% and P95 < 5s
```

### Example Output - Stress Test

```
============================================================
Concurrent Users: 200
Status: ❌ DEGRADED
============================================================
Total Requests:    12000
Successful:        10800 (90.00%)
Failed:            1200
Duration:          60.00s
RPS:               200.00
Avg Response:      8.234s
P95 Response:      15.432s

Error Breakdown:
  TIMEOUT: 800
  HTTP_503: 400

⚠️  BREAKING POINT DETECTED at 200 users
```

## Performance Benchmarks

### Target Metrics (Production)

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| P50 Latency | < 500ms | 500ms-1s | > 1s |
| P95 Latency | < 2s | 2s-5s | > 5s |
| P99 Latency | < 5s | 5s-10s | > 10s |
| Error Rate | < 1% | 1%-5% | > 5% |
| RPS | > 100 | 50-100 | < 50 |

### Endpoint-Specific Targets

| Endpoint | Expected P95 | Max RPS |
|----------|-------------|---------|
| /api/health | 100ms | 1000 |
| /api/chat | 3s | 50 |
| /api/mg/calculate | 500ms | 200 |
| /api/billing/calculate | 500ms | 200 |
| /api/job/transition | 300ms | 300 |

## Automated Testing

### CI/CD Integration

```yaml
# .github/workflows/load-test.yml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install aiohttp
      
      - name: Run load tests
        run: |
          python backend/load-tests/load_test.py \
            --all \
            --users 20 \
            --duration 60 \
            --url https://staging.eka-ai.go4garage.in \
            --token ${{ secrets.STAGING_JWT_TOKEN }}
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: load_test_results.json
```

### Monitoring Integration

```python
# Send metrics to monitoring
import requests

def report_metrics(result):
    metrics = {
        'metric': 'eka_ai_response_time',
        'points': [[time.time(), result.p95_response_time]],
        'tags': ['endpoint:/api/chat', 'env:production']
    }
    
    requests.post(
        'https://api.datadoghq.com/api/v1/series',
        headers={'DD-API-KEY': 'your-key'},
        json={'series': [metrics]}
    )
```

## Troubleshooting

### High Error Rates

**Symptoms:**
- Success rate < 95%
- HTTP 503 errors

**Possible Causes:**
- Server overloaded
- Database connection pool exhausted
- Rate limiting triggered

**Solutions:**
- Check server logs
- Increase connection pool size
- Review rate limiting configuration

### High Latency

**Symptoms:**
- P95 > 5 seconds
- Timeout errors

**Possible Causes:**
- Database slow queries
- External API latency (Gemini/Claude)
- Insufficient server resources

**Solutions:**
- Optimize database queries
- Add caching layer
- Scale horizontally

### Connection Errors

**Symptoms:**
- CLIENT_ERROR in logs
- Connection refused

**Possible Causes:**
- Server down
- Network issues
- SSL certificate problems

**Solutions:**
- Verify server health
- Check network connectivity
- Validate SSL certificates

## Best Practices

1. **Test in Staging First**
   - Always run load tests in staging before production
   - Use production-like data volumes

2. **Gradual Load Increase**
   - Start with small load, gradually increase
   - Monitor system metrics during tests

3. **Test During Off-Peak Hours**
   - Schedule production tests during low-traffic periods
   - Notify team before running tests

4. **Document Results**
   - Save all test results for trend analysis
   - Compare results between releases

5. **Set Up Alerts**
   - Configure alerts for performance degradation
   - Monitor error rates during tests

## Advanced Usage

### Custom Payloads

Edit the `ENDPOINTS` dictionary in `load_test.py`:

```python
"/api/custom": {
    "method": "POST",
    "payload": {
        "custom_field": "custom_value"
    },
    "auth_required": True,
    "expected_status": 200
}
```

### Distributed Load Testing

Use multiple machines to simulate higher load:

```bash
# Machine 1
python load_test.py --endpoint /api/chat --users 50 --duration 300

# Machine 2
python load_test.py --endpoint /api/chat --users 50 --duration 300

# Machine 3
python load_test.py --endpoint /api/chat --users 50 --duration 300

# Total: 150 concurrent users
```

## Support

For issues or questions:
- Check server logs: `/var/log/eka-ai/`
- Review monitoring dashboards
- Contact: devops@go4garage.in
