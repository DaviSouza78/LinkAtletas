import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'

const transport = vi.hoisted(() => ({ close: vi.fn(), sendMail: vi.fn() }))
vi.mock('nodemailer', () => ({ default: { createTransport: () => transport } }))

import { deliverOutbox } from '../../server/services/mail.js'

describe('liberacao do transporte SMTP', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllEnvs())

  it('nao abre SMTP nem consulta a fila em deployments de preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const pool = { connect: vi.fn() } as unknown as Pool
    await expect(deliverOutbox(pool)).resolves.toEqual({ sent: 0, disabled: true })
    expect(pool.connect).not.toHaveBeenCalled()
    expect(transport.sendMail).not.toHaveBeenCalled()
    expect(transport.close).not.toHaveBeenCalled()
  })

  it('fecha transporte quando nao existem mensagens pendentes', async () => {
    const client = { query: vi.fn().mockResolvedValue({ rows: [] }), release: vi.fn() }
    const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pool
    await expect(deliverOutbox(pool)).resolves.toEqual({ sent: 0 })
    expect(transport.close).toHaveBeenCalledOnce()
    expect(transport.sendMail).not.toHaveBeenCalled()
  })

  it('fecha transporte e preserva a falha quando o banco esta indisponivel', async () => {
    const error = new Error('Banco indisponivel')
    const pool = { connect: vi.fn().mockRejectedValue(error) } as unknown as Pool
    await expect(deliverOutbox(pool)).rejects.toBe(error)
    expect(transport.close).toHaveBeenCalledOnce()
    expect(transport.sendMail).not.toHaveBeenCalled()
  })
})
