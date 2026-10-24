import Fastify from 'fastify'
import { buildApp } from './server/app.js'
import { production } from './server/config.js'
import { startServer } from './server/runtime.js'

export const config = { maxDuration: 300 }

const app = await buildApp({ factory: Fastify, logger: true, serveFrontend: production })
await startServer(app)
