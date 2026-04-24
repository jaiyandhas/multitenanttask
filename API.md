# API Documentation

## Authentication Endpoints

### Register Organization

**POST** `/api/auth/register-org`

Create a new organization and admin user.

**Request:**
```json
{
  "orgName": "Acme Corporation",
  "adminName": "John Doe",
  "email": "john@acme.com",
  "password": "SecurePassword123"
}
```

**Response (201):**
```json
{
  "userId": "uuid",
  "token": "jwt-token",
  "tenantSlug": "acme_corporation"
}
```

### Register with Invite

**POST** `/api/auth/register`

Join an existing organization via invite token.

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@acme.com",
  "password": "SecurePassword123",
  "inviteToken": "invite-jwt-token"
}
```

**Response (201):**
```json
{
  "userId": "uuid",
  "token": "jwt-token",
  "tenantSlug": "acme_corporation"
}
```

### Login

**POST** `/api/auth/login`

Authenticate a user.

**Request:**
```json
{
  "email": "john@acme.com",
  "password": "SecurePassword123",
  "orgSlug": "acme_corporation"
}
```

**Response (200):**
```json
{
  "userId": "uuid",
  "token": "jwt-token",
  "tenantSlug": "acme_corporation"
}
```

## Tasks Endpoints

All tasks endpoints require authentication (Bearer token in Authorization header).

### List Tasks

**GET** `/api/tasks?page=1&limit=20`

Get paginated list of tasks based on user permissions.

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page

**Response (200):**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Complete project",
      "description": "...",
      "status": "inprogress",
      "priority": "high",
      "assigned_to": "uuid",
      "assignee_name": "Jane Smith",
      "due_date": "2026-05-01",
      "created_at": "2026-04-24T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### Create Task

**POST** `/api/tasks`

Create a new task. Requires `task:create` permission.

**Request:**
```json
{
  "title": "Fix bug in auth",
  "description": "JWT token validation failing",
  "priority": "high",
  "status": "todo",
  "assignedTo": "uuid",
  "dueDate": "2026-05-01"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Fix bug in auth",
  ...
}
```

### Get Task Stats

**GET** `/api/tasks/stats`

Get task statistics. Requires `task:view:all` permission.

**Response (200):**
```json
{
  "total": 150,
  "byStatus": {
    "todo": 50,
    "inprogress": 75,
    "done": 25
  },
  "overdue": 5,
  "topAssignee": {
    "name": "Jane Smith",
    "taskCount": 20
  }
}
```

### Update Task

**PATCH** `/api/tasks/:id`

Update an existing task.

**Request:**
```json
{
  "status": "done",
  "priority": "medium"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  ...
}
```

### Delete Task

**DELETE** `/api/tasks/:id`

Delete a task. Requires `task:delete` permission.

**Response (204):** No content

## Users Endpoints

### List Users

**GET** `/api/users`

Get list of users in organization. Requires `user:manage` permission.

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@acme.com",
      "role": "admin",
      "created_at": "2026-04-24T10:00:00Z"
    }
  ]
}
```

### Invite User

**POST** `/api/users/invite`

Send invite token to a new user. Requires `user:invite` permission.

**Request:**
```json
{
  "email": "newuser@acme.com",
  "role": "member"
}
```

**Response (201):**
```json
{
  "email": "newuser@acme.com",
  "inviteToken": "jwt-token",
  "expiresIn": "24h"
}
```

### Remove User

**DELETE** `/api/users/:id`

Remove a user from organization. Requires `user:remove` permission.

**Response (204):** No content

## Error Responses

All endpoints return errors in this format:

**Response (4xx/5xx):**
```json
{
  "error": "Error message",
  "stack": "Error stack trace (development only)"
}
```

Common status codes:
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `429` - Too many requests (rate limited)
- `500` - Internal server error

## Rate Limiting

Rate limit headers included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640000000
```

When rate limited (429):
```json
{
  "error": "Too many requests, please try again later"
}
```
