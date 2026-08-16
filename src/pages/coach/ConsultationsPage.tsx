import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, ExternalLink, Link2, Plus, ShieldCheck, Sparkles, UserRound, Video, X } from 'lucide-react'
import { athletes } from '../../data/mock'
import { Avatar, Badge, Toast } from '../../components/Ui'
import type { Consultation } from '../../types'
import { createGoogleMeetEvent, googleCalendarConfigured, googleCalendarConnected, connectGoogleCalendar } from '../../services/googleCalendar'
import { formatConsultationDate, getConsultations, saveConsultation } from '../../services/consultations'

const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const purposes = ['Revisão de ciclo', 'Avaliação de desempenho', 'Ajuste de planejamento', 'Correção técnica', 'Alinhamento de objetivos', 'Orientação pré-prova', 'Outro']

function localDateISO(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

export function ConsultationsPage() {
  const today = new Date()
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(localDateISO(today))
  const [consultations, setConsultations] = useState<Consultation[]>(getConsultations)
  const [modalOpen, setModalOpen] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(googleCalendarConnected())
  const [connecting, setConnecting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ athleteId: 1, athleteEmail: athletes[0].email, purpose: purposes[0], description: '', startTime: '19:00', duration: 45 })

  const days = useMemo(() => calendarDays(month), [month])
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month)
  const upcoming = useMemo(() => consultations.filter(item => item.status === 'scheduled').sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)), [consultations])

  function changeMonth(offset: number) {
    setMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  function selectAthlete(id: number) {
    const athlete = athletes.find(item => item.id === id) ?? athletes[0]
    setForm(current => ({ ...current, athleteId: id, athleteEmail: athlete.email }))
  }

  async function connectGoogle() {
    setConnecting(true)
    try { await connectGoogleCalendar(); setGoogleConnected(true); setToast('Google Agenda conectado com sucesso.') }
    catch (error) { setToast(error instanceof Error ? error.message : 'Não foi possível conectar ao Google.') }
    finally { setConnecting(false) }
  }

  async function schedule(event: React.FormEvent) {
    event.preventDefault()
    const athlete = athletes.find(item => item.id === form.athleteId) ?? athletes[0]
    const base = {
      athleteId: athlete.id,
      athleteName: athlete.name,
      athleteEmail: form.athleteEmail,
      purpose: form.purpose,
      description: form.description,
      date: selectedDate,
      startTime: form.startTime,
      duration: form.duration,
    }
    setSaving(true)
    try {
      const googleData: { googleEventId?: string; calendarLink?: string; meetLink?: string } = googleCalendarConfigured ? await createGoogleMeetEvent(base) : {}
      const consultation: Consultation = {
        ...base,
        ...googleData,
        id: googleData.googleEventId || crypto.randomUUID(),
        status: 'scheduled',
        source: googleData.googleEventId ? 'google' : 'demo',
        createdAt: new Date().toISOString(),
      }
      saveConsultation(consultation)
      setConsultations(getConsultations())
      setModalOpen(false)
      setForm(current => ({ ...current, description: '' }))
      setToast(consultation.source === 'google' ? 'Consultoria criada no Google Agenda com Meet e convite enviado.' : 'Consultoria agendada e notificação enviada ao atleta. Configure o Google para gerar o Meet real.')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Não foi possível agendar a consultoria.')
    } finally { setSaving(false) }
  }

  return <div className="consultations-page">
    <section className={`google-integration ${googleCalendarConfigured ? 'google-integration--ready' : ''}`}>
      <div className="google-integration__icon"><Video /></div>
      <div><span>Integração Google Meet</span><h2>{googleConnected ? 'Google Agenda conectado' : googleCalendarConfigured ? 'Conecte sua agenda para criar chamadas automaticamente' : 'Modo demonstração ativo'}</h2><p>{googleCalendarConfigured ? 'Cada consultoria cria um evento, um link exclusivo do Meet e envia o convite ao atleta.' : 'Os agendamentos e notificações funcionam localmente. Adicione o Client ID no .env para ativar eventos e links reais.'}</p></div>
      {googleCalendarConfigured ? <button className={`button ${googleConnected ? 'button--light' : 'button--accent'}`} onClick={connectGoogle} disabled={connecting}>{googleConnected ? <><Check /> Conectado</> : connecting ? 'Conectando...' : <><Link2 /> Conectar Google Agenda</>}</button> : <Badge tone="warning">OAuth não configurado</Badge>}
    </section>

    <div className="consultations-toolbar"><div><span className="eyebrow">Agenda de atendimentos</span><h2>Calendário de consultorias</h2><p>Organize conversas individuais e mantenha o atleta informado sobre cada encontro.</p></div><button className="button button--dark" onClick={() => setModalOpen(true)}><Plus /> Nova consultoria</button></div>

    <section className="consultations-layout">
      <article className="panel consultation-calendar"><header><button className="icon-button" onClick={() => changeMonth(-1)} aria-label="Mês anterior"><ChevronLeft /></button><h3>{monthLabel}</h3><button className="icon-button" onClick={() => changeMonth(1)} aria-label="Próximo mês"><ChevronRight /></button></header><div className="calendar-weekdays">{weekDays.map(day => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{days.map(day => {
        const iso = localDateISO(day)
        const dayEvents = consultations.filter(item => item.date === iso && item.status === 'scheduled')
        const outside = day.getMonth() !== month.getMonth()
        const isToday = iso === localDateISO(today)
        return <button key={iso} className={`${outside ? 'outside' : ''} ${isToday ? 'today' : ''} ${selectedDate === iso ? 'selected' : ''}`} onClick={() => setSelectedDate(iso)}><span>{day.getDate()}</span><div>{dayEvents.slice(0, 2).map(item => <i key={item.id} className={item.source === 'google' ? 'google' : ''}>{item.startTime} · {item.athleteName.split(' ')[0]}</i>)}{dayEvents.length > 2 && <small>+{dayEvents.length - 2}</small>}</div></button>
      })}</div></article>

      <aside className="panel consultation-agenda"><header><div><span className="eyebrow">Próximos encontros</span><h3>Consultorias agendadas</h3></div><span>{upcoming.length}</span></header><div className="consultation-list">{upcoming.slice(0, 6).map(item => {
        const athlete = athletes.find(entry => entry.id === item.athleteId)
        return <article key={item.id}><div className="consultation-list__time"><strong>{item.startTime}</strong><span>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${item.date}T12:00:00`)).replace('.', '')}</span></div><div className="consultation-list__line" /><div className="consultation-list__content"><div><Avatar initials={athlete?.initials ?? 'AT'} color={athlete?.color} /><span><strong>{item.athleteName}</strong><small>{item.purpose}</small></span></div><p>{item.description}</p><footer><Badge tone={item.source === 'google' ? 'success' : 'warning'}><Video /> {item.source === 'google' ? 'Google Meet' : 'Meet pendente'}</Badge><span><Clock3 /> {item.duration} min</span>{item.meetLink && <a href={item.meetLink} target="_blank" rel="noreferrer">Abrir <ExternalLink /></a>}</footer></div></article>
      })}{!upcoming.length && <div className="empty-consultations"><CalendarDays /><strong>Nenhuma consultoria agendada</strong><span>Selecione um dia e crie o primeiro encontro.</span></div>}</div></aside>
    </section>

    {modalOpen && <div className="modal-backdrop" role="presentation"><section className="consultation-modal" role="dialog" aria-modal="true" aria-labelledby="consultation-title"><header><div><span className="modal-icon"><CalendarDays /></span><div><h2 id="consultation-title">Nova consultoria</h2><p>O atleta será notificado assim que o agendamento for confirmado.</p></div></div><button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Fechar"><X /></button></header><form onSubmit={schedule}>
      <div className="consultation-form-grid"><label>Atleta<select value={form.athleteId} onChange={event => selectAthlete(Number(event.target.value))}>{athletes.map(item => <option value={item.id} key={item.id}>{item.name} · {item.sport}</option>)}</select></label><label>E-mail do convite<input type="email" required value={form.athleteEmail} onChange={event => setForm(current => ({ ...current, athleteEmail: event.target.value }))} /></label><label>Data<input type="date" required value={selectedDate} onChange={event => setSelectedDate(event.target.value)} /></label><label>Horário<input type="time" required value={form.startTime} onChange={event => setForm(current => ({ ...current, startTime: event.target.value }))} /></label><label>Duração<select value={form.duration} onChange={event => setForm(current => ({ ...current, duration: Number(event.target.value) }))}><option value={30}>30 minutos</option><option value={45}>45 minutos</option><option value={60}>60 minutos</option><option value={90}>90 minutos</option></select></label><label>Propósito<select value={form.purpose} onChange={event => setForm(current => ({ ...current, purpose: event.target.value }))}>{purposes.map(item => <option key={item}>{item}</option>)}</select></label><label className="full">Descrição e pauta<textarea required value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} placeholder="Explique o objetivo da consultoria, pontos que serão avaliados e como o atleta pode se preparar." /></label></div>
      <div className="consultation-summary"><Sparkles /><div><strong>{googleCalendarConfigured ? 'Criação automática pelo Google Agenda' : 'Agendamento demonstrativo local'}</strong><span>{googleCalendarConfigured ? 'Um evento com Google Meet será criado e o atleta receberá o convite por e-mail e uma notificação na LinkAtletas.' : 'A notificação interna será enviada. O link do Meet será criado quando o Client ID do Google estiver configurado.'}</span></div></div>
      <footer><button type="button" className="button button--outline" onClick={() => setModalOpen(false)}>Cancelar</button><button className="button button--accent" disabled={saving}>{saving ? 'Criando consultoria...' : <><Video /> Agendar e criar Meet <ArrowRight /></>}</button></footer>
    </form></section></div>}
    <Toast message={toast} visible={Boolean(toast)} onClose={() => setToast('')} />
  </div>
}
