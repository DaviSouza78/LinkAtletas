import { useRemote } from '../../hooks/useRemote'
import type { Notification } from '../../../shared/interaction-contracts'
import { usePersistedRefresh } from '../../hooks/usePersistedRefresh'
import { useState } from 'react'
import { useEvents } from '../../hooks/useEvents'
import { api, json } from '../../services/api'
import { message } from '../../utils/errors'
import { PageTitle } from '../../components/ui/PageTitle'
import { Notice, State, Empty } from '../../components/ui/Feedback'
import { Bell } from 'lucide-react'
import { dateTime } from '../../utils/formatters'

export function NotificationsPage() {
  const remote = useRemote<{ notifications: Notification[]; unread: number }>(
    '/notifications',
  )
  usePersistedRefresh(remote.reload)
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
