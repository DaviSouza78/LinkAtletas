import type { FastifyInstance, FastifyReply } from 'fastify'
import type { Pool } from 'pg'
import { z } from 'zod'
import { transaction } from '../../db/pool.js'
import { fail } from '../../shared/errors.js'
import {
  hashPassword,
  newToken,
  tokenHash,
  verifyPassword,
} from '../../shared/security.js'
import { bodySchema } from '../../shared/validation.js'
import type { AppUser } from '../../../shared/contracts.js'

export const COOKIE = 'la_session'
const loginSchema = z
  .object({ email: z.email().max(254), password: z.string().min(8).max(128) })
  .strict()
const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2).max(100),
  role: z.enum(['athlete', 'coach']),
})
export async function authRoutes(
  app: FastifyInstance,
  pool: Pool,
  secure: boolean,
) {
  const dummyHash = await hashPassword('dummy-account-timing-value')
  const session = async (
    user: AppUser,
    reply: FastifyReply,
    native = false,
    expectedHash?: string,
  ) => {
    const token = newToken()
    const expires = new Date(Date.now() + 12 * 60 * 60 * 1000)
    await pool.query('DELETE FROM sessions WHERE expires_at <= now()')
    await transaction(pool, async (client) => {
      const current = (
        await client.query(
          'SELECT password_hash FROM users WHERE id=$1 AND disabled_at IS NULL FOR SHARE',
          [user.id],
        )
      ).rows[0]
      if (!current || (expectedHash && current.password_hash !== expectedHash))
        fail(
          401,
          'INVALID_CREDENTIALS',
          'A conta ou a senha foi alterada. Entre novamente.',
        )
      await client.query(
        'INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)',
        [tokenHash(token), user.id, expires],
      )
    })
    if (!native)
      reply.setCookie(COOKIE, token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure,
        expires,
      })
    return native ? { token, expiresAt: expires.toISOString() } : {}
  }
  for (const native of [false, true]) {
    app.post(
      native ? '/auth/native/register' : '/auth/register',
      {
        config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
        schema: {
          tags: ['Autenticação'],
          summary: 'Cadastrar atleta ou treinador',
          body: bodySchema(registerSchema),
        },
      },
      async (req, reply) => {
        const input = registerSchema.parse(req.body)
        const password = await hashPassword(input.password)
        const user = await transaction(pool, async (client) => {
          const { rows } = await client.query<AppUser>(
            `INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role`,
            [
              input.name,
              input.email.trim().toLowerCase(),
              password,
              input.role,
            ],
          )
          await client.query('INSERT INTO profiles(user_id) VALUES($1)', [
            rows[0].id,
          ])
          return rows[0]
        })
        const credentials = await session(user, reply, native)
        return reply.code(201).send({ user, ...credentials })
      },
    )
    app.post(
      native ? '/auth/native/login' : '/auth/login',
      {
        config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
        schema: {
          tags: ['Autenticação'],
          summary: native ? 'Entrar e emitir token Bearer' : 'Entrar e emitir cookie HttpOnly',
          body: bodySchema(loginSchema),
        },
      },
      async (req, reply) => {
        const input = loginSchema.parse(req.body)
        const { rows } = await pool.query<AppUser & { password_hash: string }>(
          'SELECT id,name,email,role,password_hash FROM users WHERE email=$1 AND disabled_at IS NULL',
          [input.email.trim().toLowerCase()],
        )
        const account = rows[0]
        const valid = await verifyPassword(
          input.password,
          account?.password_hash || dummyHash,
        )
        if (!account || !valid)
          fail(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
        if (req.cookies[COOKIE])
          await pool.query('DELETE FROM sessions WHERE token_hash=$1', [
            tokenHash(req.cookies[COOKIE]),
          ])
        const user: AppUser = {
          id: account.id,
          name: account.name,
          email: account.email,
          role: account.role,
        }
        const credentials = await session(
          user,
          reply,
          native,
          account.password_hash,
        )
        return { user, ...credentials }
      },
    )
  }
  app.get(
    '/auth/session',
    { schema: { tags: ['Autenticação'], summary: 'Consultar sessão atual' } },
    async (req) => ({ user: req.user }),
  )
  app.post(
    '/auth/logout',
    {
      schema: {
        tags: ['Autenticação'],
        summary: 'Encerrar e invalidar sessão',
      },
    },
    async (req, reply) => {
      const currentToken =
        req.headers.authorization?.replace(/^Bearer /, '') ||
        req.cookies[COOKIE]
      if (currentToken)
        await pool.query('DELETE FROM sessions WHERE token_hash=$1', [
          tokenHash(currentToken),
        ])
      reply.clearCookie(COOKIE, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure,
      })
      return { ok: true }
    },
  )
}
