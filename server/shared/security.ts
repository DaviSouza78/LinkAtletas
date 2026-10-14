import {
  randomBytes,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto'
import { promisify } from 'node:util'
import type { FastifyRequest } from 'fastify'
import type { AppUser, Role } from '../../shared/contracts.js'
import { fail } from './errors.js'
const scrypt = promisify(scryptCallback)
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const key = (await scrypt(password, salt, 64)) as Buffer
  return `scrypt:${salt}:${key.toString('hex')}`
}
export async function verifyPassword(password: string, encoded: string) {
  const [scheme, salt, value] = encoded.split(':')
  if (scheme !== 'scrypt' || !salt || !value) return false
  const actual = (await scrypt(password, salt, 64)) as Buffer
  const expected = Buffer.from(value, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
export const newToken = () => randomBytes(32).toString('hex')
export const tokenHash = (token: string) =>
  createHash('sha256').update(token).digest('hex')
declare module 'fastify' {
  interface FastifyRequest {
    user: AppUser | null
  }
}
export function requireUser(request: FastifyRequest, role?: Role): AppUser {
  if (!request.user)
    fail(401, 'UNAUTHENTICATED', 'Entre na sua conta para continuar.')
  if (role && request.user.role !== role)
    fail(403, 'FORBIDDEN', 'Seu perfil não permite esta operação.')
  return request.user
}
