import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from './pages/public/LandingPage'
import { LoginRoute } from './routes/LoginRoute'
import { PasswordRecoveryPage } from './pages/auth/PasswordRecoveryPage'
import { Protected } from './routes/ProtectedRoute'
import { AdminPage } from './pages/verification/AdminPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ContractsPage } from './pages/connections/ContractsPage'
import { CoachWorkoutsPage } from './pages/workouts/CoachWorkoutsPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { AgendaPage } from './pages/agenda/AgendaPage'
import { MessagesPage } from './pages/messages/MessagesPage'
import { FinancePage } from './pages/billing/FinancePage'
import { DiscoverPage } from './pages/connections/DiscoverPage'
import { AthleteWorkoutsPage } from './pages/workouts/AthleteWorkoutsPage'
import { ReviewsPage } from './pages/reviews/ReviewsPage'
import { NotificationsPage } from './pages/notifications/NotificationsPage'
import { PrivacyPage } from './pages/privacy/PrivacyPage'
import { AdminReviewsPage } from './pages/reviews/AdminReviewsPage'
import { AdminBillingPage } from './pages/billing/AdminBillingPage'
import { AdminPrivacyPage } from './pages/privacy/AdminPrivacyPage'

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
