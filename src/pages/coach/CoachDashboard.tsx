import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Clock3, MessageCircle, MoreHorizontal, Plus, TrendingUp, UserPlus, Users, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { athletes, complianceData, trainings, weeklyLoad } from '../../data/mock'
import { Avatar, Badge, Progress, SectionHeading } from '../../components/Ui'

export function CoachDashboard() {
  return <div className="dashboard-page">
    <section className="welcome-banner"><div><span>Bom dia, André 👋</span><h2>Seu time está em movimento.</h2><p>6 atletas treinaram hoje e você tem 3 feedbacks para revisar.</p></div><div><Link className="button button--light" to="/treinador/treinos"><Plus size={17} /> Prescrever treino</Link><Link className="button button--accent" to="/treinador/alunos"><UserPlus size={17} /> Novo aluno</Link></div></section>

    <section className="stat-grid">
      <article className="stat-card"><span className="stat-card__icon stat-card__icon--lime"><Users /></span><div><small>Alunos ativos</small><strong>28</strong><span className="trend trend--up"><TrendingUp /> 12% <i>este mês</i></span></div></article>
      <article className="stat-card"><span className="stat-card__icon stat-card__icon--cyan"><CheckCircle2 /></span><div><small>Adesão aos treinos</small><strong>92%</strong><span className="trend trend--up"><TrendingUp /> 4% <i>vs. mês anterior</i></span></div></article>
      <article className="stat-card"><span className="stat-card__icon stat-card__icon--orange"><CalendarDays /></span><div><small>Treinos esta semana</small><strong>47</strong><span className="trend"><i>38 concluídos</i></span></div></article>
      <article className="stat-card"><span className="stat-card__icon stat-card__icon--purple"><MessageCircle /></span><div><small>Feedbacks pendentes</small><strong>3</strong><Link to="/treinador/mensagens">Revisar agora <ArrowRight /></Link></div></article>
    </section>

    <section className="dashboard-grid dashboard-grid--charts">
      <article className="panel chart-panel"><div className="panel__head"><div><h3>Carga de treinamento</h3><p>Volume semanal dos seus atletas</p></div><select defaultValue="8"><option value="8">Últimas 8 semanas</option></select></div><div className="chart-legend"><span><i className="lime" /> Carga planejada</span><span><i className="cyan" /> Carga realizada</span></div><div className="line-chart"><div className="chart-y"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div className="chart-area"><i /><i /><i /><i /><i /><svg viewBox="0 0 700 210" preserveAspectRatio="none"><polyline points="0,170 116,145 233,151 350,98 466,91 583,55 700,38" fill="none" stroke="#c4cbd0" strokeWidth="3" strokeDasharray="7 8" /><polyline points="0,178 116,134 233,144 350,105 466,74 583,83 700,48" fill="none" stroke="#91aca6" strokeWidth="3" /><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#74d6d1" stopOpacity=".32"/><stop offset="1" stopColor="#74d6d1" stopOpacity="0"/></linearGradient></defs><polygon points="0,178 116,134 233,144 350,105 466,74 583,83 700,48 700,210 0,210" fill="url(#area)" />{weeklyLoad.map((value, i) => <circle key={i} cx={i * 116.6} cy={205 - value * 1.8} r="5" fill="#fff" stroke="#547e76" strokeWidth="3" />)}</svg><div className="chart-x">{['S2 Jun','S3 Jun','S4 Jun','S1 Jul','S2 Jul','S3 Jul','S4 Jul'].map(x => <span key={x}>{x}</span>)}</div></div></div></article>

      <article className="panel adherence-panel"><div className="panel__head"><div><h3>Adesão da equipe</h3><p>Treinos concluídos no prazo</p></div><button className="icon-button"><MoreHorizontal /></button></div><div className="donut" style={{ '--progress': '92%' } as React.CSSProperties}><div><strong>92%</strong><span>Excelente</span></div></div><div className="adherence-breakdown"><span><i className="good" /> No prazo <b>82%</b></span><span><i className="late" /> Com atraso <b>10%</b></span><span><i className="missed" /> Não realizados <b>8%</b></span></div><div className="adherence-note"><TrendingUp /><span>Acima da média da plataforma em <b>7 pontos</b></span></div></article>
    </section>

    <section className="dashboard-grid">
      <article className="panel"><SectionHeading title="Atividade recente" description="Últimas atualizações dos seus atletas" action={<Link to="/treinador/alunos">Ver todos <ArrowRight size={15} /></Link>} /><div className="activity-list">
        {[
          { who: athletes[0], icon: CheckCircle2, text: <>concluiu <b>Intervalado 6 × 800 m</b></>, meta: 'Hoje, 07:52 · Esforço 8/10', tone: 'success' },
          { who: athletes[2], icon: Video, text: <>enviou um <b>vídeo para análise</b></>, meta: 'Hoje, 06:48 · Agachamento livre', tone: 'info' },
          { who: athletes[1], icon: MessageCircle, text: <>deixou um <b>feedback no treino</b></>, meta: 'Ontem, 19:21 · “Senti leve desconforto...”', tone: 'warning' },
          { who: athletes[4], icon: UserPlus, text: <>entrou para a sua <b>equipe</b></>, meta: 'Ontem, 10:05 · Plano Essencial', tone: 'accent' },
        ].map(({ who, icon: Icon, text, meta, tone }) => <div className="activity-item" key={who.id}><div className={`activity-icon activity-icon--${tone}`}><Icon /></div><Avatar initials={who.initials} color={who.color} /><div><p><strong>{who.name}</strong> {text}</p><span>{meta}</span></div><ChevronRight size={17} /></div>)}
      </div></article>

      <article className="panel"><SectionHeading title="Agenda de hoje" description="Domingo, 16 de agosto" action={<Link to="/treinador/consultorias">Agenda <ArrowRight size={15} /></Link>} /><div className="schedule-list">{trainings.slice(0, 3).map((training, i) => <div className="schedule-item" key={training.id}><div className="schedule-time"><strong>{i === 0 ? '07:00' : i === 1 ? '18:30' : '19:30'}</strong><span>{i === 0 ? '52 min' : i === 1 ? '45 min' : '30 min'}</span></div><i className={i === 0 ? 'done' : ''} /><div><Badge tone={i === 0 ? 'success' : i === 1 ? 'accent' : 'info'}>{i === 0 ? 'Concluído' : i === 1 ? 'Treino' : 'Videochamada'}</Badge><strong>{training.title}</strong><span>{training.athlete}</span></div></div>)}</div><Link className="schedule-add" to="/treinador/consultorias"><Plus /> Agendar consultoria</Link></article>
    </section>

    <section className="panel students-preview"><SectionHeading title="Acompanhamento dos alunos" description="Indicadores individuais de evolução e adesão" action={<Link className="button button--outline" to="/treinador/alunos">Gerenciar alunos <ArrowRight size={16} /></Link>} /><div className="table-wrap"><table><thead><tr><th>Aluno</th><th>Objetivo</th><th>Evolução</th><th>Adesão</th><th>Próximo treino</th><th /></tr></thead><tbody>{athletes.slice(0, 5).map(a => <tr key={a.id}><td><div className="person-cell"><Avatar initials={a.initials} color={a.color} /><div><strong>{a.name}</strong><span>{a.sport} · {a.plan}</span></div></div></td><td>{a.goal}</td><td><div className="progress-cell"><Progress value={a.progress} tone="cyan" /><b>{a.progress}%</b></div></td><td><Badge tone={a.compliance >= 90 ? 'success' : a.compliance >= 80 ? 'info' : 'warning'}>{a.compliance}%</Badge></td><td><span className="muted"><Clock3 /> {a.nextWorkout}</span></td><td><button className="icon-button"><MoreHorizontal /></button></td></tr>)}</tbody></table></div></section>
  </div>
}
