import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { Pool, PoolClient } from 'pg'
import { z } from 'zod'
import type { AppUser } from '../../shared/contracts.js'
import type {
  Consultation,
  InteractionEvent,
  Message,
  Notification,
  Review,
} from '../../shared/interaction-contracts.js'
import { transaction } from '../db/pool.js'
import { decryptPrivate, encryptPrivate } from '../shared/crypto.js'
import { fail } from '../shared/errors.js'
import { requireUser, tokenHash } from '../shared/security.js'
import { bodySchema, idSchema } from '../shared/validation.js'
import { assertContractAccess } from './billing.js'

type Database = Pool | PoolClient
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
const params = {
  type: 'object',
  properties: { id: { type: 'string', format: 'uuid' } },
  required: ['id'],
} as const
const notificationSelect = `SELECT id,kind,title,resource_id AS "resourceId",created_at AS "createdAt",read_at AS "readAt" FROM notifications`
const messageSelect = `SELECT m.id,m.contract_id AS "contractId",m.sender_id AS "senderId",u.name AS "senderName",m.body_ciphertext AS text,m.media_id AS "mediaId",m.created_at AS "createdAt",m.read_at AS "readAt" FROM messages m JOIN users u ON u.id=m.sender_id`
const reviewSelect = `SELECT r.id,r.contract_id AS "contractId",r.athlete_id AS "athleteId",a.name AS "athleteName",r.coach_id AS "coachId",c.name AS "coachName",r.rating,r.body AS text,r.reply,r.replied_at AS "repliedAt",r.hidden,r.created_at AS "createdAt",r.updated_at AS "updatedAt" FROM reviews r JOIN users a ON a.id=r.athlete_id JOIN users c ON c.id=r.coach_id`
const consultationSelect = `SELECT x.id,x.contract_id AS "contractId",c.athlete_id AS "athleteId",a.name AS "athleteName",c.coach_id AS "coachId",t.name AS "coachName",x.title,x.description_ciphertext AS description,x.starts_at AS "startsAt",x.duration_minutes AS "durationMinutes",x.status,x.meeting_url AS "meetingUrl",x.external_event_id AS "externalEventId",x.created_at AS "createdAt",x.updated_at AS "updatedAt" FROM consultations x JOIN contracts c ON c.id=x.contract_id JOIN users a ON a.id=c.athlete_id JOIN users t ON t.id=c.coach_id`

