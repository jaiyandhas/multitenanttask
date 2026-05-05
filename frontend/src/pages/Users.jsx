import { useEffect, useMemo, useState } from 'react'
import { createApiClient } from '../api/axios'
import { usersApi } from '../api/users'
import { useAuth } from '../context/AuthContext'
import UserTable from '../components/UserTable'

const EMPTY_FORM = { name: '', email: '', password: '', role: 'member' }

export default function Users() {
  const { token } = useAuth()
  const api = useMemo(() => createApiClient(() => token), [token])
  const uApi = useMemo(() => usersApi(api), [api])

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [toast, setToast] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

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

  const openModal = () => {
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormError('')
  }

  const submitAdd = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      const newUser = await uApi.addUser(form)
      setUsers((prev) => [...prev, newUser])
      setToast(`${newUser.name} added as ${newUser.role}`)
      setTimeout(() => setToast(''), 3000)
      closeModal()
    } catch (err) {
      setFormError(err?.response?.data?.error || 'Failed to add user')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Users</h1>
          <div className="mt-1 text-sm text-slate-600">Manage team members and their roles.</div>
        </div>
        <button
          onClick={openModal}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Add User
        </button>
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

      {/* Add User Modal */}
      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Add New User</h2>
            <p className="mt-1 text-sm text-slate-500">Create a member or manager for your organization.</p>

            <form onSubmit={submitAdd} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="jane@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              {formError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {formLoading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
