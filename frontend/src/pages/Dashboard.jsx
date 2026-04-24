import { useEffect, useMemo, useState } from 'react'
import { createApiClient } from '../api/axios'
import { tasksApi } from '../api/tasks'
import { usersApi } from '../api/users'
import KanbanBoard from '../components/KanbanBoard'
import TaskDrawer from '../components/TaskDrawer'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { token, role, permissions, user } = useAuth()
  const api = useMemo(() => createApiClient(() => token), [token])
  const tApi = useMemo(() => tasksApi(api), [api])
  const uApi = useMemo(() => usersApi(api), [api])

  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState(null)

  const canCreate = permissions.includes('task:create')
  const canAssign = permissions.includes('task:assign')
  const canViewAll = permissions.includes('task:view:all')
  const canUpdateAll = permissions.includes('task:update')
  const canUpdateOwn = permissions.includes('task:update:own')
  const canDeleteTask = permissions.includes('task:delete')
  const canViewAudit = canViewAll && (role === 'admin' || role === 'manager')

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null
    return tasks.find((t) => t.id === selectedTaskId) || null
  }, [selectedTaskId, tasks])

  const canEditSelectedTask = useMemo(() => {
    if (!selectedTask) return false
    if (canUpdateAll) return true
    return canUpdateOwn && selectedTask.assigned_to === user?.userId
  }, [selectedTask, canUpdateAll, canUpdateOwn, user?.userId])

  const liveStats = useMemo(() => {
    const byStatus = { todo: 0, inprogress: 0, done: 0 }
    const assigneeCounts = new Map()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let overdue = 0

    for (const task of tasks) {
      if (Object.prototype.hasOwnProperty.call(byStatus, task.status)) {
        byStatus[task.status] += 1
      }

      if (task.assignee_name) {
        assigneeCounts.set(task.assignee_name, (assigneeCounts.get(task.assignee_name) || 0) + 1)
      }

      if (task.due_date && task.status !== 'done') {
        const dueDate = new Date(task.due_date)
        dueDate.setHours(0, 0, 0, 0)
        if (!Number.isNaN(dueDate.getTime()) && dueDate < today) {
          overdue += 1
        }
      }
    }

    let topAssignee = { name: null, taskCount: 0 }
    for (const [name, count] of assigneeCounts.entries()) {
      if (count > topAssignee.taskCount) {
        topAssignee = { name, taskCount: count }
      }
    }

    return { total: tasks.length, byStatus, overdue, topAssignee }
  }, [tasks])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [tasksRes, usersRes] = await Promise.all([
        tApi.getTasks(),
        canViewAll ? uApi.getUsers() : Promise.resolve([])
      ])
      setTasks(tasksRes)
      setUsers(usersRes)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onMove = async (taskId, status) => {
    try {
      const updated = await tApi.updateStatus(taskId, status)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update status')
    }
  }

  const create = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const created = await tApi.createTask({
        title: newTitle,
        description: newDescription || null,
        priority: newPriority,
        assignedTo: newAssignee || null,
        dueDate: newDueDate || null
      })
      setTasks((prev) => [created, ...prev])
      setNewTitle('')
      setNewDescription('')
      setNewAssignee('')
      setNewPriority('medium')
      setNewDueDate('')
      setIsTaskModalOpen(false)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create task')
    }
  }

  const updateTask = async (taskId, patch) => {
    setError('')
    try {
      const updated = await tApi.updateTask(taskId, patch)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
      return true
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update task')
      return false
    }
  }

  const deleteTask = async (taskId) => {
    setError('')
    try {
      await tApi.deleteTask(taskId)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      setSelectedTaskId(null)
      return true
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete task')
      return false
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <div className="mt-1 text-sm text-slate-600">
            {role === 'member' ? 'Your tasks' : 'All tasks'}
          </div>
        </div>
        {canCreate ? (
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition"
          >
            + New Task
          </button>
        ) : null}
      </div>

      {canViewAll ? (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard tone="slate" label="Total Tasks" value={liveStats.total} icon="list" />
          <StatCard tone="blue" label="In Progress" value={liveStats.byStatus.inprogress} icon="progress" />
          <StatCard
            tone="red"
            label="Overdue"
            value={liveStats.overdue}
            icon="alert"
            emphasize={liveStats.overdue > 0}
          />
          <StatCard
            tone="purple"
            label="Top Assignee"
            value={liveStats.topAssignee.name || '—'}
            subtitle={liveStats.topAssignee.taskCount ? `${liveStats.topAssignee.taskCount} tasks` : null}
            icon="user"
          />
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}



      <div className="mt-6">
        {loading ? (
          <div className="text-sm text-slate-600">Loading...</div>
        ) : (
          <KanbanBoard tasks={tasks} onMove={onMove} onSelectTask={(id) => setSelectedTaskId(id)} />
        )}
      </div>

      <TaskDrawer
        open={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        task={selectedTask}
        users={users}
        canAssign={canAssign}
        canEditTask={canEditSelectedTask}
        canDeleteTask={canDeleteTask}
        onSave={updateTask}
        onDelete={deleteTask}
        canViewAudit={canViewAudit}
        loadAudit={(taskId) => tApi.getAudit(taskId)}
      />

      {isTaskModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Create New Task</h2>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={create} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Add details..."
                  rows="3"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Assignee</label>
                <select
                  disabled={!canAssign}
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                {!canViewAll ? (
                  <div className="mt-1 text-xs text-slate-500">
                    Loading users requires elevated permissions.
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition disabled:opacity-50"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StatCard({ label, value, subtitle, tone, icon, emphasize }) {
  const tones = {
    slate: 'bg-slate-50 border-slate-200 text-slate-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900'
  }
  const cls = tones[tone] || tones.slate
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${cls}`}>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <Icon name={icon} />
        <span>{label}</span>
      </div>
      <div className={`mt-1 text-2xl ${emphasize ? 'font-extrabold' : 'font-semibold'}`}>{value}</div>
      {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
    </div>
  )
}

function Icon({ name }) {
  if (name === 'list') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-slate-600" fill="currentColor">
        <path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1ZM3 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm3 6a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm3 5a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      </svg>
    )
  }
  if (name === 'progress') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-slate-600" fill="currentColor">
        <path d="M10 2a8 8 0 1 0 8 8 1 1 0 1 0-2 0 6 6 0 1 1-6-6 1 1 0 1 0 0-2Z" />
        <path d="M10 6a1 1 0 0 1 1 1v3.586l2.707 2.707a1 1 0 0 1-1.414 1.414l-3-3A1 1 0 0 1 9 11V7a1 1 0 0 1 1-1Z" />
      </svg>
    )
  }
  if (name === 'alert') {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-slate-600" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.516 11.59c.75 1.334-.214 2.99-1.742 2.99H3.483c-1.528 0-2.492-1.656-1.742-2.99l6.516-11.59ZM11 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1-8a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V7a1 1 0 0 0-1-1Z"
          clipRule="evenodd"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-slate-600" fill="currentColor">
      <path d="M10 10a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 8a7 7 0 0 1 14 0Z" />
    </svg>
  )
}

