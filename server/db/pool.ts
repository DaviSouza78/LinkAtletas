import pg from 'pg'
import { databaseUrl } from '../config.js'
export const createPool = (url = databaseUrl) =>
  new pg.Pool({ connectionString: url, max: 10, connectionTimeoutMillis: 5000 })
export async function transaction<T>(
  pool: pg.Pool,
  work: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  let discard = false
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      discard = true
    }
    throw error
  } finally {
    client.release(discard)
  }
}
