export type BillingState =
  | 'awaiting_payment'
  | 'regular'
  | 'grace'
  | 'suspended'
  | 'cancellation_requested'
  | 'ended'
  | 'uncertain'
export interface BillingConfig {
  mode: 'academic' | 'asaas'
  environment: 'disabled' | 'sandbox' | 'production'
  available: boolean
  commissionBps: number
  graceDays: number
}
export interface BillingPlan {
  coachId: string
  name: string
  amountCents: number
  active: boolean
}
export interface BillingWallet {
  walletId: string
  updatedAt: string
}
export interface BillingSubscription {
  id: string
  contractId: string
  athleteId: string
  coachId: string
  athleteName: string
  coachName: string
  planName: string
  amountCents: number
  commissionBps: number
  environment: 'sandbox' | 'production'
  state: BillingState
  checkoutUrl: string | null
  paidUntil: string | null
  graceUntil: string | null
  cancellationConfirmed: boolean
  cancellationReason: string
  createdAt: string
}
export interface BillingPayment {
  id: string
  subscriptionId: string
  providerPaymentId: string
  amountCents: number
  netCents: number
  status: string
  paidAt: string | null
  dueDate: string | null
  environment: 'sandbox' | 'production'
  coachShareCents: number
  platformShareCents: number
}
export interface BillingSummary {
  subscriptions: BillingSubscription[]
  payments: BillingPayment[]
  totals: {
    receivedCents: number
    coachShareCents: number
    platformShareCents: number
  }
}
