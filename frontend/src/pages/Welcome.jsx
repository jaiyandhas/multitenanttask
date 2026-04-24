import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Welcome() {
  const navigate = useNavigate()
  const { tenantSlug } = useAuth()

  const orgName = useMemo(() => {
    if (!tenantSlug) return ''
    return localStorage.getItem(`orgName_${tenantSlug}`) || ''
  }, [tenantSlug])

  const key = tenantSlug ? `onboarded_${tenantSlug}` : ''
  const already = key ? localStorage.getItem(key) === 'true' : false

  if (already) {
    navigate('/app', { replace: true })
    return null
  }

  const go = () => {
    if (key) localStorage.setItem(key, 'true')
    navigate('/app')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome to {orgName || 'your org'} 🎉</h1>
        <div className="mt-2 text-sm text-slate-600">Your organization is ready. Here&apos;s how to get started.</div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-500">Your org login ID</div>
          <pre className="mt-1 overflow-auto rounded bg-white px-3 py-2 text-sm text-slate-900">{tenantSlug}</pre>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <TipCard title="Share an invite link to add your team" icon="🔗" />
          <TipCard title="Create your first task on the dashboard" icon="✅" />
          <TipCard title="Visit the Users page to manage roles" icon="👑" />
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={go} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">
            Go to Dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}

function TipCard({ icon, title }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{title}</div>
    </div>
  )
}

