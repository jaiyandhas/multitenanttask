import { useEffect, useMemo, useState } from 'react'

function dotColor(action) {
  if (action === 'created') return 'bg-emerald-500'
  if (action === 'updated') return 'bg-blue-500'
  if (action === 'status_changed') return 'bg-amber-400'
  if (action === 'deleted') return 'bg-red-500'
  return 'bg-slate-400'
}

function fmtRelative(ts) {
  const t = new Date(ts).getTime()
  if (!Number.isFinite(t)) return ''
  const diff = Math.max(0, Date.now() - t)
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  return `${days}d ago`
}

function statusLabel(s) {
  if (s === 'todo') return 'Todo'
  if (s === 'inprogress') return 'In Progress'
  if (s === 'done') return 'Done'
  return s
}

function cleanDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function actionText(entry) {
  const name = entry.changed_by_name || 'Someone'
  if (entry.action === 'created') return `${name} created this task`
  if (entry.action === 'deleted') return `${name} deleted this task`
  if (entry.action === 'status_changed') {
    const from = statusLabel(entry.old_value?.status)
    const to = statusLabel(entry.new_value?.status)
    if (from && to) return `${name} moved this task from ${from} → ${to}`
    return `${name} changed the status`
  }
  return `${name} updated this task`
}

export default function TaskDrawer({
  open,
  onClose,
  task,
  users,
  canAssign,
  canEditTask,
  canDeleteTask,
  onSave,
  onDelete,
  canViewAudit,
  loadAudit
}) {
  const [entries, setEntries] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState('')
  const [saveBusy, setSaveBusy] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('todo')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  const taskId = task?.id || null

  useEffect(() => {
    setTitle(task?.title || '')
    setDescription(task?.description || '')
    setStatus(task?.status || 'todo')
    setPriority(task?.priority || 'medium')
    setDueDate(cleanDate(task?.due_date))
    setAssignedTo(task?.assigned_to || '')
  }, [task])

  useEffect(() => {
    let alive = true
    const run = async () => {
      if (!open || !taskId || !canViewAudit) return
      setAuditLoading(true)
      setAuditError('')
      try {
        const data = await loadAudit(taskId)
        if (!alive) return
        setEntries(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!alive) return
        setAuditError(err?.response?.data?.error || 'Failed to load audit history')
      } finally {
        if (alive) setAuditLoading(false)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [open, taskId, canViewAudit, loadAudit])

  const header = useMemo(() => {
    if (!task) return null
    return (
      <div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">Title</label>
            <input
              disabled={!canEditTask || saveBusy || deleteBusy}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">Description</label>
            <textarea
              disabled={!canEditTask || saveBusy || deleteBusy}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none disabled:bg-slate-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">Status</label>
              <select
                disabled={!canEditTask || saveBusy || deleteBusy}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none disabled:bg-slate-50"
              >
                <option value="todo">Todo</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">Priority</label>
              <select
                disabled={!canEditTask || saveBusy || deleteBusy}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none disabled:bg-slate-50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">Assignee</label>
              <select
                disabled={!canEditTask || !canAssign || saveBusy || deleteBusy}
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none disabled:bg-slate-50"
              >
                <option value="">Unassigned</option>
                {(users || []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">Due date</label>
              <input
                type="date"
                disabled={!canEditTask || saveBusy || deleteBusy}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none disabled:bg-slate-50"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="text-xs text-slate-500">
              {!canEditTask ? 'You do not have permission to edit this task.' : null}
            </div>
            <div className="flex items-center gap-2">
              {canDeleteTask ? (
                <button
                  type="button"
                  disabled={saveBusy || deleteBusy}
                  onClick={async () => {
                    if (!taskId) return
                    if (!window.confirm('Delete this task?')) return
                    setDeleteBusy(true)
                    await onDelete?.(taskId)
                    setDeleteBusy(false)
                  }}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleteBusy ? 'Deleting...' : 'Delete'}
                </button>
              ) : null}
              <button
                type="button"
                disabled={!canEditTask || !title.trim() || saveBusy || deleteBusy}
                onClick={async () => {
                  if (!taskId) return
                  setSaveBusy(true)
                  await onSave?.(taskId, {
                    title: title.trim(),
                    description: description.trim() || null,
                    status,
                    priority,
                    dueDate: dueDate || null,
                    assignedTo: canAssign ? assignedTo || null : undefined
                  })
                  setSaveBusy(false)
                }}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saveBusy ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }, [
    task,
    canEditTask,
    canAssign,
    users,
    title,
    description,
    status,
    priority,
    dueDate,
    assignedTo,
    saveBusy,
    deleteBusy,
    taskId,
    onDelete,
    onSave,
    canDeleteTask
  ])

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md transform bg-white shadow-xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">Task</div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
            Close
          </button>
        </div>

        <div className="h-full overflow-auto px-4 py-4">
          {header}

          {canViewAudit ? (
            <div className="mt-6">
              <div className="text-sm font-semibold text-slate-900">Audit history</div>
              {auditError ? (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {auditError}
                </div>
              ) : null}
              {auditLoading ? <div className="mt-3 text-sm text-slate-600">Loading audit…</div> : null}
              {!auditLoading && !auditError && entries.length === 0 ? (
                <div className="mt-3 text-sm text-slate-600">No audit entries yet.</div>
              ) : null}

              <div className="mt-4 space-y-4">
                {entries.map((e) => (
                  <div key={e.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${dotColor(e.action)}`} />
                      <div className="mt-2 h-full w-px bg-slate-200" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-slate-900">{actionText(e)}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{fmtRelative(e.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

