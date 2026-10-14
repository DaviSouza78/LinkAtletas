import { createHash, timingSafeEqual } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import type { Pool, PoolClient } from 'pg'
import { z } from 'zod'
import type {
  BillingConfig,
  BillingSubscription,
  BillingSummary,
} from '../../shared/billing-contracts.js'
import { transaction } from '../db/pool.js'
import { requireUser } from '../shared/security.js'
import { fail } from '../shared/errors.js'
import { bodySchema, idSchema } from '../shared/validation.js'
import { AsaasClient, AsaasError } from '../services/asaas.js'

type Database = Pool | PoolClient
export interface BillingOptions {
  client?: AsaasClient
  webhookToken?: string
  mode?: 'academic' | 'asaas'
  environment?: 'sandbox' | 'production'
  callbackOrigin?: string
}
const mode = () => (process.env.BILLING_MODE === 'asaas' ? 'asaas' : 'academic')
const environment = () =>
  process.env.ASAAS_ENVIRONMENT === 'production'
    ? ('production' as const)
    : ('sandbox' as const)
const subscriptionSelect = `SELECT s.id,s.contract_id AS "contractId",c.athlete_id AS "athleteId",c.coach_id AS "coachId",
 a.name AS "athleteName",t.name AS "coachName",s.plan_name AS "planName",s.amount_cents AS "amountCents",
 s.commission_bps AS "commissionBps",s.environment,s.state,s.checkout_url AS "checkoutUrl",s.paid_until AS "paidUntil",
 s.grace_until AS "graceUntil",s.cancellation_confirmed AS "cancellationConfirmed",s.cancellation_reason AS "cancellationReason",s.created_at AS "createdAt"
 FROM billing_subscriptions s JOIN contracts c ON c.id=s.contract_id JOIN users a ON a.id=c.athlete_id JOIN users t ON t.id=c.coach_id`
export const cancelReasonSchema = z
  .object({ reason: z.string().trim().min(5).max(1000) })
  .strict()
const response = {
  200: { type: 'object', additionalProperties: true },
  201: { type: 'object', additionalProperties: true },
}
const schema = (summary: string, body?: z.ZodType) => ({
  tags: ['Financeiro'],
  summary,
  response,
  ...(body ? { body: bodySchema(body) } : {}),
})
async function notifyBilling(
  client: Database,
  contractId: string,
  title: string,
) {
  await client.query(
    `INSERT INTO notifications(user_id,kind,title,resource_id) SELECT unnest(ARRAY[athlete_id,coach_id]),'billing',$2,id FROM contracts WHERE id=$1`,
    [contractId, title],
  )
}

