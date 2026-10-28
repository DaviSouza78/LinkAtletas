import type { Database } from './access.js'
import type { Notification } from '../../../shared/interaction-contracts.js'
import type { Pool } from 'pg'
import { publish } from './events.js'
import type { FastifyInstance } from 'fastify'
import { requireUser } from '../../shared/security.js'
import { z } from 'zod'
import { idSchema, bodySchema } from '../../shared/validation.js'

const notificationSelect = `SELECT id,kind,title,resource_id AS "resourceId",created_at AS "createdAt",read_at AS "readAt" FROM notifications`

export async function insertNotification(
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

export function registerNotificationRoutes(app: FastifyInstance, pool: Pool) {
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
}
