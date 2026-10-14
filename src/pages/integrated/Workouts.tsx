import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Save, Send, Trash2 } from 'lucide-react'
import type {
  Contract,
  ExerciseBlock,
  MetricType,
  Workout,
  WorkoutInput,
} from '../../../shared/contracts'
import { SPORTS } from '../../../shared/contracts'
import { api, json } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { MediaPanel } from './Expansion'
import {
  Badge,
  day,
  Empty,
  message,
  Notice,
  PageTitle,
  State,
  useRemote,
} from './common'

const blankBlock = (): ExerciseBlock => ({ name: '', instructions: '' })
function blankWorkout(contractId = ''): WorkoutInput {
  return {
    contractId,
    title: '',
    sport: 'Corrida',
    scheduledDate: new Date().toLocaleDateString('en-CA'),
    instructions: '',
    status: 'draft',
    blocks: [blankBlock()],
  }
}
export function CoachWorkoutsPage() {
  const remote = useRemote<{ workouts: Workout[] }>('/workouts')
  const contracts = useRemote<{ contracts: Contract[] }>('/contracts')
  const [params] = useSearchParams()
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<WorkoutInput | null>(
    params.get('atleta') ? blankWorkout(params.get('atleta')!) : null,
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [view, setView] = useState<string | null>(null)
  const active =
    contracts.data?.contracts.filter((c) => c.status === 'active') || []
  function edit(w: Workout) {
    setEditing(w.id)
    setForm({
      contractId: w.contractId,
      title: w.title,
      sport: w.sport,
      scheduledDate: w.scheduledDate.slice(0, 10),
      instructions: w.instructions,
      status: w.status,
      blocks: w.blocks.map((b) => ({ ...b })),
    })
    setSuccess('')
    setError('')
  }
  function set<K extends keyof WorkoutInput>(key: K, value: WorkoutInput[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f))
  }
  function setBlock<K extends keyof ExerciseBlock>(
    index: number,
    key: K,
    value: ExerciseBlock[K],
  ) {
    if (form)
      set(
        'blocks',
        form.blocks.map((b, i) => (i === index ? { ...b, [key]: value } : b)),
      )
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form) return
    const submitter = (e.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null
    const status = submitter?.value === 'published' ? 'published' : 'draft'
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await api(
        editing ? '/workouts/' + editing : '/workouts',
        json(editing ? 'PUT' : 'POST', { ...form, status }),
      )
      setSuccess(
        status === 'published'
          ? 'Treino publicado. O atleta já pode acessá-lo.'
          : 'Rascunho salvo. Publique quando estiver pronto.',
      )
      setForm(null)
      setEditing(null)
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
        title="Planeje o próximo passo"
        description="Crie treinos para seus atletas e acompanhe o retorno de cada execução."
        action={
          <button
            className="button button--dark"
            disabled={contracts.loading || !active.length}
            onClick={() => {
              setEditing(null)
              setForm(blankWorkout(active[0]?.id))
              setError('')
              setSuccess('')
            }}
          >
            <Plus size={18} />
            Novo treino
          </button>
        }
      />
      <Notice error={error} success={success} />
      <State {...contracts} retry={contracts.reload} />
      <State {...remote} retry={remote.reload} />
      {contracts.data && !active.length && (
        <Empty>
          Você precisa aceitar uma solicitação de contratação para prescrever
          treinos.
        </Empty>
      )}
      {form && (
        <form
          className="live-panel live-form live-workout-editor"
          onSubmit={save}
        >
          <div className="live-panel-heading">
            <div>
              <h3>{editing ? 'Editar treino' : 'Novo treino'}</h3>
              <p>Adicione instruções claras e os blocos de exercícios.</p>
            </div>
            <button
              type="button"
              className="button button--outline"
              disabled={busy}
              onClick={() => {
                setForm(null)
                setEditing(null)
                setError('')
              }}
            >
              Cancelar edição
            </button>
          </div>
          <div className="live-grid-2">
            <label>
              Título do treino
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                minLength={3}
                maxLength={150}
                required
              />
            </label>
            <label>
              Atleta
              <select
                value={form.contractId}
                onChange={(e) => set('contractId', e.target.value)}
                disabled={!!editing}
                required
              >
                <option value="">Selecione um atleta</option>
                {active.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.athleteName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Modalidade
              <select
                value={form.sport}
                onChange={(e) => set('sport', e.target.value)}
              >
                {SPORTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Data do treino
              <input
                type="date"
                value={form.scheduledDate.slice(0, 10)}
                onChange={(e) => set('scheduledDate', e.target.value)}
                required
              />
            </label>
          </div>
          <label>
            Orientações gerais
            <textarea
              rows={3}
              value={form.instructions}
              onChange={(e) => set('instructions', e.target.value)}
              maxLength={3000}
            />
          </label>
          {form.blocks.map((block, index) => (
            <fieldset className="live-block-editor" key={index}>
              <legend>Bloco {index + 1}</legend>
              <div className="live-grid-2">
                <label>
                  Nome do exercício
                  <input
                    minLength={2}
                    value={block.name}
                    onChange={(e) => setBlock(index, 'name', e.target.value)}
                    required
                    maxLength={150}
                  />
                </label>
                <label>
                  Vídeo de referência (URL)
                  <input
                    type="url"
                    value={block.videoUrl || ''}
                    placeholder="https://…"
                    pattern="https://.*"
                    onChange={(e) =>
                      setBlock(index, 'videoUrl', e.target.value || undefined)
                    }
                    maxLength={2000}
                  />
                </label>
              </div>
              <label>
                Instruções do exercício
                <textarea
                  value={block.instructions}
                  onChange={(e) =>
                    setBlock(index, 'instructions', e.target.value)
                  }
                  maxLength={2000}
                  rows={2}
                />
              </label>
              <div className="live-grid-3">
                {(
                  [
                    { key: 'sets', label: 'Séries', step: 1, max: 100 },
                    {
                      key: 'repetitions',
                      label: 'Repetições',
                      step: 1,
                      max: 10000,
                    },
                    {
                      key: 'loadKg',
                      label: 'Carga (kg)',
                      step: 0.1,
                      max: 1000,
                    },
                    {
                      key: 'durationMinutes',
                      label: 'Duração (min)',
                      step: 0.1,
                      max: 1440,
                    },
                    {
                      key: 'distanceKm',
                      label: 'Distância (km)',
                      step: 0.01,
                      max: 1000,
                    },
                  ] as const
                ).map(({ key, label, step, max }) => (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      min={key === 'sets' || key === 'repetitions' ? 1 : 0}
                      max={max}
                      step={step}
                      value={block[key] ?? ''}
                      onChange={(e) =>
                        setBlock(
                          index,
                          key,
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              {form.blocks.length > 1 && (
                <button
                  className="button button--outline"
                  type="button"
                  onClick={() =>
                    set(
                      'blocks',
                      form.blocks.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2 size={15} />
                  Remover bloco {index + 1}
                </button>
              )}
            </fieldset>
          ))}
          <button
            type="button"
            className="button button--outline"
            disabled={form.blocks.length >= 30}
            onClick={() => set('blocks', [...form.blocks, blankBlock()])}
          >
            <Plus size={16} />
            Adicionar bloco
          </button>
          <div className="live-actions">
            <button
              className="button button--outline"
              value="draft"
              disabled={busy}
            >
              <Save size={17} />
              {busy ? 'Salvando…' : 'Salvar rascunho'}
            </button>
            <button
              className="button button--dark"
              value="published"
              disabled={busy}
            >
              <Send size={17} />
              {busy ? 'Salvando…' : 'Publicar treino'}
            </button>
          </div>
        </form>
      )}
      <div className="live-stack">
        {remote.data && !remote.data.workouts.length && !form && (
          <Empty>
            Nenhum treino prescrito. Crie um treino e salve como rascunho ou
            publique para o atleta.
          </Empty>
        )}
        {remote.data?.workouts.map((w) => (
          <article className="live-panel" key={w.id}>
            <div className="live-panel-heading">
              <div>
                <h3>{w.title}</h3>
                <p>
                  {w.athleteName} · {w.sport} · {day(w.scheduledDate)}
                </p>
              </div>
              <Badge status={w.status} />
            </div>
            <div className="live-actions">
              <button
                className="button button--outline"
                onClick={() => setView(view === w.id ? null : w.id)}
              >
                {view === w.id ? 'Ocultar detalhes' : 'Ver detalhes e execução'}
              </button>
              {!w.execution && (
                <button className="button button--dark" onClick={() => edit(w)}>
                  Editar treino
                </button>
              )}
              {w.execution && (
                <span className="live-badge live-badge--approved">
                  Feedback registrado
                </span>
              )}
            </div>
            {view === w.id && <WorkoutDetails workout={w} />}
          </article>
        ))}
      </div>
    </>
  )
}
function WorkoutDetails({ workout: w }: { workout: Workout }) {
  const { user } = useAuth()
  const catalog = useRemote<{ metrics: MetricType[] }>(
    '/metrics?sport=' + encodeURIComponent(w.sport),
  )
  return (
    <div className="live-workout-detail">
      <p>{w.instructions || 'Siga as orientações de cada bloco.'}</p>
      {w.blocks.map((b, i) => (
        <div className="live-exercise" key={i}>
          <span>{String(i + 1).padStart(2, '0')}</span>
          <div>
            <strong>{b.name}</strong>
            <p>{b.instructions}</p>
            <BlockMeta block={b} />
            {b.videoUrl && /^https?:\/\//i.test(b.videoUrl) && (
              <a
                href={b.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="live-link"
              >
                Ver vídeo de referência ↗
              </a>
            )}
          </div>
        </div>
      ))}
      {w.execution && (
        <section className="live-execution-summary">
          <h4>Execução do atleta</h4>
          <p>
            {w.execution.completedBlocks.length} de {w.blocks.length} blocos
            realizados · Esforço percebido: {w.execution.effort}/10
          </p>
          <p>{w.execution.notes || 'Sem observações.'}</p>
          <div className="live-tags">
            {Object.entries(w.execution.metrics).map(([key, value]) => {
              const metric = catalog.data?.metrics.find((m) => m.key === key)
              return (
                <span key={key}>
                  {metric?.label || key}: {value}
                  {metric ? ' ' + metric.unit : ''}
                </span>
              )
            })}
          </div>
          <small>
            Atualizado em{' '}
            {new Date(w.execution.updatedAt).toLocaleString('pt-BR')}
          </small>
        </section>
      )}
      <MediaPanel
        resourceId={w.id}
        purpose={user?.role === 'coach' ? 'instruction' : 'performance'}
      />
    </div>
  )
}
function BlockMeta({ block: b }: { block: ExerciseBlock }) {
  return (
    <div className="live-tags">
      {b.sets != null && <span>{b.sets} séries</span>}
      {b.repetitions != null && <span>{b.repetitions} repetições</span>}
      {b.loadKg != null && <span>{b.loadKg} kg</span>}
      {b.durationMinutes != null && <span>{b.durationMinutes} min</span>}
      {b.distanceKm != null && <span>{b.distanceKm} km</span>}
    </div>
  )
}
export function AthleteWorkoutsPage() {
  const remote = useRemote<{ workouts: Workout[] }>('/workouts')
  const [selected, setSelected] = useState('')
  const [executing, setExecuting] = useState(false)
  const [success, setSuccess] = useState('')
  const w =
    remote.data?.workouts.find((w) => w.id === selected) ||
    remote.data?.workouts[0]
  useEffect(() => {
    setExecuting(false)
  }, [selected])
  return (
    <>
      <PageTitle
        title="Seu treino, sua evolução"
        description="Confira as orientações, realize os exercícios e conte ao treinador como foi."
      />
      <State {...remote} retry={remote.reload} />
      <Notice success={success} />
      {remote.data && !remote.data.workouts.length && (
        <Empty>
          Você ainda não possui treinos publicados. Aguarde a prescrição do seu
          treinador.
        </Empty>
      )}
      {!!remote.data?.workouts.length && w && (
        <>
          <label className="live-field live-panel">
            Treino selecionado
            <select
              value={w.id}
              onChange={(e) => {
                setSelected(e.target.value)
                setSuccess('')
              }}
            >
              {remote.data.workouts.map((item) => (
                <option key={item.id} value={item.id}>
                  {day(item.scheduledDate)} · {item.title}
                  {item.execution ? ' · Feedback registrado' : ''}
                </option>
              ))}
            </select>
          </label>
          <section className="live-panel">
            <div className="live-panel-heading">
              <div>
                <h3>{w.title}</h3>
                <p>
                  {w.sport} · {day(w.scheduledDate)} · Treinador: {w.coachName}
                </p>
              </div>
              <Badge status={w.status} />
            </div>
            <WorkoutDetails workout={w} />
            <button
              className="button button--dark"
              onClick={() => setExecuting(!executing)}
            >
              {executing
                ? 'Fechar registro'
                : w.execution
                  ? 'Atualizar execução'
                  : 'Registrar execução'}
            </button>
          </section>
          {executing && (
            <ExecutionForm
              key={w.id}
              workout={w}
              onSave={async () => {
                await remote.reload()
                setExecuting(false)
                setSuccess('Execução registrada com sucesso.')
              }}
            />
          )}
        </>
      )}
    </>
  )
}
function ExecutionForm({
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
