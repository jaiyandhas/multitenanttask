import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="text-sm font-medium text-slate-500">Multi-tenant Task System</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Production-style schema-per-tenant Kanban
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Create an organization, sign in, and manage tasks with RBAC enforced on the API.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/register"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create Org
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

