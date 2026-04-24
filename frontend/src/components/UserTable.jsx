import RoleBadge from './RoleBadge'

export default function UserTable({ users, onRoleChange, onRemove, busyId }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
              <td className="px-4 py-3 text-slate-600">{u.email}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <RoleBadge role={u.role} />
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                    value={u.role}
                    disabled={busyId === u.id}
                    onChange={(e) => onRoleChange?.(u.id, e.target.value)}
                  >
                    <option value="admin">admin</option>
                    <option value="manager">manager</option>
                    <option value="member">member</option>
                  </select>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                  disabled={busyId === u.id}
                  onClick={() => onRemove?.(u.id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

