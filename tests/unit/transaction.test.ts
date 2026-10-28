import { describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { transaction } from '../../server/db/pool.js'

function database() {
  const client = { query: vi.fn().mockResolvedValue({ rows: [] }), release: vi.fn() }
  const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pool
  return { client, pool }
}

describe('transacao PostgreSQL', () => {
  it('confirma operacao e devolve conexao utilizavel', async () => {
    const { client, pool } = database()
    await expect(transaction(pool, async () => 'resultado')).resolves.toBe('resultado')
    expect(client.query.mock.calls.map(([sql]) => sql)).toEqual(['BEGIN', 'COMMIT'])
    expect(client.release).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('desfaz operacao sem substituir o erro original', async () => {
    const { client, pool } = database()
    const error = new Error('Falha na operacao')
    await expect(transaction(pool, async () => { throw error })).rejects.toBe(error)
    expect(client.query.mock.calls.map(([sql]) => sql)).toEqual(['BEGIN', 'ROLLBACK'])
    expect(client.release).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('descarta conexao quando rollback falha e preserva a causa original', async () => {
    const { client, pool } = database()
    client.query.mockImplementation(async (sql) => {
      if (sql === 'ROLLBACK') throw new Error('Conexao interrompida')
      return { rows: [] }
    })
    const original = new Error('Falha original')
    await expect(transaction(pool, async () => { throw original })).rejects.toBe(original)
    expect(client.release).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('descarta conexao quando commit e rollback falham', async () => {
    const { client, pool } = database()
    const original = new Error('Commit indisponivel')
    client.query.mockImplementation(async (sql) => {
      if (sql === 'COMMIT') throw original
      if (sql === 'ROLLBACK') throw new Error('Rollback indisponivel')
      return { rows: [] }
    })
    await expect(transaction(pool, async () => 1)).rejects.toBe(original)
    expect(client.release).toHaveBeenCalledExactlyOnceWith(true)
  })
})
