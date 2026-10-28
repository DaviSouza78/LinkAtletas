import type { Database } from './types.js'

export async function notifyBilling(
  client: Database,
  contractId: string,
  title: string,
) {
  await client.query(
    `INSERT INTO notifications(user_id,kind,title,resource_id) SELECT unnest(ARRAY[athlete_id,coach_id]),'billing',$2,id FROM contracts WHERE id=$1`,
    [contractId, title],
  )
}
