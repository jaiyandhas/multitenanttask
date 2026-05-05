import { Routes, Route, Navigate } from 'react-router-dom'

import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'

import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route
              path="users"
              element={
                <ProtectedRoute requireRole="admin">
                  <Users />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App
