import type { Pool } from 'pg'
import type { FastifyRequest, FastifyInstance } from 'fastify'
import { tokenHash, requireUser } from '../../shared/security.js'
import type { InteractionEvent } from '../../../shared/interaction-contracts.js'
import { fail } from '../../shared/errors.js'

interface Socket {
  readyState: number
  send(data: string): void
  close(code?: number, reason?: string): void
  on(event: string, listener: (...args: any[]) => void): void
}

interface Subscriber {
  socket: Socket
  userId: string
  sessionHash: string
}

const subscribers = new WeakMap<Pool, Set<Subscriber>>()

function sessionHash(request: FastifyRequest) {
  const token =
    request.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1] ??
    request.cookies.la_session
  return token && /^[a-f0-9]{64}$/i.test(token) ? tokenHash(token) : ''
}

export async function publish(pool: Pool, userIds: string[], event: InteractionEvent) {
  for (const subscriber of subscribers.get(pool) ?? []) {
    if (!userIds.includes(subscriber.userId)) continue
    try {
      const live = await pool.query(
        'SELECT 1 FROM sessions WHERE token_hash=$1 AND user_id=$2 AND expires_at>now()',
        [subscriber.sessionHash, subscriber.userId],
      )
      if (!live.rowCount) {
        subscriber.socket.close(1008, 'Sessão encerrada')
        continue
      }
      if (subscriber.socket.readyState === 1)
        subscriber.socket.send(JSON.stringify(event))
    } catch {
      subscriber.socket.close(1011, 'Reconecte para consultar o histórico')
    }
  }
}

export function registerEventRoutes(app: FastifyInstance, pool: Pool) {
  const connections = subscribers.get(pool) ?? new Set<Subscriber>()
  subscribers.set(pool, connections)
  const expiryTimer = setInterval(async () => {
    for (const subscriber of connections) {
      try {
        const live = await pool.query(
          'SELECT 1 FROM sessions WHERE token_hash=$1 AND expires_at>now()',
          [subscriber.sessionHash],
        )
        if (!live.rowCount) subscriber.socket.close(1008, 'Sessão encerrada')
      } catch {
        subscriber.socket.close(1011, 'Reconecte')
      }
    }
  }, 15_000)
  expiryTimer.unref()
  app.addHook('onClose', async () => {
    clearInterval(expiryTimer)
    for (const s of connections) s.socket.close(1001, 'Servidor reiniciando')
    subscribers.delete(pool)
  })
  app.get(
    '/events',
    {
      websocket: true,
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
      preValidation: async (req) => {
        requireUser(req)
        if (!sessionHash(req)) fail(401, 'UNAUTHENTICATED', 'Sessão inválida.')
      },
      schema: { hide: true },
    },
    (socket, req) => {
      const user = requireUser(req)
      const subscriber = {
        socket: socket as Socket,
        userId: user.id,
        sessionHash: sessionHash(req),
      }
      connections.add(subscriber)
      socket.on('close', () => connections.delete(subscriber))
      socket.on('error', () => connections.delete(subscriber))
      // Mutations happen through the validated REST routes. Reconnect loads persisted history.
      socket.send(
        JSON.stringify({
          type: 'ready',
          userId: user.id,
        } satisfies InteractionEvent),
      )
    },
  )
}
