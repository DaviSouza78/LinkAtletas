import type { Contract } from '../../../shared/contracts'
import { useState } from 'react'
import { api, json } from '../../services/api'
import { message } from '../../utils/errors'
import { Notice } from '../ui/Feedback'

export function ContractEndAction({
  contract,
  onChange,
}: {
  contract: Contract
  onChange: () => unknown
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!open)
    return (
      <button className="button button--outline" onClick={() => setOpen(true)}>
        {contract.status === 'pending'
          ? 'Retirar solicitação'
          : 'Encerrar vínculo'}
      </button>
    )
  return (
    <form
      className="live-form exp-contract-end"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError('')
        try {
          await api(
            '/contracts/' + contract.id + '/cancel',
            json('POST', { reason }),
          )
          await onChange()
          setOpen(false)
        } catch (e) {
          setError(message(e))
        } finally {
          setBusy(false)
        }
      }}
    >
      <label>
        Motivo do encerramento
        <textarea
          required
          minLength={5}
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <p className="live-muted">
        O histórico será preservado. Se houver assinatura, a renovação e o
        período pago seguem a confirmação do provedor.
      </p>
      <Notice error={error} />
      <div className="live-actions">
        <button className="button button--outline" disabled={busy}>
          Confirmar encerramento
        </button>
        <button
          type="button"
          className="button button--outline"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          Voltar
        </button>
      </div>
    </form>
  )
}
