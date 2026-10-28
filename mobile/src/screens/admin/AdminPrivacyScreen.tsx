import { useRemote } from '../../hooks/useRemote'
import { Body, Empty, Heading, Panel } from '../../components/ui'
import { RemoteState } from '../../components/RemoteState'
import { datetime } from '../../utils/format'

export function AdminPrivacyScreen() {
  const remote = useRemote<{
    requests: {
      id: string
      user_id: string
      status: string
      requested_at: string
      completed_at?: string | null
    }[]
  }>('/admin/privacy/requests')
  return (
    <>
      <Heading>Pedidos de privacidade</Heading>
      <RemoteState remote={remote} />
      {remote.data?.requests.map((item) => (
        <Panel key={item.id}>
          <Heading small>Pedido {item.id.slice(0, 8)}</Heading>
          <Body>Conta: {item.user_id}</Body>
          <Body>
            {item.status} | Solicitado em {datetime(item.requested_at)}
          </Body>
          {item.completed_at && (
            <Body>Concluido em {datetime(item.completed_at)}</Body>
          )}
        </Panel>
      ))}
      {remote.data && !remote.data.requests.length && (
        <Empty>Nenhum pedido registrado.</Empty>
      )}
    </>
  )
}
