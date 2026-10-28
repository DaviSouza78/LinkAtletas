import type { Pool } from 'pg'
import { transaction } from '../../db/pool.js'
import { mode, clientFromEnvironment } from './configuration.js'
import { processBillingEvents } from './events.js'
import type { BillingOptions } from './types.js'
import { fail } from '../../shared/errors.js'
import { notifyBilling } from './notifications.js'
import { AsaasError } from '../../services/asaas.js'

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
