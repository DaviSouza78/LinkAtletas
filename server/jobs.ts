import { pathToFileURL } from 'node:url'
import type { Pool } from 'pg'
import { createPool } from './db/pool.js'
import { deliverOutbox } from './services/mail.js'
import { expireVerifications } from './modules/verification.js'
import {
  processBillingEvents,
  expireBillingAccess,
  reconcileBilling,
} from './modules/billing.js'

export async function runJobs(pool: Pool) {
  const verifications = await expireVerifications(pool)
  await processBillingEvents(pool)
  await reconcileBilling(pool)
  await expireBillingAccess(pool)
  const mail = await deliverOutbox(pool)
  await pool.query('DELETE FROM sessions WHERE expires_at<=now()')
  await pool.query(
    "DELETE FROM password_resets WHERE expires_at<now()-interval '1 day'",
  )
  return { verifications, mail, completedAt: new Date().toISOString() }
}
if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  const pool = createPool()
  try {
    console.log(JSON.stringify(await runJobs(pool)))
  } finally {
    await pool.end()
  }
}
