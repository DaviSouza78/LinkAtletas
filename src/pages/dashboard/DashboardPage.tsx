import { useAuth } from '../../context/AuthContext'
import { useRemote } from '../../hooks/useRemote'
import type { Dashboard } from '../../../shared/contracts'
import { Link } from 'react-router-dom'
import { ArrowRight, Dumbbell, Users, ShieldCheck } from 'lucide-react'
import { State, Empty } from '../../components/ui/Feedback'
import { Badge } from '../../components/ui/Badge'
import { day } from '../../utils/formatters'

export function DashboardPage() {
  const { user } = useAuth()
  const coach = user?.role === 'coach'
  const remote = useRemote<Dashboard>('/dashboard')
  const data = remote.data
  const active = data?.contracts.filter((c) => c.status === 'active') || []
  const pending = data?.contracts.filter((c) => c.status === 'pending') || []
  const workouts = data?.workouts || []
  const published = workouts.filter((w) => w.status === 'published')
  const executed = published.filter((w) => w.execution)
  return (
    <>
      <div className="live-hero">
        <span className="eyebrow">
          {coach ? 'Orientação que transforma' : 'Um passo de cada vez'}
        </span>
        <h2>Olá, {user?.name.split(' ')[0]}.</h2>
        <p>
          {coach
            ? 'Acompanhe seus atletas, transforme objetivos em treinos e ajude cada pessoa a ir mais longe.'
            : 'Encontre seu treinador, siga seu plano e registre como foi cada treino.'}
        </p>
        <Link
          className="button button--accent"
          to={coach ? '/treinador/treinos' : '/atleta/descobrir'}
        >
          {coach ? 'Planejar um treino' : 'Encontrar treinador'}
          <ArrowRight size={18} />
        </Link>
        <Dumbbell className="live-hero-icon" aria-hidden="true" />
      </div>
      <State {...remote} retry={remote.reload} />
      {data && (
        <>
          <div className="live-stat-grid">
            <article className="live-panel">
              <Users />
              <strong>{active.length}</strong>
              <span>{coach ? 'Atletas ativos' : 'Treinadores ativos'}</span>
            </article>
            <article className="live-panel">
              <Dumbbell />
              <strong>{published.length}</strong>
              <span>Treinos publicados</span>
            </article>
            <article className="live-panel">
              <ShieldCheck />
              <strong>{executed.length}</strong>
              <span>Execuções registradas</span>
            </article>
          </div>
          <div className="live-grid-2">
            <section className="live-panel">
              <div className="live-panel-heading">
                <h3>{coach ? 'Sua equipe' : 'Suas conexões'}</h3>
                <Link to={coach ? '/treinador/alunos' : '/atleta/conexoes'}>
                  Ver conexões →
                </Link>
              </div>
              {!data.contracts.length && (
                <Empty>
                  {coach
                    ? 'Nenhum atleta vinculado ainda.'
                    : 'Nenhuma conexão ainda. Descubra os profissionais disponíveis.'}
                </Empty>
              )}
              {data.contracts.slice(0, 6).map((c) => (
                <div className="live-row" key={c.id}>
                  <strong>{coach ? c.athleteName : c.coachName}</strong>
                  <Badge status={c.status} />
                </div>
              ))}
              {pending.length > 0 && (
                <p className="live-muted">
                  {pending.length} solicitação(ões) aguardando resposta.
                </p>
              )}
            </section>
            <section className="live-panel">
              <div className="live-panel-heading">
                <h3>{coach ? 'Treinos e feedbacks' : 'Seu plano'}</h3>
                <Link to={coach ? '/treinador/treinos' : '/atleta/treino'}>
                  Ver treinos →
                </Link>
              </div>
              {!workouts.length && (
                <Empty>
                  {coach
                    ? 'Prescreva o primeiro treino para um atleta ativo.'
                    : 'Seus treinos aparecem aqui quando seu treinador publicar.'}
                </Empty>
              )}
              {workouts.slice(0, 5).map((w) => (
                <div className="live-row" key={w.id}>
                  <div>
                    <strong>{w.title}</strong>
                    <p>
                      {day(w.scheduledDate)} ·{' '}
                      {coach ? w.athleteName : w.coachName}
                    </p>
                  </div>
                  {w.execution ? (
                    <span className="live-badge live-badge--approved">
                      Feedback registrado
                    </span>
                  ) : (
                    <Badge status={w.status} />
                  )}
                </div>
              ))}
            </section>
          </div>
        </>
      )}
    </>
  )
}