async function contractMember(
  db: Database,
  id: string,
  user: AppUser,
  active = false,
  lock = false,
) {
  const { rows } = await db.query<{
    athlete_id: string
    coach_id: string
    status: string
    decided_at: Date | null
  }>(
    `SELECT athlete_id,coach_id,status,decided_at FROM contracts WHERE id=$1 AND (athlete_id=$2 OR coach_id=$2)${lock ? ' FOR SHARE' : ''}`,
    [id, user.id],
  )
  if (!rows[0]) fail(404, 'NOT_FOUND', 'Vínculo não encontrado.')
  if (active && rows[0].status !== 'active')
    fail(403, 'INACTIVE_CONTRACT', 'Esta ação exige um vínculo ativo.')
  if (active) await assertContractAccess(db, id, user.id)
  return rows[0]
}
function participants(contract: { athlete_id: string; coach_id: string }) {
  return [contract.athlete_id, contract.coach_id]
}
function sessionHash(request: FastifyRequest) {
  const token =
    request.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1] ??
    request.cookies.la_session
  return token && /^[a-f0-9]{64}$/i.test(token) ? tokenHash(token) : ''
}
async function publish(pool: Pool, userIds: string[], event: InteractionEvent) {
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
async function insertNotification(
  db: Database,
  userId: string,
  kind: string,
  title: string,
  resourceId: string | null,
) {
  const result = await db.query<Notification>(
    `INSERT INTO notifications(user_id,kind,title,resource_id) VALUES($1,$2,$3,$4) RETURNING id,kind,title,resource_id AS "resourceId",created_at AS "createdAt",read_at AS "readAt"`,
    [userId, kind, title, resourceId],
  )
  return result.rows[0]
}
/** Use after the business transaction commits; persists notifications before publishing. */
export async function notifyUsers(
  pool: Pool,
  userIds: string[],
  kind: string,
  title: string,
  resourceId: string | null = null,
) {
  for (const userId of [...new Set(userIds)]) {
    const notification = await insertNotification(
      pool,
      userId,
      kind,
      title,
      resourceId,
    )
    await publish(pool, [userId], { type: 'notification', notification })
  }
}
async function getMessage(db: Database, id: string) {
  const row = (await db.query<Message>(`${messageSelect} WHERE m.id=$1`, [id]))
    .rows[0]
  return { ...row, text: decryptPrivate(row.text) }
}
async function getConsultation(db: Database, id: string, user: AppUser) {
  const row = (
    await db.query<Consultation>(
      `${consultationSelect} WHERE x.id=$1 AND (c.athlete_id=$2 OR c.coach_id=$2)`,
      [id, user.id],
    )
  ).rows[0]
  if (!row) fail(404, 'NOT_FOUND', 'Consultoria não encontrada.')
  return { ...row, description: decryptPrivate(row.description) }
}
async function calendarLock(client: PoolClient, ids: string[]) {
  // Lock both participant calendars in sorted order, including across distinct contracts.
  for (const id of [...ids].sort())
    await client.query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1, 12871))',
      [id],
    )
}
async function assertNoConflict(
  client: PoolClient,
  members: string[],
  startsAt: string,
  duration: number,
  excluding: string | null = null,
) {
  const overlap = await client.query(
    `SELECT 1 FROM consultations x JOIN contracts c ON c.id=x.contract_id WHERE x.status='scheduled' AND ($4::uuid IS NULL OR x.id<>$4) AND (c.athlete_id=ANY($1::uuid[]) OR c.coach_id=ANY($1::uuid[])) AND x.starts_at < $2::timestamptz + make_interval(mins=>$3::int) AND x.starts_at + make_interval(mins=>x.duration_minutes) > $2::timestamptz LIMIT 1`,
    [members, startsAt, duration, excluding],
  )
  if (overlap.rowCount)
    fail(
      409,
      'SCHEDULE_CONFLICT',
      'Um participante já possui consultoria nesse horário.',
    )
}
const meetingUrl = z
  .string()
  .url()
  .max(1000)
  .refine((value) => new URL(value).protocol === 'https:', 'Use uma URL HTTPS.')
  .optional()
const consultationInput = z
  .object({
    contractId: idSchema,
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(3000).default(''),
    startsAt: z.string().datetime({ offset: true }),
    durationMinutes: z.number().int().min(15).max(180),
    meetingUrl,
  })
  .strict()
const consultationEdit = z
  .object({
    startsAt: z.string().datetime({ offset: true }).optional(),
    durationMinutes: z.number().int().min(15).max(180).optional(),
    status: z.enum(['scheduled', 'cancelled', 'completed']).optional(),
    reason: z.string().trim().min(5).max(1000),
    meetingUrl,
  })
  .strict()
  .refine(
    (v) =>
      v.startsAt !== undefined ||
      v.durationMinutes !== undefined ||
      v.status !== undefined ||
      v.meetingUrl !== undefined,
    'Informe uma alteração.',
  )
const reviewBody = z
  .object({
    rating: z.number().int().min(1).max(5),
    text: z.string().trim().min(5).max(2000),
  })
  .strict()
const textBody = z.object({ text: z.string().trim().min(5).max(2000) }).strict()
const reasonBody = z
  .object({ reason: z.string().trim().min(5).max(1000) })
  .strict()

