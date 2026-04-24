import { useEffect, useMemo, useState } from 'react'
import { createApiClient } from '../api/axios'
import { usersApi } from '../api/users'
import { useAuth } from '../context/AuthContext'
import UserTable from '../components/UserTable'

export default function Users() {
  const { token } = useAuth()
  const api = useMemo(() => createApiClient(() => token), [token])
  const uApi = useMemo(() => usersApi(api), [api])

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [toast, setToast] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setUsers(await uApi.getUsers())
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onRoleChange = async (id, role) => {
    setError('')
    setBusyId(id)
    try {
      const updated = await uApi.updateRole(id, role)
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)))
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update role')
    } finally {
      setBusyId('')
    }
  }

  const onRemove = async (id) => {
    setError('')
    setBusyId(id)
    try {
      await uApi.removeUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to remove user')
    } finally {
      setBusyId('')
    }
  }

  const invite = async (role) => {
    setError('')
    setToast('')
    try {
      const link = await uApi.createInviteLink(role)
      await navigator.clipboard.writeText(link)
      setToast('Invite link copied! Expires in 24 hours')
      setTimeout(() => setToast(''), 2500)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create invite link')
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Users</h1>
          <div className="mt-1 text-sm text-slate-600">Admin-only role management and removals.</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => invite('member')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Invite Member
          </button>
          <button
            onClick={() => invite('manager')}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Invite Manager
          </button>
        </div>
      </div>

      {toast ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {toast}
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
          <UserTable users={users} onRoleChange={onRoleChange} onRemove={onRemove} busyId={busyId} />
        )}
      </div>
    </div>
  )
}

