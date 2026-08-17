import { useEffect, useState } from 'react'
import {
  Activity, ArrowRight, CalendarDays, Check, Clock3, ExternalLink,
  Flame, HeartPulse, MessageCircle, Pause, Play, RotateCcw,
  Sparkles, Star, Target, TrendingUp, Video, X
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Progress, Toast, Modal, WorkoutDetailModal } from '../../components/Ui'
import { formatConsultationDate, getUpcomingConsultations, subscribeToConsultations } from '../../services/consultations'
import { workoutDetails } from '../../data/mock'

export function AthleteDashboard() {
  const [toastMessage, setToastMessage] = useState('')
  const [consultations, setConsultations] = useState(() => getUpcomingConsultations(1))
  const [liveWorkoutOpen, setLiveWorkoutOpen] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [currentRep, setCurrentRep] = useState(1)
  const [workoutResultOpen, setWorkoutResultOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    return subscribeToConsultations(() => setConsultations(getUpcomingConsultations(1)))
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerRunning) {
      interval = setInterval(() => setTimerSeconds(s => s + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning])

  function formatTime(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  function handleStartLiveWorkout() {
    setLiveWorkoutOpen(true)
    setTimerRunning(true)
  }

  function handleFinishWorkout() {
    setTimerRunning(false)
    setLiveWorkoutOpen(false)
    setWorkoutResultOpen(true)
    setToastMessage('Treino concluído com sucesso! Dados sincronizados com seu treinador.')
  }

  return (
    <div className="athlete-home">
      {/* Overview Card */}
      <section className="athlete-overview">
        <div className="athlete-overview__copy">
          <span className="athlete-tag"><Flame size={15} /> Sequência de 8 dias</span>
          <h2>Seu ritmo está<br />cada vez <em>mais forte.</em></h2>
          <p>Você concluiu 92% dos treinos deste ciclo. Continue assim para atingir a meta da Meia Maratona!</p>
          <div className="athlete-overview__stats">
            <span><strong>18</strong><small>treinos no ciclo</small></span>
            <span><strong>42,8 km</strong><small>percorridos</small></span>
            <span><strong>7h 32</strong><small>em movimento</small></span>
          </div>
        </div>

        <div className="athlete-ring">
          <svg viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="72" />
            <circle
              className="ring-progress"
              cx="90"
              cy="90"
              r="72"
              style={{ strokeDashoffset: 'calc(452 - (452 * 92) / 100)' }}
            />
          </svg>
          <div>
            <strong>92%</strong>
            <span>adesão</span>
          </div>
        </div>
      </section>

      {/* Consultation Alert */}
      {consultations[0] && (
        <section className="athlete-consultation-alert">
          <div className="athlete-consultation-alert__icon"><Video size={20} /></div>
          <div>
            <span>Próxima consultoria</span>
            <h3>{consultations[0].purpose}</h3>
            <p>{consultations[0].description}</p>
            <div>
              <strong><CalendarDays size={14} /> {formatConsultationDate(consultations[0].date, consultations[0].startTime)}</strong>
              <strong><Clock3 size={14} /> {consultations[0].duration} minutos</strong>
            </div>
          </div>
          {consultations[0].meetLink ? (
            <a className="button button--accent" href={consultations[0].meetLink} target="_blank" rel="noreferrer">
              Entrar no Meet <ExternalLink size={16} />
            </a>
          ) : (
            <span className="meet-pending">Link do Meet pendente</span>
          )}
        </section>
      )}

      {/* Today Workout */}
      <section className="athlete-section">
        <div className="athlete-section__head">
          <div>
            <span className="eyebrow">Próximo desafio</span>
            <h2>Treino de hoje</h2>
          </div>
          <span className="date-pill"><CalendarDays size={14} /> 16 AGO</span>
        </div>

        <article className="today-workout">
          <div className="today-workout__visual">
            <span>06</span>
            <small>tiros</small>
            <i />
          </div>
          <div className="today-workout__content">
            <div>
              <Badge tone="warning">Intensidade alta</Badge>
              <span className="sport-label">CORRIDA</span>
            </div>
            <h3>Intervalado 6 × 800 m</h3>
            <p>Trabalho de velocidade controlada para ganhar ritmo e tolerância ao lactato.</p>
            <div className="workout-metadata">
              <span><Clock3 size={15} /> 52 min</span>
              <span><Activity size={15} /> 8,4 km</span>
              <span><HeartPulse size={15} /> Zona 4</span>
            </div>
            <button className="button button--accent" onClick={handleStartLiveWorkout}>
              <Play size={16} fill="currentColor" /> Iniciar treino ao vivo
            </button>
          </div>

          <div className="today-workout__coach">
            <Avatar initials="AM" color="#d7f266" />
            <div>
              <small>Orientação de André</small>
              <p>“Controle as 2 primeiras repetições em 4:55/km. O objetivo é terminar forte, não quebrar no meio.”</p>
            </div>
          </div>
        </article>
      </section>

      {/* Cycle Progress and Coach Interaction */}
      <section className="athlete-grid">
        <article className="athlete-card progress-card">
          <div className="athlete-card__head">
            <div>
              <span className="eyebrow">Seu ciclo</span>
              <h3>Rumo aos 21 km</h3>
            </div>
            <Target size={20} />
          </div>
          <div className="cycle-row">
            <span>Semana 6 de 8</span>
            <b>78%</b>
          </div>
          <Progress value={78} tone="cyan" />
          <div className="cycle-days">
            {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((w, i) => (
              <span key={w} className={i < 6 ? 'done' : i === 6 ? 'current' : ''}>
                {i < 6 ? <Check size={14} /> : w}
              </span>
            ))}
          </div>
          <div className="goal-box">
            <span>Próxima meta</span>
            <strong>Longão de 18 km</strong>
            <small>Domingo, 23 de agosto</small>
          </div>
        </article>

        <article className="athlete-card coach-card">
          <div className="athlete-card__head">
            <div>
              <span className="eyebrow">Seu treinador</span>
              <h3>Acompanhamento</h3>
            </div>
            <Link to="/atleta/mensagens" title="Abrir chat com André"><MessageCircle size={20} /></Link>
          </div>
          <div className="coach-card__person">
            <Avatar initials="AM" color="#d7f266" size="lg" />
            <div>
              <strong>André Martins</strong>
              <span><Star size={13} fill="currentColor" /> 4,9 · Endurance</span>
            </div>
            <Badge tone="success">Online</Badge>
          </div>
          <div className="coach-card__message">
            <p>“A consistência das últimas semanas está excelente. Vamos conversar após o treino de hoje.”</p>
            <span>Há 25 min</span>
          </div>
          <Link className="button button--outline" to="/atleta/mensagens">
            Responder ao André <ArrowRight size={15} />
          </Link>
        </article>
      </section>

      {/* Performance in the last 7 days */}
      <section className="athlete-section">
        <div className="athlete-section__head">
          <div>
            <span className="eyebrow">Últimos 7 dias</span>
            <h2>Seu desempenho</h2>
          </div>
          <button className="text-button" onClick={() => setWorkoutResultOpen(true)}>
            Ver histórico detalhado <ArrowRight size={15} />
          </button>
        </div>

        <div className="metric-card-grid">
          <article className="metric-card-interactive" onClick={() => setWorkoutResultOpen(true)}>
            <span className="metric-icon"><Activity size={20} /></span>
            <div>
              <small>Distância semanal</small>
              <strong>27,4 <i>km</i></strong>
              <span className="trend-up"><TrendingUp size={13} /> +8% vs. semana anterior</span>
            </div>
          </article>

          <article className="metric-card-interactive" onClick={() => setWorkoutResultOpen(true)}>
            <span className="metric-icon metric-icon--orange"><Flame size={20} /></span>
            <div>
              <small>Carga de treino (TRIMP)</small>
              <strong>436 <i>pts</i></strong>
              <span className="neutral">Zona produtiva ideal</span>
            </div>
          </article>

          <article className="metric-card-interactive" onClick={() => setWorkoutResultOpen(true)}>
            <span className="metric-icon metric-icon--cyan"><HeartPulse size={20} /></span>
            <div>
              <small>Ritmo médio geral</small>
              <strong>5:18 <i>/km</i></strong>
              <span className="trend-up"><TrendingUp size={13} /> 12s mais rápido</span>
            </div>
          </article>
        </div>
      </section>

      {/* Match Nudge */}
      <section className="match-nudge">
        <div className="match-nudge__icon"><Sparkles size={22} /></div>
        <div>
          <span>Indique a LinkAtletas</span>
          <h3>Treinar junto deixa o caminho mais leve.</h3>
          <p>Convide um amigo para a plataforma e ajude mais pessoas a encontrarem profissionais verificados.</p>
        </div>
        <button className="button button--light" onClick={() => setInviteModalOpen(true)}>
          Convidar amigo <ArrowRight size={16} />
        </button>
      </section>

      {/* Live Workout Execution Modal */}
      <Modal
        isOpen={liveWorkoutOpen}
        onClose={() => setLiveWorkoutOpen(false)}
        title="Execução de Treino ao Vivo"
        subtitle="Intervalado 6 × 800 m · Ritmo Alvo: 4:48–4:55/km"
      >
        <div className="live-workout-modal">
          <div className="live-timer-display">
            <span className="timer-val">{formatTime(timerSeconds)}</span>
            <small>Tempo em movimento</small>
          </div>

          <div className="live-rep-counter">
            <span>Repetição atual</span>
            <strong>Tiro {currentRep} de 6 (800m)</strong>
            <div className="rep-pills">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  className={`rep-pill ${currentRep === n ? 'rep-pill--active' : n < currentRep ? 'rep-pill--done' : ''}`}
                  onClick={() => setCurrentRep(n)}
                >
                  {n < currentRep ? <Check size={12} /> : `#${n}`}
                </button>
              ))}
            </div>
          </div>

          <div className="live-telemetry-row">
            <div><small>Ritmo Atual</small><b>4:50 /km</b></div>
            <div><small>FC Atual</small><b>166 bpm</b></div>
            <div><small>Cadência</small><b>178 spm</b></div>
          </div>

          <div className="live-controls-row">
            <button
              className="button button--outline"
              onClick={() => setTimerRunning(!timerRunning)}
            >
              {timerRunning ? <><Pause size={16} /> Pausar</> : <><Play size={16} /> Retomar</>}
            </button>
            <button
              className="button button--accent"
              onClick={handleFinishWorkout}
            >
              Concluir treino <Check size={16} />
            </button>
          </div>
        </div>
      </Modal>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Convidar amigo para a LinkAtletas"
        subtitle="Compartilhe seu link exclusivo de indicação"
      >
        <div className="invite-modal-body">
          <p>Seus amigos ganham 1 avaliação de match gratuita e você concorre a benefícios na sua mensalidade.</p>
          <div className="invite-link-box">
            <input readOnly value="https://linkatletas.com.br/convite/marina-costa-21k" />
            <button
              className="button button--accent"
              onClick={() => {
                navigator.clipboard?.writeText('https://linkatletas.com.br/convite/marina-costa-21k')
                setToastMessage('Link copiado para a área de transferência!')
                setInviteModalOpen(false)
              }}
            >
              Copiar link
            </button>
          </div>
        </div>
      </Modal>

      {/* Workout Result Detail Modal */}
      <WorkoutDetailModal
        workout={workoutDetails[1]}
        isOpen={workoutResultOpen}
        onClose={() => setWorkoutResultOpen(false)}
      />

      <Toast
        message={toastMessage}
        visible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  )
}
