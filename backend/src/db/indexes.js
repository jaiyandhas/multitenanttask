const { pool } = require('../config/db');

/**
 * Create database indexes for performance optimization
 * This should be run after schema creation
 */
async function createIndexes() {
  const client = await pool.connect();
  try {
    console.log('Creating database indexes...');

    // Public schema indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug)');

    // Per-tenant schema indexes (these need to be created per tenant)
    // The initDb function will handle this for each tenant schema
    console.log('Indexes created successfully');
  } catch (err) {
    console.error('Error creating indexes:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Create indexes for a specific tenant schema
 */
async function createTenantIndexes(tenantSchema) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL search_path TO ${tenantSchema}, public`);

    // User indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);

    // Task indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`);

    // Audit log indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_task_audit_log_task_id ON task_audit_log(task_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_task_audit_log_changed_at ON task_audit_log(changed_at DESC)`);

    await client.query('COMMIT');
    console.log(`Indexes created for tenant schema: ${tenantSchema}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Error creating indexes for ${tenantSchema}:`, err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createIndexes, createTenantIndexes };
