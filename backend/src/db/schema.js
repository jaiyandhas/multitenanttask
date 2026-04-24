const { pool } = require('../config/db');
const { tenantSchemaName } = require('../middleware/tenant');

async function ensurePublicSchema() {
  // gen_random_uuid needs pgcrypto
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function provisionTenantSchema(slug) {
  const schema = tenantSchemaName(slug);
  if (!schema) {
    const err = new Error('Invalid organization slug');
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);

    // Ensure our DDL runs in the new schema without relying on global state.
    await client.query(`SET LOCAL search_path TO ${schema}, public`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK (role IN ('admin', 'manager', 'member')) DEFAULT 'member',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        status TEXT CHECK (status IN ('todo', 'inprogress', 'done')) DEFAULT 'todo',
        priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        due_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS task_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        changed_by_name TEXT,
        old_value JSONB,
        new_value JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'tasks_set_updated_at'
        ) THEN
          CREATE TRIGGER tasks_set_updated_at
          BEFORE UPDATE ON tasks
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at();
        END IF;
      END $$;
    `);

    // placeholder for future growth
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    return schema;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { ensurePublicSchema, provisionTenantSchema };

