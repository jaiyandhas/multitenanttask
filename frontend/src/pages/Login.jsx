import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { setToken } = useAuth()

  const [orgSlug, setOrgSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(`${apiUrl}/api/auth/login`, {
        orgSlug,
        email,
        password
      })
      setToken(res.data.token)
      navigate('/app')
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="text-sm font-medium text-slate-500">Welcome back</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Login</h1>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Org slug</label>
            <input
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              placeholder="acme"
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
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              placeholder="password123"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !orgSlug || !email || !password}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-center text-sm text-slate-600">
            New org?{' '}
            <Link className="font-medium text-slate-900 hover:underline" to="/register">
              Create one
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

