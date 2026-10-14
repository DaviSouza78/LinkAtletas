import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Dumbbell, Search, ShieldCheck, Users } from 'lucide-react'
import type { CoachCard, Contract, Dashboard } from '../../../shared/contracts'
import { SPORTS } from '../../../shared/contracts'
import { useAuth } from '../../context/AuthContext'
import { api, json } from '../../services/api'
import {
  Badge,
  day,
  Empty,
  message,
  money,
  Notice,
  PageTitle,
  State,
  useRemote,
} from './common'
export function DiscoverPage() {
  const [filters, setFilters] = useState({
    query: '',
    sport: '',
    maxPrice: '',
    mode: '',
  })
  const [search, setSearch] = useState('')
  const remote = useRemote<{ coaches: CoachCard[] }>('/coaches' + search)
  const contracts = useRemote<{ contracts: Contract[] }>('/contracts')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function request(coachId: string) {
    setBusy(coachId)
    setError('')
    setSuccess('')
    try {
      await api('/contracts', json('POST', { coachId }))
      setSuccess('Solicitação enviada. Aguarde a resposta do treinador.')
      await contracts.reload()
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy('')
    }
  }
  function filter(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    setSearch('?' + params.toString())
  }
  return (
    <>
      <PageTitle
        title="Encontre sua próxima conexão"
        description="Profissionais verificados, ordenados pela compatibilidade com seu perfil."
        action={
          <Link to="/atleta/perfil" className="button button--outline">
            Ajustar meu perfil
            <ArrowRight size={16} />
          </Link>
        }
      />
      <form className="live-panel live-form live-filter" onSubmit={filter}>
        <label>
          Nome ou cidade
          <input
            placeholder="Quem você procura?"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          />
        </label>
        <label>
          Modalidade
          <select
            value={filters.sport}
            onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
          >
            <option value="">Todas</option>
            {SPORTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Preço máximo (R$)
          <input
            type="number"
            min={0}
            max={100000}
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters({ ...filters, maxPrice: e.target.value })
            }
          />
        </label>
        <label>
          Formato
          <select
            value={filters.mode}
            onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="online">Online</option>
            <option value="presencial">Presencial</option>
            <option value="hibrido">Híbrido</option>
          </select>
        </label>
        <button className="button button--dark">
          <Search size={17} />
          Buscar
        </button>
      </form>
      <Notice error={error} success={success} />
      <State {...remote} retry={remote.reload} />
      <State {...contracts} retry={contracts.reload} />
      {remote.data && !remote.data.coaches.length && (
        <Empty>
          Nenhum treinador encontrado com esses filtros. Experimente outra
          modalidade ou faixa de preço.
        </Empty>
      )}
      <div className="live-card-grid">
        {remote.data?.coaches.map((coach) => {
          const contract = contracts.data?.contracts.find(
            (c) => c.coachId === coach.userId && c.status !== 'rejected',
          )
          return (
            <article className="live-panel live-coach" key={coach.userId}>
              <div className="live-coach-top">
                <span className="live-avatar live-avatar--large">
                  {coach.name
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')}
                </span>
                <span className="live-match">{coach.score}% compatível</span>
              </div>
              <h3>{coach.name}</h3>
              <span className="live-verified">
                <ShieldCheck size={16} /> CREF verificado · {coach.cref}
              </span>
              <p>
                {coach.city || 'Cidade não informada'} ·{' '}
                {coach.mode === 'hibrido'
                  ? 'Híbrido'
                  : coach.mode === 'online'
                    ? 'Online'
                    : 'Presencial'}
              </p>
              <p>
                {coach.bio || 'Conheça este profissional e comece sua jornada.'}
              </p>
              <div className="live-tags">
                {coach.sports.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <ul className="live-reasons">
                {coach.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <div className="live-coach-bottom">
                <strong>
                  {money(coach.price)}
                  <small>/mês</small>
                </strong>
                {contract ? (
                  <Badge status={contract.status} />
                ) : (
                  <button
                    className="button button--dark"
                    disabled={!!busy || contracts.loading || !!contracts.error}
                    onClick={() => request(coach.userId)}
                  >
                    {busy === coach.userId
                      ? 'Enviando…'
                      : 'Solicitar contratação'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
      <p className="live-muted">
        A contratação nesta etapa registra o vínculo entre atleta e treinador.
        Pagamentos não são processados pela plataforma.
      </p>
    </>
  )
}
export function ContractsPage() {
  const remote = useRemote<{ contracts: Contract[] }>('/contracts')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function decide(id: string, status: 'active' | 'rejected') {
    setBusy(id)
    setError('')
    setSuccess('')
    try {
      await api('/contracts/' + id, json('PATCH', { status }))
      setSuccess(
        status === 'active'
          ? 'Solicitação aceita. Você já pode prescrever treinos para este atleta.'
          : 'Solicitação recusada.',
      )
      await remote.reload()
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy('')
    }
  }
  return (
    <>
      <PageTitle
        title="Evolução se constrói em conjunto"
        description="Gerencie suas solicitações de contratação e os atletas com vínculo ativo."
      />
      <Notice error={error} success={success} />
      <State {...remote} retry={remote.reload} />
      <div className="live-stack">
        {remote.data && !remote.data.contracts.length && (
          <Empty>
            Você ainda não recebeu solicitações. Complete seu perfil e envie seu
            CREF para aparecer na busca.
          </Empty>
        )}
        {remote.data?.contracts.map((c) => (
          <article className="live-panel live-contract" key={c.id}>
            <div>
              <h3>{c.athleteName}</h3>
              <p>Solicitação de {day(c.createdAt)}</p>
              <Badge status={c.status} />
            </div>
            {c.status === 'pending' ? (
              <div className="live-actions">
                <button
                  className="button button--dark"
                  disabled={!!busy}
                  onClick={() => decide(c.id, 'active')}
                >
                  Aceitar solicitação
                </button>
                <button
                  className="button button--outline"
                  disabled={!!busy}
                  onClick={() => decide(c.id, 'rejected')}
                >
                  Recusar solicitação
                </button>
              </div>
            ) : (
              c.status === 'active' && (
                <Link
                  className="button button--outline"
                  to={'/treinador/treinos?atleta=' + c.id}
                >
                  Prescrever treino
                  <ArrowRight size={16} />
                </Link>
              )
            )}
          </article>
        ))}
      </div>
    </>
  )
}
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
                <Link to={coach ? '/treinador/alunos' : '/atleta/descobrir'}>
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
