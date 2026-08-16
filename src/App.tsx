import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { AppShell } from './components/AppShell'
import { CoachDashboard } from './pages/coach/CoachDashboard'
import { StudentsPage } from './pages/coach/StudentsPage'
import { TrainingsPage } from './pages/coach/TrainingsPage'
import { MessagesPage } from './pages/shared/MessagesPage'
import { FinancePage } from './pages/coach/FinancePage'
import { CoachProfilePage } from './pages/coach/CoachProfilePage'
import { ConsultationsPage } from './pages/coach/ConsultationsPage'
import { AthleteDashboard } from './pages/athlete/AthleteDashboard'
import { DiscoverPage } from './pages/athlete/DiscoverPage'
import { AthleteTrainingPage } from './pages/athlete/AthleteTrainingPage'
import { AthleteProfilePage } from './pages/athlete/AthleteProfilePage'

function Protected({ role, children }: { role: 'coach' | 'athlete'; children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.role === 'coach' ? '/treinador' : '/atleta'} replace />
  return <AppShell role={role}>{children}</AppShell>
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'coach' ? '/treinador' : '/atleta'} replace /> : <LoginPage />} />

      <Route path="/treinador" element={<Protected role="coach"><CoachDashboard /></Protected>} />
      <Route path="/treinador/alunos" element={<Protected role="coach"><StudentsPage /></Protected>} />
      <Route path="/treinador/treinos" element={<Protected role="coach"><TrainingsPage /></Protected>} />
      <Route path="/treinador/consultorias" element={<Protected role="coach"><ConsultationsPage /></Protected>} />
      <Route path="/treinador/mensagens" element={<Protected role="coach"><MessagesPage role="coach" /></Protected>} />
      <Route path="/treinador/financeiro" element={<Protected role="coach"><FinancePage /></Protected>} />
      <Route path="/treinador/perfil" element={<Protected role="coach"><CoachProfilePage /></Protected>} />

      <Route path="/atleta" element={<Protected role="athlete"><AthleteDashboard /></Protected>} />
      <Route path="/atleta/descobrir" element={<Protected role="athlete"><DiscoverPage /></Protected>} />
      <Route path="/atleta/treino" element={<Protected role="athlete"><AthleteTrainingPage /></Protected>} />
      <Route path="/atleta/mensagens" element={<Protected role="athlete"><MessagesPage role="athlete" /></Protected>} />
      <Route path="/atleta/perfil" element={<Protected role="athlete"><AthleteProfilePage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
