import { useEffect, useState } from 'react'
import { CreditCard, ExternalLink, Save, Wallet } from 'lucide-react'
import type { Contract } from '../../../shared/contracts'
import type {
  BillingConfig,
  BillingPlan,
  BillingSummary,
  BillingWallet,
} from '../../../shared/billing-contracts'
import { useAuth } from '../../context/AuthContext'
import { api, json } from '../../services/api'
import {
  Badge,
  Empty,
  Notice,
  PageTitle,
  State,
  day,
  message,
  money,
  useRemote,
} from './common'

function EnvironmentNotice({ config }: { config: BillingConfig }) {
  return (
    <div className="exp-billing-environment" role="status">
      <CreditCard size={20} />
      <div>
        <strong>
          {config.mode === 'academic'
            ? 'Modo acadêmico · sem cobrança'
            : config.environment === 'sandbox'
              ? 'Asaas · ambiente sandbox'
              : 'Asaas · pagamentos reais'}
        </strong>
        <p>
          {config.mode === 'academic'
            ? 'Os vínculos e planos podem ser demonstrados. Nenhum pagamento ou repasse real é criado neste modo.'
            : config.available
              ? 'Pagamentos são concluídos no checkout hospedado. A confirmação depende dos eventos autenticados do provedor.'
              : 'O provedor aguarda configuração para iniciar pagamentos.'}
        </p>
      </div>
    </div>
  )
}
export function FinancePage() {
  const { user } = useAuth()
  const coach = user?.role === 'coach'
  const summary = useRemote<BillingSummary>('/billing/summary')
  const config = useRemote<BillingConfig>('/billing/config')
  const contracts = useRemote<{ contracts: Contract[] }>('/contracts')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  async function checkout(contractId: string) {
    setBusy(contractId)
    setError('')
    setSuccess('')
    try {
      await api('/billing/checkout', json('POST', { contractId }))
      await summary.reload()
      setSuccess(
        'Checkout preparado. Abra o link da assinatura para continuar no provedor.',
      )
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy('')
    }
  }
  async function cancel() {
    if (!cancelId) return
    setBusy(cancelId)
    setError('')
    setSuccess('')
    try {
      await api(
        '/billing/subscriptions/' + cancelId + '/cancel',
        json('POST', { reason }),
      )
      await summary.reload()
      setCancelId(null)
      setSuccess(
        'Solicitação de cancelamento registrada. Confira a confirmação e a vigência na assinatura.',
      )
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy('')
    }
  }
  return (
    <>
      <PageTitle
        title={
          coach ? 'Seu acompanhamento, em números' : 'Assinaturas e pagamentos'
        }
        description="Planos, vigência e histórico financeiro com a origem de cada operação."
      />
      <Notice error={error} success={success} />
      <State {...config} retry={config.reload} />
      <State {...summary} retry={summary.reload} />
      {config.data && <EnvironmentNotice config={config.data} />}
      {summary.data && (
        <div className="live-stat-grid">
          <article className="live-panel">
            <Wallet />
            <strong>{money(summary.data.totals.receivedCents / 100)}</strong>
            <span>
              {coach ? 'Recebimentos confirmados' : 'Pagamentos confirmados'}
            </span>
          </article>
          <article className="live-panel">
            <Wallet />
            <strong>{money(summary.data.totals.coachShareCents / 100)}</strong>
            <span>Parcela estimada dos treinadores</span>
          </article>
          <article className="live-panel">
            <CreditCard />
            <strong>{summary.data.subscriptions.length}</strong>
            <span>Assinaturas registradas</span>
          </article>
        </div>
      )}
      {coach && <CoachBillingSettings />}
      {!coach && (
        <section className="live-panel">
          <h3>Iniciar assinatura</h3>
          <State {...contracts} retry={contracts.reload} />
          {contracts.data?.contracts
            .filter((c) => c.status === 'active' || c.status === 'pending')
            .map((c) => (
              <div className="live-row" key={c.id}>
                <div>
                  <strong>{c.coachName}</strong>
                  <Badge status={c.status} />
                </div>
                <button
                  className="button button--outline"
                  disabled={
                    !!busy ||
                    !config.data?.available ||
                    config.data.mode === 'academic' ||
                    c.status !== 'active'
                  }
                  onClick={() => void checkout(c.id)}
                >
                  Preparar checkout
                </button>
              </div>
            ))}
          {contracts.data && !contracts.data.contracts.length && (
            <Empty>
              Conecte-se a um treinador para contratar o acompanhamento.
            </Empty>
          )}
        </section>
      )}
      <section className="live-panel">
        <h3>Suas assinaturas</h3>
        {summary.data?.subscriptions.map((s) => (
          <article className="exp-subscription" key={s.id}>
            <div className="live-panel-heading">
              <div>
                <h4>{s.planName}</h4>
                <p>
                  {coach ? s.athleteName : s.coachName} ·{' '}
                  {money(s.amountCents / 100)}/mês
                </p>
              </div>
              <Badge status={s.state} />
            </div>
            <p className="live-muted">
              {s.environment === 'sandbox' ? 'Sandbox' : 'Produção'} · Comissão{' '}
              {(s.commissionBps / 100).toFixed(2)}%
              {s.paidUntil
                ? ' · Período pago até ' + day(s.paidUntil)
                : ' · Sem período pago confirmado'}
            </p>
            {s.cancellationConfirmed && (
              <p className="live-success">
                Renovação cancelada. O acesso respeita o período já pago.
              </p>
            )}
            <div className="live-actions">
              {s.checkoutUrl && !coach && (
                <a
                  className="button button--dark"
                  href={s.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir checkout <ExternalLink size={16} />
                </a>
              )}
              {!['ended', 'cancellation_requested'].includes(s.state) && (
                <button
                  className="button button--outline"
                  disabled={!!busy}
                  onClick={() => {
                    setCancelId(s.id)
                    setReason('')
                  }}
                >
                  Cancelar renovação
                </button>
              )}
            </div>
            {cancelId === s.id && (
              <form
                className="live-form exp-inline-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  void cancel()
                }}
              >
                <label>
                  Motivo do cancelamento
                  <textarea
                    required
                    minLength={5}
                    maxLength={1000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <p>
                  A conclusão depende da confirmação do provedor. O período pago
                  será preservado.
                </p>
                <div className="live-actions">
                  <button className="button button--outline" disabled={!!busy}>
                    Confirmar cancelamento
                  </button>
                  <button
                    type="button"
                    className="button button--outline"
                    onClick={() => setCancelId(null)}
                  >
                    Voltar
                  </button>
                </div>
              </form>
            )}
          </article>
        ))}
        {summary.data && !summary.data.subscriptions.length && (
          <Empty>Nenhuma assinatura financeira registrada.</Empty>
        )}
      </section>
      <section className="live-panel">
        <h3>Histórico de pagamentos</h3>
        {summary.data?.payments.map((p) => (
          <article className="live-row" key={p.id}>
            <div>
              <strong>{money(p.amountCents / 100)}</strong>
              <p>
                {p.paidAt
                  ? 'Pago em ' + day(p.paidAt)
                  : p.dueDate
                    ? 'Vencimento ' + day(p.dueDate)
                    : 'Pagamento ainda não confirmado'}{' '}
                · {p.environment}
              </p>
              <small>Referência {p.providerPaymentId}</small>
            </div>
            <Badge status={p.status} />
          </article>
        ))}
        {summary.data && !summary.data.payments.length && (
          <Empty>
            Os pagamentos confirmados pelo provedor aparecerão aqui.
          </Empty>
        )}
      </section>
    </>
  )
}
function CoachBillingSettings() {
  const plan = useRemote<{ plan: BillingPlan | null }>('/billing/plan')
  const wallet = useRemote<{ wallet: BillingWallet | null }>('/billing/wallet')
  const [form, setForm] = useState({
    name: 'Acompanhamento mensal',
    amount: '',
    active: true,
  })
  const [walletId, setWalletId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  useEffect(() => {
    if (plan.data?.plan)
      setForm({
        name: plan.data.plan.name,
        amount: String(plan.data.plan.amountCents / 100),
        active: plan.data.plan.active,
      })
  }, [plan.data])
  useEffect(() => {
    if (wallet.data?.wallet) setWalletId(wallet.data.wallet.walletId)
  }, [wallet.data])
  async function save(kind: 'plan' | 'wallet') {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await api(
        '/billing/' + kind,
        json(
          'PUT',
          kind === 'wallet'
            ? { walletId }
            : {
                name: form.name,
                amountCents: Math.round(Number(form.amount) * 100),
                active: form.active,
              },
        ),
      )
      await (kind === 'wallet' ? wallet : plan).reload()
      setSuccess(
        kind === 'wallet'
          ? 'Carteira de recebimento salva.'
          : 'Plano mensal salvo.',
      )
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="live-panel">
      <h3>Configure seu acompanhamento</h3>
      <Notice error={error} success={success} />
      <State {...plan} retry={plan.reload} />
      <State {...wallet} retry={wallet.reload} />
      <div className="live-grid-2">
        <form
          className="live-form"
          onSubmit={(e) => {
            e.preventDefault()
            void save('plan')
          }}
        >
          <label>
            Nome do plano
            <input
              required
              minLength={3}
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
            />
          </label>
          <label>
            Mensalidade (R$)
            <input
              required
              type="number"
              min={1}
              step="0.01"
              max={100000}
              value={form.amount}
              onChange={(e) =>
                setForm((v) => ({ ...v, amount: e.target.value }))
              }
            />
          </label>
          <label className="exp-consent">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((v) => ({ ...v, active: e.target.checked }))
              }
            />
            <span>Plano disponível para novas assinaturas</span>
          </label>
          <button className="button button--outline" disabled={busy}>
            <Save size={16} /> Salvar plano
          </button>
        </form>
        <form
          className="live-form"
          onSubmit={(e) => {
            e.preventDefault()
            void save('wallet')
          }}
        >
          <label>
            Identificador da carteira Asaas
            <input
              required
              minLength={36}
              maxLength={36}
              pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              autoComplete="off"
            />
          </label>
          <p className="live-muted">
            Use a carteira da sua conta elegível no mesmo ambiente do gateway. O
            identificador não substitui a abertura ou verificação da conta no
            provedor.
          </p>
          <button className="button button--outline" disabled={busy}>
            <Wallet size={16} /> Salvar carteira
          </button>
        </form>
      </div>
    </section>
  )
}
export function AdminBillingPage() {
  const config = useRemote<BillingConfig>('/billing/config')
  const [commission, setCommission] = useState(0)
  const [grace, setGrace] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  useEffect(() => {
    if (config.data) {
      setCommission(config.data.commissionBps / 100)
      setGrace(config.data.graceDays)
    }
  }, [config.data])
  return (
    <>
      <PageTitle
        title="Regras financeiras da plataforma"
        description="Comissão e período de carência registrados para as novas operações."
      />
      <State {...config} retry={config.reload} />
      {config.data && <EnvironmentNotice config={config.data} />}
      <form
        className="live-panel live-form"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setError('')
          setSuccess('')
          try {
            await api(
              '/admin/billing/settings',
              json('PATCH', {
                commissionBps: Math.round(commission * 100),
                graceDays: grace,
              }),
            )
            await config.reload()
            setSuccess('Configuração financeira atualizada.')
          } catch (e) {
            setError(message(e))
          } finally {
            setBusy(false)
          }
        }}
      >
        <label>
          Comissão da plataforma (%)
          <input
            required
            type="number"
            min={0}
            max={50}
            step="0.01"
            value={commission}
            onChange={(e) => setCommission(Number(e.target.value))}
          />
        </label>
        <label>
          Carência após vencimento (dias)
          <input
            required
            type="number"
            min={0}
            max={30}
            step={1}
            value={grace}
            onChange={(e) => setGrace(Number(e.target.value))}
          />
        </label>
        <Notice error={error} success={success} />
        <button className="button button--dark" disabled={busy}>
          <Save size={16} /> Salvar regras financeiras
        </button>
      </form>
    </>
  )
}
