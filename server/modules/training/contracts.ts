import type { FastifyInstance } from 'fastify'
import type { Pool } from 'pg'
import { z } from 'zod'
import type { AppUser, Contract } from '../../../shared/contracts.js'
import { transaction } from '../../db/pool.js'
import { fail } from '../../shared/errors.js'
import { requireUser } from '../../shared/security.js'
import { bodySchema, idSchema } from '../../shared/validation.js'
import { profileFor } from '../accounts/profiles.js'
import { calculateMatch } from './matching.js'
import { cancelContractBilling } from '../billing/lifecycle.js'
import { cancelReasonSchema } from '../billing/validation.js'
const select = `SELECT c.id,c.athlete_id AS "athleteId",c.coach_id AS "coachId",a.name AS "athleteName",t.name AS "coachName",
 c.status,c.created_at AS "createdAt",c.decided_at AS "decidedAt" FROM contracts c JOIN users a ON a.id=c.athlete_id JOIN users t ON t.id=c.coach_id`
export async function listContracts(
  pool: Pool,
  user: AppUser,
): Promise<Contract[]> {
  return (
    await pool.query<Contract>(
      `${select} WHERE c.athlete_id=$1 OR c.coach_id=$1 ORDER BY c.created_at DESC`,
      [user.id],
    )
  ).rows
}
export async function contractsRoutes(app: FastifyInstance, pool: Pool) {
  const create = z.object({ coachId: idSchema }).strict()
  const decide = z.object({ status: z.enum(['active', 'rejected']) }).strict()
  app.get(
    '/contracts',
    {
      schema: { tags: ['Vínculos'], summary: 'Minhas solicitações e vínculos' },
    },
    async (req) => ({ contracts: await listContracts(pool, requireUser(req)) }),
  )
  app.post(
    '/contracts',
    {
      schema: {
        tags: ['Vínculos'],
        summary: 'Solicitar um novo ciclo de acompanhamento',
        body: bodySchema(create),
      },
    },
    async (req, reply) => {
      const user = requireUser(req, 'athlete')
      const { coachId } = create.parse(req.body)
      const id = await transaction(pool, async (client) => {
        const { rows: coach } = await client.query(
          `SELECT p.sports,p.verification_status FROM profiles p JOIN users u ON u.id=p.user_id WHERE u.id=$1 AND u.role='coach' AND u.disabled_at IS NULL AND (p.verification_expires_at IS NULL OR p.verification_expires_at>now()) FOR SHARE`,
          [coachId],
        )
        if (!coach.length || coach[0].verification_status !== 'approved')
          fail(
            400,
            'UNAVAILABLE_COACH',
            'O treinador não está disponível para novas solicitações.',
          )
        const { rows: athlete } = await client.query(
          'SELECT sports FROM profiles WHERE user_id=$1',
          [user.id],
        )
        if (
          !athlete[0]?.sports.some((s: string) => coach[0].sports.includes(s))
        )
          fail(
            400,
            'INCOMPATIBLE_SPORT',
            'Complete seu perfil com uma modalidade atendida pelo treinador.',
          )
        const [athleteProfile, coachProfile] = await Promise.all([
          profileFor(client, user.id),
          profileFor(client, coachId),
        ])
        if (!calculateMatch(athleteProfile, coachProfile))
          fail(
            400,
            'INCOMPATIBLE_SERVICE',
            'O formato de atendimento ou a localização não é compatível com seu perfil.',
          )
        const { rows } = await client.query(
          `INSERT INTO contracts(athlete_id,coach_id) VALUES($1,$2)
        ON CONFLICT(athlete_id,coach_id) WHERE status IN ('pending','active','suspended') DO NOTHING RETURNING id`,
          [user.id, coachId],
        )
        if (!rows[0])
          fail(
            409,
            'DUPLICATE_CONTRACT',
            'Você já possui uma solicitação ou vínculo com este treinador.',
          )
        return rows[0].id as string
      })
      return reply.code(201).send({
        contract: (await pool.query<Contract>(`${select} WHERE c.id=$1`, [id]))
          .rows[0],
      })
    },
  )
  app.patch<{ Params: { id: string } }>(
    '/contracts/:id',
    {
      schema: {
        tags: ['Vínculos'],
        summary: 'Aceitar ou recusar solicitação',
        body: bodySchema(decide),
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
      },
    },
    async (req) => {
      const user = requireUser(req, 'coach')
      const id = idSchema.parse(req.params.id)
      const { status } = decide.parse(req.body)
      await transaction(pool, async (client) => {
        const { rows } = await client.query(
          'SELECT status FROM contracts WHERE id=$1 AND coach_id=$2 FOR UPDATE',
          [id, user.id],
        )
        if (!rows[0]) fail(404, 'NOT_FOUND', 'Solicitação não encontrada.')
        if (rows[0].status !== 'pending')
          fail(409, 'CONTRACT_STATE', 'Esta solicitação já foi respondida.')
        const { rows: coach } = await client.query(
          'SELECT verification_status,verification_expires_at FROM profiles WHERE user_id=$1 FOR SHARE',
          [user.id],
        )
        if (
          status === 'active' &&
          (coach[0].verification_status !== 'approved' ||
            (coach[0].verification_expires_at &&
              new Date(coach[0].verification_expires_at).getTime() <= Date.now()))
        )
          fail(
            403,
            'UNVERIFIED',
            'A aprovação profissional é necessária para aceitar alunos.',
          )
        await client.query(
          'UPDATE contracts SET status=$1,decided_at=now() WHERE id=$2',
          [status, id],
        )
      })
      return {
        contract: (await pool.query<Contract>(`${select} WHERE c.id=$1`, [id]))
          .rows[0],
      }
    },
  )
  app.post<{ Params: { id: string } }>(
    '/contracts/:id/cancel',
    {
      schema: {
        tags: ['Vínculos'],
        summary: 'Encerrar ciclo ou retirar solicitação com motivo',
        body: bodySchema(cancelReasonSchema),
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (req) => {
      const user = requireUser(req),
        id = idSchema.parse(req.params.id)
      const { reason } = cancelReasonSchema.parse(req.body)
      await cancelContractBilling(pool, id, user.id, reason)
      return {
        contract: (await pool.query<Contract>(`${select} WHERE c.id=$1`, [id]))
          .rows[0],
      }
    },
  )
}
