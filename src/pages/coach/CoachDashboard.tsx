import { useState } from 'react'
import {
  ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Clock3,
  MessageCircle, MoreHorizontal, Plus, TrendingUp, UserPlus, Users, Video
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { athletes, trainings, workoutDetails } from '../../data/mock'
import {
  Avatar, Badge, Progress, SectionHeading,
  WorkoutDetailModal, VideoReviewModal, StudentDetailModal
} from '../../components/Ui'
import { TrainingLoadChart, AdherenceDonutChart } from '../../components/Charts'
import type { Athlete, WorkoutDetail } from '../../types'

export function CoachDashboard() {
  const [loadPeriod, setLoadPeriod] = useState<'4' | '8' | '12'>('8')
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDetail | null>(null)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Athlete | null>(null)

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div>
          <span>Bom dia, André 👋</span>
          <h2>Seu time está em movimento.</h2>
          <p>6 atletas treinaram hoje e você tem 3 feedbacks para revisar.</p>
        </div>
        <div>
          <Link className="button button--light" to="/treinador/treinos">
            <Plus size={17} /> Prescrever treino
          </Link>
          <Link className="button button--accent" to="/treinador/alunos">
            <UserPlus size={17} /> Novo aluno
          </Link>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <section className="stat-grid">
        <article className="stat-card">
          <span className="stat-card__icon stat-card__icon--lime"><Users /></span>
          <div>
            <small>Alunos ativos</small>
            <strong>28</strong>
            <span className="trend trend--up"><TrendingUp /> 12% <i>este mês</i></span>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-card__icon stat-card__icon--cyan"><CheckCircle2 /></span>
          <div>
            <small>Adesão aos treinos</small>
            <strong>92%</strong>
            <span className="trend trend--up"><TrendingUp /> 4% <i>vs. mês anterior</i></span>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-card__icon stat-card__icon--orange"><CalendarDays /></span>
          <div>
            <small>Treinos esta semana</small>
            <strong>47</strong>
            <span className="trend"><i>38 concluídos</i></span>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-card__icon stat-card__icon--purple"><MessageCircle /></span>
          <div>
            <small>Feedbacks pendentes</small>
            <strong>3</strong>
            <Link to="/treinador/mensagens" className="revisar-link">
              Revisar agora <ArrowRight size={14} />
            </Link>
          </div>
        </article>
      </section>

      {/* Charts Section: Interactive Load & Adherence Donut */}
      <section className="dashboard-grid dashboard-grid--charts">
        {/* Real Interactive Training Load Chart */}
        <article className="panel training-load-panel">
          <div className="panel__head">
            <div>
              <h3>Carga de treinamento</h3>
              <p>Volume semanal dos seus atletas (pontos de estresse x volume)</p>
            </div>
            <select
              value={loadPeriod}
              onChange={e => setLoadPeriod(e.target.value as '4' | '8' | '12')}
              aria-label="Selecione o período do gráfico"
            >
              <option value="8">Últimas 8 semanas</option>
              <option value="4">Últimas 4 semanas</option>
              <option value="12">Últimas 12 semanas</option>
            </select>
          </div>

          <div className="chart-legend">
            <span><i className="lime" /> Carga planejada</span>
            <span><i className="cyan" /> Carga realizada</span>
          </div>

          <TrainingLoadChart period={loadPeriod} />
        </article>

        {/* Real Interactive Team Adherence Donut Chart */}
        <article className="panel adherence-panel">
          <div className="panel__head">
            <div>
              <h3>Adesão da equipe</h3>
              <p>Treinos concluídos no prazo</p>
            </div>
            <button className="icon-button" aria-label="Mais opções de adesão">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <AdherenceDonutChart
            onTimePercent={82}
            delayedPercent={10}
            missedPercent={8}
            totalPercent={92}
          />

          <div className="adherence-note">
            <TrendingUp size={16} />
            <span>Acima da média da plataforma em <b>7 pontos</b></span>
          </div>
        </article>
      </section>

      {/* Recent Activity and Today's Schedule */}
      <section className="dashboard-grid">
        {/* Interactive Activity List */}
        <article className="panel">
          <SectionHeading
            title="Atividade recente"
            description="Últimas atualizações e envios dos seus atletas"
            action={<Link to="/treinador/alunos" className="muted-link">Ver todos <ArrowRight size={15} /></Link>}
          />
          <div className="activity-list">
            {/* Marina Costa - Intervalado */}
            <div
              className="activity-item activity-item--clickable"
              onClick={() => setSelectedWorkout(workoutDetails[1])}
              title="Clique para ver os resultados e parciais"
            >
              <div className="activity-icon activity-icon--success"><CheckCircle2 size={18} /></div>
              <Avatar initials={athletes[0].initials} color={athletes[0].color} />
              <div>
                <p><strong>{athletes[0].name}</strong> concluiu <b>Intervalado 6 × 800 m</b></p>
                <span>Hoje, 07:52 · Esforço 8/10 · Ritmo 4:51/km</span>
              </div>
              <ChevronRight size={17} />
            </div>

            {/* Camila Rocha - Video */}
            <div
              className="activity-item activity-item--clickable"
              onClick={() => setVideoModalOpen(true)}
              title="Clique para analisar a execução do agachamento"
            >
              <div className="activity-icon activity-icon--info"><Video size={18} /></div>
              <Avatar initials={athletes[2].initials} color={athletes[2].color} />
              <div>
                <p><strong>{athletes[2].name}</strong> enviou um <b>vídeo para análise</b></p>
                <span>Hoje, 06:48 · Agachamento livre (80 kg)</span>
              </div>
              <ChevronRight size={17} />
            </div>

            {/* Rafael Nunes - Feedback */}
            <div
              className="activity-item activity-item--clickable"
              onClick={() => setSelectedStudent(athletes[1])}
              title="Clique para ver a ficha do atleta e histórico"
            >
              <div className="activity-icon activity-icon--warning"><MessageCircle size={18} /></div>
              <Avatar initials={athletes[1].initials} color={athletes[1].color} />
              <div>
                <p><strong>{athletes[1].name}</strong> deixou um <b>feedback no treino</b></p>
                <span>Ontem, 19:21 · “Senti leve desconforto...”</span>
              </div>
              <ChevronRight size={17} />
            </div>

            {/* Beatriz Lima - New student */}
            <div
              className="activity-item activity-item--clickable"
              onClick={() => setSelectedStudent(athletes[4])}
              title="Clique para ver a ficha de Beatriz Lima"
            >
              <div className="activity-icon activity-icon--accent"><UserPlus size={18} /></div>
              <Avatar initials={athletes[4].initials} color={athletes[4].color} />
              <div>
                <p><strong>{athletes[4].name}</strong> entrou para a sua <b>equipe</b></p>
                <span>Ontem, 10:05 · Plano Essencial</span>
              </div>
              <ChevronRight size={17} />
            </div>
          </div>
        </article>

        {/* Schedule List */}
        <article className="panel">
          <SectionHeading
            title="Agenda de hoje"
            description="Domingo, 16 de agosto"
            action={<Link to="/treinador/consultorias" className="muted-link">Agenda <ArrowRight size={15} /></Link>}
          />
          <div className="schedule-list">
            {trainings.slice(0, 3).map((training, i) => (
              <div className="schedule-item" key={training.id}>
                <div className="schedule-time">
                  <strong>{i === 0 ? '07:00' : i === 1 ? '18:30' : '19:30'}</strong>
                  <span>{i === 0 ? '52 min' : i === 1 ? '45 min' : '30 min'}</span>
                </div>
                <i className={i === 0 ? 'done' : ''} />
                <div>
                  <Badge tone={i === 0 ? 'success' : i === 1 ? 'accent' : 'info'}>
                    {i === 0 ? 'Concluído' : i === 1 ? 'Treino' : 'Videochamada'}
                  </Badge>
                  <strong>{training.title}</strong>
                  <span>{training.athlete}</span>
                </div>
              </div>
            ))}
          </div>
          <Link className="schedule-add" to="/treinador/consultorias">
            <Plus size={17} /> Agendar consultoria
          </Link>
        </article>
      </section>

      {/* Interactive Students Tracking Table */}
      <section className="panel students-preview">
        <SectionHeading
          title="Acompanhamento dos alunos"
          description="Indicadores individuais de evolução, adesão e próximos estímulos"
          action={
            <Link className="button button--outline" to="/treinador/alunos">
              Gerenciar alunos <ArrowRight size={16} />
            </Link>
          }
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Objetivo</th>
                <th>Evolução</th>
                <th>Adesão</th>
                <th>Próximo treino</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {athletes.slice(0, 5).map(a => (
                <tr
                  key={a.id}
                  className="table-row-clickable"
                  onClick={() => setSelectedStudent(a)}
                  title={`Clique para ver a ficha completa de ${a.name}`}
                >
                  <td>
                    <div className="person-cell">
                      <Avatar initials={a.initials} color={a.color} />
                      <div>
                        <strong>{a.name}</strong>
                        <span>{a.sport} · {a.plan}</span>
                      </div>
                    </div>
                  </td>
                  <td>{a.goal}</td>
                  <td>
                    <div className="progress-cell">
                      <Progress value={a.progress} tone="cyan" />
                      <b>{a.progress}%</b>
                    </div>
                  </td>
                  <td>
                    <Badge tone={a.compliance >= 90 ? 'success' : a.compliance >= 80 ? 'info' : 'warning'}>
                      {a.compliance}%
                    </Badge>
                  </td>
                  <td>
                    <span className="muted"><Clock3 size={14} /> {a.nextWorkout}</span>
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      onClick={e => { e.stopPropagation(); setSelectedStudent(a) }}
                      aria-label="Opções do aluno"
                    >
                      <MoreHorizontal size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modals */}
      <WorkoutDetailModal
        workout={selectedWorkout}
        isOpen={Boolean(selectedWorkout)}
        onClose={() => setSelectedWorkout(null)}
      />

      <VideoReviewModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        athleteName="Camila Rocha"
        exerciseTitle="Agachamento Livre (80 kg)"
      />

      <StudentDetailModal
        athlete={selectedStudent}
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  )
}
