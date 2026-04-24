const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { pool } = require('../config/db');
const { ensurePublicSchema, provisionTenantSchema } = require('../db/schema');
const { permissionsForRole } = require('../permissions');
const { tenantSchemaName, setTenantContext } = require('../middleware/tenant');

function slugifyOrgName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
}

function signToken({ userId, tenantSlug, role }) {
  const permissions = permissionsForRole(role);
  const payload = { userId, tenantSlug, role, permissions };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
}

async function registerWithInvite({ inviteToken, name, email, password }) {
  await ensurePublicSchema();
  if (!inviteToken) {
    const err = new Error('inviteToken is required');
    err.statusCode = 400;
    throw err;
  }

  let payload;
  try {
    payload = jwt.verify(inviteToken, process.env.JWT_SECRET);
  } catch (e) {
    const err = new Error('Invalid invite token');
    err.statusCode = 401;
    throw err;
  }

  if (!payload || payload.type !== 'invite') {
    const err = new Error('Invalid invite token');
    err.statusCode = 401;
    throw err;
  }

  const tenantSlug = String(payload.tenantSlug || '').trim().toLowerCase();
  const role = payload.role;
  if (!tenantSlug || !['manager', 'member'].includes(role)) {
    const err = new Error('Invalid invite token');
    err.statusCode = 401;
    throw err;
  }

  // cold-start safety
  await provisionTenantSchema(tenantSlug);

  const orgRes = await pool.query('SELECT name, slug FROM public.organizations WHERE slug=$1', [tenantSlug]);
  if (orgRes.rowCount === 0) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const schema = tenantSchemaName(tenantSlug);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await setTenantContext(client, tenantSlug);
    const result = await client.query(
      `INSERT INTO ${schema}.users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, role`,
      [name, String(email || '').trim().toLowerCase(), passwordHash, role]
    );
    await client.query('COMMIT');

    const user = result.rows[0];
    const token = signToken({ userId: user.id, tenantSlug, role: user.role });
    return {
      token,
      tenantSlug,
      orgName: orgRes.rows[0].name,
      role: user.role,
      permissions: permissionsForRole(user.role)
    };
  } catch (e) {
    await client.query('ROLLBACK');
    if (e && e.code === '23505') {
      const err = new Error('Email already exists');
      err.statusCode = 409;
      throw err;
    }
    throw e;
  } finally {
    client.release();
  }
}

async function registerOrg({ orgName, adminName, email, password }) {
  await ensurePublicSchema();

  const baseSlug = slugifyOrgName(orgName);
  if (!baseSlug) {
    const err = new Error('Invalid organization name');
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  let tenantSlug = baseSlug;
  try {
    // pick an unused slug
    for (let i = 0; i < 50; i++) {
      const trySlug = i === 0 ? baseSlug : `${baseSlug}_${i + 1}`;
      const exists = await client.query('SELECT 1 FROM public.organizations WHERE slug=$1', [trySlug]);
      if (exists.rowCount === 0) {
        tenantSlug = trySlug;
        break;
      }
    }

    await client.query(
      'INSERT INTO public.organizations (name, slug) VALUES ($1, $2)',
      [orgName, tenantSlug]
    );
  } finally {
    client.release();
  }

  try {
    await provisionTenantSchema(tenantSlug);
  } catch (err) {
    // best-effort cleanup
    await pool.query('DELETE FROM public.organizations WHERE slug=$1', [tenantSlug]);
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const schema = tenantSchemaName(tenantSlug);

  const tenantClient = await pool.connect();
  try {
    await tenantClient.query('BEGIN');
    await setTenantContext(tenantClient, tenantSlug);
    const result = await tenantClient.query(
      `INSERT INTO ${schema}.users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, role`,
      [adminName, email.toLowerCase(), passwordHash]
    );
    await tenantClient.query('COMMIT');

    const user = result.rows[0];
    const token = signToken({ userId: user.id, tenantSlug, role: user.role });
    return { token, tenantSlug, orgName, role: user.role, permissions: permissionsForRole(user.role) };
  } catch (err) {
    await tenantClient.query('ROLLBACK');
    throw err;
  } finally {
    tenantClient.release();
  }
}

async function login({ email, password, orgSlug }) {
  await ensurePublicSchema();

  const org = await pool.query('SELECT id, name, slug FROM public.organizations WHERE slug=$1', [
    String(orgSlug || '').trim().toLowerCase()
  ]);
  if (org.rowCount === 0) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }

  const tenantSlug = org.rows[0].slug;
  const schema = tenantSchemaName(tenantSlug);

  const client = await pool.connect();
  try {
    await setTenantContext(client, tenantSlug);
    const userRes = await client.query(
      `SELECT id, email, password_hash, role FROM ${schema}.users WHERE email=$1`,
      [String(email || '').trim().toLowerCase()]
    );
    if (userRes.rowCount === 0) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const user = userRes.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const token = signToken({ userId: user.id, tenantSlug, role: user.role });
    return { token, tenantSlug, role: user.role, permissions: permissionsForRole(user.role) };
  } finally {
    client.release();
  }
}

module.exports = { registerOrg, registerWithInvite, login };