export async function billingConfiguration(
  pool: Database,
  options: BillingOptions = {},
): Promise<BillingConfig> {
  const { rows } = await pool.query(
    'SELECT commission_bps,grace_days FROM billing_settings WHERE id=1',
  )
  const selected = options.mode ?? mode()
  return {
    mode: selected,
    environment:
      selected === 'academic'
        ? 'disabled'
        : (options.environment ?? environment()),
    available:
      selected === 'asaas' &&
      Boolean(
        options.client ||
        (process.env.ASAAS_API_KEY && process.env.ASAAS_WEBHOOK_TOKEN),
      ),
    commissionBps: rows[0].commission_bps,
    graceDays: rows[0].grace_days,
  }
}
export async function assertContractAccess(
  pool: Database,
  contractId: string,
  userId: string,
) {
  const { rows } = await pool.query(
    `SELECT c.status,s.state,s.paid_until,s.grace_until,p.verification_status,p.verification_expires_at,a.disabled_at AS athlete_disabled,t.disabled_at AS coach_disabled FROM contracts c JOIN users a ON a.id=c.athlete_id JOIN users t ON t.id=c.coach_id JOIN profiles p ON p.user_id=c.coach_id LEFT JOIN billing_subscriptions s ON s.contract_id=c.id WHERE c.id=$1 AND (c.athlete_id=$2 OR c.coach_id=$2)`,
    [contractId, userId],
  )
  const row = rows[0]
  if (!row) fail(404, 'NOT_FOUND', 'Vínculo não encontrado.')
  if (row.status !== 'active')
    fail(
      403,
      'INACTIVE_CONTRACT',
      'O vínculo precisa estar ativo para esta operação.',
    )
  if (
    row.athlete_disabled ||
    row.coach_disabled ||
    row.verification_status !== 'approved' ||
    (row.verification_expires_at &&
      new Date(row.verification_expires_at).getTime() <= Date.now())
  )
    fail(
      403,
      'UNAVAILABLE_COACH',
      'O acompanhamento está indisponível até a regularização da conta ou da aprovação profissional.',
    )
  if (mode() === 'academic') return
  const current = Date.now()
  const paid = row.paid_until && new Date(row.paid_until).getTime() > current
  const grace = row.grace_until && new Date(row.grace_until).getTime() > current
  if (!(
    (['regular', 'cancellation_requested'].includes(row.state) && paid) ||
    (row.state === 'grace' && grace)
  ))
    fail(
      403,
      'BILLING_ACCESS',
      'O acompanhamento aguarda pagamento ou regularização financeira.',
    )
}
async function ownedSubscription(pool: Database, id: string, userId: string) {
  const { rows } = await pool.query<BillingSubscription>(
    `${subscriptionSelect} WHERE s.id=$1 AND (c.athlete_id=$2 OR c.coach_id=$2)`,
    [id, userId],
  )
  if (!rows[0]) fail(404, 'NOT_FOUND', 'Assinatura não encontrada.')
  return rows[0]
}
function clientFromEnvironment() {
  if (mode() !== 'asaas') return undefined
  return process.env.ASAAS_API_KEY
    ? new AsaasClient({
        apiKey: process.env.ASAAS_API_KEY,
        environment: environment(),
      })
    : undefined
}
const hash = (value: string) => createHash('sha256').update(value).digest()
function validWebhookToken(incoming: unknown, expected: string | undefined) {
  return Boolean(
    expected &&
    expected.length >= 32 &&
    typeof incoming === 'string' &&
    incoming.length <= 255 &&
    timingSafeEqual(hash(incoming), hash(expected)),
  )
}
const cents = z.number().finite().min(0).max(1000000)
const resource = z.object({
  id: z.string().min(1).max(200),
  externalReference: z.string().max(200).nullable().optional(),
  status: z.string().max(100).optional(),
  subscription: z.string().max(200).optional(),
  customer: z.string().max(200).optional(),
  value: cents.optional(),
  netValue: cents.optional(),
  dueDate: z.iso.date().optional(),
  paymentDate: z.iso.date().nullable().optional(),
  confirmedDate: z.iso.date().nullable().optional(),
  deleted: z.boolean().optional(),
  split: z
    .array(
      z.object({
        id: z.string().max(200),
        walletId: z.string().max(200),
        status: z.string().max(100),
        fixedValue: cents.nullable().optional(),
        percentualValue: z.number().min(0).max(100).nullable().optional(),
      }),
    )
    .max(100)
    .optional(),
})
const checkoutResource = z.object({
  id: z.string().min(1).max(200),
  externalReference: z.string().max(200).nullable().optional(),
  status: z.string().optional(),
  customer: z.string().max(200).nullable().optional(),
})
const eventSchema = z.object({
  id: z.string().min(1).max(255),
  event: z.string().min(1).max(100),
  dateCreated: z.string().min(10).max(50),
  payment: resource.optional(),
  subscription: resource.optional(),
  checkout: checkoutResource.optional(),
  additionalInfo: z
    .object({ splitId: z.string().max(200).optional() })
    .optional(),
})
type GatewayEvent = z.infer<typeof eventSchema>
function eventTime(value: string) {
  // Asaas's unqualified dates are São Paulo local time; explicit offsets are respected.
  const qualified = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? value.replace(' ', 'T') + '-03:00'
    : value
  const time = new Date(qualified)
  if (!Number.isFinite(time.getTime()))
    fail(400, 'INVALID_EVENT_DATE', 'Data do evento inválida.')
  return time
}
function monthlyEnd(value: string | Date) {
  const date = new Date(value)
  const day = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + 1)
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate()
  date.setUTCDate(Math.min(day, last))
  return date
}
async function locateEventSubscription(
  client: PoolClient,
  event: GatewayEvent,
) {
  const item = event.payment ?? event.subscription ?? event.checkout
  if (!item) return null
  const providerSubscription =
    event.payment?.subscription ?? event.subscription?.id ?? null
  const ref =
    item.externalReference && z.uuid().safeParse(item.externalReference).success
      ? item.externalReference
      : null
  const { rows } = await client.query(
    `SELECT s.* FROM billing_subscriptions s WHERE s.id=$1 OR s.provider_subscription_id=$2 OR s.provider_checkout_id=$3
    OR ($4::text IS NOT NULL AND s.provider_customer_id=$4 AND s.provider_subscription_id IS NULL AND s.state<>'ended' AND s.amount_cents=$5) FOR UPDATE`,
    [
      ref,
      providerSubscription,
      event.checkout?.id ?? null,
      event.subscription?.customer ?? event.payment?.customer ?? null,
      Math.round(
        (event.subscription?.value ?? event.payment?.value ?? 0) * 100,
      ),
    ],
  )
  // Multiple candidates indicate a reference mismatch. Do not credit either party.
  if (rows.length !== 1) return null
  return rows[0]
}
export async function processBillingEvents(pool: Pool) {
  const ids = (
    await pool.query(
      'SELECT id FROM billing_events WHERE processed_at IS NULL AND next_attempt_at<=now() ORDER BY received_at LIMIT 100',
    )
  ).rows
  for (const { id } of ids)
    await transaction(pool, async (client) => {
      const stored = (
        await client.query(
          'SELECT * FROM billing_events WHERE id=$1 AND processed_at IS NULL FOR UPDATE SKIP LOCKED',
          [id],
        )
      ).rows[0]
      if (!stored) return
      const event = eventSchema.parse(stored.payload)
      const sub = await locateEventSubscription(client, event)
      if (!sub) {
        await client.query(
          `UPDATE billing_events SET attempts=attempts+1,next_attempt_at=now()+interval '5 minutes',processing_note='Referência aguardando conciliação' WHERE id=$1`,
          [id],
        )
        return
      }
      if (
        stored.payload._environment &&
        stored.payload._environment !== sub.environment
      ) {
        await client.query(
          `UPDATE billing_events SET processed_at=now(),attempts=attempts+1,processing_note='Ambiente divergente; evento não aplicado' WHERE id=$1`,
          [id],
        )
        return
      }
      const at = eventTime(event.dateCreated)
      if (event.checkout?.customer)
        await client.query(
          'UPDATE billing_subscriptions SET provider_customer_id=$1 WHERE id=$2',
          [event.checkout.customer, sub.id],
        )
      if (event.checkout && !sub.provider_checkout_id) {
        const host =
          sub.environment === 'sandbox'
            ? 'https://sandbox.asaas.com'
            : 'https://asaas.com'
        await client.query(
          `UPDATE billing_subscriptions SET provider_checkout_id=$1,checkout_url=$2,state=CASE WHEN state='uncertain' THEN 'awaiting_payment' ELSE state END WHERE id=$3`,
          [
            event.checkout.id,
            `${host}/checkoutSession/show?id=${encodeURIComponent(event.checkout.id)}`,
            sub.id,
          ],
        )
        await client.query(
          `UPDATE billing_jobs SET state='confirmed',updated_at=now() WHERE subscription_id=$1 AND kind='checkout'`,
          [sub.id],
        )
      }
      if (event.subscription || event.payment?.subscription) {
        const providerId = event.subscription?.id ?? event.payment?.subscription
        if (
          sub.provider_subscription_id &&
          sub.provider_subscription_id !== providerId
        ) {
          await client.query(
            `UPDATE billing_events SET attempts=attempts+1,next_attempt_at=now()+interval '1 hour',processing_note='Assinatura divergente; revisão necessária' WHERE id=$1`,
            [id],
          )
          return
        }
        await client.query(
          'UPDATE billing_subscriptions SET provider_subscription_id=$1 WHERE id=$2',
          [providerId, sub.id],
        )
      }
      if (
        event.payment &&
        event.payment.value !== undefined &&
        event.payment.netValue !== undefined
      ) {
        const payment = event.payment
        const amount = Math.round(payment.value! * 100),
          net = Math.round(payment.netValue! * 100)
        if (net > amount)
          fail(400, 'INVALID_PAYMENT', 'Valores financeiros inconsistentes.')
        const terminal = [
          'REFUNDED',
          'CHARGEBACK_REQUESTED',
          'CHARGEBACK_DISPUTE',
        ]
        const paid = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(
          event.event,
        )
        const incomingStatus = event.event.replace(/^PAYMENT_/, '')
        const old = (
          await client.query(
            'SELECT * FROM billing_payments WHERE provider_payment_id=$1 FOR UPDATE',
            [payment.id],
          )
        ).rows[0]
        const status =
          event.event.startsWith('PAYMENT_SPLIT_') && old
            ? old.status
            : incomingStatus
        const regressesPaid =
          old &&
          ['RECEIVED', 'CONFIRMED'].includes(old.status) &&
          ['CREATED', 'UPDATED', 'OVERDUE', 'AUTHORIZED'].includes(
            incomingStatus,
          )
        if (
          !old ||
          (new Date(old.event_at).getTime() <= at.getTime() &&
            !(terminal.includes(old.status) && paid) &&
            !regressesPaid)
        ) {
          const paidAt = paid
            ? new Date(
                `${payment.paymentDate ?? payment.confirmedDate ?? payment.dueDate ?? at.toISOString().slice(0, 10)}T00:00:00Z`,
              )
            : (old?.paid_at ?? null)
          const inserted = await client.query(
            `INSERT INTO billing_payments(subscription_id,provider_payment_id,amount_cents,net_cents,status,paid_at,due_date,event_at)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(provider_payment_id) DO UPDATE SET status=EXCLUDED.status,amount_cents=EXCLUDED.amount_cents,net_cents=EXCLUDED.net_cents,paid_at=COALESCE(EXCLUDED.paid_at,billing_payments.paid_at),event_at=EXCLUDED.event_at RETURNING id`,
            [
              sub.id,
              payment.id,
              amount,
              net,
              status,
              paidAt,
              payment.dueDate ?? null,
              at,
            ],
          )
          if (paid && sub.state !== 'ended') {
            const periodEnd = monthlyEnd(
              `${payment.dueDate ?? (paidAt as Date).toISOString().slice(0, 10)}T00:00:00Z`,
            )
            await client.query(
              `UPDATE billing_subscriptions SET paid_until=GREATEST(paid_until,$1),state=CASE WHEN cancellation_started_at IS NOT NULL THEN 'cancellation_requested' ELSE 'regular' END,grace_until=NULL WHERE id=$2`,
              [periodEnd, sub.id],
            )
            await client.query(
              `UPDATE contracts SET status='active' WHERE id=$1 AND status='suspended'`,
              [sub.contract_id],
            )
          }
          if (
            event.event === 'PAYMENT_OVERDUE' &&
            !sub.cancellation_started_at &&
            (!sub.paid_until ||
              new Date(sub.paid_until).getTime() <= Date.now())
          ) {
            const settings = (
              await client.query(
                'SELECT grace_days FROM billing_settings WHERE id=1',
              )
            ).rows[0]
            const start = new Date(
              `${payment.dueDate ?? at.toISOString().slice(0, 10)}T00:00:00Z`,
            )
            start.setUTCDate(start.getUTCDate() + settings.grace_days)
            await client.query(
              `UPDATE billing_subscriptions SET state='grace',grace_until=$1 WHERE id=$2 AND state<>'ended'`,
              [start, sub.id],
            )
          }
          if (
            [
              'PAYMENT_REFUNDED',
              'PAYMENT_CHARGEBACK_REQUESTED',
              'PAYMENT_CHARGEBACK_DISPUTE',
            ].includes(event.event)
          ) {
            await client.query(
              `UPDATE billing_subscriptions SET state='suspended',grace_until=NULL WHERE id=$1 AND state<>'ended'`,
              [sub.id],
            )
            await client.query(
              `UPDATE contracts SET status='suspended' WHERE id=$1 AND status='active'`,
              [sub.contract_id],
            )
          }
          if (event.event.startsWith('PAYMENT_SPLIT_'))
            for (const split of payment.split ?? []) {
              if (
                event.additionalInfo?.splitId &&
                event.additionalInfo.splitId !== split.id
              )
                continue
              const splitAmount =
                split.fixedValue != null
                  ? Math.round(split.fixedValue * 100)
                  : Math.round((net * (split.percentualValue ?? 0)) / 100)
              await client.query(
                `INSERT INTO billing_splits(provider_split_id,payment_id,wallet_id,amount_cents,status,event_at) VALUES($1,$2,$3,$4,$5,$6)
            ON CONFLICT(provider_split_id) DO UPDATE SET status=EXCLUDED.status,event_at=EXCLUDED.event_at WHERE billing_splits.event_at<=EXCLUDED.event_at`,
                [
                  split.id,
                  inserted.rows[0].id,
                  split.walletId,
                  splitAmount,
                  split.status,
                  at,
                ],
              )
            }
          // Shares are estimates of the net split, never a claim of a bank transfer.
          await client.query(
            'UPDATE billing_payments SET coach_share_cents=round(net_cents::numeric*(10000-$1)/10000),platform_share_cents=net_cents-round(net_cents::numeric*(10000-$1)/10000) WHERE id=$2',
            [sub.commission_bps, inserted.rows[0].id],
          )
        }
      }
      if (
        event.event === 'CHECKOUT_PAID' &&
        sub.state !== 'ended' &&
        !sub.paid_until
      ) {
        await client.query(
          `UPDATE billing_subscriptions SET paid_until=$1,state=CASE WHEN cancellation_started_at IS NOT NULL THEN 'cancellation_requested' ELSE 'regular' END WHERE id=$2`,
          [monthlyEnd(at), sub.id],
        )
        await client.query(
          `UPDATE billing_jobs SET state='confirmed',updated_at=now() WHERE subscription_id=$1 AND kind='checkout'`,
          [sub.id],
        )
      }
      if (
        ['SUBSCRIPTION_DELETED', 'SUBSCRIPTION_INACTIVATED'].includes(
          event.event,
        )
      ) {
        await client.query(
          `UPDATE billing_subscriptions SET cancellation_confirmed=true,cancellation_started_at=COALESCE(cancellation_started_at,now()),state=CASE WHEN paid_until>now() THEN 'cancellation_requested' ELSE 'ended' END WHERE id=$1`,
          [sub.id],
        )
        await client.query(
          `UPDATE billing_jobs SET state='confirmed',updated_at=now() WHERE subscription_id=$1 AND kind='cancellation'`,
          [sub.id],
        )
      }
      if (
        ['CHECKOUT_CANCELED', 'CHECKOUT_EXPIRED'].includes(event.event) &&
        !sub.paid_until
      ) {
        await client.query(
          `UPDATE billing_subscriptions SET state='ended',cancellation_confirmed=true WHERE id=$1`,
          [sub.id],
        )
        await client.query(
          `UPDATE contracts SET status='cancelled',ended_at=now() WHERE id=$1 AND status<>'cancelled'`,
          [sub.contract_id],
        )
      }
      await client.query(
        'UPDATE billing_subscriptions SET last_event_at=GREATEST(last_event_at,$1) WHERE id=$2',
        [at, sub.id],
      )
      const latest = (
        await client.query(
          'SELECT state,cancellation_confirmed FROM billing_subscriptions WHERE id=$1',
          [sub.id],
        )
      ).rows[0]
      if (
        latest.state !== sub.state ||
        latest.cancellation_confirmed !== sub.cancellation_confirmed
      )
        await notifyBilling(
          client,
          sub.contract_id,
          'A situação financeira do acompanhamento foi atualizada. Consulte o financeiro.',
        )
      await client.query(
        `UPDATE billing_events SET processed_at=now(),attempts=attempts+1,processing_note='Processado' WHERE id=$1`,
        [id],
      )
    })
}

