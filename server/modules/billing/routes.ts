import type { FastifyInstance } from 'fastify'
import type { Pool } from 'pg'
import type { BillingOptions } from './types.js'
import {
  schema,
  cancelReasonSchema,
  validWebhookToken,
  eventSchema,
  eventTime,
} from './validation.js'
import { requireUser } from '../../shared/security.js'
import { reconcileBilling, expireBillingAccess, cancelContractBilling } from './lifecycle.js'
import { clientFromEnvironment, billingConfiguration } from './configuration.js'
import { z } from 'zod'
import { fail } from '../../shared/errors.js'
import { idSchema } from '../../shared/validation.js'
import { transaction } from '../../db/pool.js'
import { AsaasError } from '../../services/asaas.js'
import { ownedSubscription, subscriptionSelect } from './subscriptions.js'
import type { BillingSubscription, BillingSummary } from '../../../shared/billing-contracts.js'

export async function billingRoutes(
  app: FastifyInstance,
  pool: Pool,
  options: BillingOptions = {},
) {
  app.get(
    '/admin/billing/jobs',
    {
      schema: schema(
        'Pendências e tentativas de conciliação sem payload privado',
      ),
    },
    async (req) => {
      requireUser(req, 'admin')
      return {
        jobs: (
          await pool.query(
            'SELECT id,subscription_id AS "subscriptionId",kind,state,attempts,note,updated_at AS "updatedAt" FROM billing_jobs ORDER BY updated_at DESC LIMIT 100',
          )
        ).rows,
        pendingEvents: (
          await pool.query(
            'SELECT id,event,attempts,processing_note AS note,received_at AS "receivedAt" FROM billing_events WHERE processed_at IS NULL ORDER BY received_at LIMIT 100',
          )
        ).rows,
      }
    },
  )
  app.post(
    '/admin/billing/reconcile',
    { schema: schema('Executar conciliação com consultas somente leitura') },
    async (req) => {
      const user = requireUser(req, 'admin')
      await reconcileBilling(pool, options.client ?? clientFromEnvironment())
      await pool.query(
        `INSERT INTO billing_audit(actor_id,action) VALUES($1,'reconciliation.requested')`,
        [user.id],
      )
      return { ok: true }
    },
  )
  app.get(
    '/billing/config',
    { schema: schema('Configuração pública da cobrança; sem segredos') },
    async (req) => {
      requireUser(req)
      return billingConfiguration(pool, options)
    },
  )
  app.get(
    '/billing/wallet',
    { schema: schema('Carteira de recebimento do próprio treinador') },
    async (req) => {
      const user = requireUser(req, 'coach')
      return {
        wallet:
          (
            await pool.query(
              'SELECT wallet_id AS "walletId",updated_at AS "updatedAt" FROM billing_wallets WHERE coach_id=$1',
              [user.id],
            )
          ).rows[0] ?? null,
      }
    },
  )
  const walletSchema = z.object({ walletId: z.uuid() }).strict()
  app.put(
    '/billing/wallet',
    { schema: schema('Configurar referência da carteira Asaas', walletSchema) },
    async (req) => {
      const user = requireUser(req, 'coach'),
        data = walletSchema.parse(req.body)
      if (data.walletId === process.env.ASAAS_PLATFORM_WALLET_ID)
        fail(
          400,
          'INVALID_WALLET',
          'Informe uma carteira recebedora diferente da conta emissora.',
        )
      const wallet = (
        await pool.query(
          `INSERT INTO billing_wallets(coach_id,wallet_id) VALUES($1,$2) ON CONFLICT(coach_id) DO UPDATE SET wallet_id=EXCLUDED.wallet_id,updated_at=now() RETURNING wallet_id AS "walletId",updated_at AS "updatedAt"`,
          [user.id, data.walletId],
        )
      ).rows[0]
      return { wallet }
    },
  )
  const planSchema = z
    .object({
      name: z.string().trim().min(3).max(100),
      amountCents: z.number().int().min(100).max(10000000),
      active: z.boolean(),
    })
    .strict()
  const planSelect =
    'SELECT coach_id AS "coachId",name,amount_cents AS "amountCents",active FROM billing_plans'
  app.get(
    '/billing/plan',
    { schema: schema('Plano do próprio treinador') },
    async (req) => ({
      plan:
        (
          await pool.query(`${planSelect} WHERE coach_id=$1`, [
            requireUser(req, 'coach').id,
          ])
        ).rows[0] ?? null,
    }),
  )
  app.put(
    '/billing/plan',
    { schema: schema('Definir plano mensal em centavos', planSchema) },
    async (req) => {
      const user = requireUser(req, 'coach'),
        data = planSchema.parse(req.body)
      await pool.query(
        `INSERT INTO billing_plans(coach_id,name,amount_cents,active) VALUES($1,$2,$3,$4) ON CONFLICT(coach_id) DO UPDATE SET name=EXCLUDED.name,amount_cents=EXCLUDED.amount_cents,active=EXCLUDED.active`,
        [user.id, data.name, data.amountCents, data.active],
      )
      return {
        plan: (await pool.query(`${planSelect} WHERE coach_id=$1`, [user.id]))
          .rows[0],
      }
    },
  )
  app.get(
    '/billing/plans',
    { schema: schema('Planos publicados de profissionais aprovados') },
    async (req) => {
      requireUser(req)
      const query = z
        .object({ coachId: idSchema.optional() })
        .strict()
        .parse(req.query)
      return {
        plans: (
          await pool.query(
            `SELECT p.coach_id AS "coachId",p.name,p.amount_cents AS "amountCents",p.active FROM billing_plans p JOIN profiles pr ON pr.user_id=p.coach_id JOIN users u ON u.id=p.coach_id WHERE p.active AND u.disabled_at IS NULL AND pr.verification_status='approved' AND (pr.verification_expires_at IS NULL OR pr.verification_expires_at>now()) AND ($1::uuid IS NULL OR p.coach_id=$1)`,
            [query.coachId ?? null],
          )
        ).rows,
      }
    },
  )
  const settingsSchema = z
    .object({
      commissionBps: z.number().int().min(0).max(5000),
      graceDays: z.number().int().min(0).max(30),
    })
    .strict()
  app.patch(
    '/admin/billing/settings',
    {
      schema: schema(
        'Comissão e carência; configuração auditada',
        settingsSchema,
      ),
    },
    async (req) => {
      const user = requireUser(req, 'admin'),
        data = settingsSchema.parse(req.body)
      await transaction(pool, async (client) => {
        await client.query(
          'UPDATE billing_settings SET commission_bps=$1,grace_days=$2 WHERE id=1',
          [data.commissionBps, data.graceDays],
        )
        await client.query(
          `INSERT INTO billing_audit(actor_id,action,reason) VALUES($1,'settings.changed',$2)`,
          [
            user.id,
            `Comissão ${data.commissionBps} bps; carência ${data.graceDays} dias`,
          ],
        )
      })
      return { config: await billingConfiguration(pool, options) }
    },
  )
  const checkoutSchema = z.object({ contractId: idSchema }).strict()
  app.post(
    '/billing/checkout',
    {
      schema: schema(
        'Criar uma única intenção de checkout por ciclo',
        checkoutSchema,
      ),
    },
    async (req) => {
      const user = requireUser(req, 'athlete'),
        data = checkoutSchema.parse(req.body)
      const config = await billingConfiguration(pool, options),
        provider = options.client ?? clientFromEnvironment()
      if (config.mode !== 'asaas' || !config.available || !provider)
        fail(
          503,
          'BILLING_DISABLED',
          'A cobrança está desativada ou aguarda configuração do gateway. Nenhum pagamento foi criado.',
        )
      const prepared = await transaction(pool, async (client) => {
        const account = (
          await client.query(
            'SELECT disabled_at FROM users WHERE id=$1 FOR SHARE',
            [user.id],
          )
        ).rows[0]
        if (!account || account.disabled_at)
          fail(
            403,
            'ACCOUNT_CLOSED',
            'A conta não está disponível para contratar.',
          )
        const contract = (
          await client.query(
            'SELECT * FROM contracts WHERE id=$1 AND athlete_id=$2 FOR UPDATE',
            [data.contractId, user.id],
          )
        ).rows[0]
        if (!contract) fail(404, 'NOT_FOUND', 'Vínculo não encontrado.')
        if (contract.status !== 'active')
          fail(
            409,
            'CONTRACT_STATE',
            'O treinador precisa aceitar o acompanhamento antes do pagamento.',
          )
        const availableCoach = await client.query(
          "SELECT 1 FROM profiles p JOIN users u ON u.id=p.user_id WHERE u.id=$1 AND u.role='coach' AND u.disabled_at IS NULL AND p.verification_status='approved' AND (p.verification_expires_at IS NULL OR p.verification_expires_at>now()) FOR SHARE",
          [contract.coach_id],
        )
        if (!availableCoach.rowCount)
          fail(
            409,
            'UNAVAILABLE_COACH',
            'O treinador precisa ter conta ativa e aprovacao profissional vigente para iniciar o pagamento.',
          )
        const existing = (
          await client.query(
            'SELECT id FROM billing_subscriptions WHERE contract_id=$1',
            [contract.id],
          )
        ).rows[0]
        if (existing)
          return {
            id: existing.id as string,
            create: false,
            walletId: '',
            name: '',
            amountCents: 0,
          }
        const plan = (
          await client.query(
            'SELECT p.*,w.wallet_id FROM billing_plans p JOIN billing_wallets w ON w.coach_id=p.coach_id WHERE p.coach_id=$1 AND p.active',
            [contract.coach_id],
          )
        ).rows[0]
        if (!plan || plan.wallet_id === process.env.ASAAS_PLATFORM_WALLET_ID)
          fail(
            409,
            'PLAN_UNAVAILABLE',
            'O treinador precisa configurar um plano e uma carteira recebedora elegível.',
          )
        const id = (
          await client.query(
            `INSERT INTO billing_subscriptions(contract_id,plan_name,amount_cents,commission_bps,environment,state) VALUES($1,$2,$3,$4,$5,'uncertain') RETURNING id`,
            [
              contract.id,
              plan.name,
              plan.amount_cents,
              config.commissionBps,
              config.environment,
            ],
          )
        ).rows[0].id as string
        await client.query(
          `INSERT INTO billing_jobs(subscription_id,kind,state) VALUES($1,'checkout','running')`,
          [id],
        )
        return {
          id,
          create: true,
          walletId: plan.wallet_id as string,
          name: plan.name as string,
          amountCents: plan.amount_cents as number,
        }
      })
      if (prepared.create) {
        try {
          const origin =
            options.callbackOrigin ??
            process.env.APP_ORIGIN ??
            'http://localhost:5173'
          const nextDueDate = new Date().toISOString().slice(0, 10)
          const checkout = await provider.createCheckout({
            reference: prepared.id,
            name: prepared.name,
            walletId: prepared.walletId,
            amountCents: prepared.amountCents,
            commissionBps: config.commissionBps,
            callbackOrigin: origin,
            nextDueDate,
          })
          await pool.query(
            `UPDATE billing_subscriptions SET provider_checkout_id=$1,checkout_url=$2,state=CASE WHEN state='uncertain' THEN 'awaiting_payment' ELSE state END WHERE id=$3`,
            [checkout.id, checkout.url, prepared.id],
          )
          await pool.query(
            `UPDATE billing_jobs SET state='confirmed',updated_at=now() WHERE subscription_id=$1 AND kind='checkout'`,
            [prepared.id],
          )
        } catch (error) {
          const definitelyRefused =
            error instanceof AsaasError && !error.uncertain
          await pool.query(
            `UPDATE billing_jobs SET state=$1,note='Checkout não confirmado; não reenviar sem conciliação',updated_at=now() WHERE subscription_id=$2 AND kind='checkout'`,
            [definitelyRefused ? 'failed' : 'uncertain', prepared.id],
          )
          if (definitelyRefused) {
            await pool.query(
              `UPDATE billing_subscriptions SET state='ended',cancellation_confirmed=true,cancellation_reason='Checkout recusado pelo provedor; sem cobrança confirmada' WHERE id=$1`,
              [prepared.id],
            )
            await expireBillingAccess(pool)
            fail(
              502,
              'CHECKOUT_REFUSED',
              'O provedor recusou a criação do checkout. O ciclo foi encerrado com histórico preservado; corrija a configuração antes de uma nova solicitação.',
            )
          }
          fail(
            502,
            'CHECKOUT_UNCERTAIN',
            'Não foi possível confirmar a criação do checkout. A intenção foi registrada e não será duplicada automaticamente.',
          )
        }
      }
      return {
        subscription: await ownedSubscription(pool, prepared.id, user.id),
      }
    },
  )
  app.get(
    '/billing/summary',
    {
      schema: schema(
        'Histórico financeiro persistido; participações estimadas sobre líquido',
      ),
    },
    async (req) => {
      const user = requireUser(req)
      const subscriptions = (
        await pool.query<BillingSubscription>(
          `${subscriptionSelect} WHERE $2 OR c.athlete_id=$1 OR c.coach_id=$1 ORDER BY s.created_at DESC`,
          [user.id, user.role === 'admin'],
        )
      ).rows
      const payments = (
        await pool.query(
          `SELECT p.id,p.subscription_id AS "subscriptionId",p.provider_payment_id AS "providerPaymentId",p.amount_cents AS "amountCents",p.net_cents AS "netCents",p.status,p.paid_at AS "paidAt",p.due_date AS "dueDate",s.environment,p.coach_share_cents AS "coachShareCents",p.platform_share_cents AS "platformShareCents" FROM billing_payments p JOIN billing_subscriptions s ON s.id=p.subscription_id JOIN contracts c ON c.id=s.contract_id WHERE $2 OR c.athlete_id=$1 OR c.coach_id=$1 ORDER BY p.event_at DESC`,
          [user.id, user.role === 'admin'],
        )
      ).rows
      const totals = payments
        .filter((p) =>
          ['RECEIVED', 'CONFIRMED', 'SPLIT_DONE'].includes(p.status),
        )
        .reduce(
          (sum, payment) => ({
            receivedCents: sum.receivedCents + payment.amountCents,
            coachShareCents: sum.coachShareCents + payment.coachShareCents,
            platformShareCents:
              sum.platformShareCents + payment.platformShareCents,
          }),
          { receivedCents: 0, coachShareCents: 0, platformShareCents: 0 },
        )
      return { subscriptions, payments, totals } satisfies BillingSummary
    },
  )
  app.post<{ Params: { id: string } }>(
    '/billing/subscriptions/:id/cancel',
    {
      schema: schema(
        'Interromper renovação preservando a vigência paga',
        cancelReasonSchema,
      ),
    },
    async (req) => {
      const user = requireUser(req),
        id = idSchema.parse(req.params.id),
        data = cancelReasonSchema.parse(req.body)
      const subscription = await ownedSubscription(pool, id, user.id)
      await cancelContractBilling(
        pool,
        subscription.contractId,
        user.id,
        data.reason,
        options,
      )
      return { subscription: await ownedSubscription(pool, id, user.id) }
    },
  )
  app.post(
    '/billing/webhook',
    {
      schema: {
        ...schema(
          'Receber evento autenticado Asaas; guardar somente campos necessários',
        ),
        security: [{ webhookToken: [] }],
      },
      config: { rateLimit: { max: 500, timeWindow: '1 minute' } },
    },
    async (req) => {
      const config = await billingConfiguration(pool, options)
      if (config.mode !== 'asaas')
        fail(
          503,
          'BILLING_DISABLED',
          'Eventos financeiros não são aceitos no modo acadêmico.',
        )
      if (
        !validWebhookToken(
          req.headers['asaas-access-token'],
          options.webhookToken ?? process.env.ASAAS_WEBHOOK_TOKEN,
        )
      )
        fail(401, 'INVALID_WEBHOOK', 'Notificação não autenticada.')
      const event = eventSchema.parse(req.body),
        at = eventTime(event.dateCreated)
      // Zod strips card tokens, account identities and all unneeded provider attributes.
      await pool.query(
        'INSERT INTO billing_events(id,event,event_at,payload) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING',
        [
          event.id,
          event.event,
          at,
          JSON.stringify({ ...event, _environment: config.environment }),
        ],
      )
      return { received: true }
    },
  )
}
