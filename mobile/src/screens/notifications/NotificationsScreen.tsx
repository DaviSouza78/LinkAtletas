import type { Notification } from '../../../../shared/interaction-contracts'
import { api } from '../../services/api'
import { datetime } from '../../utils/format'
import { useAction } from '../../hooks/useAction'
import { useRemote } from '../../hooks/useRemote'
import {
  Body,
  Button,
  Empty,
  Heading,
  Loading,
  Notice,
  Panel,
} from '../../components/ui'
import { useEvents } from '../../hooks/useEvents'

export function NotificationsScreen() {
  const remote = useRemote<{ notifications: Notification[]; unread: number }>(
      '/notifications',
    ),
    action = useAction()
  useEvents((event) => {
    if (event.type === 'notification') void remote.reload()
  })
  return (
    <>
      <Heading>Notificações</Heading>
      {remote.loading && <Loading />}
      {remote.error && <Notice message={remote.error} error />}
      {action.error && <Notice message={action.error} error />}
      {remote.data && (
        <Panel>
          <Body>{remote.data.unread} não lida(s)</Body>
          <Button
            title="Marcar todas como lidas"
            secondary
            disabled={action.busy || remote.data.unread === 0}
            onPress={() =>
              void action.run(async () => {
                await api('/notifications', 'PUT', { all: true })
                await remote.reload()
              })
            }
          />
        </Panel>
      )}
      {remote.data?.notifications.map((notification) => (
        <Panel key={notification.id}>
          <Heading small>{notification.title}</Heading>
          <Body muted>
            {datetime(notification.createdAt)} ·{' '}
            {notification.readAt ? 'Lida' : 'Não lida'}
          </Body>
          {!notification.readAt && (
            <Button
              title="Marcar como lida"
              secondary
              disabled={action.busy}
              onPress={() =>
                void action.run(async () => {
                  await api('/notifications', 'PUT', { ids: [notification.id] })
                  await remote.reload()
                })
              }
            />
          )}
        </Panel>
      ))}
      {remote.data && !remote.data.notifications.length && (
        <Empty>Você ainda não tem notificações.</Empty>
      )}
    </>
  )
}
