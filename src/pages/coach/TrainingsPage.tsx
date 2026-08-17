import { useMemo, useState } from 'react'
import {
  Calendar, Clock3, Copy, Dumbbell, LayoutGrid, List,
  MoreHorizontal, Plus, Search, X
} from 'lucide-react'
import { athletes, trainings, workoutDetails } from '../../data/mock'
import { Badge, Toast, Modal, WorkoutDetailModal } from '../../components/Ui'
import type { Training, WorkoutDetail } from '../../types'

export function TrainingsPage() {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [toastMessage, setToastMessage] = useState('')
  const [trainingsList, setTrainingsList] = useState<Training[]>(trainings)
  const [newTrainingOpen, setNewTrainingOpen] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDetail | null>(null)

  const [form, setForm] = useState({
    title: '',
    athlete: athletes[0].name,
    sport: 'Corrida',
    duration: '45 min',
    intensity: 'Moderada' as 'Leve' | 'Moderada' | 'Alta',
    description: '',
    targetPace: '5:15 /km',
  })

  const filtered = useMemo(() => {
    return trainingsList.filter(t =>
      `${t.title} ${t.athlete} ${t.sport}`.toLowerCase().includes(query.toLowerCase())
    )
  }, [trainingsList, query])

  function handleCreateTraining(e: React.FormEvent) {
    e.preventDefault()
    const newT: Training = {
      id: Date.now(),
      title: form.title || 'Treino Personalizado',
      athlete: form.athlete,
      sport: form.sport,
      date: 'Hoje, 19:00',
      duration: form.duration,
      intensity: form.intensity,
      status: 'Programado',
      exercises: 4,
      description: form.description,
      targetPace: form.targetPace,
    }
    setTrainingsList([newT, ...trainingsList])
    setNewTrainingOpen(false)
    setToastMessage(`Treino "${newT.title}" prescrito com sucesso para ${newT.athlete}!`)
    setForm({
      title: '',
      athlete: athletes[0].name,
      sport: 'Corrida',
      duration: '45 min',
      intensity: 'Moderada',
      description: '',
      targetPace: '5:15 /km',
    })
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="toolbar-search">
          <Search size={18} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar treino, modalidade ou atleta..."
          />
        </div>
        <div className="view-switch">
          <button
            className={view === 'grid' ? 'active' : ''}
            onClick={() => setView('grid')}
            aria-label="Visualização em grade"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
            aria-label="Visualização em lista"
          >
            <List size={18} />
          </button>
        </div>
        <button className="button button--dark" onClick={() => setNewTrainingOpen(true)}>
          <Plus size={17} /> Novo treino
        </button>
      </div>

      {/* Training Metrics Summary */}
      <section className="training-summary">
        <article>
          <span><Calendar size={20} /></span>
          <div>
            <small>Programados</small>
            <strong>{trainingsList.filter(t => t.status === 'Programado').length}</strong>
          </div>
        </article>
        <article>
          <span><Dumbbell size={20} /></span>
          <div>
            <small>Concluídos na semana</small>
            <strong>38</strong>
          </div>
        </article>
        <article>
          <span><Copy size={20} /></span>
          <div>
            <small>Modelos na biblioteca</small>
            <strong>24</strong>
          </div>
        </article>
      </section>

      {/* Trainings Grid / List */}
      <div className={view === 'grid' ? 'training-grid' : 'training-list'}>
        {filtered.map(t => (
          <article className="training-card" key={t.id}>
            <div className="training-card__stripe" />
            <div className="training-card__head">
              <Badge tone={t.status === 'Concluído' ? 'success' : 'accent'}>
                {t.status}
              </Badge>
              <button className="icon-button" aria-label="Mais opções">
                <MoreHorizontal size={17} />
              </button>
            </div>
            <span className="training-card__sport">{t.sport}</span>
            <h3>{t.title}</h3>
            <p>{t.athlete}</p>
            <div className="training-card__meta">
              <span><Calendar size={14} /> {t.date}</span>
              <span><Clock3 size={14} /> {t.duration}</span>
              <span><Dumbbell size={14} /> {t.exercises} blocos</span>
            </div>
            <div className="training-card__bottom">
              <Badge tone={t.intensity === 'Alta' ? 'warning' : t.intensity === 'Leve' ? 'info' : 'neutral'}>
                Intensidade {t.intensity.toLowerCase()}
              </Badge>
              <button
                onClick={() => {
                  if (t.status === 'Concluído') {
                    setSelectedWorkout(workoutDetails[1])
                  } else {
                    setToastMessage(`Editando prescrição de ${t.athlete}...`)
                  }
                }}
              >
                {t.status === 'Concluído' ? 'Ver resultado' : 'Editar treino'}
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Prescribe Training Modal */}
      <Modal
        isOpen={newTrainingOpen}
        onClose={() => setNewTrainingOpen(false)}
        title="Prescrever Novo Treino"
        subtitle="Configure os blocos, zonas de intensidade e orientações para o atleta"
      >
        <form onSubmit={handleCreateTraining} className="prescribe-form">
          <div className="form-row-2">
            <label>
              <span>Atleta</span>
              <select
                value={form.athlete}
                onChange={e => setForm({ ...form, athlete: e.target.value })}
              >
                {athletes.map(a => (
                  <option key={a.id} value={a.name}>{a.name} ({a.sport})</option>
                ))}
              </select>
            </label>

            <label>
              <span>Modalidade</span>
              <select
                value={form.sport}
                onChange={e => setForm({ ...form, sport: e.target.value })}
              >
                <option>Corrida</option>
                <option>Triatlo</option>
                <option>Musculação</option>
                <option>Natação</option>
                <option>Ciclismo</option>
              </select>
            </label>
          </div>

          <label>
            <span>Título do treino</span>
            <input
              required
              placeholder="Ex: Intervalado Piramidal 400-800-1200m"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </label>

          <div className="form-row-2">
            <label>
              <span>Duração estimada</span>
              <input
                value={form.duration}
                onChange={e => setForm({ ...form, duration: e.target.value })}
                placeholder="Ex: 50 min"
              />
            </label>

            <label>
              <span>Intensidade / Zona</span>
              <select
                value={form.intensity}
                onChange={e => setForm({ ...form, intensity: e.target.value as any })}
              >
                <option value="Leve">Leve (Z1/Z2)</option>
                <option value="Moderada">Moderada (Z3)</option>
                <option value="Alta">Alta (Z4/Z5)</option>
              </select>
            </label>
          </div>

          <label>
            <span>Orientações técnicas e descrição dos blocos</span>
            <textarea
              rows={3}
              placeholder="Descreva o aquecimento, séries principais, intervalos e volta à calma..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <div className="modal-actions-footer">
            <button type="button" className="button button--outline" onClick={() => setNewTrainingOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="button button--accent">
              Publicar e notificar atleta <Plus size={16} />
            </button>
          </div>
        </form>
      </Modal>

      {/* Workout Detail Modal */}
      <WorkoutDetailModal
        workout={selectedWorkout}
        isOpen={Boolean(selectedWorkout)}
        onClose={() => setSelectedWorkout(null)}
      />

      <Toast
        message={toastMessage}
        visible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  )
}
