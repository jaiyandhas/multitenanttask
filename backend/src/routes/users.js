const express = require('express');
const bcrypt = require('bcryptjs');
const { withTenantClient } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { listUsers, updateUserRole, removeUser } = require('../services/usersService');
const { pool } = require('../config/db');
const { tenantSchemaName } = require('../middleware/tenant');

const router = express.Router();

// Admin directly adds a new member or manager (no invite link needed)
router.post('/add', requirePermission('user:manage'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, and role are required' });
    }
    if (!['manager', 'member'].includes(role)) {
      return res.status(400).json({ error: 'role must be manager or member' });
    }

    const tenantSlug = req.user.tenantSlug;
    const schema = tenantSchemaName(tenantSlug);
    const safeEmail = String(email).trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO ${schema}.users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, created_at`,
        [name, safeEmail, passwordHash, role]
      );
      await client.query(
        `INSERT INTO public.user_tenants (email, tenant_slug) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`,
        [safeEmail, tenantSlug]
      );
      await client.query('COMMIT');
      return res.status(201).json({ user: result.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        return res.status(409).json({ error: 'A user with that email already exists' });
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    return next(err);
  }
});

router.get('/', requirePermission('task:view:all'), async (req, res, next) => {
  try {
    const users = await withTenantClient(req, (client) =>
      listUsers(client, {
        tenantSlug: req.user.tenantSlug
      })
    );
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id/role', requirePermission('user:manage'), async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!role) return res.status(400).json({ error: 'role is required' });

    const user = await withTenantClient(req, (client) =>
      updateUserRole(client, {
        tenantSlug: req.user.tenantSlug,
        permissions: req.user.permissions,
        userId: req.params.id,
        role
      })
    );
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', requirePermission('user:remove'), async (req, res, next) => {
  try {
    const result = await withTenantClient(req, (client) =>
      removeUser(client, {
        tenantSlug: req.user.tenantSlug,
        permissions: req.user.permissions,
        userId: req.params.id
      })
    );
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

