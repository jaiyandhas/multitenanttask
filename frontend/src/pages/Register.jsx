import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function slugify(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32)
}

export default function Register() {
  const navigate = useNavigate()
  const { setToken } = useAuth()

  const [step, setStep] = useState(1)
  const [orgName, setOrgName] = useState('')
  const slugPreview = useMemo(() => slugify(orgName) || 'your_org', [orgName])

  const [adminName, setAdminName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  const next = () => setStep((s) => Math.min(2, s + 1))
  const back = () => setStep((s) => Math.max(1, s - 1))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(`${apiUrl}/api/auth/register-org`, {
        orgName,
        adminName,
        email,
        password
      })
      setToken(res.data.token)
      if (res.data.tenantSlug) {
        localStorage.setItem(`orgName_${res.data.tenantSlug}`, res.data.orgName || orgName || '')
        const onboardKey = `onboarded_${res.data.tenantSlug}`
        const onboarded = localStorage.getItem(onboardKey) === 'true'
        navigate(onboarded ? '/app' : '/app/welcome')
      } else {
        navigate('/app')
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="text-sm font-medium text-slate-500">Create your organization</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Onboarding</h1>

        <div className="mt-6 flex items-center gap-2 text-sm">
          <div className={`rounded-full px-3 py-1 ${step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
            Step 1
          </div>
          <div className="h-px flex-1 bg-slate-200" />
          <div className={`rounded-full px-3 py-1 ${step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
            Step 2
          </div>
        </div>

        <form onSubmit={submit} className="mt-8">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Organization name</label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Acme Corp"
                />
                <div className="mt-2 text-xs text-slate-500">
                  Schema preview: <span className="font-mono">tenant_{slugPreview}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={next}
                  disabled={!orgName.trim()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Your name</label>
                  <input
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
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
                    placeholder="admin@acme.com"
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
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={back}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !adminName || !email || !password}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create organization'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

