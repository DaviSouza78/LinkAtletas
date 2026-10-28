import type { FastifyInstance } from 'fastify'
import type { Pool, PoolClient } from 'pg'
import { z } from 'zod'
import type {
  AppUser,
  MetricType,
  Workout,
  WorkoutInput,
} from '../../../shared/contracts.js'
import { transaction } from '../../db/pool.js'
import { fail } from '../../shared/errors.js'
import { requireUser } from '../../shared/security.js'
import {
  bodySchema,
  executionSchema,
  idSchema,
  workoutSchema,
} from '../../shared/validation.js'
import { listContracts } from './contracts.js'
import { encryptPrivate, decryptPrivate } from '../../shared/crypto.js'
import { assertContractAccess } from '../billing/access.js'
import { notifyUsers } from '../interactions/notifications.js'

const select = `SELECT w.id,w.contract_id AS "contractId",w.title,w.sport,to_char(w.scheduled_date,'YYYY-MM-DD') AS "scheduledDate",
 w.instructions,w.status,w.created_at AS "createdAt",c.athlete_id AS "athleteId",c.coach_id AS "coachId",
 a.name AS "athleteName",t.name AS "coachName",
 COALESCE((SELECT jsonb_agg(b.definition ORDER BY b.position) FROM exercise_blocks b WHERE b.workout_id=w.id),'[]'::jsonb) AS blocks,
 CASE WHEN e.id IS NULL THEN NULL ELSE jsonb_build_object('id',e.id,'completedBlocks',e.completed_blocks,'effort',e.effort,'notes',e.notes,'metrics',e.metrics,'privatePayload',e.private_payload,'updatedAt',e.updated_at) END AS execution
 FROM workouts w JOIN contracts c ON c.id=w.contract_id JOIN users a ON a.id=c.athlete_id JOIN users t ON t.id=c.coach_id
 LEFT JOIN executions e ON e.workout_id=w.id`
