# Troubleshooting Guide

This guide helps diagnose and resolve common issues with the EKA-AI Platform.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Backend Issues](#backend-issues)
3. [Frontend Issues](#frontend-issues)
4. [Docker Issues](#docker-issues)
5. [API Issues](#api-issues)
6. [Performance Issues](#performance-issues)
7. [Security Issues](#security-issues)
8. [Debugging Tools](#debugging-tools)

---

## Installation Issues

### Node modules installation fails

**Symptoms:**
```
npm ERR! code EINTEGRITY
npm ERR! Verification failed
```

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Or use specific registry
npm install --registry=https://registry.npmjs.org/
```

### Python dependencies installation fails

**Symptoms:**
```
error: command 'gcc' failed
```

**Solutions:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3-dev build-essential

# macOS
xcode-select --install

# Then retry
pip install -r server/requirements.txt
```

### Permission denied errors

**Symptoms:**
```
EACCES: permission denied
```

**Solutions:**
```bash
# Fix npm permissions (Linux/macOS)
sudo chown -R $USER:$(id -gn $USER) ~/.npm
sudo chown -R $USER:$(id -gn $USER) node_modules

# Or use npx instead of global npm
npx vite

# For Python venv
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate  # Windows
```

---

## Backend Issues

### Backend won't start

**Symptoms:**
```
ModuleNotFoundError: No module named 'flask'
```

**Solutions:**
```bash
# Ensure you're in the virtual environment
cd server
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run backend
python3 app.py
```

### GEMINI_API_KEY not found

**Symptoms:**
```
Error: GEMINI_API_KEY environment variable not set
```

**Solutions:**
```bash
# 1. Create .env file
cd server
cp .env.example .env

# 2. Edit .env and add your key
nano .env  # or use your favorite editor
# Add: GEMINI_API_KEY=your_actual_key_here

# 3. Verify it's loaded
python3 -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('GEMINI_API_KEY'))"
```

### Port 5000 already in use

**Symptoms:**
```
OSError: [Errno 48] Address already in use
```

**Solutions:**
```bash
# Find process using port 5000
lsof -i :5000  # Linux/macOS
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 <PID>  # Linux/macOS
taskkill /PID <PID> /F  # Windows

# Or use a different port
export PORT=5001
python3 app.py
```

### Flask import errors

**Symptoms:**
```
ImportError: cannot import name 'Flask' from partially initialized module
```

**Solutions:**
```bash
# Ensure you're not in a directory that shadows Flask
cd server
python3 -c "import flask; print(flask.__file__)"

# Reinstall Flask
pip uninstall flask flask-cors
pip install flask==3.1.0 flask-cors==5.0.0
```

---

## Frontend Issues

### Frontend won't start

**Symptoms:**
```
Error: Cannot find module 'vite'
```

**Solutions:**
```bash
# Install dependencies
npm install

# If still fails, remove and reinstall
rm -rf node_modules package-lock.json
npm install

# Start dev server
npm run dev
```

### Port 3000 already in use

**Symptoms:**
```
Port 3000 is in use
```

**Solutions:**
```bash
# Vite will automatically try the next available port
# Or specify a different port
npx vite --port 3001

# Or update package.json:
# "dev": "vite --port 3001"
```

### Cannot connect to backend

**Symptoms:**
- "Network Error" in console
- 404 errors for API calls

**Solutions:**
```bash
# 1. Verify backend is running
curl http://localhost:5000/health

# 2. Check VITE_BACKEND_URL
cat .env.local
# Should contain: VITE_BACKEND_URL=http://localhost:5000

# 3. Check CORS
# In server/app.py, verify CORS is enabled:
# CORS(app, resources={r"/*": {"origins": "*"}})

# 4. Check browser console for errors
# Open DevTools (F12) > Console tab
```

### Build fails

**Symptoms:**
```
Error: Build failed with errors
```

**Solutions:**
```bash
# Check TypeScript errors
npm run build 2>&1 | tee build.log

# Fix type errors in code
# or temporarily disable strict mode in tsconfig.json

# Clear cache and rebuild
rm -rf dist node_modules/.vite
npm run build
```

---

## Docker Issues

### Docker build fails

**Symptoms:**
```
ERROR [internal] load metadata
```

**Solutions:**
```bash
# Check Docker is running
docker ps

# Check Dockerfile syntax
docker build --no-cache -t eka-ai-platform .

# Check Docker disk space
docker system df
docker system prune -a  # Remove unused data

# Build with verbose output
docker build --progress=plain -t eka-ai-platform .
```

### Container exits immediately

**Symptoms:**
```
docker ps  # Shows no running containers
docker ps -a  # Shows exited container
```

**Solutions:**
```bash
# Check container logs
docker logs <container_id>

# Common issues:
# 1. Missing .env file
docker run -e GEMINI_API_KEY=your_key eka-ai-platform

# 2. Port conflicts
docker run -p 5001:5000 eka-ai-platform

# 3. Check health
docker inspect --format='{{json .State.Health}}' <container_id>
```

### Docker compose issues

**Symptoms:**
```
ERROR: Service 'backend' failed to build
```

**Solutions:**
```bash
# Rebuild without cache
docker-compose build --no-cache

# Check configuration
docker-compose config

# Start with verbose output
docker-compose up --build

# Check logs
docker-compose logs -f backend
```

---

## API Issues

### Gemini API errors

**Symptoms:**
```
Error: Invalid API key
```

**Solutions:**
```bash
# 1. Verify API key
# Go to: https://makersuite.google.com/app/apikey

# 2. Check key format
# Should start with "AIza..."

# 3. Test API key
curl https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY

# 4. Check rate limits
# Free tier has limits: 60 requests per minute
```

### Timeout errors

**Symptoms:**
```
Error: Request timeout
```

**Solutions:**
```bash
# 1. Increase timeout in server/app.py
# response = model.generate_content(prompt, timeout=120)

# 2. For gunicorn, increase worker timeout
gunicorn --timeout 180 app:app

# 3. Check network connectivity
ping generativelanguage.googleapis.com
```

### CORS errors

**Symptoms:**
```
Access to fetch blocked by CORS policy
```

**Solutions:**
```python
# In server/app.py, ensure CORS is configured:
from flask_cors import CORS

# For development
CORS(app, resources={r"/*": {"origins": "*"}})

# For production (more secure)
CORS(app, resources={
    r"/*": {
        "origins": ["https://your-domain.com"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})
```

---

## Performance Issues

### Slow API responses

**Symptoms:**
- Long wait times for responses
- High CPU/memory usage

**Diagnostics:**
```bash
# Check backend logs
tail -f /var/log/eka-ai/access.log

# Monitor resources
htop  # or top

# Check gunicorn workers
ps aux | grep gunicorn
```

**Solutions:**
```bash
# 1. Increase gunicorn workers
gunicorn -w 4 --threads 2 app:app

# 2. Use production mode
export FLASK_ENV=production

# 3. Enable caching (future enhancement)
# Implement Redis or memcached

# 4. Optimize Gemini API calls
# - Reduce prompt size
# - Use streaming responses
# - Implement request queuing
```

### High memory usage

**Symptoms:**
```
MemoryError or OOM killed
```

**Solutions:**
```bash
# Check memory usage
free -h  # Linux
top  # or htop

# Reduce gunicorn workers
gunicorn -w 2 app:app

# Set memory limits (Docker)
docker run -m 512m eka-ai-platform

# Monitor and restart
# Add health checks and auto-restart
```

---

## Security Issues

### API key exposed

**Symptoms:**
- API key visible in browser
- API key in git history

**Immediate Actions:**
```bash
# 1. Revoke the exposed key immediately
# Go to: https://makersuite.google.com/app/apikey

# 2. Generate new API key

# 3. Update .env file
echo "GEMINI_API_KEY=new_key_here" > server/.env

# 4. Verify key is not in git
git log --all --full-history --source -- "*env*"

# 5. If in git history, use git filter-branch or BFG Repo Cleaner
```

### SSL/TLS certificate issues

**Symptoms:**
```
SSL certificate problem
```

**Solutions:**
```bash
# For Let's Encrypt certificates
sudo certbot renew

# Check certificate expiry
openssl s_client -connect your-domain.com:443 -servername your-domain.com | openssl x509 -noout -dates

# Force HTTPS (nginx)
# Add in nginx config:
# return 301 https://$server_name$request_uri;
```

---

## Debugging Tools

### Backend debugging

```python
# Enable Flask debug mode (development only!)
export FLASK_DEBUG=1
python3 app.py

# Add logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Print statements
print(f"Debug: {variable}")

# Use Python debugger
import pdb; pdb.set_trace()
```

### Frontend debugging

```javascript
// Browser DevTools (F12)
console.log('Debug:', variable);
console.table(arrayOfObjects);

// React DevTools extension
// Install from Chrome/Firefox extension store

// Network tab
// Monitor all API requests and responses

// Vite debug mode
// Already includes source maps
```

### Network debugging

```bash
# Test backend endpoint
curl -v http://localhost:5000/health

# Test with data
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"history":[],"context":{},"currentStatus":"CREATED"}'

# Monitor network traffic
# Use browser DevTools > Network tab
# or tcpdump/Wireshark for advanced analysis
```

### Log analysis

```bash
# Backend logs
tail -f server/app.log
grep "ERROR" server/app.log | tail -20

# System logs
journalctl -u eka-ai -f  # Systemd service
docker logs -f eka-ai  # Docker container

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Getting Help

If you're still experiencing issues:

1. **Check existing issues**: https://github.com/ekaaiurgaa-glitch/eka-ai-platform/issues
2. **Review documentation**: README.md, DEPLOYMENT.md, ARCHITECTURE.md
3. **Open a new issue**: Include:
   - Error messages (full stack trace)
   - Steps to reproduce
   - Environment details (OS, versions)
   - What you've tried
4. **Security issues**: See SECURITY.md for private reporting

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `EADDRINUSE` | Port already in use | Kill process or use different port |
| `ModuleNotFoundError` | Missing Python package | `pip install -r requirements.txt` |
| `Cannot find module` | Missing Node package | `npm install` |
| `CORS policy` | CORS not configured | Check Flask CORS settings |
| `Invalid API key` | Wrong/missing Gemini key | Check `.env` file |
| `Permission denied` | File permissions | Use `chmod` or run as correct user |
| `Connection refused` | Service not running | Start backend/frontend |
| `404 Not Found` | Wrong URL/endpoint | Check API routes |
| `Timeout` | Request too slow | Increase timeout settings |
| `Out of memory` | High resource usage | Reduce workers or increase RAM |

---

**Remember**: Check the logs first! Most issues can be diagnosed from error messages in logs.