export async function expireBillingAccess(pool: Pool) {
  await transaction(pool, async (client) => {
    await client.query(
      `UPDATE billing_subscriptions SET state='ended' WHERE cancellation_confirmed AND (paid_until IS NULL OR paid_until<=now()) AND state<>'ended'`,
    )
    await client.query(
      `UPDATE contracts c SET status='cancelled',ended_at=COALESCE(c.ended_at,now()) FROM billing_subscriptions s WHERE s.contract_id=c.id AND s.state='ended' AND c.status IN ('active','suspended','pending')`,
    )
    if (mode() !== 'asaas') return
    const settings = (
      await client.query('SELECT grace_days FROM billing_settings WHERE id=1')
    ).rows[0]
    await client.query(
      `UPDATE billing_subscriptions SET state='grace',grace_until=paid_until+($1 * interval '1 day') WHERE state='regular' AND paid_until<=now() AND cancellation_started_at IS NULL`,
      [settings.grace_days],
    )
    await client.query(
      `UPDATE billing_subscriptions SET state='suspended' WHERE state='grace' AND grace_until<=now()`,
    )
    await client.query(
      `UPDATE contracts c SET status='suspended' FROM billing_subscriptions s WHERE s.contract_id=c.id AND s.state='suspended' AND c.status='active'`,
    )
  })
}
export async function reconcileBilling(
  pool: Pool,
  client = clientFromEnvironment(),
) {
  await processBillingEvents(pool)
  let linked = false
  if (client) {
    const unlinked = (
      await pool.query(
        `SELECT id,provider_checkout_id FROM billing_subscriptions WHERE provider_subscription_id IS NULL AND provider_checkout_id IS NOT NULL AND state<>'ended' LIMIT 50`,
      )
    ).rows
    for (const sub of unlinked) {
      try {
        const candidates = await client.checkoutSubscriptions(
          sub.provider_checkout_id,
        )
        if (candidates.length === 1) {
          const result = await pool.query(
            `UPDATE billing_subscriptions SET provider_subscription_id=$1 WHERE id=$2 AND provider_subscription_id IS NULL`,
            [candidates[0], sub.id],
          )
          if (result.rowCount) linked = true
        }
        await pool.query(
          `INSERT INTO billing_jobs(subscription_id,kind,state,note) VALUES($1,'reconciliation',$2,$3)`,
          [
            sub.id,
            candidates.length === 1 ? 'confirmed' : 'uncertain',
            'Consulta de cobranças vinculadas ao Checkout; sem criação financeira',
          ],
        )
      } catch {
        await pool.query(
          `INSERT INTO billing_jobs(subscription_id,kind,state,note) VALUES($1,'reconciliation','uncertain','Correlação de Checkout indisponível')`,
          [sub.id],
        )
      }
    }
    const rows = (
      await pool.query(
        `SELECT s.id,s.provider_subscription_id FROM billing_subscriptions s WHERE s.cancellation_started_at IS NOT NULL AND NOT s.cancellation_confirmed AND s.provider_subscription_id IS NOT NULL LIMIT 50`,
      )
    ).rows
    for (const sub of rows) {
      try {
        const remote = await client.getSubscription(
          sub.provider_subscription_id,
        )
        if (remote.deleted || remote.status === 'INACTIVE')
          await pool.query(
            `UPDATE billing_subscriptions SET cancellation_confirmed=true,state=CASE WHEN paid_until>now() THEN 'cancellation_requested' ELSE 'ended' END WHERE id=$1`,
            [sub.id],
          )
        await pool.query(
          `INSERT INTO billing_jobs(subscription_id,kind,state,note) VALUES($1,'reconciliation','confirmed','Consulta somente leitura concluída')`,
          [sub.id],
        )
      } catch {
        await pool.query(
          `INSERT INTO billing_jobs(subscription_id,kind,state,note) VALUES($1,'reconciliation','uncertain','Consulta do provedor indisponível; sem reenvio financeiro')`,
          [sub.id],
        )
      }
    }
  }
  // Retry previously unmatched events immediately after a verified read-only correlation.
  if (linked)
    await pool.query(
      `UPDATE billing_events SET next_attempt_at=now() WHERE processed_at IS NULL AND processing_note='Referência aguardando conciliação'`,
    )
  await processBillingEvents(pool)
  await expireBillingAccess(pool)
}