export async function listWorkouts(
  pool: Pool,
  user: AppUser,
): Promise<Workout[]> {
  return (
    await pool.query<Workout>(
      `${select} WHERE c.coach_id=$1 OR (c.athlete_id=$1 AND w.status='published') ORDER BY w.scheduled_date DESC,w.created_at DESC`,
      [user.id],
    )
  ).rows.map(decodeWorkout)
}
function decodeWorkout(workout: Workout): Workout {
  const execution = workout.execution as
    | (NonNullable<Workout['execution']> & { privatePayload?: string | null })
    | null
  if (execution) {
    if (execution.privatePayload)
      Object.assign(
        execution,
        JSON.parse(decryptPrivate(execution.privatePayload)),
      )
    delete execution.privatePayload
  }
  return workout
}
async function getWorkout(
  pool: Pool,
  id: string,
  user: AppUser,
): Promise<Workout> {
  const { rows } = await pool.query<Workout>(
    `${select} WHERE w.id=$1 AND (c.coach_id=$2 OR (c.athlete_id=$2 AND w.status='published'))`,
    [id, user.id],
  )
  if (!rows[0]) fail(404, 'NOT_FOUND', 'Treino não encontrado.')
  return decodeWorkout(rows[0])
}
async function validateContract(
  client: PoolClient,
  id: string,
  coachId: string,
  sport: string,
) {
  await assertContractAccess(client, id, coachId)
  const { rows } = await client.query(
    "SELECT athlete_id FROM contracts WHERE id=$1 AND coach_id=$2 AND status='active' FOR SHARE",
    [id, coachId],
  )
  if (!rows[0])
    fail(
      403,
      'INACTIVE_CONTRACT',
      'A prescrição exige um vínculo ativo com seu aluno.',
    )
  const profiles = await client.query(
    'SELECT sports FROM profiles WHERE user_id=$1 OR user_id=$2',
    [coachId, rows[0].athlete_id],
  )
  if (profiles.rows.some((p) => !p.sports.includes(sport)))
    fail(
      400,
      'INVALID_SPORT',
      'A modalidade do treino precisa estar nos perfis do atleta e treinador.',
    )
}
async function saveBlocks(client: PoolClient, id: string, input: WorkoutInput) {
  await client.query('DELETE FROM exercise_blocks WHERE workout_id=$1', [id])
  for (const [index, block] of input.blocks.entries())
    await client.query(
      'INSERT INTO exercise_blocks(workout_id,position,definition) VALUES($1,$2,$3::jsonb)',
      [id, index, JSON.stringify(block)],
    )
}
const params = {
  type: 'object',
  properties: { id: { type: 'string', format: 'uuid' } },
  required: ['id'],
} as const
export async function workoutsRoutes(app: FastifyInstance, pool: Pool) {
  app.get(
    '/workouts',
    {
      schema: {
        tags: ['Treinos'],
        summary: 'Listar minhas fichas e feedbacks',
      },
    },
    async (req) => ({ workouts: await listWorkouts(pool, requireUser(req)) }),
  )
  app.get<{ Params: { id: string } }>(
    '/workouts/:id',
    {
      schema: {
        tags: ['Treinos'],
        summary: 'Consultar ficha com autorização por vínculo',
        params,
      },
    },
    async (req) => ({
      workout: await getWorkout(
        pool,
        idSchema.parse(req.params.id),
        requireUser(req),
      ),
    }),
  )
  app.post(
    '/workouts',
    {
      schema: {
        tags: ['Treinos'],
        summary: 'Criar rascunho ou publicar ficha de exercícios',
        body: bodySchema(workoutSchema),
      },
    },
    async (req, reply) => {
      const user = requireUser(req, 'coach')
      const input = workoutSchema.parse(req.body)
      const id = await transaction(pool, async (client) => {
        await validateContract(client, input.contractId, user.id, input.sport)
        const { rows } = await client.query(
          `INSERT INTO workouts(contract_id,title,sport,scheduled_date,instructions,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
          [
            input.contractId,
            input.title,
            input.sport,
            input.scheduledDate,
            input.instructions,
            input.status,
          ],
        )
        await saveBlocks(client, rows[0].id, input)
        return rows[0].id as string
      })
      const saved = await getWorkout(pool, id, user)
      if (saved.status === 'published')
        await notifyUsers(
          pool,
          [saved.athleteId],
          'workout',
          'Um treino foi publicado.',
          id,
        )
      return reply.code(201).send({ workout: saved })
    },
  )
  app.put<{ Params: { id: string } }>(
    '/workouts/:id',
    {
      schema: {
        tags: ['Treinos'],
        summary: 'Editar ou publicar rascunho antes de receber execução',
        body: bodySchema(workoutSchema),
        params,
      },
    },
    async (req) => {
      const user = requireUser(req, 'coach')
      const id = idSchema.parse(req.params.id)
      const input = workoutSchema.parse(req.body)
      await transaction(pool, async (client) => {
        const { rows } = await client.query(
          `SELECT w.contract_id FROM workouts w JOIN contracts c ON c.id=w.contract_id WHERE w.id=$1 AND c.coach_id=$2 FOR UPDATE OF w`,
          [id, user.id],
        )
        if (!rows[0]) fail(404, 'NOT_FOUND', 'Treino não encontrado.')
        if (rows[0].contract_id !== input.contractId)
          fail(
            400,
            'IMMUTABLE_CONTRACT',
            'Não é possível transferir uma ficha para outro vínculo.',
          )
        await validateContract(client, input.contractId, user.id, input.sport)
        if (
          (
            await client.query('SELECT 1 FROM executions WHERE workout_id=$1', [
              id,
            ])
          ).rowCount
        )
          fail(
            409,
            'WORKOUT_EXECUTED',
            'Uma ficha com execução registrada deve ser preservada. Crie uma nova ficha para ajustes.',
          )
        await client.query(
          'UPDATE workouts SET title=$1,sport=$2,scheduled_date=$3,instructions=$4,status=$5 WHERE id=$6',
          [
            input.title,
            input.sport,
            input.scheduledDate,
            input.instructions,
            input.status,
            id,
          ],
        )
        await saveBlocks(client, id, input)
      })
      return { workout: await getWorkout(pool, id, user) }
    },
  )
  app.put<{ Params: { id: string } }>(
    '/workouts/:id/execution',
    {
      schema: {
        tags: ['Treinos'],
        summary: 'Registrar ou atualizar execução sem duplicar',
        body: bodySchema(executionSchema),
        params,
      },
    },
    async (req) => {
      const user = requireUser(req, 'athlete')
      const id = idSchema.parse(req.params.id)
      const input = executionSchema.parse(req.body)
      await transaction(pool, async (client) => {
        const { rows } = await client.query(
          `SELECT w.sport,w.contract_id,c.status FROM workouts w JOIN contracts c ON c.id=w.contract_id WHERE w.id=$1 AND c.athlete_id=$2 AND w.status='published' FOR UPDATE OF w`,
          [id, user.id],
        )
        if (!rows[0]) fail(404, 'NOT_FOUND', 'Treino não encontrado.')
        await assertContractAccess(client, rows[0].contract_id, user.id)
        if (rows[0].status !== 'active')
          fail(
            403,
            'INACTIVE_CONTRACT',
            'O vínculo precisa estar ativo para registrar execução.',
          )
        const count = (
          await client.query(
            'SELECT count(*)::int AS total FROM exercise_blocks WHERE workout_id=$1',
            [id],
          )
        ).rows[0].total as number
        if (
          new Set(input.completedBlocks).size !==
            input.completedBlocks.length ||
          input.completedBlocks.some((i) => i >= count)
        )
          fail(
            400,
            'INVALID_BLOCKS',
            'Selecione apenas os blocos existentes, sem repetições.',
          )
        const { rows: metrics } = await client.query<MetricType>(
          'SELECT * FROM metric_types WHERE sport=$1',
          [rows[0].sport],
        )
        for (const [key, value] of Object.entries(input.metrics)) {
          const type = metrics.find((m) => m.key === key)
          if (
            !type ||
            value < type.min ||
            value > type.max ||
            (key === 'repetitions' && !Number.isInteger(value))
          )
            fail(
              400,
              'INVALID_METRIC',
              `Métrica inválida para esta modalidade: ${key}.`,
            )
        }
        await client.query(
          `INSERT INTO executions(workout_id,completed_blocks,effort,notes,metrics,private_payload) VALUES($1,$2,$3,'','{}',$4)
        ON CONFLICT(workout_id) DO UPDATE SET completed_blocks=EXCLUDED.completed_blocks,effort=EXCLUDED.effort,notes='',metrics='{}',private_payload=EXCLUDED.private_payload,updated_at=now()`,
          [
            id,
            input.completedBlocks,
            input.effort,
            encryptPrivate(
              JSON.stringify({ notes: input.notes, metrics: input.metrics }),
            ),
          ],
        )
      })
      return { workout: await getWorkout(pool, id, user) }
    },
  )
  app.get(
    '/metrics',
    {
      schema: {
        tags: ['Treinos'],
        summary: 'Catálogo de métricas e limites por modalidade',
        querystring: {
          type: 'object',
          properties: { sport: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (req) => {
      requireUser(req)
      const { sport } = z
        .object({ sport: z.string().max(80).optional() })
        .parse(req.query)
      return {
        metrics: (
          await pool.query<MetricType>(
            'SELECT * FROM metric_types WHERE ($1::text IS NULL OR sport=$1) ORDER BY sport,key',
            [sport || null],
          )
        ).rows,
      }
    },
  )
  app.get(
    '/dashboard',
    {
      schema: {
        tags: ['Painéis'],
        summary: 'Vínculos e treinos persistidos do usuário',
      },
    },
    async (req) => {
      const user = requireUser(req)
      const [contracts, workouts] = await Promise.all([
        listContracts(pool, user),
        listWorkouts(pool, user),
      ])
      return { contracts, workouts }
    },
  )
}
