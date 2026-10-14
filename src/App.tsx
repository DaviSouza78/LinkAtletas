import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Role } from '../shared/contracts'
import { homeFor, useAuth } from './context/AuthContext'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { AppShell } from './components/AppShell'
import { AdminPage, ProfilePage } from './pages/integrated/Profile'
import {
  ContractsPage,
  DashboardPage,
  DiscoverPage,
} from './pages/integrated/Connections'
import {
  AthleteWorkoutsPage,
  CoachWorkoutsPage,
} from './pages/integrated/Workouts'
function Protected({ role, children }: { role: Role; children: ReactNode }) {
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
function LoginRoute() {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="live-state" role="status">
        Verificando sua sessão…
      </div>
    )
  return user ? <Navigate to={homeFor(user.role)} replace /> : <LoginPage />
}
function FuturePage() {
  return (
    <section className="live-panel">
      <span className="eyebrow">Evolução futura · Sprint 3</span>
      <h2>Esta funcionalidade ainda não está disponível</h2>
      <p>
        Mensagens, consultorias e pagamentos estão fora do fluxo implementado na
        Sprint 2. Acompanhe suas conexões, treinos e execuções pelo menu.
      </p>
    </section>
  )
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/cadastro"
        element={<Navigate to="/login?cadastro=1" replace />}
      />
      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AdminPage />
          </Protected>
        }
      />
      <Route
        path="/treinador"
        element={
          <Protected role="coach">
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/treinador/alunos"
        element={
          <Protected role="coach">
            <ContractsPage />
          </Protected>
        }
      />
      <Route
        path="/treinador/treinos"
        element={
          <Protected role="coach">
            <CoachWorkoutsPage />
          </Protected>
        }
      />
      <Route
        path="/treinador/perfil"
        element={
          <Protected role="coach">
            <ProfilePage />
          </Protected>
        }
      />
      <Route
        path="/treinador/consultorias"
        element={
          <Protected role="coach">
            <FuturePage />
          </Protected>
        }
      />
      <Route
        path="/treinador/mensagens"
        element={
          <Protected role="coach">
            <FuturePage />
          </Protected>
        }
      />
      <Route
        path="/treinador/financeiro"
        element={
          <Protected role="coach">
            <FuturePage />
          </Protected>
        }
      />
      <Route
        path="/atleta"
        element={
          <Protected role="athlete">
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/atleta/descobrir"
        element={
          <Protected role="athlete">
            <DiscoverPage />
          </Protected>
        }
      />
      <Route
        path="/atleta/treino"
        element={
          <Protected role="athlete">
            <AthleteWorkoutsPage />
          </Protected>
        }
      />
      <Route
        path="/atleta/perfil"
        element={
          <Protected role="athlete">
            <ProfilePage />
          </Protected>
        }
      />
      <Route
        path="/atleta/mensagens"
        element={
          <Protected role="athlete">
            <FuturePage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