export async function cancelContractBilling(
  pool: Pool,
  contractId: string,
  userId: string,
  reason: string,
  options: BillingOptions = {},
) {
  const sub = await transaction(pool, async (client) => {
    const contract = (
      await client.query(
        'SELECT * FROM contracts WHERE id=$1 AND (athlete_id=$2 OR coach_id=$2) FOR UPDATE',
        [contractId, userId],
      )
    ).rows[0]
    if (!contract) fail(404, 'NOT_FOUND', 'Vínculo não encontrado.')
    if (contract.status === 'rejected')
      fail(409, 'CONTRACT_STATE', 'A solicitação já foi recusada.')
    if (contract.status === 'cancelled') return null
    const subscription = (
      await client.query(
        'SELECT * FROM billing_subscriptions WHERE contract_id=$1 FOR UPDATE',
        [contractId],
      )
    ).rows[0]
    if (!subscription) {
      await client.query(
        `UPDATE contracts SET status='cancelled',ended_at=now(),cancellation_reason=$1 WHERE id=$2`,
        [reason, contractId],
      )
      await notifyBilling(
        client,
        contractId,
        'O ciclo de acompanhamento foi encerrado com motivo registrado.',
      )
      await client.query(
        `INSERT INTO billing_audit(actor_id,contract_id,action,reason) VALUES($1,$2,'contract.cancelled',$3)`,
        [userId, contractId, reason],
      )
      return null
    }
    if (subscription.cancellation_started_at || subscription.state === 'ended')
      return { ...subscription, alreadyRequested: true }
    await client.query(
      `UPDATE billing_subscriptions SET cancellation_started_at=now(),cancellation_reason=$1,state='cancellation_requested' WHERE id=$2`,
      [reason, subscription.id],
    )
    await client.query(
      `UPDATE contracts SET cancellation_reason=$1 WHERE id=$2`,
      [reason, contractId],
    )
    await client.query(
      `INSERT INTO billing_jobs(subscription_id,kind,state) VALUES($1,'cancellation','running')`,
      [subscription.id],
    )
    await client.query(
      `INSERT INTO billing_audit(actor_id,contract_id,action,reason) VALUES($1,$2,'contract.cancellation_requested',$3)`,
      [userId, contractId, reason],
    )
    await notifyBilling(
      client,
      contractId,
      'Foi solicitado o encerramento da renovação. A confirmação pode ser acompanhada no financeiro.',
    )
    return subscription
  })
  if (!sub || sub.alreadyRequested) return
  const provider = options.client ?? clientFromEnvironment()
  try {
    if (!provider) throw new AsaasError(false, 503)
    if (sub.provider_subscription_id) {
      await provider.cancelSubscription(sub.provider_subscription_id)
      await pool.query(
        `UPDATE billing_subscriptions SET cancellation_confirmed=true,state=CASE WHEN paid_until>now() THEN 'cancellation_requested' ELSE 'ended' END WHERE id=$1`,
        [sub.id],
      )
    } else if (sub.provider_checkout_id && !sub.paid_until) {
      await provider.cancelCheckout(sub.provider_checkout_id)
      // Await authenticated CHECKOUT_CANCELED; this API acknowledgement is not a subscription cancellation.
    } else throw new AsaasError(true)
    await pool.query(
      `UPDATE billing_jobs SET state='confirmed',updated_at=now() WHERE subscription_id=$1 AND kind='cancellation'`,
      [sub.id],
    )
    await expireBillingAccess(pool)
  } catch (error) {
    await pool.query(
      `UPDATE billing_jobs SET state=$1,note='Cancelamento não confirmado; conciliação necessária',updated_at=now() WHERE subscription_id=$2 AND kind='cancellation'`,
      [
        error instanceof AsaasError && !error.uncertain
          ? 'failed'
          : 'uncertain',
        sub.id,
      ],
    )
    fail(
      502,
      'CANCELLATION_PENDING',
      'O cancelamento foi solicitado, mas o provedor ainda não o confirmou. Acompanhe a conciliação.',
    )
  }
}

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
            `${planSelect} p JOIN profiles pr ON pr.user_id=p.coach_id WHERE p.active AND pr.verification_status='approved' AND ($1::uuid IS NULL OR p.coach_id=$1)`,
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
