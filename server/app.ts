import Fastify, { LogController } from 'fastify'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import type { Pool } from 'pg'
import { appOrigin, production } from './config.js'
import { createPool } from './db/pool.js'
import { fail, installErrors } from './shared/errors.js'
import { tokenHash } from './shared/security.js'
import { authRoutes, COOKIE } from './modules/auth.js'
import { profilesRoutes } from './modules/profiles.js'
import { verificationRoutes } from './modules/verification.js'
import { matchingRoutes } from './modules/matching.js'
import { contractsRoutes } from './modules/contracts.js'
import { workoutsRoutes } from './modules/workouts.js'
import type { AppUser } from '../shared/contracts.js'
import { installResponseDocs } from './shared/openapi.js'

export async function buildApp(
  options: {
    pool?: Pool
    logger?: boolean
    origin?: string
    secureCookies?: boolean
    serveFrontend?: boolean
  } = {},
) {
  const pool = options.pool || createPool()
  const origin = options.origin || appOrigin
  const app = Fastify({
    logger: options.logger
      ? {
          redact: [
            'req.headers.cookie',
            'req.headers.authorization',
            'res.headers.set-cookie',
          ],
        }
      : false,
    bodyLimit: 262144,
    logController: new LogController({ disableRequestLogging: true }),
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false } },
  })
  installErrors(app, options.serveFrontend)
  installResponseDocs(app)
  await app.register(cookie)
  await app.register(rateLimit, { global: false })
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'LinkAtletas — API Sprint 2',
        version: '1.1.0',
        description:
          'Sessão HttpOnly; mutações exigem Origin autorizado. Sem cobrança real nesta Sprint.',
      },
      servers: [{ url: '/' }],
      components: {
        securitySchemes: {
          cookieAuth: { type: 'apiKey', in: 'cookie', name: COOKIE },
        },
      },
      security: [{ cookieAuth: [] }],
    },
  })
  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: { persistAuthorization: false },
  })
  app.decorateRequest('user', null)
  app.addHook('onRequest', async (req, reply) => {
    reply
      .header('X-Content-Type-Options', 'nosniff')
      .header('Referrer-Policy', 'same-origin')
    if (req.url.startsWith('/api/')) reply.header('Cache-Control', 'no-store')
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const incoming = req.headers.origin
      const sameServer = `${req.protocol}://${req.headers.host}`
      if (!incoming || (incoming !== origin && incoming !== sameServer))
        fail(403, 'INVALID_ORIGIN', 'Origem da requisição não autorizada.')
    }
    const token = req.cookies[COOKIE]
    if (token && /^[a-f0-9]{64}$/.test(token)) {
      const { rows } = await pool.query<AppUser>(
        `SELECT u.id,u.name,u.email,u.role FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()`,
        [tokenHash(token)],
      )
      req.user = rows[0] || null
    }
  })
  await app.register(
    async (api) => {
      api.get(
        '/health',
        {
          schema: {
            tags: ['Operação'],
            summary: 'Verificar conexão com banco',
          },
        },
        async () => {
          await pool.query('SELECT 1')
          return { ok: true, database: 'postgresql' }
        },
      )
      await authRoutes(api, pool, options.secureCookies ?? production)
      await profilesRoutes(api, pool)
      await verificationRoutes(api, pool)
      await matchingRoutes(api, pool)
      await contractsRoutes(api, pool)
      await workoutsRoutes(api, pool)
    },
    { prefix: '/api' },
  )
  app.get('/api/openapi.json', { schema: { hide: true } }, async () => {
    const document = app.swagger()
    // Fastify records prefixed paths. Keep server root so generated clients do not duplicate /api.
    return document
  })
  if (!options.pool) app.addHook('onClose', async () => pool.end())
  return app
}
