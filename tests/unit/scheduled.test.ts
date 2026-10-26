import Fastify from 'fastify'
import type { Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'
import { runScheduledJobs, scheduledRoutes } from '../../server/scheduled.js'

const secret = 'a'.repeat(32)

describe('tarefas agendadas', () => {
  it.each([undefined, 'curta', secret])('recusa acesso sem autorizacao: %s', async (key) => {
    const app = Fastify()
    const work = vi.fn()
    scheduledRoutes(app, work, () => key)
    try {
      const response = await app.inject('/api/internal/jobs')
      expect(response.statusCode).toBe(401)
      expect(response.headers['cache-control']).toBe('no-store')
      expect(work).not.toHaveBeenCalled()
    } finally {
      await app.close()
    }
  })

  it.each(['Bearer errada', `Bearer ${'b'.repeat(32)}`])('recusa token incorreto: %s', async (authorization) => {
    const app = Fastify()
    const work = vi.fn()
    scheduledRoutes(app, work, () => secret)
    try {
      const response = await app.inject({ url: '/api/internal/jobs', headers: { authorization } })
      expect(response.statusCode).toBe(401)
      expect(work).not.toHaveBeenCalled()
    } finally {
      await app.close()
    }
  })

  it('executa somente com o segredo correto', async () => {
    const app = Fastify()
    const work = vi.fn().mockResolvedValue({ completed: true })
    scheduledRoutes(app, work, () => secret)
    try {
      const response = await app.inject({
        url: '/api/internal/jobs',
        headers: { authorization: `Bearer ${secret}` },
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ completed: true })
      expect(work).toHaveBeenCalledOnce()
    } finally {
      await app.close()
    }
  })

  function database(locked: boolean) {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [{ locked }] }),
      release: vi.fn(),
    }
    const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pool
    return { client, pool }
  }

  it('evita outra execucao enquanto a trava esta ocupada', async () => {
    const { pool, client } = database(false)
    const work = vi.fn()
    expect(await runScheduledJobs(pool, work)).toEqual({ skipped: true })
    expect(work).not.toHaveBeenCalled()
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK')
    expect(client.release).toHaveBeenCalledOnce()
  })

  it('mantem a trava dentro de uma transacao ate concluir o trabalho', async () => {
    const { pool, client } = database(true)
    const work = vi.fn(async () => {
      expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN')
      expect(client.release).not.toHaveBeenCalled()
      return { completed: true }
    })
    expect(await runScheduledJobs(pool, work)).toEqual({ skipped: false, result: { completed: true } })
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK')
    expect(client.release).toHaveBeenCalledOnce()
  })

  it('libera a trava mesmo quando o trabalho falha', async () => {
    const { pool, client } = database(true)
    await expect(runScheduledJobs(pool, async () => { throw new Error('falha') })).rejects.toThrow('falha')
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK')
    expect(client.release).toHaveBeenCalledOnce()
  })

  it('descarta a conexao quando nao consegue encerrar a transacao', async () => {
    const { pool, client } = database(true)
    client.query.mockRejectedValueOnce(new Error('banco indisponivel'))
    client.query.mockRejectedValueOnce(new Error('rollback indisponivel'))
    await expect(runScheduledJobs(pool, vi.fn())).rejects.toThrow('rollback indisponivel')
    expect(client.release).toHaveBeenCalledWith(true)
  })
})
