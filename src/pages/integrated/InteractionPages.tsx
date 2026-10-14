import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bell, CalendarDays, MessageSquare, Send, Star } from 'lucide-react'
import type { Contract } from '../../../shared/contracts'
import type {
  Consultation,
  InteractionEvent,
  Message,
  Notification,
  Review,
} from '../../../shared/interaction-contracts'
import { useAuth } from '../../context/AuthContext'
import { api, json } from '../../services/api'
import {
  Badge,
  Empty,
  Notice,
  PageTitle,
  State,
  message,
  useRemote,
} from './common'
import { uploadFile } from './Expansion'
import {
  createGoogleMeetEvent,
  googleCalendarConfigured,
} from '../../services/googleCalendar'

export function useEvents(onEvent: (event: InteractionEvent) => void) {
  const handler = useRef(onEvent)
  handler.current = onEvent
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    let stopped = false
    let socket: WebSocket | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    function connect() {
      socket = new WebSocket(
        `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/events`,
      )
      socket.onopen = () => setConnected(true)
      socket.onmessage = (e) => {
        try {
          handler.current(JSON.parse(e.data) as InteractionEvent)
        } catch {
          /* Ignore invalid events; persisted data remains authoritative. */
        }
      }
      socket.onerror = () => socket?.close()
      socket.onclose = () => {
        setConnected(false)
        if (!stopped) timer = setTimeout(connect, 3000)
      }
    }
    connect()
    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
      socket?.close()
    }
  }, [])
  return connected
}
const dateTime = (value: string) =>
  new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
