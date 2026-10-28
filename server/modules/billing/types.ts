import type { Pool, PoolClient } from 'pg'
import { AsaasClient } from '../../services/asaas.js'

export type Database = Pool | PoolClient

export interface BillingOptions {
  client?: AsaasClient
  webhookToken?: string
  mode?: 'academic' | 'asaas'
  environment?: 'sandbox' | 'production'
  callbackOrigin?: string
}
