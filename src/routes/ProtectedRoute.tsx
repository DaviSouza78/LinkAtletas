import type { Role } from '../../shared/contracts'
import type { ReactNode } from 'react'
import { useAuth, homeFor } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'

export function Protected({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading, error, refresh } = useAuth()
  if (loading)
    return (
      <div className="live-state" role="status">
        Verificando sua sessão…
      </div>
    )
  if (error)
    return (
      <div className="live-state" role="alert">
        <p>{error}</p>
        <button className="button button--dark" onClick={refresh}>
          Tentar novamente
        </button>
      </div>
    )
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return <AppShell role={role}>{children}</AppShell>
}
