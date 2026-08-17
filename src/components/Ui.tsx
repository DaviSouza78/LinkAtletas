import { useState, useEffect, type ReactNode } from 'react'
import {
  Activity, ArrowRight, Award, Check, CheckCircle2, ChevronRight,
  Clock3, Dumbbell, ExternalLink, Flame, HeartPulse, LockKeyhole,
  MapPin, MessageCircle, MoreHorizontal, Phone, Play, ShieldCheck,
  Sparkles, Star, Trophy, UserCheck, Video, X, Zap
} from 'lucide-react'
import type { Athlete, Coach, CoachPlan, WorkoutDetail } from '../types'
import { useNavigate } from 'react-router-dom'

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'accent' | 'info' | 'danger' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Avatar({ initials, color = '#d7f266', size = 'md' }: { initials: string; color?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  return <span className={`avatar avatar--${size}`} style={{ '--avatar-color': color } as React.CSSProperties}>{initials}</span>
}

export function Progress({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'cyan' | 'orange' | 'lime' }) {
  return <div className="progress" aria-label={`${value}%`}><span className={`progress__bar progress__bar--${tone}`} style={{ width: `${value}%` }} /></div>
}

export function Toast({ message, visible, onClose }: { message: string; visible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000)
      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  return (
    <div className={`toast ${visible ? 'toast--visible' : ''}`} role="status">
      <span className="toast__icon"><Check size={16} /></span>
      <span>{message}</span>
      <button onClick={onClose} aria-label="Fechar"><X size={16} /></button>
    </div>
  )
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '640px',
}: {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  maxWidth?: string
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="modal-card__header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button modal-close-btn" onClick={onClose} aria-label="Fechar modal">
            <X size={19} />
          </button>
        </header>
        <div className="modal-card__body">{children}</div>
      </div>
    </div>
  )
}

