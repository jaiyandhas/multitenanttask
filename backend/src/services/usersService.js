const { tenantSchemaName } = require('../middleware/tenant');

async function listUsers(client, { tenantSlug }) {
  const schema = tenantSchemaName(tenantSlug);
  const res = await client.query(
    `SELECT id, name, email, role, created_at FROM ${schema}.users ORDER BY created_at ASC`
  );
  return res.rows;
}

async function updateUserRole(client, { tenantSlug, permissions, userId, role }) {
  const schema = tenantSchemaName(tenantSlug);
  if (!permissions.includes('user:manage')) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const res = await client.query(
    `UPDATE ${schema}.users SET role=$1 WHERE id=$2 RETURNING id, name, email, role`,
    [role, userId]
  );
  if (res.rowCount === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return res.rows[0];
}

async function removeUser(client, { tenantSlug, permissions, userId }) {
  const schema = tenantSchemaName(tenantSlug);
  if (!permissions.includes('user:remove')) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const res = await client.query(`DELETE FROM ${schema}.users WHERE id=$1 RETURNING id`, [userId]);
  if (res.rowCount === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return { id: res.rows[0].id };
}

module.exports = { listUsers, updateUserRole, removeUser };

