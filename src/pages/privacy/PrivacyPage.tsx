import { useState } from 'react'
import { useRemote } from '../../hooks/useRemote'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { message } from '../../utils/errors'
import { api, json } from '../../services/api'
import { PageTitle } from '../../components/ui/PageTitle'
import { Notice, State } from '../../components/ui/Feedback'
import { ShieldCheck, Download, Trash2 } from 'lucide-react'
import { HealthPanel } from './HealthPanel'

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
