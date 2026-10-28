import { useRemote } from '../../hooks/useRemote'
import { useState, useEffect } from 'react'
import { api, json } from '../../services/api'
import { message } from '../../utils/errors'
import { State, Notice } from '../../components/ui/Feedback'

export function HealthPanel() {
  const remote = useRemote<{
    health: { notes: string; heightCm?: number; weightKg?: number } | null
  }>('/privacy/health')
  const [form, setForm] = useState({ notes: '', height: '', weight: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  useEffect(() => {
    if (remote.data?.health)
      setForm({
        notes: remote.data.health.notes,
        height: String(remote.data.health.heightCm || ''),
        weight: String(remote.data.health.weightKg || ''),
      })
  }, [remote.data])
  return (
    <form
      className="live-panel live-form"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError('')
        setSuccess('')
        try {
          await api(
            '/privacy/health',
            json('PUT', {
              notes: form.notes,
              ...(form.height ? { heightCm: Number(form.height) } : {}),
              ...(form.weight ? { weightKg: Number(form.weight) } : {}),
            }),
          )
          await remote.reload()
          setSuccess('Informações privadas salvas.')
        } catch (e) {
          setError(message(e))
        } finally {
          setBusy(false)
        }
      }}
    >
      <h3>Informações privadas de saúde</h3>
      <p>
        Dados opcionais da sua conta, protegidos em repouso. Revogar o
        consentimento de saúde elimina este registro.
      </p>
      <State {...remote} retry={remote.reload} />
      <div className="live-grid-2">
        <label>
          Altura (cm)
          <input
            type="number"
            min={30}
            max={300}
            step="any"
            value={form.height}
            onChange={(e) => setForm((v) => ({ ...v, height: e.target.value }))}
          />
        </label>
        <label>
          Peso (kg)
          <input
            type="number"
            min={1}
            max={700}
            step="any"
            value={form.weight}
            onChange={(e) => setForm((v) => ({ ...v, weight: e.target.value }))}
          />
        </label>
      </div>
      <label>
        Observações privadas
        <textarea
          rows={3}
          maxLength={4000}
          value={form.notes}
          onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))}
        />
      </label>
      <Notice error={error} success={success} />
      <button
        className="button button--outline"
        disabled={busy || remote.loading}
      >
        Salvar informações privadas
      </button>
    </form>
  )
}
