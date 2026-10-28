import type { Database } from './types.js'
import type { BillingSubscription } from '../../../shared/billing-contracts.js'
import { fail } from '../../shared/errors.js'

export const subscriptionSelect = `SELECT s.id,s.contract_id AS "contractId",c.athlete_id AS "athleteId",c.coach_id AS "coachId",
 a.name AS "athleteName",t.name AS "coachName",s.plan_name AS "planName",s.amount_cents AS "amountCents",
 s.commission_bps AS "commissionBps",s.environment,s.state,s.checkout_url AS "checkoutUrl",s.paid_until AS "paidUntil",
 s.grace_until AS "graceUntil",s.cancellation_confirmed AS "cancellationConfirmed",s.cancellation_reason AS "cancellationReason",s.created_at AS "createdAt"
 FROM billing_subscriptions s JOIN contracts c ON c.id=s.contract_id JOIN users a ON a.id=c.athlete_id JOIN users t ON t.id=c.coach_id`

export async function ownedSubscription(pool: Database, id: string, userId: string) {
  const { rows } = await pool.query<BillingSubscription>(
    `${subscriptionSelect} WHERE s.id=$1 AND (c.athlete_id=$2 OR c.coach_id=$2)`,
    [id, userId],
  )
  if (!rows[0]) fail(404, 'NOT_FOUND', 'Assinatura não encontrada.')
  return rows[0]
}
