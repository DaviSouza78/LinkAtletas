import { createPool } from '../../server/db/pool.js'
import { migrate } from '../../server/db/migrate.js'

// Advisory-locked migrations finish before accepting application traffic.
const pool = createPool()
try {
  await migrate(pool)
} finally {
  await pool.end()
}
await import('../../server/index.js')
