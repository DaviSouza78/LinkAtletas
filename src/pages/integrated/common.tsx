import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { api } from '../../services/api'
export function useRemote<T>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const pending = useRef<AbortController | null>(null)
  const reload = useCallback(async () => {
    pending.current?.abort()
    const controller = new AbortController()
    pending.current = controller
    setLoading(true)
    setError('')
    try {
      const result = await api<T>(path, { signal: controller.signal })
      if (!controller.signal.aborted) setData(result)
    } catch (e) {
      if (
        !controller.signal.aborted &&
        !(e instanceof DOMException && e.name === 'AbortError')
      )
        setError(message(e))
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [path])
  useEffect(() => {
    void reload()
    return () => pending.current?.abort()
  }, [reload])
  return { data, error, loading, reload }
}
export function message(e: unknown) {
  return e instanceof Error
    ? e.message
    : 'Não foi possível concluir a operação.'
}
export function State({
  loading,
  error,
  retry,
}: {
  loading: boolean
  error: string
  retry: () => unknown
}) {
  if (error)
    return (
      <div className="live-state" role="alert">
        <strong>Precisamos tentar novamente</strong>
        <p>{error}</p>
        <button className="button button--outline" onClick={retry}>
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    )
  if (loading)
    return (
      <div className="live-state" role="status">
        Carregando seus dados…
      </div>
    )
  return null
}
export function Notice({
  error,
  success,
}: {
  error?: string
  success?: string
}) {
  return (
    <>
      {error && (
        <div role="alert" className="form-error">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="live-success">
          {success}
        </div>
      )}
    </>
  )
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="live-empty">{children}</div>
}
export function PageTitle({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="live-title">
      <div>
        <span className="eyebrow">Sua jornada em movimento</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}
export const money = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const day = (value: string) =>
  new Date(value.slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR')
export const statusLabel: Record<string, string> = {
  pending: 'Aguardando análise',
  active: 'Ativo',
  rejected: 'Recusado',
  approved: 'Aprovado',
  unsubmitted: 'Não enviado',
  draft: 'Rascunho',
  published: 'Publicado',
  suspended: 'Suspenso',
  cancelled: 'Encerrado',
  scheduled: 'Agendada',
  completed: 'Concluído',
  hidden: 'Oculto',
  expired: 'Expirado',
  awaiting_payment: 'Aguardando pagamento',
  regular: 'Pagamento regular',
  grace: 'Em carência',
  cancellation_requested: 'Cancelamento solicitado',
  ended: 'Encerrado',
  uncertain: 'Aguardando conciliação',
  RECEIVED: 'Recebido',
  CONFIRMED: 'Confirmado',
  OVERDUE: 'Vencido',
  PENDING: 'Pendente',
  REFUNDED: 'Estornado',
}
export function Badge({ status }: { status: string }) {
  return (
    <span className={`live-badge live-badge--${status}`}>
      {statusLabel[status] || status}
    </span>
  )
}
