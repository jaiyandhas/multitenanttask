# Security & Configuration Guide

## Environment Variables

### Setup

1. Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

2. For production, create `.env` with secure values:

```bash
# Never commit .env to version control
DATABASE_URL=postgres://user:password@host:5432/dbname
JWT_SECRET=generate-a-secure-random-key-here
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
AUTO_SEED=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Generating a Secure JWT Secret

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
```

### Required Variables

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgres://user:pass@localhost:5432/tasksystem` | PostgreSQL connection |
| `JWT_SECRET` | `abcd1234...` | JWT token signing key |
| `NODE_ENV` | `production` or `development` | Environment mode |
| `PORT` | `5000` | Express server port |
| `CORS_ORIGIN` | `https://app.example.com` | Allowed CORS origin |
| `AUTO_SEED` | `false` | Auto-seed on startup |

## Security Features

### Authentication & Authorization

- **JWT Tokens**: 24-hour expiry with embedded permissions
- **RBAC**: Three roles - Admin, Manager, Member
- **Password Hashing**: bcrypt with 10 salt rounds
- **Invite Tokens**: Single-use JWT tokens for user invitations

### Tenant Isolation

- **Schema-per-tenant**: Each organization has its own PostgreSQL schema
- **Request-level context**: `SET search_path` prevents cross-tenant access
- **SQL Injection Protection**: Parameterized queries throughout

### Rate Limiting

- **Auth endpoints**: 5 requests per 15 minutes per IP
- **API endpoints**: 100 requests per 15 minutes per IP (configurable)
- **Disabled in tests**: Skipped when `NODE_ENV=test`

### Input Validation

All endpoints validate input with Joi schemas:

- **Email/URL validation**: RFC 5322 compliant
- **Password requirements**: Minimum 8 characters
- **Org slug validation**: Alphanumeric + underscore only
- **Unknown fields stripped**: Extra fields removed from requests

## Production Deployment Checklist

- [ ] Generate new `JWT_SECRET` using `openssl rand -base64 32`
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database password
- [ ] Enable HTTPS (set CORS_ORIGIN to https://)
- [ ] Configure appropriate RATE_LIMIT values
- [ ] Set `AUTO_SEED=false`
- [ ] Review and test all environment variables
- [ ] Set up database backups
- [ ] Enable database SSL connections
- [ ] Review security headers in nginx config
- [ ] Set up monitoring and alerting
- [ ] Configure log aggregation

## Docker Secrets Management

For Docker deployments, use secret files instead of environment variables:

```yaml
services:
  backend:
    environment:
      DATABASE_URL: postgres://user:password@postgres:5432/tasksystem
      JWT_SECRET_FILE: /run/secrets/jwt_secret
```

## HTTPS & Security Headers

For production, ensure Nginx (or your reverse proxy) includes:

```nginx
# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Reporting Security Issues

⚠️  **Do not open public issues for security vulnerabilities.**

Please email security concerns to the maintainers directly.
