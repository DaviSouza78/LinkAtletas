import type { Contract } from '../../../shared/contracts'
import { useAuth } from '../../context/AuthContext'
import { useRemote } from '../../hooks/useRemote'
import type { Message } from '../../../shared/interaction-contracts'
import { usePersistedRefresh } from '../../hooks/usePersistedRefresh'
import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useEvents } from '../../hooks/useEvents'
import { api, json } from '../../services/api'
import { message } from '../../utils/errors'
import { uploadFile } from '../../services/media'
import { MessageSquare, Send } from 'lucide-react'
import { State, Notice, Empty } from '../../components/ui/Feedback'
import { dateTime } from '../../utils/formatters'

export function Conversation({ contract }: { contract: Contract }) {
  const { user } = useAuth()
  const remote = useRemote<{ messages: Message[]; nextCursor: string | null }>(
    `/contracts/${contract.id}/messages?limit=50`,
  )
  usePersistedRefresh(remote.reload)
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
          {connected ? 'Conectado' : 'Atualizacao a cada 10 s'}
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
