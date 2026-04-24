# Quick Start Guide - Enhanced Version

This guide helps you get started with the improved Multi-Tenant Task Management System.

## 📋 What's New

- ✅ **Security**: Environment variables, rate limiting, input validation
- ✅ **Testing**: Jest (backend) and Vitest (frontend) with base tests
- ✅ **Performance**: Database indexes, pagination support
- ✅ **Reliability**: Error boundaries, request logging
- ✅ **Documentation**: Complete API, security, and testing guides

## 🚀 First Time Setup

### Using Docker (Recommended)

```bash
# 1. Create local environment file
cp .env.example .env.local

# 2. Start all services
docker-compose up --build

# 3. Access the app
# Frontend: http://localhost
# Backend: http://localhost:5001/api
# Database: localhost:5432
```

### Local Development

#### Prerequisites
- Node.js 20+
- PostgreSQL 16+

#### Backend Setup

```bash
cd backend

# 1. Copy environment template
cp .env.example .env

# 2. Update .env with your database URL
# Edit .env and set:
# DATABASE_URL=postgres://user:password@localhost:5432/tasksystem

# 3. Install dependencies
npm install

# 4. Seed database (optional, for demo data)
npm run seed

# 5. Start development server
npm run dev
# Runs on http://localhost:5000
```

#### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
# Runs on http://localhost:5173
```

## 🧪 Running Tests

### Backend

```bash
cd backend

# Run all tests
npm test

# Watch mode (reruns on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Currently tests:
# - RBAC middleware
# - Input validation
# - Tenant schema naming
```

### Frontend

```bash
cd frontend

# Run all tests
npm test

# Watch mode
npm run test:watch

# Open test UI dashboard
npm test -- --ui

# Generate coverage report
npm run test:coverage

# Currently tests:
# - ErrorBoundary component
```

## 🔒 Security Features

### Environment Variables

All sensitive data is now managed via environment variables:

```bash
# Example from .env.local
DATABASE_URL=postgres://postgres:postgres@localhost:5432/tasksystem
JWT_SECRET=dev-secret-key-change-in-production
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Important**: Never commit `.env` files to version control.

### Rate Limiting

Automatic rate limiting on:
- **Auth endpoints** (login, register): 5 requests per 15 minutes
- **API endpoints**: 100 requests per 15 minutes (configurable)

### Input Validation

All request bodies are validated using Joi schemas:
- Email addresses
- Passwords (minimum 8 characters)
- Organization slugs (alphanumeric + underscore)
- Unknown fields are automatically stripped

## 📊 Features

### Pagination

Tasks endpoint supports pagination:

```
GET /api/tasks?page=1&limit=20
```

Response includes pagination metadata:
```json
{
  "tasks": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Error Handling

- **Frontend**: Error Boundary catches React errors gracefully
- **Backend**: Enhanced error middleware with request logging
- **Logging**: All requests logged with method, path, status, and duration

## 📚 Documentation

- **[API.md](API.md)** — Full API reference with examples
- **[SECURITY.md](SECURITY.md)** — Security guide and production checklist
- **[TESTING.md](TESTING.md)** — Testing guide with examples
- **[FIXES_SUMMARY.md](FIXES_SUMMARY.md)** — Complete changelog

## 🧑‍💻 Development Workflow

### Adding a New API Endpoint

1. **Define validation schema** in `src/validation/`
2. **Add route handler** in `src/routes/`
3. **Apply validation middleware**: `validateBody(schema)`
4. **Add tests** in `__tests__/`

Example:
```javascript
const { validateBody } = require('../middleware/validation');
const { createSchema } = require('../validation/schemas');

router.post('/tasks', validateBody(createSchema), async (req, res, next) => {
  try {
    const result = await createTask(req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});
```

### Adding a New Component

1. **Create component** in `src/components/`
2. **Add tests** in `src/components/*.test.jsx`
3. **Use error boundaries** for error handling

Example:
```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />)
    expect(screen.getByText(/expected/i)).toBeInTheDocument()
  })
})
```

## 🔧 Database Performance

Indexes have been added to:
- `users.email` - Fast lookups by email
- `tasks.status` - Filter by task status
- `tasks.priority` - Filter by priority
- `tasks.assigned_to` - Find tasks by assignee
- `tasks.created_at` - Sort by creation time
- `task_audit_log.task_id` - Quick audit lookups

Indexes are created automatically on app startup.

## 🚨 Troubleshooting

### "Rate limited" error
- Wait 15 minutes or check rate limit variables
- In development, set `NODE_ENV=test` to disable limiting

### Validation errors
- Check `.env` has valid DATABASE_URL
- Ensure input matches required schema (check API.md)
- Unknown fields are automatically removed

### Tests not running
```bash
cd backend
npm install  # Ensure jest/supertest are installed
npm test

# Similar for frontend
cd frontend
npm install
npm test
```

### Database connection error
- Check `DATABASE_URL` in `.env` is correct
- Ensure PostgreSQL is running
- Verify database exists and user has permissions

## 📦 Production Deployment

See [SECURITY.md](SECURITY.md) for complete production checklist.

Key steps:
1. Generate secure JWT_SECRET: `openssl rand -base64 32`
2. Use environment variables for all secrets
3. Set `NODE_ENV=production`
4. Enable HTTPS and security headers
5. Configure appropriate database backups
6. Set up monitoring and logging

## 💡 Next Steps

1. **Read the documentation**: Start with [API.md](API.md)
2. **Run the tests**: `npm test` to see what's covered
3. **Check security**: Review [SECURITY.md](SECURITY.md)
4. **Add more tests**: Expand test coverage for your features
5. **Deploy**: Follow production checklist for deployment

---

**Questions?** Check the documentation files or review FIXES_SUMMARY.md for all improvements.
