# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of EKA-AI Platform seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report a Security Vulnerability

Please report security vulnerabilities by emailing the project maintainers. Include the following information:

* Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
* Full paths of source file(s) related to the manifestation of the issue
* The location of the affected source code (tag/branch/commit or direct URL)
* Any special configuration required to reproduce the issue
* Step-by-step instructions to reproduce the issue
* Proof-of-concept or exploit code (if possible)
* Impact of the issue, including how an attacker might exploit it

### What to Expect

* **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours.
* **Communication**: We will keep you informed about our progress addressing the vulnerability.
* **Credit**: If you wish, we will publicly credit you for responsibly disclosing the issue after we've released a fix.
* **Disclosure Timeline**: We aim to patch critical vulnerabilities within 7 days and non-critical issues within 30 days.

## Security Best Practices

### For Developers

1. **API Keys and Secrets**
   - Never commit API keys, passwords, or secrets to the repository
   - Use environment variables for all sensitive configuration
   - Always use `.env` files and ensure they're in `.gitignore`
   - Rotate API keys regularly

2. **Dependencies**
   - Keep all dependencies up to date
   - Run `npm audit` and `pip check` regularly
   - Review and update dependencies with known vulnerabilities immediately

3. **Backend Security**
   - API keys are stored server-side only (never exposed to client)
   - Flask backend uses environment-based configuration
   - CORS is configured but should be restricted in production
   - Input validation on all API endpoints

4. **Frontend Security**
   - No sensitive data in client-side code
   - All API calls go through the backend proxy
   - Content Security Policy headers recommended for production

### For Deployment

1. **Production Environment**
   ```bash
   # Set production environment
   FLASK_ENV=production
   
   # Use strong API keys
   GEMINI_API_KEY=<your-secure-key>
   
   # Use gunicorn instead of Flask dev server
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

2. **HTTPS/TLS**
   - Always use HTTPS in production
   - Configure SSL/TLS certificates properly
   - Use a reverse proxy (nginx/Apache) with security headers

3. **Access Control**
   - Implement authentication if needed
   - Use rate limiting to prevent abuse
   - Monitor and log all API access
   - Set up IP allowlisting if appropriate

4. **Server Configuration**
   - Keep server software updated
   - Use firewall to restrict access
   - Disable debug mode in production
   - Configure proper CORS origins (not `*`)

5. **Monitoring**
   - Set up error tracking (e.g., Sentry)
   - Monitor for unusual API usage patterns
   - Regular security audits
   - Log and review access patterns

## Security Checklist

Before deploying to production:

- [ ] All API keys are in environment variables (never in code)
- [ ] `.env` files are in `.gitignore`
- [ ] `FLASK_ENV=production` is set
- [ ] Using gunicorn (not Flask dev server)
- [ ] HTTPS/TLS is configured
- [ ] CORS is restricted to specific origins
- [ ] Rate limiting is configured
- [ ] Authentication is implemented (if required)
- [ ] Security headers are configured
- [ ] Dependencies are up to date
- [ ] Security scanning is enabled
- [ ] Monitoring and alerting are set up
- [ ] Backup and recovery procedures are in place

## Security Features

### Current Implementation

1. **API Key Protection**
   - Gemini API key stored only on backend
   - Never exposed to browser/client
   - Environment-based configuration

2. **Input Validation**
   - Request validation on backend endpoints
   - Error handling with safe error messages
   - No sensitive information in error responses

3. **CORS Configuration**
   - flask-cors properly configured
   - Can be restricted to specific domains

### Recommended Enhancements

1. **Rate Limiting**
   - Add Flask-Limiter for API rate limiting
   - Prevent abuse and DoS attacks

2. **Authentication**
   - Add user authentication if needed
   - JWT tokens for API access
   - Session management

3. **Request Logging**
   - Log all API requests
   - Track and monitor usage patterns
   - Detect anomalies

4. **Security Headers**
   - Content-Security-Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security

## Known Security Considerations

1. **API Key Management**
   - The Gemini API key must be kept secure
   - Rotate keys periodically
   - Use separate keys for dev/staging/production

2. **CORS Configuration**
   - Default configuration allows all origins (development only)
   - Must be restricted in production to specific domains

3. **Input Sanitization**
   - User inputs are passed to Gemini API
   - Validate and sanitize all inputs
   - Be aware of prompt injection risks

## Additional Resources

* [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
* [Flask Security Best Practices](https://flask.palletsprojects.com/en/latest/security/)
* [React Security Best Practices](https://react.dev/learn/security)
* [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)

## Contact

For security-related questions or concerns, please contact the project maintainers.

---

**Remember**: Security is everyone's responsibility. If you see something, say something.
