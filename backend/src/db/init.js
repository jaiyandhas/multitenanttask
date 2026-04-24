const { pool } = require('../config/db');
const { ensurePublicSchema, provisionTenantSchema } = require('./schema');
const { createIndexes, createTenantIndexes } = require('./indexes');

async function initDb() {
  await ensurePublicSchema();
  await createIndexes();

  const orgs = await pool.query('SELECT slug FROM public.organizations ORDER BY created_at ASC');
  if (orgs.rowCount === 0 && process.env.AUTO_SEED === 'true') {
    const { seedAll } = require('./seedData');
    await seedAll();
    return;
  }

  for (const row of orgs.rows) {
    const slug = row.slug;
    await provisionTenantSchema(slug);
    // Create indexes for the tenant schema
    const { tenantSchemaName } = require('../middleware/tenant');
    const schema = tenantSchemaName(slug);
    await createTenantIndexes(schema);
  }
}

module.exports = { initDb };

