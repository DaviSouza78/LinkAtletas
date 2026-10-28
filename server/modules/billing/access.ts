import type { Database } from './types.js'
import { fail } from '../../shared/errors.js'
import { mode } from './configuration.js'

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
