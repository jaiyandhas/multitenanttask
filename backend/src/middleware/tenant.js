function tenantSchemaName(tenantSlug) {
  if (!tenantSlug || typeof tenantSlug !== 'string') return null;
  const slug = tenantSlug.trim().toLowerCase();
  if (!/^[a-z0-9_]+$/.test(slug)) return null;
  return `tenant_${slug}`;
}

async function setTenantContext(client, tenantSlug) {
  const schema = tenantSchemaName(tenantSlug);
  if (!schema) {
    const err = new Error('Invalid tenant');
    err.statusCode = 400;
    throw err;
  }

  await client.query(`SET search_path TO ${schema}, public`);
  return schema;
}

module.exports = { tenantSchemaName, setTenantContext };

