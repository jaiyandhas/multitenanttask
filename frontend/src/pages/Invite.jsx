import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function Invite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { setToken } = useAuth()

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  const [orgName, setOrgName] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const inviteToken = useMemo(() => token || '', [token])

  useEffect(() => {
    let alive = true
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await axios.get(`${apiUrl}/api/users/invite/${inviteToken}`)
        if (!alive) return
        setOrgName(res.data.orgName)
        setTenantSlug(res.data.tenantSlug)
        setRole(res.data.role)
      } catch (err) {
        if (!alive) return
        setError(err?.response?.data?.error || 'Invalid invite link')
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [apiUrl, inviteToken])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await axios.post(`${apiUrl}/api/auth/register`, {
        name,
        email,
        password,
        inviteToken
      })
      setToken(res.data.token)
      localStorage.setItem(`orgName_${res.data.tenantSlug}`, res.data.orgName || orgName || '')
      navigate('/app')
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        {loading ? (
          <div className="text-sm text-slate-600">Loading invite…</div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : (
          <>
            <div className="text-sm font-medium text-slate-500">Invitation</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              You&apos;ve been invited to join {orgName} as {role}
            </h1>
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <div className="text-xs font-medium text-slate-500">Organization (locked)</div>
              <div className="mt-0.5 font-mono text-slate-900">{tenantSlug}</div>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="jane@company.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !name || !email || !password}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {submitting ? 'Joining…' : 'Join organization'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

