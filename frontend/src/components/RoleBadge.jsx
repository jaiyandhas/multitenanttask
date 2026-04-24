const styles = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  manager: 'bg-blue-100 text-blue-800 border-blue-200',
  member: 'bg-slate-100 text-slate-700 border-slate-200'
}

export default function RoleBadge({ role }) {
  const r = role || 'member'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[r] || styles.member}`}>
      {r}
    </span>
  )
}

