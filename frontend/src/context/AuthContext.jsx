import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

function safeDecodeJwt(token) {
  try {
    const [, payload] = String(token || '').split('.')
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => {
    const decoded = safeDecodeJwt(localStorage.getItem('token'))
    return decoded || null
  })

  useEffect(() => {
    if (!token) {
      setUser(null)
      localStorage.removeItem('token')
      return
    }
    localStorage.setItem('token', token)
    setUser(safeDecodeJwt(token))
  }, [token])

  const value = useMemo(() => {
    const isAuthenticated = Boolean(token)
    const tenantSlug = user?.tenantSlug || null
    const role = user?.role || null
    const permissions = user?.permissions || []

    return {
      token,
      user,
      isAuthenticated,
      tenantSlug,
      role,
      permissions,
      setToken,
      logout: () => setToken('')
    }
  }, [token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

