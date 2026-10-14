import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { Pool } from 'pg'
import { createPool, transaction } from './pool.js'
import { encryptPrivate } from '../shared/crypto.js'

export async function migrate(pool: Pool) {
  const directory = fileURLToPath(new URL('./migrations/', import.meta.url))
  await transaction(pool, async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(128712026)')
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    )
    for (const name of (await readdir(directory))
      .filter((n) => n.endsWith('.sql'))
      .sort()) {
      const existing = await client.query(
        'SELECT 1 FROM schema_migrations WHERE version=$1',
        [name],
      )
      if (existing.rowCount) continue
      await client.query(await readFile(path.join(directory, name), 'utf8'))
      await client.query('INSERT INTO schema_migrations(version) VALUES($1)', [
        name,
      ])
    }
    const existing = await client.query(
      "SELECT id,notes,metrics FROM executions WHERE private_payload IS NULL AND (notes<>'' OR metrics<>'{}'::jsonb) FOR UPDATE",
    )
    for (const row of existing.rows)
      await client.query(
        "UPDATE executions SET private_payload=$1,notes='',metrics='{}' WHERE id=$2",
        [
          encryptPrivate(
            JSON.stringify({ notes: row.notes, metrics: row.metrics }),
          ),
          row.id,
        ],
      )
  })
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const pool = createPool()
  try {
    await migrate(pool)
    console.log('Migrations aplicadas.')
  } finally {
    await pool.end()
  }
}
