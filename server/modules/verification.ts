import type { FastifyInstance } from 'fastify'
import type { Pool } from 'pg'
import { z } from 'zod'
import type { Verification } from '../../shared/contracts.js'
import { transaction } from '../db/pool.js'
import { fail } from '../shared/errors.js'
import { requireUser } from '../shared/security.js'
import { bodySchema, idSchema } from '../shared/validation.js'

const select = `SELECT v.id,v.coach_id AS "coachId",u.name AS "coachName",v.cref,v.evidence,v.status,v.reason,
 v.submitted_at AS "submittedAt",v.reviewed_at AS "reviewedAt",v.reviewer_id AS "reviewerId" FROM verifications v JOIN users u ON u.id=v.coach_id`
const submission = z
  .object({
    cref: z.string().trim().min(4).max(50),
    evidence: z.string().trim().min(10).max(2000),
  })
  .strict()
const decision = z
  .object({
    status: z.enum(['approved', 'rejected']),
    reason: z.string().trim().min(5).max(1000),
  })
  .strict()
export async function verificationRoutes(app: FastifyInstance, pool: Pool) {
  app.get(
    '/verifications',
    {
      schema: {
        tags: ['Validação profissional'],
        summary: 'Histórico privado do treinador',
      },
    },
    async (req) => {
      const user = requireUser(req, 'coach')
      return {
        verifications: (
          await pool.query<Verification>(
            `${select} WHERE v.coach_id=$1 ORDER BY v.submitted_at DESC`,
            [user.id],
          )
        ).rows,
      }
    },
  )
  app.post(
    '/verifications',
    {
      schema: {
        tags: ['Validação profissional'],
        summary: 'Submeter registro à conferência manual',
        body: bodySchema(submission),
      },
    },
    async (req, reply) => {
      const user = requireUser(req, 'coach')
      const input = submission.parse(req.body)
      const id = await transaction(pool, async (client) => {
        const { rows: profiles } = await client.query(
          'SELECT sports,levels,goals,availability,verification_status FROM profiles WHERE user_id=$1 FOR UPDATE',
          [user.id],
        )
        const profile = profiles[0]
        if (
          !profile.sports.length ||
          !profile.levels.length ||
          !profile.goals.length ||
          !profile.availability.length
        )
          fail(
            400,
            'INCOMPLETE_PROFILE',
            'Complete modalidade, objetivos, nível e disponibilidade antes de enviar o registro.',
          )
        if (profile.verification_status === 'approved')
          fail(409, 'ALREADY_APPROVED', 'Seu perfil já foi aprovado.')
        const { rows } = await client.query(
          'INSERT INTO verifications(coach_id,cref,evidence) VALUES($1,$2,$3) RETURNING id',
          [user.id, input.cref, input.evidence],
        )
        await client.query(
          `UPDATE profiles SET cref=$1,verification_status='pending',verification_reason='' WHERE user_id=$2`,
          [input.cref, user.id],
        )
        return rows[0].id as string
      })
      return reply
        .code(201)
        .send({
          verification: (
            await pool.query<Verification>(`${select} WHERE v.id=$1`, [id])
          ).rows[0],
        })
    },
  )
  app.get(
    '/admin/verifications',
    {
      schema: {
        tags: ['Administração'],
        summary: 'Listar submissões para conferência manual',
      },
    },
    async (req) => {
      requireUser(req, 'admin')
      return {
        verifications: (
          await pool.query<Verification>(
            `${select} ORDER BY (v.status='pending') DESC,v.submitted_at DESC`,
          )
        ).rows,
      }
    },
  )
  app.patch<{ Params: { id: string } }>(
    '/admin/verifications/:id',
    {
      schema: {
        tags: ['Administração'],
        summary: 'Registrar decisão e auditoria',
        body: bodySchema(decision),
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
      },
    },
    async (req) => {
      const user = requireUser(req, 'admin')
      const id = idSchema.parse(req.params.id)
      const input = decision.parse(req.body)
      await transaction(pool, async (client) => {
        const { rows } = await client.query(
          "SELECT coach_id FROM verifications WHERE id=$1 AND status='pending' FOR UPDATE",
          [id],
        )
        if (!rows.length)
          fail(
            409,
            'DECISION_CONFLICT',
            'Solicitação inexistente ou já analisada.',
          )
        await client.query(
          'UPDATE verifications SET status=$1,reason=$2,reviewed_at=now(),reviewer_id=$3 WHERE id=$4',
          [input.status, input.reason, user.id, id],
        )
        await client.query(
          'INSERT INTO verification_audit(verification_id,reviewer_id,decision,reason) VALUES($1,$2,$3,$4)',
          [id, user.id, input.status, input.reason],
        )
        await client.query(
          'UPDATE profiles SET verification_status=$1,verification_reason=$2 WHERE user_id=$3',
          [input.status, input.reason, rows[0].coach_id],
        )
      })
      return {
        verification: (
          await pool.query<Verification>(`${select} WHERE v.id=$1`, [id])
        ).rows[0],
      }
    },
  )
}
