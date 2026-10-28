import type { Pool, PoolClient } from 'pg'
import type { AppUser } from '../../../shared/contracts.js'
import { fail } from '../../shared/errors.js'
import { assertContractAccess } from '../billing/access.js'

export type Database = Pool | PoolClient

export const params = {
  type: 'object',
  properties: { id: { type: 'string', format: 'uuid' } },
  required: ['id'],
} as const

export async function contractMember(
  db: Database,
  id: string,
  user: AppUser,
  active = false,
  lock = false,
) {
  const { rows } = await db.query<{
    athlete_id: string
    coach_id: string
    status: string
    decided_at: Date | null
  }>(
    `SELECT athlete_id,coach_id,status,decided_at FROM contracts WHERE id=$1 AND (athlete_id=$2 OR coach_id=$2)${lock ? ' FOR SHARE' : ''}`,
    [id, user.id],
  )
  if (!rows[0]) fail(404, 'NOT_FOUND', 'Vínculo não encontrado.')
  if (active && rows[0].status !== 'active')
    fail(403, 'INACTIVE_CONTRACT', 'Esta ação exige um vínculo ativo.')
  if (active) await assertContractAccess(db, id, user.id)
  return rows[0]
}

export function participants(contract: { athlete_id: string; coach_id: string }) {
  return [contract.athlete_id, contract.coach_id]
}
