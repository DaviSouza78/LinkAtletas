import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { UserRole, UserSession } from '../types'

interface AuthContextValue {
  user: UserSession | null
  login: (email: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const STORAGE_KEY = 'linkatletas.session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try { setUser(JSON.parse(stored) as UserSession) } catch { localStorage.removeItem(STORAGE_KEY) }
    }
  }, [])

  const login = async (email: string, password: string, role: UserRole) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const expected = role === 'coach'
      ? { email: 'emailtreinador@email.com', password: 'senhatreinador', name: 'André Martins' }
      : { email: 'emailatleta@email.com', password: 'senhaatleta', name: 'Marina Costa' }
    if (email.trim().toLowerCase() !== expected.email || password !== expected.password) {
      throw new Error('E-mail ou senha incorretos para este perfil.')
    }
    const next = { role, name: expected.name, email: expected.email }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setUser(next)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, logout }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return value
}
