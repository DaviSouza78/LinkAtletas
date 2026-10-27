import { useEffect, useState } from 'react'
import { ShieldCheck, Save } from 'lucide-react'
import type {
  Profile,
  ProfileInput,
  Verification,
  VerificationStatus,
} from '../../../shared/contracts'
import { SPORTS, GOALS, LEVELS, SLOTS } from '../../../shared/contracts'
import { useAuth } from '../../context/AuthContext'
import { api, json } from '../../services/api'
import { uploadFile } from './Expansion'
import {
  Badge,
  Empty,
  message,
  Notice,
  PageTitle,
  State,
  useRemote,
} from './common'
function Choices({
  legend,
  values,
  selected,
  onChange,
}: {
  legend: string
  values: readonly string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <fieldset className="live-choices">
      <legend>{legend}</legend>
      <div>
        {values.map((value) => (
          <label
            key={value}
            className={selected.includes(value) ? 'selected' : ''}
          >
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() =>
                onChange(
                  selected.includes(value)
                    ? selected.filter((v) => v !== value)
                    : [...selected, value],
                )
              }
            />
            {value}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
export function ProfilePage() {
  const { user } = useAuth()
  const remote = useRemote<{ profile: Profile }>('/profiles/me')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  useEffect(() => {
    if (remote.data) setProfile(remote.data.profile)
  }, [remote.data])
  function set<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p))
    setSuccess('')
  }
  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setBusy(true)
    setError('')
    setSuccess('')
    const {
      name,
      city,
      bio,
      sports,
      goals,
      levels,
      availability,
      mode,
      budget,
      price,
    } = profile
    try {
      const data = await api<{ profile: Profile }>(
        '/profiles/me',
        json('PUT', {
          name,
          city,
          bio,
          sports,
          goals,
          levels,
          availability,
          mode,
          budget,
          price,
        }),
      )
      setProfile(data.profile)
      setSuccess('Perfil salvo com sucesso.')
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageTitle
        title={
          user?.role === 'coach'
            ? 'Seu perfil profissional'
            : 'Um perfil que combina com você'
        }
        description="Seus objetivos e sua disponibilidade ajudam a construir conexões mais relevantes."
      />
      <State {...remote} retry={remote.reload} />
      {profile && !remote.error && (
        <div className="live-stack">
          <form className="live-panel live-form" onSubmit={save}>
            <div className="live-panel-heading">
              <div>
                <h3>Informações do perfil</h3>
                <p>{profile.email}</p>
              </div>
              {user?.role === 'coach' && (
                <Badge status={profile.verificationStatus} />
              )}
            </div>
            <div className="live-grid-2">
              <label>
                Nome completo
                <input
                  value={profile.name}
                  minLength={2}
                  maxLength={100}
                  required
                  onChange={(e) => set('name', e.target.value)}
                />
              </label>
              <label>
                Cidade
                <input
                  value={profile.city}
                  maxLength={100}
                  onChange={(e) => set('city', e.target.value)}
                />
              </label>
            </div>
            <label>
              Sobre você
              <textarea
                value={profile.bio}
                maxLength={2000}
                rows={3}
                onChange={(e) => set('bio', e.target.value)}
              />
            </label>
            <Choices
              legend="Modalidades"
              values={SPORTS}
              selected={profile.sports}
              onChange={(v) => set('sports', v)}
            />
            <Choices
              legend="Objetivos"
              values={GOALS}
              selected={profile.goals}
              onChange={(v) => set('goals', v)}
            />
            <Choices
              legend={
                user?.role === 'coach' ? 'Níveis que atende' : 'Seu nível'
              }
              values={LEVELS}
              selected={profile.levels}
              onChange={(v) => set('levels', v)}
            />
            <Choices
              legend="Disponibilidade"
              values={SLOTS}
              selected={profile.availability}
              onChange={(v) => set('availability', v)}
            />
            <div className="live-grid-2">
              <label>
                Formato de atendimento
                <select
                  value={profile.mode}
                  onChange={(e) =>
                    set('mode', e.target.value as Profile['mode'])
                  }
                >
                  <option value="online">Online</option>
                  <option value="presencial">Presencial</option>
                  <option value="hibrido">Híbrido</option>
                </select>
              </label>
              {user?.role === 'coach' ? (
                <label>
                  Preço mensal (R$)
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    step="0.01"
                    value={profile.price}
                    onChange={(e) => set('price', Number(e.target.value))}
                  />
                </label>
              ) : (
                <label>
                  Orçamento mensal (R$)
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    step="0.01"
                    value={profile.budget}
                    onChange={(e) => set('budget', Number(e.target.value))}
                  />
                </label>
              )}
            </div>
            <Notice error={error} success={success} />
            <button className="button button--dark" disabled={busy}>
              <Save size={17} />
              {busy ? 'Salvando…' : 'Salvar perfil'}
            </button>
          </form>
          {user?.role === 'coach' && (
            <VerificationForm
              onChange={remote.reload}
              currentStatus={profile.verificationStatus}
            />
          )}
        </div>
      )}
    </>
  )
}
type ExtendedVerification = Verification & {
  currentStatus?: VerificationStatus
  currentReason?: string
  documentId?: string | null
  expiresAt?: string | null
  source?: string
}
function VerificationForm({
  onChange,
  currentStatus,
}: {
  onChange: () => unknown
  currentStatus: string
}) {
  const { user } = useAuth()
  const remote = useRemote<{ verifications: ExtendedVerification[] }>(
    '/verifications',
  )
  const [cref, setCref] = useState('')
  const [evidence, setEvidence] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      let document = documentId
      if (file && !document && user) {
        document = (await uploadFile(file, 'verification', user.id)).media.id
        setDocumentId(document)
      }
      await api(
        '/verifications',
        json('POST', {
          cref,
          evidence,
          ...(document ? { documentId: document } : {}),
        }),
      )
      setSuccess('Credenciais enviadas. Aguarde a análise do administrador.')
      await remote.reload()
      onChange()
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  const pending = remote.data?.verifications.some((v) => v.status === 'pending')
  const approved = currentStatus === 'approved'
  return (
    <section className="live-panel">
      <div className="live-panel-heading">
        <div>
          <h3>
            <ShieldCheck size={21} /> Verificação profissional
          </h3>
          <p>Seu perfil aparece na busca após a aprovação manual do CREF.</p>
        </div>
      </div>
      <State {...remote} retry={remote.reload} />
      {remote.data?.verifications.map((v) => (
        <article className="live-row" key={v.id}>
          <div>
            <strong>{v.cref}</strong>
            <p>{v.reason || 'Solicitação enviada para análise.'}</p>
            {v.expiresAt && (
              <small>
                Validade: {new Date(v.expiresAt).toLocaleDateString('pt-BR')}
              </small>
            )}
            {v.documentId && (
              <a
                className="live-link"
                href={'/api/media/' + v.documentId + '/content'}
                target="_blank"
                rel="noreferrer"
              >
                Abrir documento privado
              </a>
            )}
          </div>
          <Badge status={v.status} />
        </article>
      ))}
      {!approved && (
        <form onSubmit={submit} className="live-form">
          <label>
            CREF
            <input
              value={cref}
              placeholder="Ex.: 012345-G/SC"
              required
              minLength={4}
              maxLength={50}
              onChange={(e) => setCref(e.target.value)}
            />
          </label>
          <label>
            Evidência profissional
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              required
              minLength={10}
              maxLength={2000}
              placeholder="Informe o link público de consulta ao registro e informações para verificação."
              rows={3}
            />
          </label>
          <p className="live-muted">
            Complete seu perfil antes de enviar. Use apenas informações
            profissionais. A evidência é revisada pelo administrador.
          </p>
          <label>
            Documento profissional privado (opcional)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null)
                setDocumentId(null)
              }}
            />
          </label>
          <Notice error={error} success={success} />
          <button className="button button--dark" disabled={busy || pending}>
            {pending
              ? 'Análise em andamento'
              : busy
                ? 'Enviando…'
                : 'Enviar para análise'}
          </button>
        </form>
      )}
    </section>
  )
}
export function AdminPage() {
  const remote = useRemote<{ verifications: ExtendedVerification[] }>(
    '/admin/verifications',
  )
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [expirations, setExpirations] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function review(id: string, status: 'approved' | 'rejected') {
    setBusy(id)
    setError('')
    setSuccess('')
    if ((reasons[id] || '').trim().length < 5) {
      setError(
        'Informe uma justificativa de pelo menos 5 caracteres para registrar a análise.',
      )
      setBusy('')
      return
    }
    try {
      await api(
        '/admin/verifications/' + id,
        json('PATCH', {
          status,
          reason: reasons[id] || '',
          ...(status === 'approved' && expirations[id]
            ? {
                expiresAt: new Date(
                  expirations[id] + 'T23:59:59',
                ).toISOString(),
              }
            : {}),
        }),
      )
      setSuccess(
        status === 'approved'
          ? 'Profissional aprovado.'
          : 'Solicitação recusada com justificativa.',
      )
      await remote.reload()
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy('')
    }
  }
  async function suspend(
    v: ExtendedVerification,
    status: 'suspended' | 'rejected',
  ) {
    if ((reasons[v.id] || '').trim().length < 5) {
      setError('Informe uma justificativa de pelo menos 5 caracteres.')
      return
    }
    if (
      !window.confirm(
        status === 'suspended'
          ? 'Suspender este profissional e remover seu perfil da descoberta?'
          : 'Revogar a aprovação deste profissional?',
      )
    )
      return
    setBusy(v.id)
    setError('')
    setSuccess('')
    try {
      await api(
        '/admin/coaches/' + v.coachId + '/verification',
        json('PATCH', { status, reason: reasons[v.id] }),
      )
      await remote.reload()
      setSuccess('Decisão profissional registrada com auditoria.')
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy('')
    }
  }
  return (
    <>
      <PageTitle
        title="Confiança começa com verificação"
        description="Revise o registro e a evidência profissional antes de aprovar o treinador."
      />
      <Notice error={error} success={success} />
      <State {...remote} retry={remote.reload} />
      <div className="live-stack">
        {remote.data && !remote.data.verifications.length && (
          <Empty>Nenhum registro para analisar no momento.</Empty>
        )}
        {remote.data?.verifications.map((v) => (
          <article className="live-panel" key={v.id}>
            <div className="live-panel-heading">
              <div>
                <h3>{v.coachName}</h3>
                <p>CREF {v.cref}</p>
              </div>
              <Badge status={v.currentStatus || v.status} />
            </div>
            <p className="live-muted">
              Resultado desta solicitacao: <Badge status={v.status} />
            </p>
            <p className="live-evidence">{v.evidence}</p>
            {v.currentReason && v.currentReason !== v.reason && (
              <p>Situacao atual: {v.currentReason}</p>
            )}
            {v.documentId && (
              <a
                className="button button--outline"
                href={'/api/media/' + v.documentId + '/content'}
                target="_blank"
                rel="noreferrer"
              >
                Conferir documento privado
              </a>
            )}
            {v.expiresAt && (
              <p className="live-muted">
                Validade: {new Date(v.expiresAt).toLocaleDateString('pt-BR')} ·
                Origem{' '}
                {v.source === 'manual'
                  ? 'conferência manual'
                  : v.source || 'manual'}
              </p>
            )}
            {v.status === 'pending' ? (
              <>
                <label className="live-field">
                  Justificativa da análise
                  <textarea
                    value={reasons[v.id] || ''}
                    onChange={(e) =>
                      setReasons({ ...reasons, [v.id]: e.target.value })
                    }
                    maxLength={1000}
                    placeholder="Obrigatória para aprovar ou recusar (mínimo 5 caracteres)."
                  />
                </label>
                <label className="live-field">
                  Validade da aprovação (opcional)
                  <input
                    type="date"
                    value={expirations[v.id] || ''}
                    min={new Date().toLocaleDateString('en-CA')}
                    onChange={(e) =>
                      setExpirations((value) => ({
                        ...value,
                        [v.id]: e.target.value,
                      }))
                    }
                  />
                </label>
                <div className="live-actions">
                  <button
                    className="button button--dark"
                    disabled={!!busy}
                    onClick={() => review(v.id, 'approved')}
                  >
                    Aprovar
                  </button>
                  <button
                    className="button button--outline"
                    disabled={!!busy}
                    onClick={() => review(v.id, 'rejected')}
                  >
                    Recusar
                  </button>
                </div>
              </>
            ) : (
              <p>{v.reason || 'Registro aprovado.'}</p>
            )}
            {v.status === 'approved' &&
              (!v.currentStatus ||
                ['approved', 'suspended', 'expired'].includes(v.currentStatus)) && (
                <div className="live-form exp-inline-form">
                  <label>
                    Justificativa da suspensão ou revogação
                    <textarea
                      minLength={5}
                      maxLength={1000}
                      value={reasons[v.id] || ''}
                      onChange={(e) =>
                        setReasons((value) => ({
                          ...value,
                          [v.id]: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="live-actions">
                    <button
                      className="button button--outline"
                      disabled={!!busy || v.currentStatus === 'suspended'}
                      onClick={() => void suspend(v, 'suspended')}
                    >
                      Suspender profissional
                    </button>
                    <button
                      className="button button--outline"
                      disabled={!!busy}
                      onClick={() => void suspend(v, 'rejected')}
                    >
                      Revogar aprovação
                    </button>
                  </div>
                </div>
            )}
          </article>
        ))}
      </div>
    </>
  )
}