export function WorkoutDetailModal({
  workout,
  isOpen,
  onClose,
}: {
  workout: WorkoutDetail | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!workout) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={workout.title}
      subtitle={`${workout.athleteName} · ${workout.date}`}
      maxWidth="720px"
    >
      <div className="workout-detail-content">
        {/* Metric pills summary */}
        <div className="workout-telemetry-grid">
          <div className="telemetry-box">
            <span className="telemetry-icon"><Activity size={18} /></span>
            <small>Distância</small>
            <strong>{workout.distance}</strong>
          </div>
          <div className="telemetry-box">
            <span className="telemetry-icon"><Clock3 size={18} /></span>
            <small>Duração</small>
            <strong>{workout.duration}</strong>
          </div>
          <div className="telemetry-box">
            <span className="telemetry-icon"><Zap size={18} /></span>
            <small>Ritmo médio</small>
            <strong>{workout.avgPace}</strong>
          </div>
          <div className="telemetry-box">
            <span className="telemetry-icon"><HeartPulse size={18} /></span>
            <small>FC Média / Máx</small>
            <strong>{workout.avgHr} <small>/ {workout.maxHr} bpm</small></strong>
          </div>
          <div className="telemetry-box">
            <span className="telemetry-icon"><Flame size={18} /></span>
            <small>Calorias</small>
            <strong>{workout.calories} kcal</strong>
          </div>
          <div className="telemetry-box">
            <span className="telemetry-icon"><Trophy size={18} /></span>
            <small>Esforço (RPE)</small>
            <strong className="text-lime">{workout.rpe} / 10</strong>
          </div>
        </div>

        {/* Splits / Parciais table */}
        <div className="workout-splits-section">
          <div className="section-subtitle">
            <span>Parciais por repetição (800m)</span>
            <Badge tone="success">Consistência 98%</Badge>
          </div>
          <div className="table-wrap table-wrap--compact">
            <table>
              <thead>
                <tr>
                  <th>Tiro</th>
                  <th>Distância</th>
                  <th>Tempo</th>
                  <th>Ritmo</th>
                  <th>FC Média</th>
                  <th>Cadência</th>
                  <th>RPE</th>
                </tr>
              </thead>
              <tbody>
                {workout.splits.map(s => (
                  <tr key={s.rep}>
                    <td><b>#{s.rep}</b></td>
                    <td>{s.distance}</td>
                    <td><b>{s.time}</b></td>
                    <td><span className="pace-badge">{s.pace}</span></td>
                    <td>{s.hr} bpm</td>
                    <td>{s.cadence ? `${s.cadence} spm` : '-'}</td>
                    <td><span className="rpe-dot">{s.rpe}/10</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Athlete notes & Coach feedback */}
        <div className="workout-feedback-cards">
          {workout.athleteNotes && (
            <div className="feedback-card athlete-card-bg">
              <div className="feedback-card__header">
                <Avatar initials={workout.athleteInitials} color={workout.athleteColor} size="sm" />
                <strong>Comentário da atleta</strong>
              </div>
              <p>“{workout.athleteNotes}”</p>
            </div>
          )}

          {workout.coachFeedback && (
            <div className="feedback-card coach-card-bg">
              <div className="feedback-card__header">
                <Avatar initials="AM" color="#d7f266" size="sm" />
                <strong>Orientação do treinador (André)</strong>
                <Badge tone="success">Validado</Badge>
              </div>
              <p>“{workout.coachFeedback}”</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export function VideoReviewModal({
  isOpen,
  onClose,
  athleteName = 'Camila Rocha',
  exerciseTitle = 'Agachamento Livre com Barra (80 kg)',
}: {
  isOpen: boolean
  onClose: () => void
  athleteName?: string
  exerciseTitle?: string
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [comment, setComment] = useState('')
  const [sentFeedback, setSentFeedback] = useState(false)

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Análise de Execução em Vídeo"
      subtitle={`${athleteName} · ${exerciseTitle}`}
      maxWidth="760px"
    >
      <div className="video-review-content">
        {/* Video Player Simulator */}
        <div className="video-player-container">
          <div className="video-viewport">
            <div className="video-overlay-grid">
              <div className="video-indicator video-indicator--posture">
                <span>Ângulo do joelho: 92° (Profundidade correta)</span>
              </div>
              <div className="video-indicator video-indicator--spine">
                <span>Alinhamento da coluna lombar: Estável</span>
              </div>
            </div>
            <button
              className={`video-play-btn ${isPlaying ? 'video-play-btn--playing' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              <Play size={28} fill="currentColor" />
            </button>
            <div className="video-controls-bar">
              <span>00:18 / 00:38</span>
              <div className="video-progress-track">
                <div className="video-progress-fill" style={{ width: isPlaying ? '75%' : '48%' }} />
              </div>
              <Badge tone="accent">HD 1080p</Badge>
            </div>
          </div>
        </div>

        {/* Checkpoints evaluated */}
        <div className="checkpoints-list">
          <h4>Pontos avaliados pela IA biomecânica:</h4>
          <div className="checkpoints-grid">
            <div className="checkpoint-item check--good">
              <CheckCircle2 size={16} />
              <div>
                <strong>Profundidade do agachamento</strong>
                <span>Quebrou a paralela com controle excêntrico.</span>
              </div>
            </div>
            <div className="checkpoint-item check--good">
              <CheckCircle2 size={16} />
              <div>
                <strong>Estabilidade do tornozelo</strong>
                <span>Calcanhares firmes no solo durante todo o arco.</span>
              </div>
            </div>
            <div className="checkpoint-item check--warn">
              <AlertDot />
              <div>
                <strong>Valgo dinâmico leve</strong>
                <span>Atenção para manter os joelhos alinhados com a ponta dos pés na fase concêntrica.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coach feedback input */}
        <div className="video-feedback-form">
          <label>
            <strong>Enviar feedback para {athleteName}</strong>
            <textarea
              placeholder="Digite suas observações técnicas ou orientações para a próxima série..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </label>
          <div className="feedback-actions">
            <button className="button button--outline" onClick={() => { setSentFeedback(true); setTimeout(onClose, 1200) }}>
              <Sparkles size={16} /> Gerar feedback inteligente
            </button>
            <button
              className="button button--accent"
              onClick={() => { setSentFeedback(true); setTimeout(onClose, 1200) }}
            >
              {sentFeedback ? 'Feedback Enviado! ✓' : 'Enviar correção'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function AlertDot() {
  return (
    <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#f5b97e', display: 'grid', placeItems: 'center', color: '#17231f', fontSize: 10, fontWeight: 900 }}>
      !
    </span>
  )
}

export function StudentDetailModal({
  athlete,
  isOpen,
  onClose,
}: {
  athlete: Athlete | null
  isOpen: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  if (!athlete) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={athlete.name}
      subtitle={`${athlete.sport} · Plano ${athlete.plan}`}
      maxWidth="680px"
    >
      <div className="student-modal-content">
        <div className="student-profile-hero">
          <Avatar initials={athlete.initials} color={athlete.color} size="xl" />
          <div className="student-profile-info">
            <div className="student-title-row">
              <h3>{athlete.name}</h3>
              <Badge tone={athlete.status === 'active' ? 'success' : athlete.status === 'attention' ? 'warning' : 'accent'}>
                {athlete.status === 'active' ? 'Ativo e regular' : athlete.status === 'attention' ? 'Atenção necessária' : 'Novo atleta'}
              </Badge>
            </div>
            <div className="student-contact-tags">
              <span><MapPin size={13} /> {athlete.city || 'Joinville, SC'}</span>
              <span><Phone size={13} /> {athlete.phone || '(47) 99124-5582'}</span>
            </div>
          </div>
        </div>

        {/* Biomarkers / Physiology Grid */}
        <div className="student-bio-grid">
          <div className="bio-stat">
            <small>Idade</small>
            <strong>{athlete.age || 29} anos</strong>
          </div>
          <div className="bio-stat">
            <small>Altura / Peso</small>
            <strong>{athlete.height || '1,68 m'} · {athlete.weight || '59 kg'}</strong>
          </div>
          <div className="bio-stat">
            <small>FC Repouso / Máx</small>
            <strong>{athlete.restingHr || 48} / {athlete.maxHr || 188} bpm</strong>
          </div>
          <div className="bio-stat">
            <small>Adesão aos treinos</small>
            <strong className="text-lime">{athlete.compliance}%</strong>
          </div>
        </div>

        {/* Goal & Current Cycle */}
        <div className="student-cycle-card">
          <div className="cycle-header">
            <span>Objetivo principal</span>
            <strong>{athlete.goal}</strong>
          </div>
          <div className="cycle-progress-wrap">
            <div className="progress-labels">
              <small>Progresso do macrociclo</small>
              <b>{athlete.progress}%</b>
            </div>
            <Progress value={athlete.progress} tone="cyan" />
          </div>
          <div className="next-training-box">
            <Clock3 size={16} />
            <div>
              <small>Próximo estímulo programado</small>
              <strong>{athlete.nextWorkout}</strong>
            </div>
          </div>
        </div>

        {/* Coach notes */}
        {athlete.notes && (
          <div className="student-notes-box">
            <strong>Anotações técnicas do treinador:</strong>
            <p>{athlete.notes}</p>
          </div>
        )}

        <div className="modal-actions-footer">
          <button
            className="button button--outline"
            onClick={() => { onClose(); navigate('/treinador/mensagens') }}
          >
            <MessageCircle size={16} /> Abrir conversa
          </button>
          <button
            className="button button--accent"
            onClick={() => { onClose(); navigate('/treinador/treinos') }}
          >
            <Dumbbell size={16} /> Prescrever treino
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function CoachDetailModal({
  coach,
  isOpen,
  onClose,
  onConnect,
}: {
  coach: Coach | null
  isOpen: boolean
  onClose: () => void
  onConnect?: (planName: string) => void
}) {
  const [selectedPlan, setSelectedPlan] = useState<string>('Plano Performance')
  if (!coach) return null

  const plans = coach.plans || [
    {
      id: 'default-p1',
      name: 'Plano Essencial',
      price: coach.price,
      period: 'mês',
      features: ['Planilha semanal de treinos', 'Ajustes quinzenais', 'Feedback via chat em até 24h'],
    },
    {
      id: 'default-p2',
      name: 'Plano Performance',
      price: Math.round(coach.price * 1.3),
      period: 'mês',
      popular: true,
      features: ['Planilha personalizada', 'Análise de técnica por vídeo', '1 Videochamada mensal (45 min)', 'Suporte diário'],
    },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={coach.name}
      subtitle={`${coach.specialty} · CREF ${coach.cref || '012345-G/SC'}`}
      maxWidth="780px"
    >
      <div className="coach-detail-modal">
        {/* Header Profile */}
        <div className="coach-detail-hero">
          <Avatar initials={coach.initials} color={coach.color} size="xl" />
          <div className="coach-hero-text">
            <div className="coach-hero-title">
              <h3>{coach.name}</h3>
              <Badge tone="success"><ShieldCheck size={14} /> CREF Verificado</Badge>
            </div>
            <p className="coach-hero-specialty">{coach.specialty}</p>
            <div className="coach-hero-meta">
              <span className="rating-pill"><Star size={14} fill="currentColor" /> {coach.rating} ({coach.reviews} avaliações)</span>
              <span><MapPin size={14} /> {coach.location}</span>
              <span><Video size={14} /> {coach.mode}</span>
            </div>
          </div>
        </div>

        {/* Bio & Methodology */}
        <div className="coach-detail-section">
          <h4>Sobre o profissional</h4>
          <p>{coach.bio}</p>
          {coach.methodology && (
            <div className="methodology-card">
              <strong><Sparkles size={16} /> Metodologia aplicada:</strong>
              <p>{coach.methodology}</p>
            </div>
          )}
        </div>

        {/* Plan selection */}
        <div className="coach-detail-section">
          <h4>Escolha seu plano de acompanhamento</h4>
          <div className="coach-plans-grid">
            {plans.map(p => (
              <div
                key={p.id}
                className={`plan-select-card ${selectedPlan === p.name ? 'plan-select-card--selected' : ''}`}
                onClick={() => setSelectedPlan(p.name)}
              >
                {p.popular && <span className="plan-badge">Mais escolhido</span>}
                <h5>{p.name}</h5>
                <div className="plan-price">
                  <strong>R$ {p.price}</strong>
                  <small>/{p.period}</small>
                </div>
                <ul className="plan-features">
                  {p.features.map(f => (
                    <li key={f}><Check size={14} /> {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        {coach.testimonials && coach.testimonials.length > 0 && (
          <div className="coach-detail-section">
            <h4>Depoimentos de atletas</h4>
            <div className="testimonials-list">
              {coach.testimonials.map(t => (
                <div className="testimonial-card" key={t.id}>
                  <div className="testimonial-header">
                    <Avatar initials={t.athleteInitials} color="#74d6d1" size="sm" />
                    <div>
                      <strong>{t.athleteName}</strong>
                      <div className="stars-row">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill="#f5b97e" color="#f5b97e" />
                        ))}
                      </div>
                    </div>
                    <small>{t.date}</small>
                  </div>
                  <p>“{t.comment}”</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions-footer">
          <button className="button button--outline" onClick={onClose}>
            Voltar
          </button>
          <button
            className="button button--accent button--large"
            onClick={() => {
              if (onConnect) onConnect(selectedPlan)
              onClose()
            }}
          >
            Solicitar conexão com {coach.name.split(' ')[0]} ({selectedPlan}) <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </Modal>
  )
}
