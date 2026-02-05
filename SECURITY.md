# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 4.5.x   | :white_check_mark: |
| < 4.5   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within EKA-AI Platform, please follow these steps:

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email your findings to the repository maintainer
3. Include detailed steps to reproduce the vulnerability
4. Allow 48 hours for an initial response

### What to Include

- Type of vulnerability (e.g., XSS, SQL injection, authentication bypass)
- Full paths of source files related to the vulnerability
- Step-by-step instructions to reproduce
- Proof-of-concept code (if possible)
- Impact assessment

## Security Best Practices

When deploying EKA-AI Platform:

1. **Environment Variables**: Never commit `.env` files. Use `.env.example` as a template.
2. **JWT Secret**: Generate a strong secret using `openssl rand -hex 32`
3. **CORS Origins**: Only allow trusted domains in `CORS_ORIGINS`
4. **Supabase RLS**: Enable Row Level Security on all tables
5. **HTTPS**: Always deploy behind HTTPS in production
6. **Rate Limiting**: The backend includes rate limiting; ensure it's properly configured