function localDateTime(value: string) {
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
}
export function MessagesPage() {
  const { user } = useAuth()
  const contracts = useRemote<{ contracts: Contract[] }>('/contracts')
  const [params] = useSearchParams()
  const [selected, setSelected] = useState(params.get('vinculo') || '')
  const current =
    contracts.data?.contracts.find((c) => c.id === selected) ||
    contracts.data?.contracts[0]
  return (
    <>
      <PageTitle
        title="Conversa que acompanha seu treino"
        description="Orientações e mensagens privadas entre você e seu vínculo esportivo."
      />
      <State {...contracts} retry={contracts.reload} />
      {contracts.data && !contracts.data.contracts.length && (
        <Empty>
          Suas conversas ficam disponíveis depois que você se conecta a um
          treinador.
        </Empty>
      )}
      {current && (
        <div className="exp-chat-layout">
          <aside
            className="live-panel exp-conversations"
            aria-label="Conversas"
          >
            {contracts.data?.contracts.map((c) => (
              <button
                key={c.id}
                className={
                  c.id === current.id
                    ? 'exp-conversation active'
                    : 'exp-conversation'
                }
                onClick={() => setSelected(c.id)}
              >
                <span className="live-avatar">
                  {(user?.role === 'coach' ? c.athleteName : c.coachName)
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span>
                  <strong>
                    {user?.role === 'coach' ? c.athleteName : c.coachName}
                  </strong>
                  <Badge status={c.status} />
                </span>
              </button>
            ))}
          </aside>
          <Conversation key={current.id} contract={current} />
        </div>
      )}
    </>
  )
}
function Conversation({ contract }: { contract: Contract }) {
  const { user } = useAuth()
  const remote = useRemote<{ messages: Message[]; nextCursor: string | null }>(
    `/contracts/${contract.id}/messages?limit=50`,
  )
  const [older, setOlder] = useState<Message[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [attachment, setAttachment] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const connected = useEvents((event) => {
    if (
      event.type === 'ready' ||
      (event.type === 'message' && event.message.contractId === contract.id) ||
      (event.type === 'read' && event.contractId === contract.id)
    )
      void remote.reload()
  })
  const messages = [
    ...new Map(
      [...older, ...(remote.data?.messages || [])].map((m) => [m.id, m]),
    ).values(),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  useEffect(() => {
    const unread = remote.data?.messages.filter(
      (m) => m.senderId !== user?.id && !m.readAt,
    )
    if (unread?.length)
      void api(
        `/contracts/${contract.id}/messages/read`,
        json('PUT', { throughId: unread[unread.length - 1].id }),
      ).catch((e) => setError(message(e)))
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [remote.data, contract.id, user?.id])
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const form = e.currentTarget
    try {
      let mediaId = attachment
      if (file && !mediaId) {
        mediaId = (await uploadFile(file, 'message', contract.id)).media.id
        setAttachment(mediaId)
      }
      await api(
        `/contracts/${contract.id}/messages`,
        json('POST', { text, ...(mediaId ? { mediaId } : {}) }),
      )
      setText('')
      setFile(null)
      setAttachment(null)
      form.reset()
      await remote.reload()
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  async function loadOlder() {
    setBusy(true)
    setError('')
    try {
      const result = await api<{
        messages: Message[]
        nextCursor: string | null
      }>(
        `/contracts/${contract.id}/messages?limit=50&before=${cursor || remote.data?.nextCursor}`,
      )
      setOlder((previous) => [...result.messages, ...previous])
      setCursor(result.nextCursor || 'end')
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="live-panel exp-chat">
      <div className="live-panel-heading">
        <h3>
          <MessageSquare size={20} />{' '}
          {user?.role === 'coach' ? contract.athleteName : contract.coachName}
        </h3>
        <span
          className={connected ? 'exp-connection online' : 'exp-connection'}
          role="status"
        >
          {connected ? 'Conectado' : 'Reconectando…'}
        </span>
      </div>
      <State {...remote} retry={remote.reload} />
      <Notice error={error} />
      <div
        className="exp-chat-history"
        aria-label="Histórico de mensagens"
        aria-live="polite"
      >
        {cursor !== 'end' && (cursor || remote.data?.nextCursor) && (
          <button
            className="button button--outline"
            disabled={busy}
            onClick={() => void loadOlder()}
          >
            Carregar mensagens anteriores
          </button>
        )}
        {remote.data && !messages.length && (
          <Empty>
            Comece a conversa. Compartilhe dúvidas e orientações para o próximo
            treino.
          </Empty>
        )}
        {messages.map((m) => (
          <article
            key={m.id}
            className={`exp-message ${m.senderId === user?.id ? 'exp-message--own' : ''}`}
          >
            <strong>{m.senderName}</strong>
            <p>{m.text}</p>
            {m.mediaId && (
              <a
                className="live-link"
                target="_blank"
                rel="noreferrer"
                href={`/api/media/${m.mediaId}/content`}
              >
                Abrir anexo privado
              </a>
            )}
            <small>
              {dateTime(m.createdAt)}
              {m.senderId === user?.id
                ? m.readAt
                  ? ' · Lida'
                  : ' · Enviada'
                : ''}
            </small>
          </article>
        ))}
        <div ref={end} />
      </div>
      {contract.status === 'active' ? (
        <form className="live-form exp-message-form" onSubmit={submit}>
          <label>
            Sua mensagem
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              required={!file && !attachment}
              maxLength={4000}
              rows={3}
              placeholder="Escreva uma orientação ou dúvida…"
            />
          </label>
          <label>
            Anexo opcional
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null)
                setAttachment(null)
              }}
            />
          </label>
          <button
            className="button button--dark"
            disabled={busy || (!text.trim() && !file && !attachment)}
          >
            <Send size={17} /> {busy ? 'Enviando…' : 'Enviar mensagem'}
          </button>
        </form>
      ) : (
        <p className="live-muted">
          O histórico permanece disponível. Novas mensagens exigem vínculo
          ativo.
        </p>
      )}
    </section>
  )
}
export function NotificationsPage() {
  const remote = useRemote<{ notifications: Notification[]; unread: number }>(
    '/notifications',
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEvents((event) => {
    if (event.type === 'notification' || event.type === 'ready')
      void remote.reload()
  })
  async function read(ids?: string[]) {
    setBusy(true)
    setError('')
    try {
      await api('/notifications', json('PUT', ids ? { ids } : { all: true }))
      await remote.reload()
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageTitle
        title="Novidades da sua jornada"
        description={`${remote.data?.unread || 0} notificação(ões) ainda não lida(s).`}
        action={
          <button
            className="button button--outline"
            disabled={busy || !remote.data?.unread}
            onClick={() => void read()}
          >
            Marcar todas como lidas
          </button>
        }
      />
      <Notice error={error} />
      <State {...remote} retry={remote.reload} />
      <section className="live-panel">
        {remote.data?.notifications.map((n) => (
          <article
            className={`live-row exp-notification ${n.readAt ? '' : 'unread'}`}
            key={n.id}
          >
            <Bell size={20} />
            <div>
              <strong>{n.title}</strong>
              <p>{dateTime(n.createdAt)}</p>
            </div>
            {!n.readAt && (
              <button
                className="button button--outline"
                disabled={busy}
                onClick={() => void read([n.id])}
              >
                Marcar como lida
              </button>
            )}
          </article>
        ))}
        {remote.data && !remote.data.notifications.length && (
          <Empty>As novidades dos seus treinos e vínculos aparecem aqui.</Empty>
        )}
      </section>
    </>
  )
}
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
export function ReviewsPage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const coachId = params.get('treinador')
  const remote = useRemote<{
    reviews: Review[]
    average: number
    count: number
  }>('/reviews' + (coachId ? '?coachId=' + coachId : ''))
  const contracts = useRemote<{ contracts: Contract[] }>('/contracts')
  const [form, setForm] = useState({ contractId: '', rating: 5, text: '' })
  const [editing, setEditing] = useState<string | null>(null)
  const [reply, setReply] = useState<Record<string, string>>({})
  const [report, setReport] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const eligible =
    contracts.data?.contracts.filter(
      (c) => c.status === 'active' && (!coachId || c.coachId === coachId),
    ) || []
  async function perform(action: () => Promise<unknown>, text: string) {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await action()
      await remote.reload()
      setSuccess(text)
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageTitle
        title="Experiências que ajudam a escolher"
        description="Avaliações de atletas vinculados, com espaço para resposta do profissional."
      />
      <Notice error={error} success={success} />
      <State {...remote} retry={remote.reload} />
      {remote.data && (
        <div className="exp-review-summary live-panel">
          <Star size={28} />
          <strong>{Number(remote.data.average || 0).toFixed(1)}</strong>
          <span>{remote.data.count} avaliação(ões) publicada(s)</span>
        </div>
      )}
      {user?.role === 'athlete' && (
        <form
          className="live-panel live-form"
          onSubmit={(e) => {
            e.preventDefault()
            void perform(async () => {
              await api(
                editing ? '/reviews/' + editing : '/reviews',
                json(
                  editing ? 'PUT' : 'POST',
                  editing
                    ? { rating: form.rating, text: form.text }
                    : {
                        ...form,
                        contractId: form.contractId || eligible[0]?.id,
                      },
                ),
              )
              setEditing(null)
              setForm({ contractId: '', rating: 5, text: '' })
            }, 'Avaliação salva.')
          }}
        >
          <h3>
            {editing ? 'Editar sua avaliação' : 'Compartilhe sua experiência'}
          </h3>
          <p>
            Novas avaliações exigem vínculo elegível e o período mínimo definido
            pela plataforma. Cada ciclo de vínculo possui uma avaliação.
          </p>
          <label>
            Treinador
            <select
              required
              disabled={!!editing}
              value={form.contractId || eligible[0]?.id || ''}
              onChange={(e) =>
                setForm((v) => ({ ...v, contractId: e.target.value }))
              }
            >
              {!eligible.length && (
                <option value="">Nenhum vínculo ativo</option>
              )}
              {eligible.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.coachName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nota
            <select
              value={form.rating}
              onChange={(e) =>
                setForm((v) => ({ ...v, rating: Number(e.target.value) }))
              }
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} estrela(s)
                </option>
              ))}
            </select>
          </label>
          <label>
            Sua experiência
            <textarea
              required
              minLength={5}
              maxLength={2000}
              rows={4}
              value={form.text}
              onChange={(e) => setForm((v) => ({ ...v, text: e.target.value }))}
            />
          </label>
          <div className="live-actions">
            <button
              className="button button--dark"
              disabled={busy || !eligible.length}
            >
              <Star size={16} />{' '}
              {editing ? 'Salvar edição' : 'Publicar avaliação'}
            </button>
            {editing && (
              <button
                type="button"
                className="button button--outline"
                onClick={() => {
                  setEditing(null)
                  setForm({ contractId: '', rating: 5, text: '' })
                }}
              >
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      )}
      <div className="live-stack">
        {remote.data?.reviews.map((r) => (
          <article className="live-panel exp-review" key={r.id}>
            <div className="live-panel-heading">
              <div>
                <h3>{r.coachName}</h3>
                <p>
                  {r.athleteName} · {dateTime(r.createdAt)}
                </p>
              </div>
              <span
                aria-label={`${r.rating} de 5 estrelas`}
                className="exp-stars"
              >
                {'★'.repeat(r.rating)}
                {'☆'.repeat(5 - r.rating)}
              </span>
            </div>
            <p className="exp-policy">{r.text}</p>
            {r.reply && (
              <div className="exp-feedback">
                <strong>Resposta do treinador</strong>
                <p>{r.reply}</p>
              </div>
            )}
            <div className="live-actions">
              {r.athleteId === user?.id && (
                <button
                  className="button button--outline"
                  onClick={() => {
                    setEditing(r.id)
                    setForm({
                      contractId: r.contractId,
                      rating: r.rating,
                      text: r.text,
                    })
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  Editar avaliação
                </button>
              )}
              <button
                className="button button--outline"
                onClick={() => {
                  setReport(report === r.id ? null : r.id)
                  setReason('')
                }}
              >
                Denunciar conteúdo
              </button>
            </div>
            {user?.id === r.coachId && (
              <form
                className="live-form exp-inline-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  void perform(
                    () =>
                      api(
                        '/reviews/' + r.id + '/reply',
                        json('POST', { text: reply[r.id] || '' }),
                      ),
                    'Resposta publicada.',
                  )
                }}
              >
                <label>
                  Sua resposta
                  <textarea
                    required
                    minLength={5}
                    maxLength={2000}
                    value={reply[r.id] || ''}
                    onChange={(e) =>
                      setReply((v) => ({ ...v, [r.id]: e.target.value }))
                    }
                  />
                </label>
                <button className="button button--outline" disabled={busy}>
                  Responder avaliação
                </button>
              </form>
            )}
            {report === r.id && (
              <form
                className="live-form exp-inline-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  void perform(async () => {
                    await api(
                      '/reviews/' + r.id + '/report',
                      json('POST', { reason }),
                    )
                    setReport(null)
                  }, 'Denúncia enviada para análise.')
                }}
              >
                <label>
                  Motivo da denúncia
                  <textarea
                    required
                    minLength={5}
                    maxLength={1000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <button className="button button--outline" disabled={busy}>
                  Enviar denúncia
                </button>
              </form>
            )}
          </article>
        ))}
        {remote.data && !remote.data.reviews.length && (
          <Empty>Ainda não há avaliações publicadas.</Empty>
        )}
      </div>
    </>
  )
}
export function AdminReviewsPage() {
  const remote = useRemote<{
    reviews: Review[]
    reports: {
      id: string
      reviewId: string
      reason: string
      createdAt: string
    }[]
  }>('/admin/reviews')
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function moderate(r: Review) {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await api(
        '/admin/reviews/' + r.id,
        json('PATCH', { hidden: !r.hidden, reason: reasons[r.id] }),
      )
      await remote.reload()
      setSuccess('Decisão de moderação registrada.')
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageTitle
        title="Avaliações com responsabilidade"
        description="Revise denúncias e registre a justificativa de cada decisão de publicação."
      />
      <Notice error={error} success={success} />
      <State {...remote} retry={remote.reload} />
      <div className="live-stack">
        {remote.data?.reviews.map((r) => (
          <article className="live-panel live-form" key={r.id}>
            <div className="live-panel-heading">
              <h3>
                {r.coachName} · {r.rating}/5
              </h3>
              <Badge status={r.hidden ? 'hidden' : 'published'} />
            </div>
            <p>
              {r.athleteName}: {r.text}
            </p>
            {remote.data?.reports
              .filter((p) => p.reviewId === r.id)
              .map((p) => (
                <div className="exp-feedback" key={p.id}>
                  <strong>Denúncia</strong>
                  <p>{p.reason}</p>
                </div>
              ))}
            <label>
              Justificativa de moderação
              <textarea
                value={reasons[r.id] || ''}
                onChange={(e) =>
                  setReasons((v) => ({ ...v, [r.id]: e.target.value }))
                }
                minLength={5}
                maxLength={1000}
              />
            </label>
            <button
              className="button button--outline"
              disabled={busy || (reasons[r.id] || '').trim().length < 5}
              onClick={() => void moderate(r)}
            >
              {r.hidden ? 'Restaurar publicação' : 'Ocultar avaliação'}
            </button>
          </article>
        ))}
        {remote.data && !remote.data.reviews.length && (
          <Empty>Nenhuma avaliação para moderar.</Empty>
        )}
      </div>
    </>
  )
}
