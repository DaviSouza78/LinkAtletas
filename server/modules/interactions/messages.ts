import { params } from './access.js'
import { type Database, contractMember, participants } from './access.js'
import type { Message } from '../../../shared/interaction-contracts.js'
import { decryptPrivate, encryptPrivate } from '../../shared/crypto.js'
import type { FastifyInstance } from 'fastify'
import type { Pool } from 'pg'
import { requireUser } from '../../shared/security.js'
import { idSchema, bodySchema } from '../../shared/validation.js'
import { z } from 'zod'
import { fail } from '../../shared/errors.js'
import { transaction } from '../../db/pool.js'
import { insertNotification } from './notifications.js'
import { publish } from './events.js'

const messageSelect = `SELECT m.id,m.contract_id AS "contractId",m.sender_id AS "senderId",u.name AS "senderName",m.body_ciphertext AS text,m.media_id AS "mediaId",m.created_at AS "createdAt",m.read_at AS "readAt" FROM messages m JOIN users u ON u.id=m.sender_id`

async function getMessage(db: Database, id: string) {
  const row = (await db.query<Message>(`${messageSelect} WHERE m.id=$1`, [id]))
    .rows[0]
  return { ...row, text: decryptPrivate(row.text) }
}

export function registerMessageRoutes(app: FastifyInstance, pool: Pool) {

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
}
