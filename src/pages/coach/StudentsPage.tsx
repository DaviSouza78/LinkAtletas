import { useMemo, useState } from 'react'
import { Filter, Mail, MoreHorizontal, Plus, Search, SlidersHorizontal, UserPlus, X } from 'lucide-react'
import { athletes } from '../../data/mock'
import { Avatar, Badge, Progress, Toast, StudentDetailModal, Modal } from '../../components/Ui'
import type { Athlete } from '../../types'
import { useNavigate } from 'react-router-dom'

export function StudentsPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [toastMessage, setToastMessage] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Athlete | null>(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', sport: 'Corrida', plan: 'Performance' })

  const navigate = useNavigate()

  const filtered = useMemo(() => athletes.filter(a => {
    const matchFilter = filter === 'Todos' || (filter === 'Atenção' ? a.status === 'attention' : a.sport === filter)
    const matchSearch = `${a.name} ${a.sport} ${a.goal}`.toLowerCase().includes(query.toLowerCase())
    return matchFilter && matchSearch
  }), [query, filter])

  function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteModalOpen(false)
    setToastMessage(`Convite enviado com sucesso para ${inviteForm.email}!`)
    setInviteForm({ name: '', email: '', sport: 'Corrida', plan: 'Performance' })
  }

  return (
    <div>
      {/* Top Toolbar */}
      <div className="page-toolbar">
        <div className="toolbar-search">
          <Search size={18} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome, modalidade ou objetivo"
          />
        </div>
        <button className="button button--outline">
          <SlidersHorizontal size={17} /> Filtros
        </button>
        <button className="button button--dark" onClick={() => setInviteModalOpen(true)}>
          <UserPlus size={17} /> Convidar aluno
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['Todos', 'Corrida', 'Triatlo', 'Musculação', 'Natação', 'Atenção'].map(item => (
          <button
            key={item}
            className={filter === item ? 'active' : ''}
            onClick={() => setFilter(item)}
          >
            {item}
            {item === 'Todos' && <span>{athletes.length}</span>}
          </button>
        ))}
      </div>

      {/* Student Cards Grid */}
      <div className="student-card-grid">
        {filtered.map(a => (
          <article
            className="student-card student-card--clickable"
            key={a.id}
            onClick={() => setSelectedStudent(a)}
          >
            <div className="student-card__top">
              <Avatar initials={a.initials} color={a.color} size="lg" />
              <div>
                <h3>{a.name}</h3>
                <span>{a.sport} · Plano {a.plan}</span>
              </div>
              <button
                className="icon-button"
                onClick={e => { e.stopPropagation(); setSelectedStudent(a) }}
                aria-label="Mais opções"
              >
                <MoreHorizontal size={17} />
              </button>
            </div>

            <div className="student-card__goal">
              <small>Objetivo atual</small>
              <strong>{a.goal}</strong>
            </div>

            <div className="student-card__metric">
              <span>Evolução do ciclo <b>{a.progress}%</b></span>
              <Progress value={a.progress} tone="cyan" />
            </div>

            <div className="student-card__row">
              <span>
                <small>Adesão</small>
                <Badge tone={a.compliance >= 90 ? 'success' : a.compliance >= 80 ? 'info' : 'warning'}>
                  {a.compliance}%
                </Badge>
              </span>
              <span>
                <small>Última atividade</small>
                <b>{a.lastActivity}</b>
              </span>
            </div>

            <div className="student-card__next">
              <span>Próximo</span>
              <b>{a.nextWorkout}</b>
            </div>

            <div className="student-card__actions" onClick={e => e.stopPropagation()}>
              <button onClick={() => navigate('/treinador/mensagens')}>
                <Mail size={16} /> Mensagem
              </button>
              <button onClick={() => navigate('/treinador/treinos')}>
                <Plus size={16} /> Prescrever
              </button>
            </div>
          </article>
        ))}
      </div>

      {!filtered.length && (
        <div className="empty-state">
          <Filter size={32} />
          <h3>Nenhum aluno encontrado</h3>
          <p>Tente ajustar sua busca ou remover um filtro ativo.</p>
        </div>
      )}

      {/* Student Detail Modal */}
      <StudentDetailModal
        athlete={selectedStudent}
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
      />

      {/* Invite Student Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Convidar Novo Aluno"
        subtitle="Envie um link de acesso ou convite direto por e-mail"
      >
        <form onSubmit={handleSendInvite} className="invite-student-form">
          <label>
            <span>Nome do aluno</span>
            <input
              required
              placeholder="Ex: João da Silva"
              value={inviteForm.name}
              onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
            />
          </label>

          <label>
            <span>E-mail</span>
            <input
              type="email"
              required
              placeholder="aluno@email.com"
              value={inviteForm.email}
              onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
            />
          </label>

          <div className="form-row-2">
            <label>
              <span>Modalidade</span>
              <select
                value={inviteForm.sport}
                onChange={e => setInviteForm({ ...inviteForm, sport: e.target.value })}
              >
                <option>Corrida</option>
                <option>Triatlo</option>
                <option>Musculação</option>
                <option>Natação</option>
                <option>Ciclismo</option>
              </select>
            </label>

            <label>
              <span>Plano inicial</span>
              <select
                value={inviteForm.plan}
                onChange={e => setInviteForm({ ...inviteForm, plan: e.target.value })}
              >
                <option>Plano Essencial (R$ 189/mês)</option>
                <option>Plano Performance (R$ 249/mês)</option>
                <option>Plano Elite (R$ 389/mês)</option>
              </select>
            </label>
          </div>

          <div className="modal-actions-footer">
            <button type="button" className="button button--outline" onClick={() => setInviteModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="button button--accent">
              Enviar convite por e-mail <Plus size={16} />
            </button>
          </div>
        </form>
      </Modal>

      <Toast
        message={toastMessage}
        visible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  )
}