export async function interactionsRoutes(app: FastifyInstance, pool: Pool) {
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

  app.get<{ Params: { id: string } }>(
    '/contracts/:id/messages',
    {
      schema: {
        tags: ['Comunicação'],
        summary: 'Histórico autorizado, paginado por cursor',
        params,
      },
    },
    async (req) => {
      const user = requireUser(req),
        id = idSchema.parse(req.params.id)
      const query = z
        .object({
          before: idSchema.optional(),
          limit: z.coerce.number().int().min(1).max(100).default(50),
        })
        .strict()
        .parse(req.query)
      await contractMember(pool, id, user)
      let cursor: { created_at: string; id: string } | undefined
      if (query.before) {
        cursor = (
          await pool.query(
            'SELECT created_at::text,id FROM messages WHERE id=$1 AND contract_id=$2',
            [query.before, id],
          )
        ).rows[0]
        if (!cursor)
          fail(400, 'INVALID_CURSOR', 'Cursor não pertence a esta conversa.')
      }
      const rows = (
        await pool.query<Message>(
          `${messageSelect} WHERE m.contract_id=$1 AND ($2::timestamptz IS NULL OR (m.created_at,m.id)<($2::timestamptz,$3::uuid)) ORDER BY m.created_at DESC,m.id DESC LIMIT $4`,
          [id, cursor?.created_at ?? null, cursor?.id ?? null, query.limit + 1],
        )
      ).rows
      const more = rows.length > query.limit
      const page = rows.slice(0, query.limit)
      const nextCursor = more ? (page[page.length - 1]?.id ?? null) : null
      return {
        messages: page
          .reverse()
          .map((m) => ({ ...m, text: decryptPrivate(m.text) })),
        nextCursor,
      }
    },
  )
  const messageBody = z
    .object({
      text: z.string().trim().max(4000).default(''),
      mediaId: idSchema.optional(),
    })
    .strict()
    .refine(
      (v) => v.text.length > 0 || !!v.mediaId,
      'Escreva uma mensagem ou anexe um arquivo.',
    )
  app.post<{ Params: { id: string } }>(
    '/contracts/:id/messages',
    {
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
      schema: {
        tags: ['Comunicação'],
        summary: 'Enviar mensagem cifrada para vínculo ativo',
        params,
        body: bodySchema(messageBody),
      },
    },
    async (req, reply) => {
      const user = requireUser(req),
        id = idSchema.parse(req.params.id),
        input = messageBody.parse(req.body)
      const saved = await transaction(pool, async (client) => {
        const contract = await contractMember(client, id, user, true, true)
        if (input.mediaId) {
          const attachment = await client.query(
            "SELECT 1 FROM media WHERE id=$1 AND owner_id=$2 AND purpose='message' AND resource_id=$3 AND deleted_at IS NULL",
            [input.mediaId, user.id, id],
          )
          if (!attachment.rowCount)
            fail(
              400,
              'INVALID_ATTACHMENT',
              'Anexo não pertence à mensagem e ao vínculo.',
            )
        }
        const result = await client.query(
          'INSERT INTO messages(contract_id,sender_id,body_ciphertext,media_id) VALUES($1,$2,$3,$4) RETURNING id',
          [id, user.id, encryptPrivate(input.text), input.mediaId ?? null],
        )
        const recipient =
          user.id === contract.athlete_id
            ? contract.coach_id
            : contract.athlete_id
        const notification = await insertNotification(
          client,
          recipient,
          'message',
          'Você recebeu uma nova mensagem.',
          id,
        )
        return {
          message: await getMessage(client, result.rows[0].id),
          recipients: participants(contract),
          recipient,
          notification,
        }
      })
      await publish(pool, saved.recipients, {
        type: 'message',
        message: saved.message,
      })
      await publish(pool, [saved.recipient], {
        type: 'notification',
        notification: saved.notification,
      })
      return reply.code(201).send({ message: saved.message })
    },
  )
  const readBody = z.object({ throughId: idSchema.optional() }).strict()
  app.put<{ Params: { id: string } }>(
    '/contracts/:id/messages/read',
    {
      schema: {
        tags: ['Comunicação'],
        summary: 'Confirmar leitura de mensagens recebidas',
        params,
        body: bodySchema(readBody),
      },
    },
    async (req) => {
      const user = requireUser(req),
        id = idSchema.parse(req.params.id),
        input = readBody.parse(req.body)
      const contract = await contractMember(pool, id, user)
      await transaction(pool, async (client) => {
        const cursor = input.throughId
          ? (
              await client.query(
                'SELECT created_at::text,id FROM messages WHERE id=$1 AND contract_id=$2',
                [input.throughId, id],
              )
            ).rows[0]
          : null
        if (input.throughId && !cursor)
          fail(400, 'INVALID_CURSOR', 'Mensagem não encontrada nesta conversa.')
        // Missing cursor means the snapshot visible when this transaction began; future messages remain unread.
        await client.query(
          'UPDATE messages SET read_at=now() WHERE contract_id=$1 AND sender_id<>$2 AND read_at IS NULL AND created_at<=now() AND ($3::timestamptz IS NULL OR (created_at,id)<=($3::timestamptz,$4::uuid))',
          [id, user.id, cursor?.created_at ?? null, cursor?.id ?? null],
        )
        await client.query(
          "UPDATE notifications SET read_at=now() WHERE user_id=$1 AND resource_id=$2 AND kind='message' AND read_at IS NULL AND NOT EXISTS(SELECT 1 FROM messages WHERE contract_id=$2 AND sender_id<>$1 AND read_at IS NULL)",
          [user.id, id],
        )
      })
      await publish(pool, participants(contract), {
        type: 'read',
        contractId: id,
        readerId: user.id,
        throughId: input.throughId ?? null,
      })
      return { ok: true }
    },
  )
  app.get(
    '/notifications',
    {
      schema: {
        tags: ['Notificações'],
        summary: 'Notificações internas persistidas',
      },
    },
    async (req) => {
      const user = requireUser(req)
      const notifications = (
        await pool.query<Notification>(
          `${notificationSelect} WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT 200`,
          [user.id],
        )
      ).rows
      const unread = (
        await pool.query(
          'SELECT count(*)::int AS count FROM notifications WHERE user_id=$1 AND read_at IS NULL',
          [user.id],
        )
      ).rows[0].count
      return { notifications, unread }
    },
  )
  const notificationBody = z
    .object({
      ids: z.array(idSchema).min(1).max(200).optional(),
      all: z.boolean().optional(),
    })
    .strict()
    .refine((v) => v.all === true || !!v.ids?.length, 'Selecione notificações.')
  app.put(
    '/notifications',
    {
      schema: {
        tags: ['Notificações'],
        summary: 'Marcar minhas notificações como lidas',
        body: bodySchema(notificationBody),
      },
    },
    async (req) => {
      const user = requireUser(req),
        input = notificationBody.parse(req.body)
      await pool.query(
        'UPDATE notifications SET read_at=COALESCE(read_at,now()) WHERE user_id=$1 AND ($2::boolean OR id=ANY($3::uuid[]))',
        [user.id, input.all === true, input.ids ?? []],
      )
      return { ok: true }
    },
  )

  app.get(
    '/reviews',
    {
      schema: {
        tags: ['Avaliações'],
        summary: 'Avaliações publicadas e média sem conteúdo oculto',
      },
    },
    async (req) => {
      requireUser(req)
      const { coachId } = z
        .object({ coachId: idSchema.optional() })
        .strict()
        .parse(req.query)
      const reviews = (
        await pool.query<Review>(
          `${reviewSelect} WHERE r.hidden=false AND ($1::uuid IS NULL OR r.coach_id=$1) ORDER BY r.created_at DESC LIMIT 100`,
          [coachId ?? null],
        )
      ).rows
      const aggregate = (
        await pool.query(
          'SELECT count(*)::int AS count,COALESCE(avg(rating),0)::float8 AS average FROM reviews WHERE hidden=false AND ($1::uuid IS NULL OR coach_id=$1)',
          [coachId ?? null],
        )
      ).rows[0]
      return { reviews, average: aggregate.average, count: aggregate.count }
    },
  )
  const createReview = reviewBody.extend({ contractId: idSchema })
  app.post(
    '/reviews',
    {
      schema: {
        tags: ['Avaliações'],
        summary: 'Avaliar vínculo ativo após período mínimo',
        body: bodySchema(createReview),
      },
    },
    async (req, reply) => {
      const user = requireUser(req, 'athlete'),
        input = createReview.parse(req.body)
      const id = await transaction(pool, async (client) => {
        const contract = await contractMember(
          client,
          input.contractId,
          user,
          true,
          true,
        )
        const days = Number(process.env.REVIEW_MIN_DAYS ?? 7)
        if (!Number.isFinite(days) || days < 0)
          fail(503, 'CONFIGURATION', 'Configuração de avaliações indisponível.')
        if (
          !contract.decided_at ||
          contract.decided_at.getTime() > Date.now() - days * 86400_000
        )
          fail(
            403,
            'REVIEW_TOO_EARLY',
            `A avaliação exige pelo menos ${days} dias de acompanhamento.`,
          )
        const result = await client.query(
          'INSERT INTO reviews(contract_id,athlete_id,coach_id,rating,body) VALUES($1,$2,$3,$4,$5) ON CONFLICT(contract_id) DO NOTHING RETURNING id',
          [
            input.contractId,
            user.id,
            contract.coach_id,
            input.rating,
            input.text,
          ],
        )
        if (!result.rowCount)
          fail(
            409,
            'DUPLICATE_REVIEW',
            'Você já avaliou este vínculo. Edite a avaliação existente.',
          )
        return result.rows[0].id as string
      })
      const review = (
        await pool.query<Review>(`${reviewSelect} WHERE r.id=$1`, [id])
      ).rows[0]
      await notifyUsers(
        pool,
        [review.coachId],
        'review',
        'Você recebeu uma avaliação.',
        review.id,
      )
      return reply.code(201).send({ review })
    },
  )
  app.put<{ Params: { id: string } }>(
    '/reviews/:id',
    {
      schema: {
        tags: ['Avaliações'],
        summary: 'Editar minha avaliação publicada',
        params,
        body: bodySchema(reviewBody),
      },
    },
    async (req) => {
      const user = requireUser(req, 'athlete'),
        id = idSchema.parse(req.params.id),
        input = reviewBody.parse(req.body)
      const result = await pool.query(
        'UPDATE reviews SET rating=$1,body=$2,updated_at=now() WHERE id=$3 AND athlete_id=$4 AND hidden=false RETURNING id',
        [input.rating, input.text, id, user.id],
      )
      if (!result.rowCount)
        fail(404, 'NOT_FOUND', 'Avaliação não encontrada para edição.')
      return {
        review: (
          await pool.query<Review>(
            `${reviewSelect} WHERE r.id=$1 AND r.hidden=false`,
            [id],
          )
        ).rows[0],
      }
    },
  )
  app.post<{ Params: { id: string } }>(
    '/reviews/:id/reply',
    {
      schema: {
        tags: ['Avaliações'],
        summary: 'Responder avaliação recebida',
        params,
        body: bodySchema(textBody),
      },
    },
    async (req) => {
      const user = requireUser(req, 'coach'),
        id = idSchema.parse(req.params.id),
        { text } = textBody.parse(req.body)
      const result = await pool.query(
        'UPDATE reviews SET reply=$1,replied_at=now(),updated_at=now() WHERE id=$2 AND coach_id=$3 AND hidden=false RETURNING athlete_id',
        [text, id, user.id],
      )
      if (!result.rowCount)
        fail(404, 'NOT_FOUND', 'Avaliação não encontrada para resposta.')
      await notifyUsers(
        pool,
        [result.rows[0].athlete_id],
        'review_reply',
        'Seu treinador respondeu à avaliação.',
        id,
      )
      return {
        review: (
          await pool.query<Review>(
            `${reviewSelect} WHERE r.id=$1 AND r.hidden=false`,
            [id],
          )
        ).rows[0],
      }
    },
  )
  app.post<{ Params: { id: string } }>(
    '/reviews/:id/report',
    {
      schema: {
        tags: ['Avaliações'],
        summary: 'Denunciar avaliação publicada',
        params,
        body: bodySchema(reasonBody),
      },
    },
    async (req) => {
      const user = requireUser(req),
        id = idSchema.parse(req.params.id),
        { reason } = reasonBody.parse(req.body)
      const visible = await pool.query(
        'SELECT 1 FROM reviews WHERE id=$1 AND hidden=false',
        [id],
      )
      if (!visible.rowCount) fail(404, 'NOT_FOUND', 'Avaliação não encontrada.')
      await pool.query(
        'INSERT INTO review_reports(review_id,reporter_id,reason) VALUES($1,$2,$3) ON CONFLICT(review_id,reporter_id) DO UPDATE SET reason=EXCLUDED.reason,created_at=now()',
        [id, user.id, reason],
      )
      return { ok: true }
    },
  )
  app.get(
    '/admin/reviews',
    {
      schema: {
        tags: ['Administração'],
        summary: 'Avaliações e denúncias para moderação',
      },
    },
    async (req) => {
      requireUser(req, 'admin')
      const reviews = (
        await pool.query<Review>(
          `${reviewSelect} ORDER BY r.created_at DESC LIMIT 200`,
        )
      ).rows
      const reports = (
        await pool.query(
          'SELECT id,review_id AS "reviewId",reporter_id AS "reporterId",reason,created_at AS "createdAt" FROM review_reports ORDER BY created_at DESC LIMIT 200',
        )
      ).rows
      return { reviews, reports }
    },
  )
  const moderation = reasonBody.extend({ hidden: z.boolean() })
  app.patch<{ Params: { id: string } }>(
    '/admin/reviews/:id',
    {
      schema: {
        tags: ['Administração'],
        summary: 'Ocultar/restaurar avaliação com auditoria',
        params,
        body: bodySchema(moderation),
      },
    },
    async (req) => {
      const user = requireUser(req, 'admin'),
        id = idSchema.parse(req.params.id),
        input = moderation.parse(req.body)
      await transaction(pool, async (client) => {
        const result = await client.query(
          'UPDATE reviews SET hidden=$1,updated_at=now() WHERE id=$2 RETURNING id',
          [input.hidden, id],
        )
        if (!result.rowCount)
          fail(404, 'NOT_FOUND', 'Avaliação não encontrada.')
        await client.query(
          'INSERT INTO review_moderation(review_id,reviewer_id,hidden,reason) VALUES($1,$2,$3,$4)',
          [id, user.id, input.hidden, input.reason],
        )
      })
      return {
        review: (
          await pool.query<Review>(`${reviewSelect} WHERE r.id=$1`, [id])
        ).rows[0],
      }
    },
  )

  app.get(
    '/consultations',
    {
      schema: {
        tags: ['Agenda'],
        summary: 'Minha agenda e histórico de consultorias',
      },
    },
    async (req) => {
      const user = requireUser(req)
      const rows = (
        await pool.query<Consultation>(
          `${consultationSelect} WHERE c.athlete_id=$1 OR c.coach_id=$1 ORDER BY x.starts_at DESC LIMIT 200`,
          [user.id],
        )
      ).rows
      return {
        consultations: rows.map((row) => ({
          ...row,
          description: decryptPrivate(row.description),
        })),
      }
    },
  )
  app.post(
    '/consultations',
    {
      schema: {
        tags: ['Agenda'],
        summary: 'Agendar consultoria sem conflito de participantes',
        body: bodySchema(consultationInput),
      },
    },
    async (req, reply) => {
      const user = requireUser(req),
        input = consultationInput.parse(req.body)
      if (new Date(input.startsAt).getTime() <= Date.now())
        fail(400, 'PAST_APPOINTMENT', 'Escolha um horário futuro.')
      const saved = await transaction(pool, async (client) => {
        const contract = await contractMember(
          client,
          input.contractId,
          user,
          true,
          true,
        )
        const ids = participants(contract)
        await calendarLock(client, ids)
        await assertNoConflict(
          client,
          ids,
          input.startsAt,
          input.durationMinutes,
        )
        const result = await client.query(
          'INSERT INTO consultations(contract_id,title,description_ciphertext,starts_at,duration_minutes,meeting_url) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',
          [
            input.contractId,
            input.title,
            encryptPrivate(input.description),
            input.startsAt,
            input.durationMinutes,
            input.meetingUrl ?? null,
          ],
        )
        await client.query(
          "INSERT INTO consultation_history(consultation_id,actor_id,action,new_starts_at,reason) VALUES($1,$2,'created',$3,'Agendamento solicitado pelo participante.')",
          [result.rows[0].id, user.id, input.startsAt],
        )
        const recipient = ids.find((i) => i !== user.id)!
        return {
          consultation: await getConsultation(client, result.rows[0].id, user),
          ids,
          recipient,
          notification: await insertNotification(
            client,
            recipient,
            'consultation',
            'Uma consultoria foi agendada.',
            result.rows[0].id,
          ),
        }
      })
      await publish(pool, saved.ids, {
        type: 'consultation',
        consultation: saved.consultation,
      })
      await publish(pool, [saved.recipient], {
        type: 'notification',
        notification: saved.notification,
      })
      return reply.code(201).send({ consultation: saved.consultation })
    },
  )
  app.patch<{ Params: { id: string } }>(
    '/consultations/:id',
    {
      schema: {
        tags: ['Agenda'],
        summary: 'Reagendar/cancelar/completar consultoria com histórico',
        params,
        body: bodySchema(consultationEdit),
      },
    },
    async (req) => {
      const user = requireUser(req),
        id = idSchema.parse(req.params.id),
        input = consultationEdit.parse(req.body)
      const saved = await transaction(pool, async (client) => {
        // Acquire calendars before row lock, preserving lock order between create and edit.
        const current = await getConsultation(client, id, user)
        const contract = await contractMember(
          client,
          current.contractId,
          user,
          input.status !== 'cancelled',
          true,
        )
        const ids = participants(contract)
        await calendarLock(client, ids)
        const locked = (
          await client.query(
            'SELECT status,starts_at,duration_minutes,meeting_url FROM consultations WHERE id=$1 FOR UPDATE',
            [id],
          )
        ).rows[0]
        if (locked.status !== 'scheduled')
          fail(
            409,
            'APPOINTMENT_STATE',
            'Consultoria já encerrada. Crie outro agendamento.',
          )
        const nextStatus = input.status ?? locked.status,
          startsAt = input.startsAt ?? locked.starts_at.toISOString(),
          duration = input.durationMinutes ?? locked.duration_minutes
        if (nextStatus === 'scheduled') {
          if (new Date(startsAt).getTime() <= Date.now())
            fail(400, 'PAST_APPOINTMENT', 'Escolha um horário futuro.')
          await assertNoConflict(client, ids, startsAt, duration, id)
        }
        if (
          nextStatus === 'completed' &&
          locked.starts_at.getTime() > Date.now()
        )
          fail(400, 'EARLY_COMPLETION', 'A consultoria ainda não começou.')
        await client.query(
          'UPDATE consultations SET starts_at=$1,duration_minutes=$2,status=$3,meeting_url=$4,updated_at=now() WHERE id=$5',
          [
            startsAt,
            duration,
            nextStatus,
            input.meetingUrl ?? locked.meeting_url,
            id,
          ],
        )
        await client.query(
          'INSERT INTO consultation_history(consultation_id,actor_id,action,previous_starts_at,new_starts_at,reason) VALUES($1,$2,$3,$4,$5,$6)',
          [
            id,
            user.id,
            nextStatus === 'scheduled' ? 'rescheduled' : nextStatus,
            locked.starts_at,
            startsAt,
            input.reason,
          ],
        )
        const recipient = ids.find((i) => i !== user.id)!
        return {
          consultation: await getConsultation(client, id, user),
          ids,
          recipient,
          notification: await insertNotification(
            client,
            recipient,
            'consultation',
            'Uma consultoria foi atualizada.',
            id,
          ),
        }
      })
      await publish(pool, saved.ids, {
        type: 'consultation',
        consultation: saved.consultation,
      })
      await publish(pool, [saved.recipient], {
        type: 'notification',
        notification: saved.notification,
      })
      return { consultation: saved.consultation }
    },
  )
  app.get<{ Params: { id: string } }>(
    '/consultations/:id/history',
    {
      schema: {
        tags: ['Agenda'],
        summary: 'Histórico autorizado das alterações de agenda',
        params,
      },
    },
    async (req) => {
      const user = requireUser(req),
        id = idSchema.parse(req.params.id)
      await getConsultation(pool, id, user)
      return {
        history: (
          await pool.query(
            'SELECT id,actor_id AS "actorId",action,previous_starts_at AS "previousStartsAt",new_starts_at AS "newStartsAt",reason,created_at AS "createdAt" FROM consultation_history WHERE consultation_id=$1 ORDER BY created_at,id',
            [id],
          )
        ).rows,
      }
    },
  )
  const externalEvent = z
    .object({
      eventId: z
        .string()
        .min(5)
        .max(200)
        .regex(/^[a-zA-Z0-9_-]+$/),
      meetingUrl: z
        .string()
        .url()
        .max(1000)
        .refine(
          (value) =>
            new URL(value).protocol === 'https:' &&
            new URL(value).hostname === 'meet.google.com',
          'Informe uma reunião HTTPS do Google Meet.',
        ),
    })
    .strict()
  app.post<{ Params: { id: string } }>(
    '/consultations/:id/google-event',
    {
      schema: {
        tags: ['Agenda'],
        summary: 'Vincular evento criado pelo usuário após OAuth no Google',
        params,
        body: bodySchema(externalEvent),
      },
    },
    async (req) => {
      const user = requireUser(req),
        id = idSchema.parse(req.params.id),
        input = externalEvent.parse(req.body)
      const saved = await transaction(pool, async (client) => {
        const current = await getConsultation(client, id, user)
        const contract = await contractMember(
          client,
          current.contractId,
          user,
          true,
          true,
        )
        const result = await client.query(
          "UPDATE consultations SET external_event_id=$1,meeting_url=$2,updated_at=now() WHERE id=$3 AND status='scheduled' AND external_event_id IS NULL RETURNING id",
          [input.eventId, input.meetingUrl, id],
        )
        if (!result.rowCount)
          fail(
            409,
            'EXTERNAL_EVENT_EXISTS',
            'Consultoria já possui evento externo ou foi encerrada.',
          )
        await client.query(
          "INSERT INTO consultation_history(consultation_id,actor_id,action,reason) VALUES($1,$2,'external-linked','Referência de evento informada pelo usuário após sua ação no Google. Não representa validação independente do provedor.')",
          [id, user.id],
        )
        return {
          consultation: await getConsultation(client, id, user),
          ids: participants(contract),
        }
      })
      await publish(pool, saved.ids, {
        type: 'consultation',
        consultation: saved.consultation,
      })
      return { consultation: saved.consultation }
    },
  )
}
