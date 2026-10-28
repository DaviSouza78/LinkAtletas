import { useRemote } from '../../hooks/useRemote'
import { PageTitle } from '../../components/ui/PageTitle'
import { State, Empty } from '../../components/ui/Feedback'

export function AdminPrivacyPage() {
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
      <PageTitle
        title="Pedidos de privacidade"
        description="Acompanhe a execução dos pedidos de encerramento e eliminação."
      />
      <State {...remote} retry={remote.reload} />
      <section className="live-panel">
        {remote.data?.requests.map((r) => (
          <article className="live-row" key={r.id}>
            <div>
              <strong>Pedido {r.id.slice(0, 8)}</strong>
              <p>{new Date(r.requested_at).toLocaleString('pt-BR')}</p>
              <small>Conta {r.user_id}</small>
            </div>
            <span className="live-badge">
              {r.status === 'completed' ? 'Concluído' : r.status}
            </span>
          </article>
        ))}
        {remote.data && !remote.data.requests.length && (
          <Empty>Nenhum pedido registrado.</Empty>
        )}
      </section>
    </>
  )
}
