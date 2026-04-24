const { tenantSchemaName } = require('../middleware/tenant');

async function listTasks(client, { tenantSlug, userId, permissions }) {
  const schema = tenantSchemaName(tenantSlug);
  const canViewAll = permissions.includes('task:view:all');

  const res = canViewAll
    ? await client.query(
        `SELECT t.*, u.name as assignee_name
         FROM ${schema}.tasks t
         LEFT JOIN ${schema}.users u ON u.id = t.assigned_to
         ORDER BY t.created_at DESC`
      )
    : await client.query(
        `SELECT t.*, u.name as assignee_name
         FROM ${schema}.tasks t
         LEFT JOIN ${schema}.users u ON u.id = t.assigned_to
         WHERE t.assigned_to = $1
         ORDER BY t.created_at DESC`,
        [userId]
      );

  return res.rows;
}

async function createTask(client, { tenantSlug, userId, input }) {
  const schema = tenantSchemaName(tenantSlug);
  const {
    title,
    description = null,
    status = 'todo',
    priority = 'medium',
    assignedTo = null,
    dueDate = null
  } = input;

  const res = await client.query(
    `INSERT INTO ${schema}.tasks
      (title, description, status, priority, assigned_to, created_by, due_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [title, description, status, priority, assignedTo, userId, dueDate]
  );
  return res.rows[0];
}

async function updateTask(client, { tenantSlug, userId, permissions, taskId, patch }) {
  const schema = tenantSchemaName(tenantSlug);
  const canUpdateAll = permissions.includes('task:update');
  const canUpdateOwn = permissions.includes('task:update:own');

  if (!canUpdateAll && !canUpdateOwn) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const existingRes = await client.query(`SELECT * FROM ${schema}.tasks WHERE id=$1`, [taskId]);
  if (existingRes.rowCount === 0) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  const existing = existingRes.rows[0];

  if (!canUpdateAll && canUpdateOwn && existing.assigned_to !== userId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const allowed = {
    title: patch.title,
    description: patch.description,
    status: patch.status,
    priority: patch.priority,
    assigned_to: patch.assignedTo,
    due_date: patch.dueDate
  };

  const fields = [];
  const values = [];
  let idx = 1;
  for (const [k, v] of Object.entries(allowed)) {
    if (typeof v === 'undefined') continue;
    fields.push(`${k}=$${idx++}`);
    values.push(v);
  }

  if (fields.length === 0) return existing;

  values.push(taskId);
  const res = await client.query(
    `UPDATE ${schema}.tasks SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`,
    values
  );
  return res.rows[0];
}

async function deleteTask(client, { tenantSlug, permissions, taskId }) {
  const schema = tenantSchemaName(tenantSlug);
  if (!permissions.includes('task:delete')) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const res = await client.query(`DELETE FROM ${schema}.tasks WHERE id=$1 RETURNING id`, [taskId]);
  if (res.rowCount === 0) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  return { id: res.rows[0].id };
}

module.exports = { listTasks, createTask, updateTask, deleteTask };

