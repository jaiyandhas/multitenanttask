# Multi-Tenant Task Management System

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.x-404D59?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Docker](https://img.shields.io/badge/Docker-Supported-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A robust, production-ready Multi-Tenant Task Management System designed with **Schema-Per-Tenant** architecture in PostgreSQL. Built with a Node.js/Express backend and a modern React frontend.

It provides strong data isolation, fine-grained Role-Based Access Control (RBAC), and a comprehensive audit trail for task management.

## Architecture Overview

Browser (React)
     │
     ▼
Express API (Node.js)
     │
     ▼
Tenant Middleware (extracts tenantSlug from JWT)
     │
     └─── SET search_path TO tenant_<slug>
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
tenant_acme  tenant_stark  public
(users,tasks) (users,tasks) (organizations)

## Tech Stack

| Layer | Technology | Why |
|------|------------|-----|
| UI | React + Vite | Fast local dev + simple component model |
| Styling | Tailwind CSS | Quick, consistent UI without bespoke CSS |
| API | Express (Node.js) | Minimal, explicit routing + middleware composition |
| Auth | JWT | Stateless auth, easy to pass tenant context |
| RBAC | Permissions embedded in JWT | Avoid DB lookup per request |
| DB | PostgreSQL 16 | Strong relational model + JSONB audit payloads |
| Tenant isolation | Schema-per-tenant + `search_path` | Strong isolation without separate DBs |
| Containers | Docker + docker compose | One-command end-to-end startup |

## Why Schema-Per-Tenant?

| Approach | Isolation | Complexity | Scalability |
|---------|-----------|------------|-------------|
| Row-level | Weak | Low | Medium |
| Schema-per-tenant | Strong | Medium | High |
| Separate DBs | Strongest | High | Very High |

This project uses **schema-per-tenant** because it provides a strong security boundary while staying operationally simple: the API sets `search_path` **per request** based on the JWT’s `tenantSlug`, so all unqualified table access automatically stays within that tenant.

## RBAC Design

Permissions are defined centrally in `backend/src/permissions/index.js` and embedded into the JWT at login time.

### Permission matrix

| Permission | Admin | Manager | Member |
|------------|:-----:|:-------:|:------:|
| `task:create` | ✅ | ✅ | ❌ |
| `task:delete` | ✅ | ❌ | ❌ |
| `task:view:all` | ✅ | ✅ | ❌ |
| `task:view:own` | ❌ | ❌ | ✅ |
| `task:assign` | ✅ | ✅ | ❌ |
| `task:update` | ❌ | ✅ | ❌ |
| `task:update:own` | ❌ | ❌ | ✅ |
| `user:manage` | ✅ | ❌ | ❌ |
| `user:remove` | ✅ | ❌ | ❌ |
| `user:invite` | ✅ | ❌ | ❌ |

### Why `permissions[]` live in the JWT

The API can authorize requests via `requirePermission('...')` without a DB lookup on every call, and the authorization decision is stable for the token lifetime (**24h**).

## Audit Log Design

Each tenant schema contains a `task_audit_log` table that stores **structured** before/after snapshots:

- `old_value` (JSONB): the task row before the change
- `new_value` (JSONB): the task row after the change

This is superior to plain string messages because it’s **queryable** (filter by fields), **diffable** (compute changes), and **extensible** (new task fields don’t require audit schema changes).

## Security Considerations

- **JWT expiry (24h)**: after expiry, API calls return 401 and the user must log in again.
- **bcrypt saltRounds=10**: a practical baseline that balances security and latency for interactive logins.
- **Tenant isolation via `search_path`**: each request sets `SET search_path TO tenant_<slug>, public`, preventing cross-tenant reads/writes as long as queries avoid hardcoding other schemas.
- **CORS (dev)**: locked to `http://localhost:5173` by default (override with `CORS_ORIGIN`).
- **Invite tokens**: single-purpose JWTs with `{ type: 'invite' }` and a **24h** expiry.

## Docker Setup

```bash
docker compose up --build
```

That’s it. Postgres, backend, and frontend start together. The backend auto-provisions tenant schemas on startup so cold-start containers work.

## Local Development Setup (without Docker)

### Prereqs

- Node.js 20+
- PostgreSQL (ability to `CREATE SCHEMA` and `CREATE EXTENSION pgcrypto`)

### Backend

```bash
cd backend
cp .env.example .env
npm install

# point DATABASE_URL at your local postgres db "tasksystem"
npm run seed
npm run dev
```

Backend defaults to `http://localhost:4000` (set `PORT=5000` if you want parity with Docker).

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Demo Credentials

| Org | Org Slug | Role | Email | Password |
|-----|----------|------|-------|----------|
| Acme Corp | `acme` | admin | `admin@acme.com` | `password123` |
| Acme Corp | `acme` | manager | `manager@acme.com` | `password123` |
| Acme Corp | `acme` | member | `member@acme.com` | `password123` |
| Stark Industries | `stark` | admin | `admin@stark.com` | `password123` |

## API Reference

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/health` | public | — | Liveness check |
| POST | `/api/auth/register-org` | public | — | Create org + admin user, returns JWT |
| POST | `/api/auth/login` | public | — | Login to an existing org, returns JWT |
| POST | `/api/auth/register` | public | — | Register via invite token, returns JWT |
| GET | `/api/tasks` | ✅ | `task:view:all` or `task:view:own` | List tasks (scoped by permissions) |
| POST | `/api/tasks` | ✅ | `task:create` | Create a task (writes audit log) |
| PATCH | `/api/tasks/:id` | ✅ | `task:update` or `task:update:own` | Update a task (writes audit log) |
| PATCH | `/api/tasks/:id/status` | ✅ | `task:update` or `task:update:own` | Change status (writes audit log) |
| DELETE | `/api/tasks/:id` | ✅ | `task:delete` | Delete a task (writes audit log) |
| GET | `/api/tasks/stats` | ✅ | `task:view:all` | Dashboard stats (admin/manager only) |
| GET | `/api/tasks/:id/audit` | ✅ | `task:view:all` | Audit timeline (admin/manager only) |
| GET | `/api/users/invite/:token` | public | — | Validate invite token + show org context |
| GET | `/api/users` | ✅ | `task:view:all` | List users (admin/manager only) |
| POST | `/api/users/invite-link` | ✅ | `user:manage` | Create invite link (admin only) |
| PATCH | `/api/users/:id/role` | ✅ | `user:manage` | Change user role (admin only) |
| DELETE | `/api/users/:id` | ✅ | `user:remove` | Remove user (admin only) |

## Recent Improvements (v1.1.0)

### ✨ Production Readiness

This version includes comprehensive security, testing, and performance improvements:

- **🔒 Security Hardening**: Environment-based secrets management, rate limiting, input validation
- **🧪 Testing Infrastructure**: Jest backend tests, Vitest frontend tests with full coverage support
- **⚡ Performance**: Database indexes on all critical columns, pagination support
- **📊 Error Handling**: Enhanced error boundaries, request logging, better error messages
- **📚 Documentation**: API docs, security guide, testing guide, FIXES_SUMMARY

### Key Additions

| Feature | Status | Details |
|---------|--------|---------|
| Input Validation | ✅ | Joi schemas for all endpoints, email/password validation |
| Rate Limiting | ✅ | Auth endpoints (5/15min), API endpoints (100/15min, configurable) |
| Request Logging | ✅ | Per-request timing and status logging |
| Database Indexes | ✅ | Optimized queries on tasks, users, audit logs |
| Pagination | ✅ | `/api/tasks?page=1&limit=20`, max 100 items/page |
| Error Boundaries | ✅ | React error boundary with graceful UI fallback |
| Alert System | ✅ | Context-based notifications for user actions |
| Test Framework | ✅ | Jest (backend) + Vitest (frontend) with coverage tracking |

### Documentation

- **[SECURITY.md](SECURITY.md)** — Security features, production checklist, environment setup
- **[TESTING.md](TESTING.md)** — Testing guide with backend/frontend examples
- **[API.md](API.md)** — Full API reference with request/response examples
- **[FIXES_SUMMARY.md](FIXES_SUMMARY.md)** — Detailed changelog of all improvements

### Running Tests

```bash
# Backend tests
cd backend
npm test                 # Run all tests once
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Frontend tests
cd frontend
npm test                 # Run all tests once
npm run test:watch      # Watch mode
npm test -- --ui        # Open test UI dashboard
```

### Environment Configuration

Required environment variables (see `.env.example`):

```bash
DATABASE_URL=postgres://user:password@localhost:5432/tasksystem
JWT_SECRET=generate-a-secure-key-for-production
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
PORT=5000
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # per window
```

For local development, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
# Edit .env.local with local database credentials
```

### Production Deployment

1. Generate a secure JWT_SECRET: `openssl rand -base64 32`
2. Review [SECURITY.md](SECURITY.md) production checklist
3. Set `NODE_ENV=production` and `AUTO_SEED=false`
4. Configure database with strong password
5. Set appropriate `CORS_ORIGIN` for your domain
6. Enable HTTPS and security headers (see nginx config in SECURITY.md)

## If I Had More Time

- Rate limiting per tenant
- WebSocket live task updates
- Tenant deletion (`DROP SCHEMA tenant_<slug> CASCADE`)
- Task comments
- Email notifications on task assignment
- OAuth (Google) for password-free login
- Admin super-dashboard across all tenants

