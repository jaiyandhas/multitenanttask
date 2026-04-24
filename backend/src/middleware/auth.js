const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { setTenantContext } = require('./tenant');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) return res.status(401).json({ error: 'Missing Bearer token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

async function withTenantClient(req, fn) {
  const client = await pool.connect();
  try {
    await setTenantContext(client, req.user.tenantSlug);
    return await fn(client);
  } finally {
    client.release();
  }
}

module.exports = { authRequired, withTenantClient };

