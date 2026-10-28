import type { Workout, MetricType } from '../../../shared/contracts'
import { useRemote } from '../../hooks/useRemote'
import { useState } from 'react'
import { api, json } from '../../services/api'
import { message } from '../../utils/errors'
import { State, Notice } from '../../components/ui/Feedback'
import { Save } from 'lucide-react'

export function ExecutionForm({
  workout: w,
  onSave,
}: {
  workout: Workout
  onSave: () => Promise<void>
}) {
  const metrics = useRemote<{ metrics: MetricType[] }>(
    '/metrics?sport=' + encodeURIComponent(w.sport),
  )
  const [completed, setCompleted] = useState<number[]>(
    w.execution?.completedBlocks || [],
  )
  const [effort, setEffort] = useState(w.execution?.effort || 5)
  const [notes, setNotes] = useState(w.execution?.notes || '')
  const [values, setValues] = useState<Record<string, number>>(
    w.execution?.metrics || {},
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api(
        '/workouts/' + w.id + '/execution',
        json('PUT', {
          completedBlocks: completed,
          effort,
          notes,
          metrics: values,
        }),
      )
      await onSave()
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="live-panel live-form" onSubmit={save}>
      <div>
        <h3>Como foi seu treino?</h3>
        <p>
          Marque os blocos realizados. Você pode registrar uma execução parcial.
        </p>
      </div>
      <fieldset className="live-execution-blocks">
        <legend>Blocos realizados</legend>
        {w.blocks.map((b, i) => (
          <label key={i}>
            <input
              type="checkbox"
              checked={completed.includes(i)}
              onChange={() =>
                setCompleted(
                  completed.includes(i)
                    ? completed.filter((n) => n !== i)
                    : [...completed, i],
                )
              }
            />
            <span>
              {i + 1}. {b.name}
            </span>
          </label>
        ))}
      </fieldset>
      <label>
        Esforço percebido (1 a 10)
        <input
          type="number"
          min={1}
          max={10}
          step={1}
          value={effort}
          onChange={(e) => setEffort(Number(e.target.value))}
          required
        />
      </label>
      <p className="live-muted">1 = muito leve · 10 = esforço máximo.</p>
      <State {...metrics} retry={metrics.reload} />
      <div className="live-grid-3">
        {metrics.data?.metrics.map((m) => (
          <label key={m.key}>
            {m.label} ({m.unit})
            <input
              type="number"
              min={m.min}
              max={m.max}
              step={m.key === 'repetitions' ? 1 : 'any'}
              value={values[m.key] ?? ''}
              onChange={(e) => {
                const next = { ...values }
                if (e.target.value === '') delete next[m.key]
                else next[m.key] = Number(e.target.value)
                setValues(next)
              }}
            />
          </label>
        ))}
      </div>
      <label>
        Observações do treino
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={3000}
          placeholder="Como você se sentiu? Houve alguma dificuldade?"
        />
      </label>
      <Notice error={error} />
      <button
        className="button button--dark"
        disabled={busy || metrics.loading || !!metrics.error}
      >
        <Save size={17} />
        {busy ? 'Salvando…' : 'Salvar execução'}
      </button>
    </form>
  )
}
