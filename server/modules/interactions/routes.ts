import type { FastifyInstance } from 'fastify'
import type { Pool } from 'pg'
import { registerEventRoutes } from './events.js'
import { registerMessageRoutes } from './messages.js'
import { registerNotificationRoutes } from './notifications.js'
import { registerReviewRoutes } from './reviews.js'
import { registerConsultationRoutes } from './consultations.js'

export async function interactionsRoutes(app: FastifyInstance, pool: Pool) {
  registerEventRoutes(app, pool)
  registerMessageRoutes(app, pool)
  registerNotificationRoutes(app, pool)
  registerReviewRoutes(app, pool)
  registerConsultationRoutes(app, pool)
}
