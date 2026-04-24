function priorityStyle(priority) {
  if (priority === 'high') return 'bg-red-100 text-red-700 border-red-200'
  if (priority === 'medium') return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-emerald-100 text-emerald-800 border-emerald-200'
}

function priorityBorder(priority) {
  if (priority === 'high') return 'border-l-4 border-red-500'
  if (priority === 'medium') return 'border-l-4 border-yellow-400'
  return 'border-l-4 border-gray-300'
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const a = parts[0][0] || ''
  const b = parts[1]?.[0] || ''
  return (a + b).toUpperCase()
}

export default function TaskCard({ task, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-slate-300 cursor-pointer ${priorityBorder(
        task.priority
      )}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">{task.title}</div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${priorityStyle(task.priority)}`}>
          {task.priority}
        </span>
      </div>
      {task.description ? <div className="mt-1 text-xs text-slate-600">{task.description}</div> : null}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {initials(task.assignee_name)}
          </div>
          <div className="text-xs text-slate-600">{task.assignee_name || 'Unassigned'}</div>
        </div>
        <div className="text-xs text-slate-500">{task.due_date ? String(task.due_date) : ''}</div>
      </div>
    </div>
  )
}

