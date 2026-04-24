const express = require('express');
const { withTenantClient } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { listTasks, createTask, updateTask, deleteTask } = require('../services/tasksService');

const router = express.Router();

async function getCurrentUserName(client, userId) {
  if (!userId) return null;
  const res = await client.query(`SELECT name FROM users WHERE id=$1`, [userId]);
  return res.rowCount ? res.rows[0].name : null;
}

async function getTaskById(client, taskId) {
  const res = await client.query(`SELECT * FROM tasks WHERE id=$1`, [taskId]);
  return res.rowCount ? res.rows[0] : null;
}

async function insertTaskAuditLog(client, { taskId, action, changedBy, changedByName, oldValue, newValue }) {
  await client.query(
    `INSERT INTO task_audit_log
      (task_id, action, changed_by, changed_by_name, old_value, new_value)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb)`,
    [
      taskId || null,
      action,
      changedBy || null,
      changedByName || null,
      typeof oldValue === 'undefined' ? null : JSON.stringify(oldValue),
      typeof newValue === 'undefined' ? null : JSON.stringify(newValue)
    ]
  );
}

router.get('/', async (req, res, next) => {
  try {
    const tasks = await withTenantClient(req, (client) =>
      listTasks(client, {
        tenantSlug: req.user.tenantSlug,
        userId: req.user.userId,
        permissions: req.user.permissions
      })
    );
    return res.json({ tasks });
  } catch (err) {
    return next(err);
  }
});

router.get('/stats', requirePermission('task:view:all'), async (req, res, next) => {
  try {
    const stats = await withTenantClient(req, async (client) => {
      const totalRes = await client.query(`SELECT COUNT(*)::int AS n FROM tasks`);
      const total = totalRes.rows[0].n;

      const byStatusRes = await client.query(
        `SELECT status, COUNT(*)::int AS n
         FROM tasks
         GROUP BY status`
      );
      const byStatus = { todo: 0, inprogress: 0, done: 0 };
      for (const row of byStatusRes.rows) {
        if (row.status && Object.prototype.hasOwnProperty.call(byStatus, row.status)) {
          byStatus[row.status] = row.n;
        }
      }

      const overdueRes = await client.query(
        `SELECT COUNT(*)::int AS n
         FROM tasks
         WHERE due_date IS NOT NULL
           AND due_date < CURRENT_DATE
           AND status <> 'done'`
      );
      const overdue = overdueRes.rows[0].n;

      const topAssigneeRes = await client.query(
        `SELECT u.name, COUNT(*)::int AS task_count
         FROM tasks t
         JOIN users u ON u.id = t.assigned_to
         GROUP BY u.name
         ORDER BY task_count DESC
         LIMIT 1`
      );
      const topAssignee =
        topAssigneeRes.rowCount === 0
          ? { name: null, taskCount: 0 }
          : { name: topAssigneeRes.rows[0].name, taskCount: topAssigneeRes.rows[0].task_count };

      return { total, byStatus, overdue, topAssignee };
    });

    return res.json(stats);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/audit', requirePermission('task:view:all'), async (req, res, next) => {
  try {
    const entries = await withTenantClient(req, async (client) => {
      const resAudit = await client.query(
        `SELECT *
         FROM task_audit_log
         WHERE task_id = $1
         ORDER BY created_at DESC`,
        [req.params.id]
      );
      return resAudit.rows;
    });
    return res.json({ entries });
  } catch (err) {
    return next(err);
  }
});

router.post('/', requirePermission('task:create'), async (req, res, next) => {
  try {
    const { title } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });

    const task = await withTenantClient(req, async (client) => {
      const created = await createTask(client, {
        tenantSlug: req.user.tenantSlug,
        userId: req.user.userId,
        input: {
          title,
          description: req.body.description,
          status: req.body.status,
          priority: req.body.priority,
          assignedTo: req.body.assignedTo,
          dueDate: req.body.dueDate
        }
      });

      const changedByName = await getCurrentUserName(client, req.user.userId);
      await insertTaskAuditLog(client, {
        taskId: created.id,
        action: 'created',
        changedBy: req.user.userId,
        changedByName,
        oldValue: null,
        newValue: created
      });
      return created;
    });
    return res.status(201).json({ task });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const task = await withTenantClient(req, async (client) => {
      const before = await getTaskById(client, req.params.id);
      const updated = await updateTask(client, {
        tenantSlug: req.user.tenantSlug,
        userId: req.user.userId,
        permissions: req.user.permissions,
        taskId: req.params.id,
        patch: req.body || {}
      });

      const action = typeof (req.body || {}).status !== 'undefined' ? 'status_changed' : 'updated';
      const changedByName = await getCurrentUserName(client, req.user.userId);
      await insertTaskAuditLog(client, {
        taskId: updated.id,
        action,
        changedBy: req.user.userId,
        changedByName,
        oldValue: before,
        newValue: updated
      });

      return updated;
    });
    return res.json({ task });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'status is required' });

    const task = await withTenantClient(req, async (client) => {
      const before = await getTaskById(client, req.params.id);
      const updated = await updateTask(client, {
        tenantSlug: req.user.tenantSlug,
        userId: req.user.userId,
        permissions: req.user.permissions,
        taskId: req.params.id,
        patch: { status }
      });

      const changedByName = await getCurrentUserName(client, req.user.userId);
      await insertTaskAuditLog(client, {
        taskId: updated.id,
        action: 'status_changed',
        changedBy: req.user.userId,
        changedByName,
        oldValue: before,
        newValue: updated
      });

      return updated;
    });
    return res.json({ task });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', requirePermission('task:delete'), async (req, res, next) => {
  try {
    const result = await withTenantClient(req, async (client) => {
      const before = await getTaskById(client, req.params.id);
      const deleted = await deleteTask(client, {
        tenantSlug: req.user.tenantSlug,
        permissions: req.user.permissions,
        taskId: req.params.id
      });

      const changedByName = await getCurrentUserName(client, req.user.userId);
      await insertTaskAuditLog(client, {
        taskId: deleted.id,
        action: 'deleted',
        changedBy: req.user.userId,
        changedByName,
        oldValue: before,
        newValue: null
      });

      return deleted;
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

