import { RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

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
