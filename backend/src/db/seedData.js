const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { ensurePublicSchema, provisionTenantSchema } = require('./schema');
const { setTenantContext, tenantSchemaName } = require('../middleware/tenant');

async function upsertOrg({ name, slug }) {
  await pool.query(
    `INSERT INTO public.organizations (name, slug)
     VALUES ($1, $2)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
    [name, slug]
  );
}

async function ensureUser(client, { tenantSlug, name, email, password, role }) {
  const schema = tenantSchemaName(tenantSlug);
  const passwordHash = await bcrypt.hash(password, 10);
  const res = await client.query(
    `INSERT INTO ${schema}.users (name, email, password_hash, role)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (email) DO UPDATE SET
       name=EXCLUDED.name,
       password_hash=EXCLUDED.password_hash,
       role=EXCLUDED.role
     RETURNING id`,
    [name, email.toLowerCase(), passwordHash, role]
  );
  return res.rows[0].id;
}

async function createTaskWithAudit(client, { tenantSlug, title, description, status, priority, assignedTo, createdBy, dueDate }) {
  const schema = tenantSchemaName(tenantSlug);
  const res = await client.query(
    `INSERT INTO ${schema}.tasks (title, description, status, priority, assigned_to, created_by, due_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [title, description || null, status, priority, assignedTo || null, createdBy || null, dueDate || null]
  );
  const task = res.rows[0];

  let changedByName = null;
  if (createdBy) {
    const userRes = await client.query(`SELECT name FROM ${schema}.users WHERE id=$1`, [createdBy]);
    changedByName = userRes.rowCount ? userRes.rows[0].name : null;
  }

  await client.query(
    `INSERT INTO ${schema}.task_audit_log
      (task_id, action, changed_by, changed_by_name, old_value, new_value)
     VALUES ($1,'created',$2,$3,$4::jsonb,$5::jsonb)`,
    [task.id, createdBy || null, changedByName, null, JSON.stringify(task)]
  );
}

async function seedOrgAcme() {
  const tenantSlug = 'acme';
  await upsertOrg({ name: 'Acme Corp', slug: tenantSlug });
  await provisionTenantSchema(tenantSlug);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await setTenantContext(client, tenantSlug);

    const adminId = await ensureUser(client, {
      tenantSlug,
      name: 'Acme Admin',
      email: 'admin@acme.com',
      password: 'password123',
      role: 'admin'
    });
    const managerId = await ensureUser(client, {
      tenantSlug,
      name: 'Acme Manager',
      email: 'manager@acme.com',
      password: 'password123',
      role: 'manager'
    });
    const memberId = await ensureUser(client, {
      tenantSlug,
      name: 'Acme Member',
      email: 'member@acme.com',
      password: 'password123',
      role: 'member'
    });

    const tasks = [
      {
        title: 'Draft Q2 roadmap',
        description: 'Outline priorities and milestones for Q2.',
        status: 'todo',
        priority: 'high',
        assignedTo: managerId,
        createdBy: adminId
      },
      {
        title: 'Fix onboarding copy',
        description: 'Tighten language in step 2.',
        status: 'inprogress',
        priority: 'medium',
        assignedTo: memberId,
        createdBy: managerId
      },
      {
        title: 'Set up analytics events',
        description: 'Track signup + task lifecycle events.',
        status: 'todo',
        priority: 'medium',
        assignedTo: memberId,
        createdBy: adminId
      },
      {
        title: 'Review security headers',
        description: 'Baseline CORS + security headers for API.',
        status: 'done',
        priority: 'low',
        assignedTo: adminId,
        createdBy: adminId
      },
      {
        title: 'Customer feedback triage',
        description: 'Collect top 10 requests from support.',
        status: 'inprogress',
        priority: 'high',
        assignedTo: managerId,
        createdBy: adminId
      },
      {
        title: 'Write release notes template',
        description: 'Standardize release comms.',
        status: 'done',
        priority: 'low',
        assignedTo: memberId,
        createdBy: managerId
      }
    ];

    for (const t of tasks) {
      await createTaskWithAudit(client, { tenantSlug, ...t });
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedOrgStark() {
  const tenantSlug = 'stark';
  await upsertOrg({ name: 'Stark Industries', slug: tenantSlug });
  await provisionTenantSchema(tenantSlug);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await setTenantContext(client, tenantSlug);

    const adminId = await ensureUser(client, {
      tenantSlug,
      name: 'Stark Admin',
      email: 'admin@stark.com',
      password: 'password123',
      role: 'admin'
    });

    const tasks = [
      {
        title: 'Prototype arc reactor dashboard',
        description: 'Internal dashboard for reactor metrics.',
        status: 'todo',
        priority: 'high',
        assignedTo: adminId,
        createdBy: adminId
      },
      {
        title: 'Refactor inventory service',
        description: 'Reduce query count by batching.',
        status: 'inprogress',
        priority: 'medium',
        assignedTo: adminId,
        createdBy: adminId
      },
      {
        title: 'Quarterly compliance audit',
        description: 'Prepare evidence pack.',
        status: 'todo',
        priority: 'high',
        assignedTo: adminId,
        createdBy: adminId
      },
      {
        title: 'Deploy staging environment',
        description: 'Baseline staging infra + smoke tests.',
        status: 'done',
        priority: 'low',
        assignedTo: adminId,
        createdBy: adminId
      }
    ];

    for (const t of tasks) {
      await createTaskWithAudit(client, { tenantSlug, ...t });
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedAll() {
  await ensurePublicSchema();
  await seedOrgAcme();
  await seedOrgStark();
}

module.exports = { seedAll };

