import type { Database, BillingOptions } from './types.js'
import type { BillingConfig } from '../../../shared/billing-contracts.js'
import { AsaasClient } from '../../services/asaas.js'

export const mode = () => (process.env.BILLING_MODE === 'asaas' ? 'asaas' : 'academic')

const environment = () =>
  process.env.ASAAS_ENVIRONMENT === 'production'
    ? ('production' as const)
    : ('sandbox' as const)

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

export function clientFromEnvironment() {
  if (mode() !== 'asaas') return undefined
  return process.env.ASAAS_API_KEY
    ? new AsaasClient({
        apiKey: process.env.ASAAS_API_KEY,
        environment: environment(),
      })
    : undefined
}
