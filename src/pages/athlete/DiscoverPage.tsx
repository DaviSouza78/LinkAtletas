import { useMemo, useState } from 'react'
import {
  ArrowRight, Check, Filter, MapPin, Search, ShieldCheck,
  SlidersHorizontal, Sparkles, Star, Video, X
} from 'lucide-react'
import { coaches } from '../../data/mock'
import { Avatar, Badge, Toast, CoachDetailModal, Modal } from '../../components/Ui'
import type { Coach } from '../../types'

export function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [sport, setSport] = useState('Todos')
  const [toastMessage, setToastMessage] = useState('')
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [maxPrice, setMaxPrice] = useState(400)
  const [selectedMode, setSelectedMode] = useState('Todos')

  const filtered = useMemo(() => {
    return coaches.filter(c => {
      const matchSport = sport === 'Todos' || c.sports.includes(sport)
      const matchSearch = `${c.name} ${c.specialty} ${c.location}`.toLowerCase().includes(query.toLowerCase())
      const matchPrice = c.price <= maxPrice
      const matchMode = selectedMode === 'Todos' || c.mode.toLowerCase().includes(selectedMode.toLowerCase())
      return matchSport && matchSearch && matchPrice && matchMode
    })
  }, [query, sport, maxPrice, selectedMode])

  function handleConnect(coach: Coach, planName: string) {
    setToastMessage(`Solicitação de conexão para o "${planName}" enviada a ${coach.name}!`)
  }

  return (
    <div className="discover-page">
      {/* Hero Banner */}
      <section className="match-hero">
        <div>
          <span><Sparkles size={16} /> Matches personalizados</span>
          <h2>Encontramos profissionais que combinam com <em>seu momento.</em></h2>
          <p>Recomendações baseadas no seu objetivo de correr 21 km, orçamento e disponibilidade semanal.</p>
        </div>
        <div className="match-score">
          <strong>{filtered.length}</strong>
          <span>matches encontrados</span>
          <small>Atualizado hoje</small>
        </div>
      </section>

      {/* Discover Toolbar & Search */}
      <div className="discover-toolbar">
        <div className="toolbar-search">
          <Search size={18} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar nome, especialidade ou cidade"
          />
        </div>
        <button
          className="button button--outline"
          onClick={() => setFilterModalOpen(true)}
        >
          <SlidersHorizontal size={17} /> Filtros
        </button>
      </div>

      {/* Modality Filter Tabs */}
      <div className="filter-tabs athlete-filters">
        {['Todos', 'Corrida', 'Triatlo', 'Musculação', 'Natação', 'Ciclismo'].map(item => (
          <button
            key={item}
            className={sport === item ? 'active' : ''}
            onClick={() => setSport(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Coaches Grid */}
      <div className="coach-match-grid">
        {filtered.map((coach, i) => (
          <article className="coach-match-card" key={coach.id}>
            <div className="coach-match-card__score">
              <Sparkles size={14} /> {coach.match}% match
            </div>

            <div className="coach-match-card__person">
              <Avatar initials={coach.initials} color={coach.color} size="xl" />
              <span className="verified-dot" title="Profissional com CREF Ativo"><Check size={12} /></span>
            </div>

            <div className="coach-match-card__title">
              <h3>{coach.name}</h3>
              <Badge tone="success"><ShieldCheck size={14} /> CREF verificado</Badge>
            </div>

            <p className="coach-match-card__specialty">{coach.specialty}</p>

            <div className="coach-rating">
              <Star size={15} fill="currentColor" />
              <strong>{coach.rating}</strong>
              <span>({coach.reviews} avaliações)</span>
            </div>

            <p className="coach-match-card__bio">{coach.bio}</p>

            <div className="coach-tags">
              {coach.sports.map(s => <span key={s}>{s}</span>)}
            </div>

            <div className="coach-info">
              <span><MapPin size={15} /> {coach.location}</span>
              <span><Video size={15} /> {coach.mode}</span>
            </div>

            <div className="coach-match-card__price">
              <span>A partir de <strong>R$ {coach.price}/mês</strong></span>
              <button
                className="coach-profile-btn"
                onClick={() => setSelectedCoach(coach)}
              >
                Ver perfil <ArrowRight size={15} />
              </button>
            </div>

            {i === 0 && <div className="top-match">Melhor match</div>}
          </article>
        ))}
      </div>

      {!filtered.length && (
        <div className="empty-state">
          <Filter size={32} />
          <h3>Nenhum treinador encontrado</h3>
          <p>Tente ajustar os filtros de valor ou modalidade para ver mais profissionais.</p>
          <button className="button button--accent" onClick={() => { setSport('Todos'); setQuery(''); setMaxPrice(400); setSelectedMode('Todos') }}>
            Redefinir filtros
          </button>
        </div>
      )}

      {/* Advanced Filters Modal */}
      <Modal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Filtros avançados"
        subtitle="Refine sua busca por profissionais compatíveis"
      >
        <div className="advanced-filters-body">
          <label className="filter-field">
            <span>Orçamento máximo: <strong>R$ {maxPrice}/mês</strong></span>
            <input
              type="range"
              min={150}
              max={500}
              step={10}
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
            />
          </label>

          <label className="filter-field">
            <span>Modelo de acompanhamento</span>
            <div className="mode-pill-options">
              {['Todos', 'Online', 'Híbrido', 'Presencial'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  className={`mode-btn ${selectedMode === mode ? 'mode-btn--selected' : ''}`}
                  onClick={() => setSelectedMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          </label>

          <div className="modal-actions-footer">
            <button
              className="button button--outline"
              onClick={() => { setMaxPrice(400); setSelectedMode('Todos'); setFilterModalOpen(false) }}
            >
              Limpar
            </button>
            <button
              className="button button--accent"
              onClick={() => setFilterModalOpen(false)}
            >
              Aplicar filtros ({filtered.length} encontrados)
            </button>
          </div>
        </div>
      </Modal>

      {/* Full Coach Detail Modal */}
      <CoachDetailModal
        coach={selectedCoach}
        isOpen={Boolean(selectedCoach)}
        onClose={() => setSelectedCoach(null)}
        onConnect={(planName) => selectedCoach && handleConnect(selectedCoach, planName)}
      />

      <Toast
        message={toastMessage}
        visible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  )
}
