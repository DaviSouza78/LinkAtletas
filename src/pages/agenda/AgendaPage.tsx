import { useAuth } from '../../context/AuthContext'
import { useRemote } from '../../hooks/useRemote'
import type { Consultation } from '../../../shared/interaction-contracts'
import type { Contract } from '../../../shared/contracts'
import { useState } from 'react'
import { useEvents } from '../../hooks/useEvents'
import { usePersistedRefresh } from '../../hooks/usePersistedRefresh'
import { message } from '../../utils/errors'
import { localDateTime, dateTime } from '../../utils/formatters'
import { createGoogleMeetEvent, googleCalendarConfigured } from '../../services/googleCalendar'
import { api, json } from '../../services/api'
import { PageTitle } from '../../components/ui/PageTitle'
import { Notice, State, Empty } from '../../components/ui/Feedback'
import { CalendarDays } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'

export function AgendaPage() {
  const { user } = useAuth()
  const remote = useRemote<{ consultations: Consultation[] }>('/consultations')
  const contracts = useRemote<{ contracts: Contract[] }>('/contracts')
  const [form, setForm] = useState({
    contractId: '',
    title: '',
    description: '',
    startsAt: '',
    durationMinutes: 30,
    meetingUrl: '',
  })
  const [editing, setEditing] = useState<Consultation | null>(null)
  const [reschedule, setReschedule] = useState('')
  const [reason, setReason] = useState('')
  const [completedId, setCompletedId] = useState<string | null>(null)
  const [googlePending, setGooglePending] = useState<
    Record<string, { eventId: string; meetingUrl: string }>
  >({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  useEvents((event) => {
    if (event.type === 'consultation') void remote.reload()
  })
  usePersistedRefresh(remote.reload)
  const active =
    contracts.data?.contracts.filter((c) => c.status === 'active') || []
  async function perform(action: () => Promise<unknown>, result: string) {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await action()
      await remote.reload()
      setSuccess(result)
      setEditing(null)
      setCompletedId(null)
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  async function createGoogle(c: Consultation) {
    if (
      !googlePending[c.id] &&
      !window.confirm(
        'Criar um evento e uma reunião Meet na sua própria agenda Google? A conexão solicitará sua autorização. Nenhum convite por e-mail será enviado pela plataforma.',
      )
    )
      return
    await perform(async () => {
      let reference = googlePending[c.id]
      if (!reference) {
        const date = localDateTime(c.startsAt)
        const event = await createGoogleMeetEvent({
          athleteId: 0,
          athleteName: c.athleteName,
          athleteEmail: '',
          purpose: c.title,
          description: c.description,
          date: date.slice(0, 10),
          startTime: date.slice(11, 16),
          duration: c.durationMinutes,
        })
        if (!event.meetLink)
          throw new Error(
            'Evento criado no Google, mas o link Meet ainda não foi disponibilizado. Confira sua agenda antes de tentar outra criação.',
          )
        reference = { eventId: event.googleEventId, meetingUrl: event.meetLink }
        setGooglePending((previous) => ({ ...previous, [c.id]: reference }))
      }
      await api(
        '/consultations/' + c.id + '/google-event',
        json('POST', reference),
      )
      setGooglePending((previous) => {
        const next = { ...previous }
        delete next[c.id]
        return next
      })
    }, 'Referência do Google Agenda e Meet vinculada à consultoria.')
  }
  return (
    <>
      <PageTitle
        title="Reserve um momento para evoluir"
        description="Agende consultorias, acompanhe os próximos encontros e organize seu tempo."
      />
      <Notice error={error} success={success} />
      <State {...remote} retry={remote.reload} />
      <State {...contracts} retry={contracts.reload} />
      <div className="exp-agenda-layout">
        <section className="live-stack">
          {remote.data?.consultations.map((c) => (
            <article className="live-panel" key={c.id}>
              <div className="live-panel-heading">
                <h3>
                  <CalendarDays size={20} /> {c.title}
                </h3>
                <Badge status={c.status} />
              </div>
              <p>
                <strong>{dateTime(c.startsAt)}</strong> · {c.durationMinutes}{' '}
                minutos
              </p>
              <p>{user?.role === 'coach' ? c.athleteName : c.coachName}</p>
              <p className="exp-policy">{c.description}</p>
              {c.meetingUrl ? (
                <a
                  className="button button--outline"
                  target="_blank"
                  rel="noreferrer"
                  href={c.meetingUrl}
                >
                  Abrir encontro online
                </a>
              ) : (
                <p className="live-muted">
                  Consultoria registrada. Nenhuma videoconferência externa foi
                  criada.
                </p>
              )}
              {c.status === 'scheduled' && (
                <div className="live-actions">
                  <button
                    className="button button--outline"
                    disabled={busy}
                    onClick={() => {
                      setEditing(c)
                      setReschedule(localDateTime(c.startsAt))
                      setReason('')
                    }}
                  >
                    Reagendar ou cancelar
                  </button>
                  {user?.role === 'coach' && (
                    <button
                      className="button button--outline"
                      disabled={
                        busy || new Date(c.startsAt).getTime() > Date.now()
                      }
                      onClick={() => {
                        setCompletedId(c.id)
                        setReason('')
                      }}
                    >
                      Marcar concluída
                    </button>
                  )}
                  {!c.externalEventId &&
                    googleCalendarConfigured &&
                    user?.role === 'coach' && (
                      <button
                        className="button button--outline"
                        disabled={busy}
                        onClick={() => void createGoogle(c)}
                      >
                        {googlePending[c.id]
                          ? 'Vincular evento já criado'
                          : 'Criar evento Google e Meet'}
                      </button>
                    )}
                </div>
              )}
              {c.externalEventId && (
                <p className="live-muted">
                  Evento vinculado ao Google. Reagendamentos e cancelamentos
                  locais precisam ser atualizados também na sua agenda externa.
                </p>
              )}
              {completedId === c.id && (
                <form
                  className="live-form exp-inline-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void perform(
                      () =>
                        api(
                          '/consultations/' + c.id,
                          json('PATCH', { status: 'completed', reason }),
                        ),
                      'Consultoria concluída.',
                    )
                  }}
                >
                  <label>
                    Registro da conclusão
                    <textarea
                      required
                      minLength={5}
                      maxLength={1000}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <div className="live-actions">
                    <button className="button button--outline" disabled={busy}>
                      Confirmar conclusão
                    </button>
                    <button
                      type="button"
                      className="button button--outline"
                      onClick={() => setCompletedId(null)}
                    >
                      Voltar
                    </button>
                  </div>
                </form>
              )}
              {editing?.id === c.id && (
                <form
                  className="live-form exp-inline-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void perform(
                      () =>
                        api(
                          '/consultations/' + c.id,
                          json('PATCH', {
                            startsAt: new Date(reschedule).toISOString(),
                            reason,
                          }),
                        ),
                      'Consultoria reagendada.',
                    )
                  }}
                >
                  <label>
                    Novo início
                    <input
                      required
                      type="datetime-local"
                      value={reschedule}
                      onChange={(e) => setReschedule(e.target.value)}
                    />
                  </label>
                  <label>
                    Motivo da mudança
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      minLength={5}
                      maxLength={1000}
                      required
                    />
                  </label>
                  <div className="live-actions">
                    <button className="button button--dark" disabled={busy}>
                      Salvar novo horário
                    </button>
                    <button
                      type="button"
                      className="button button--outline"
                      disabled={busy || reason.trim().length < 5}
                      onClick={() => {
                        if (window.confirm('Cancelar esta consultoria?'))
                          void perform(
                            () =>
                              api(
                                '/consultations/' + c.id,
                                json('PATCH', { status: 'cancelled', reason }),
                              ),
                            'Consultoria cancelada.',
                          )
                      }}
                    >
                      Cancelar consultoria
                    </button>
                    <button
                      type="button"
                      className="button button--outline"
                      onClick={() => setEditing(null)}
                    >
                      Fechar
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))}
          {remote.data && !remote.data.consultations.length && (
            <Empty>
              Nenhuma consultoria agendada. Planeje seu primeiro encontro.
            </Empty>
          )}
        </section>
        <form
          className="live-panel live-form"
          onSubmit={(e) => {
            e.preventDefault()
            void perform(async () => {
              await api(
                '/consultations',
                json('POST', {
                  ...form,
                  contractId: form.contractId || active[0]?.id,
                  startsAt: new Date(form.startsAt).toISOString(),
                  ...(form.meetingUrl
                    ? { meetingUrl: form.meetingUrl }
                    : { meetingUrl: undefined }),
                }),
              )
              setForm({
                contractId: '',
                title: '',
                description: '',
                startsAt: '',
                durationMinutes: 30,
                meetingUrl: '',
              })
            }, 'Consultoria agendada.')
          }}
        >
          <h3>Agendar consultoria</h3>
          <label>
            Vínculo
            <select
              required
              value={form.contractId || active[0]?.id || ''}
              onChange={(e) =>
                setForm((v) => ({ ...v, contractId: e.target.value }))
              }
            >
              {!active.length && <option value="">Nenhum vínculo ativo</option>}
              {active.map((c) => (
                <option key={c.id} value={c.id}>
                  {user?.role === 'coach' ? c.athleteName : c.coachName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Título
            <input
              required
              minLength={3}
              maxLength={120}
              value={form.title}
              onChange={(e) =>
                setForm((v) => ({ ...v, title: e.target.value }))
              }
            />
          </label>
          <label>
            Objetivo do encontro
            <textarea
              required
              maxLength={3000}
              value={form.description}
              onChange={(e) =>
                setForm((v) => ({ ...v, description: e.target.value }))
              }
            />
          </label>
          <label>
            Data e horário
            <input
              required
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) =>
                setForm((v) => ({ ...v, startsAt: e.target.value }))
              }
            />
          </label>
          <label>
            Duração (minutos)
            <input
              required
              type="number"
              min={15}
              max={180}
              value={form.durationMinutes}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  durationMinutes: Number(e.target.value),
                }))
              }
            />
          </label>
          <label>
            Link HTTPS do encontro (opcional)
            <input
              type="url"
              value={form.meetingUrl}
              onChange={(e) =>
                setForm((v) => ({ ...v, meetingUrl: e.target.value }))
              }
            />
          </label>
          <button
            className="button button--dark"
            disabled={busy || !active.length}
          >
            <CalendarDays size={17} /> Agendar consultoria
          </button>
        </form>
      </div>
    </>
  )
}
