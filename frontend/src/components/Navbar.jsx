import { Link, useLocation, useNavigate } from 'react-router-dom'
import RoleBadge from './RoleBadge'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { tenantSlug, role, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-100">
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="text-xs text-slate-400">Organization</div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 font-bold text-white shadow-sm">
              {tenantSlug ? tenantSlug.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="font-semibold">{tenantSlug ? tenantSlug.toUpperCase() : '—'}</div>
          </div>
          <RoleBadge role={role} />
        </div>
      </div>

      <nav className="px-3 py-4 text-sm">
        <Link
          to="/app"
          className={`block rounded px-3 py-2 ${
            location.pathname === '/app' ? 'bg-slate-800 text-white' : 'text-slate-200 hover:bg-slate-800'
          }`}
        >
          Dashboard
        </Link>
        {role === 'admin' ? (
          <Link
            to="/app/users"
            className={`mt-1 block rounded px-3 py-2 ${
              location.pathname === '/app/users'
                ? 'bg-slate-800 text-white'
                : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            Users
          </Link>
        ) : null}

        <button
          onClick={onLogout}
          className="mt-6 w-full rounded bg-slate-800 px-3 py-2 text-left text-slate-100 hover:bg-slate-700"
        >
          Logout
        </button>
      </nav>
    </aside>
  )
}

