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
import {
  AdminPrivacyPage,
  PasswordRecoveryPage,
  PrivacyPage,
} from './pages/integrated/Expansion'
import {
  AdminReviewsPage,
  AgendaPage,
  MessagesPage,
  NotificationsPage,
  ReviewsPage,
} from './pages/integrated/InteractionPages'
import { AdminBillingPage, FinancePage } from './pages/integrated/BillingPages'
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
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/recuperar-senha" element={<PasswordRecoveryPage />} />
      <Route path="/redefinir-senha" element={<PasswordRecoveryPage />} />
      <Route path="/reset-password" element={<PasswordRecoveryPage />} />
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
            <AgendaPage />
          </Protected>
        }
      />
      <Route
        path="/treinador/mensagens"
        element={
          <Protected role="coach">
            <MessagesPage />
          </Protected>
        }
      />
      <Route
        path="/treinador/financeiro"
        element={
          <Protected role="coach">
            <FinancePage />
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
            <MessagesPage />
          </Protected>
        }
      />
      {(['athlete', 'coach'] as const).flatMap((role) => {
        const root = role === 'athlete' ? '/atleta' : '/treinador'
        return [
          <Route
            key={root + '/agenda'}
            path={root + '/agenda'}
            element={
              <Protected role={role}>
                <AgendaPage />
              </Protected>
            }
          />,
          <Route
            key={root + '/avaliacoes'}
            path={root + '/avaliacoes'}
            element={
              <Protected role={role}>
                <ReviewsPage />
              </Protected>
            }
          />,
          <Route
            key={root + '/notificacoes'}
            path={root + '/notificacoes'}
            element={
              <Protected role={role}>
                <NotificationsPage />
              </Protected>
            }
          />,
          <Route
            key={root + '/privacidade'}
            path={root + '/privacidade'}
            element={
              <Protected role={role}>
                <PrivacyPage />
              </Protected>
            }
          />,
          ...(role === 'athlete'
            ? [
                <Route
                  key="/atleta/financeiro"
                  path="/atleta/financeiro"
                  element={
                    <Protected role="athlete">
                      <FinancePage />
                    </Protected>
                  }
                />,
                <Route
                  key="/atleta/conexoes"
                  path="/atleta/conexoes"
                  element={
                    <Protected role="athlete">
                      <ContractsPage />
                    </Protected>
                  }
                />,
              ]
            : []),
        ]
      })}
      <Route
        path="/admin/avaliacoes"
        element={
          <Protected role="admin">
            <AdminReviewsPage />
          </Protected>
        }
      />
      <Route
        path="/admin/financeiro"
        element={
          <Protected role="admin">
            <AdminBillingPage />
          </Protected>
        }
      />
      <Route
        path="/admin/privacidade"
        element={
          <Protected role="admin">
            <AdminPrivacyPage />
          </Protected>
        }
      />
      <Route
        path="/admin/notificacoes"
        element={
          <Protected role="admin">
            <NotificationsPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
