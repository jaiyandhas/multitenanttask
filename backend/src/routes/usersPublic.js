const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { ensurePublicSchema, provisionTenantSchema } = require('../db/schema');

const router = express.Router();

router.get('/invite/:token', async (req, res, next) => {
  try {
    await ensurePublicSchema();
    const { token } = req.params;
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid invite token' });
    }

    if (!payload || payload.type !== 'invite') {
      return res.status(401).json({ error: 'Invalid invite token' });
    }

    const tenantSlug = String(payload.tenantSlug || '').trim().toLowerCase();
    const role = payload.role;
    if (!tenantSlug || !['manager', 'member'].includes(role)) {
      return res.status(401).json({ error: 'Invalid invite token' });
    }

    const orgRes = await pool.query('SELECT name, slug FROM public.organizations WHERE slug=$1', [tenantSlug]);
    if (orgRes.rowCount === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // cold-start safety: make sure tenant schema exists
    await provisionTenantSchema(tenantSlug);

    return res.json({ tenantSlug, orgName: orgRes.rows[0].name, role });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

