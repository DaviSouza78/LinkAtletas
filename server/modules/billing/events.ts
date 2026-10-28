import type { PoolClient, Pool } from 'pg'
import { type GatewayEvent, eventSchema, eventTime, monthlyEnd } from './validation.js'
import { z } from 'zod'
import { transaction } from '../../db/pool.js'
import { fail } from '../../shared/errors.js'
import { notifyBilling } from './notifications.js'

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
