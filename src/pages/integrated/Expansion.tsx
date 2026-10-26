import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Download, FileUp, ShieldCheck, Trash2 } from 'lucide-react'
import { api, json } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Empty, Notice, PageTitle, State, message, useRemote } from './common'

export interface MediaItem {
  id: string
  name: string
  mimeType: string
  size: number
  purpose: string
  resourceId: string
  ownerId: string
  createdAt: string
  feedback: {
    id: string
    text: string
    authorName?: string
    createdAt: string
  }[]
}
export async function uploadFile(
  file: File,
  purpose: string,
  resourceId: string,
) {
  if (file.size > 3 * 1024 * 1024) {
    const { upload } = await api<{
      upload: { id: string; partSize: number; parts: number }
    }>(
      '/media/uploads',
      json('POST', {
        purpose,
        resourceId,
        name: file.name,
        mimeType: file.type,
        size: file.size,
      }),
    )
    try {
      for (let part = 0; part < upload.parts; part++) {
        await api(`/media/uploads/${upload.id}/parts/${part}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: file.slice(
            part * upload.partSize,
            (part + 1) * upload.partSize,
          ),
        })
      }
      return await api<{ media: MediaItem }>(
        `/media/uploads/${upload.id}/complete`,
        json('POST', {}),
      )
    } catch (error) {
      await api(`/media/uploads/${upload.id}`, { method: 'DELETE' }).catch(
        () => undefined,
      )
      throw error
    }
  }
  const body = new FormData()
  body.append('file', file)
  return api<{ media: MediaItem }>(
    `/media?purpose=${purpose}&resourceId=${encodeURIComponent(resourceId)}`,
    { method: 'POST', body },
  )
}
export function MediaPanel({
  resourceId,
  purpose,
  allowUpload = true,
}: {
  resourceId: string
  purpose: 'instruction' | 'performance' | 'message' | 'verification'
  allowUpload?: boolean
}) {
  const { user } = useAuth()
  const remote = useRemote<{ media: MediaItem[] }>(
    '/media?resourceId=' + resourceId,
  )
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function perform(action: () => Promise<unknown>, successText: string) {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await action()
      await remote.reload()
      setSuccess(successText)
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) return
    const form = e.currentTarget
    await perform(async () => {
      await uploadFile(file, purpose, resourceId)
      setFile(null)
      form.reset()
    }, 'Arquivo enviado com sucesso.')
  }
  return (
    <section className="exp-media">
      <h4>
        <FileUp size={18} /> Arquivos e correções
      </h4>
      <p className="live-muted">
        Arquivos privados compartilhados com as pessoas deste vínculo. Imagens e
        PDF até 10 MiB; vídeos até 50 MiB.
      </p>
      <State {...remote} retry={remote.reload} />
      <Notice error={error} success={success} />
      {remote.data?.media.map((m) => (
        <article className="exp-media-item" key={m.id}>
          <div className="live-panel-heading">
            <a
              className="live-link"
              href={'/api/media/' + m.id + '/content'}
              target="_blank"
              rel="noreferrer"
            >
              {m.name}
            </a>
            <small>{(m.size / 1024 / 1024).toFixed(2)} MiB</small>
          </div>
          {m.mimeType.startsWith('video/') && (
            <video
              controls
              preload="none"
              src={'/api/media/' + m.id + '/content'}
              aria-label={'Vídeo ' + m.name}
            />
          )}
          {m.feedback?.map((f) => (
            <div className="exp-feedback" key={f.id}>
              <strong>{f.authorName || 'Feedback'}</strong>
              <p>{f.text}</p>
            </div>
          ))}
          {user?.role === 'coach' && m.purpose === 'performance' && (
            <form
              className="live-form"
              onSubmit={(e) => {
                e.preventDefault()
                void perform(async () => {
                  await api(
                    '/media/' + m.id + '/feedback',
                    json('POST', { text: text[m.id] }),
                  )
                  setText((v) => ({ ...v, [m.id]: '' }))
                }, 'Correção registrada.')
              }}
            >
              <label>
                Comentário sobre {m.name}
                <textarea
                  required
                  minLength={2}
                  maxLength={2000}
                  rows={2}
                  value={text[m.id] || ''}
                  onChange={(e) =>
                    setText((v) => ({ ...v, [m.id]: e.target.value }))
                  }
                />
              </label>
              <div className="live-actions">
                <button className="button button--outline" disabled={busy}>
                  Enviar correção técnica
                </button>
              </div>
            </form>
          )}
          {m.ownerId === user?.id && (
            <button
              type="button"
              className="button button--outline"
              disabled={busy}
              onClick={() => {
                if (window.confirm('Excluir este arquivo privado?'))
                  void perform(
                    () => api('/media/' + m.id, { method: 'DELETE' }),
                    'Arquivo excluído.',
                  )
              }}
            >
              <Trash2 size={16} /> Excluir arquivo
            </button>
          )}
        </article>
      ))}
      {remote.data && !remote.data.media.length && (
        <p className="live-muted">Nenhum arquivo enviado para este recurso.</p>
      )}
      {allowUpload && (
        <form onSubmit={upload} className="live-form exp-upload">
          <label>
            Arquivo privado
            <input
              type="file"
              required
              accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          {purpose === 'performance' && (
            <p className="live-muted">
              Autorize a coleta de performance em{' '}
              <Link
                to={
                  user?.role === 'coach'
                    ? '/treinador/privacidade'
                    : '/atleta/privacidade'
                }
              >
                Privacidade
              </Link>{' '}
              antes de enviar seu vídeo.
            </p>
          )}
          <button className="button button--outline" disabled={busy || !file}>
            <FileUp size={16} /> {busy ? 'Enviando…' : 'Enviar arquivo'}
          </button>
        </form>
      )}
    </section>
  )
}

interface Consent {
  purpose: string
  granted: boolean
  version: string
  updatedAt: string
}
const consentNames: Record<string, string> = {
  performance: 'Vídeos e dados de performance',
  health: 'Informações de saúde',
  communications: 'Comunicações por e-mail',
}
export function PrivacyPage() {
  const [consentDraft, setConsentDraft] = useState<Record<string, boolean>>({})
  const policy = useRemote<{
    policy: { version: string; text: string; retention: string }
  }>('/privacy/policy')
  const consent = useRemote<{ consents: Consent[] }>('/privacy/consents')
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function perform(action: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await action()
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  async function exportData() {
    const data = await api('/privacy/export')
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'linkatletas-meus-dados.json'
    a.click()
    URL.revokeObjectURL(url)
    setSuccess('Exportação dos seus dados preparada.')
  }
  return (
    <>
      <PageTitle
        title="Você decide sobre seus dados"
        description="Controle as finalidades de uso, obtenha uma cópia das informações e gerencie sua conta."
      />
      <Notice error={error} success={success} />
      <State {...policy} retry={policy.reload} />
      <State {...consent} retry={consent.reload} />
      <div className="live-stack">
        {policy.data && (
          <section className="live-panel">
            <h3>
              <ShieldCheck size={20} /> Política de privacidade
            </h3>
            <small>Versão {policy.data.policy.version}</small>
            <p className="exp-policy">{policy.data.policy.text}</p>
            <p className="exp-policy">{policy.data.policy.retention}</p>
          </section>
        )}
        {consent.data && (
          <section className="live-panel">
            <h3>Suas autorizações</h3>
            <p>
              Você pode revogar cada finalidade. A revogação impede novas
              coletas e aplica a política de retenção.
            </p>
            {Object.entries(consentNames).map(([purpose, label]) => {
              const current = consent.data?.consents.find(
                (c) => c.purpose === purpose,
              )
              return (
                <label className="exp-consent" key={purpose}>
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={consentDraft[purpose] ?? current?.granted ?? false}
                    onChange={(e) => {
                      const granted = e.target.checked
                      setConsentDraft((previous) => ({
                        ...previous,
                        [purpose]: granted,
                      }))
                      void perform(async () => {
                        await api(
                          '/privacy/consents',
                          json('PUT', { purpose, granted }),
                        )
                        await consent.reload()
                        setSuccess('Preferência de privacidade atualizada.')
                      }).finally(() =>
                        setConsentDraft((previous) => {
                          const next = { ...previous }
                          delete next[purpose]
                          return next
                        }),
                      )
                    }}
                  />
                  <span>
                    <strong>{label}</strong>
                    <small>
                      {current?.updatedAt
                        ? 'Atualizada em ' +
                          new Date(current.updatedAt).toLocaleString('pt-BR')
                        : 'Ainda não concedida'}
                    </small>
                  </span>
                </label>
              )
            })}
          </section>
        )}
        {consent.data?.consents.some(
          (c) => c.purpose === 'health' && c.granted,
        ) && <HealthPanel />}
        <section className="live-panel">
          <h3>Uma cópia para você</h3>
          <p>Baixe suas informações em formato JSON.</p>
          <button
            className="button button--outline"
            disabled={busy}
            onClick={() => void perform(exportData)}
          >
            <Download size={17} /> Exportar meus dados
          </button>
        </section>
        <form
          className="live-panel live-form exp-danger"
          onSubmit={(e) => {
            e.preventDefault()
            if (!confirmed) return
            void perform(async () => {
              await api('/privacy/delete', json('POST', { password }))
              await refresh()
              navigate('/login', { replace: true })
            })
          }}
        >
          <h3>Encerrar e solicitar exclusão da conta</h3>
          <p>
            Sua sessão será encerrada. Os dados serão eliminados ou anonimizados
            conforme a política; registros que precisarem ser retidos serão
            minimizados.
          </p>
          <label>
            Confirme sua senha
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="exp-consent">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              required
            />
            <span>Entendo que esta ação encerra minha conta.</span>
          </label>
          <button
            className="button button--outline"
            disabled={busy || !confirmed}
          >
            <Trash2 size={16} /> Encerrar minha conta
          </button>
        </form>
      </div>
    </>
  )
}
export function PasswordRecoveryPage() {
  const [params] = useSearchParams()
  const [token] = useState(
    () =>
      new URLSearchParams(location.hash.slice(1)).get('token') ||
      params.get('token') ||
      '',
  )
  const reset = token.length > 0
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (reset && password !== confirmation) {
      setError('As senhas precisam ser iguais.')
      return
    }
    setBusy(true)
    try {
      await api(
        reset ? '/auth/reset-password' : '/auth/forgot-password',
        json('POST', reset ? { token, password } : { email }),
      )
      setSuccess(
        reset
          ? 'Senha alterada. Entre novamente com a nova senha.'
          : 'Se o e-mail estiver cadastrado, você receberá instruções para recuperar o acesso.',
      )
      setPassword('')
      setConfirmation('')
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="exp-recovery">
      <form className="live-panel live-form" onSubmit={submit}>
        <Link to="/login">← Voltar para o login</Link>
        <span className="eyebrow">LinkAtletas · Sua conta</span>
        <h1>{reset ? 'Escolha sua nova senha' : 'Recupere seu acesso'}</h1>
        <p>
          {reset
            ? 'O link pode ser usado uma única vez e expira em 30 minutos.'
            : 'Informe o e-mail que você usou no cadastro.'}
        </p>
        {reset ? (
          <>
            <label>
              Nova senha
              <input
                required
                minLength={8}
                maxLength={128}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              Repita a nova senha
              <input
                required
                minLength={8}
                maxLength={128}
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
          </>
        ) : (
          <label>
            E-mail
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        )}
        <Notice error={error} success={success} />
        <button className="button button--dark" disabled={busy}>
          {busy ? 'Aguarde…' : reset ? 'Alterar senha' : 'Enviar instruções'}
        </button>
      </form>
    </main>
  )
}
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
function HealthPanel() {
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
