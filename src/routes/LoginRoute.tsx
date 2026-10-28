import { useAuth, homeFor } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { LoginPage } from '../pages/auth/LoginPage'

export function LoginRoute() {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="live-state" role="status">
        Verificando sua sessão…
      </div>
    )
  return user ? <Navigate to={homeFor(user.role)} replace /> : <LoginPage />
}
