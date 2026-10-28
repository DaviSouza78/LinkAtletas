import { useState } from 'react'
import { useRemote } from '../../hooks/useRemote'
import { type CoachCard, type Contract, SPORTS } from '../../../shared/contracts'
import { api, json } from '../../services/api'
import { message } from '../../utils/errors'
import { PageTitle } from '../../components/ui/PageTitle'
import { Link } from 'react-router-dom'
import { ArrowRight, Search, ShieldCheck } from 'lucide-react'
import { Notice, State, Empty } from '../../components/ui/Feedback'
import { money } from '../../utils/formatters'
import { Badge } from '../../components/ui/Badge'

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
            (c) =>
              c.coachId === coach.userId &&
              ['pending', 'active', 'suspended'].includes(c.status),
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
              <Link
                className="live-link"
                to={'/atleta/avaliacoes?treinador=' + coach.userId}
              >
                Ver avaliações deste treinador
              </Link>
            </article>
          )
        })}
      </div>
      <p className="live-muted">
        A solicitação registra seu interesse. Consulte as condições de
        assinatura em Financeiro depois que o treinador aceitar.
      </p>
    </>
  )
}
