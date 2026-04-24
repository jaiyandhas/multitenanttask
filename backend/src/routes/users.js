const express = require('express');
const { withTenantClient } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { listUsers, updateUserRole, removeUser } = require('../services/usersService');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/invite-link', requirePermission('user:manage'), async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!role) return res.status(400).json({ error: 'role is required' });
    if (!['manager', 'member'].includes(role)) {
      return res.status(400).json({ error: 'role must be manager or member' });
    }

    const payload = { tenantSlug: req.user.tenantSlug, role, type: 'invite' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
    const inviteLink = `http://localhost:5173/invite/${token}`;
    return res.json({ inviteLink });
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

