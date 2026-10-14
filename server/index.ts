import { fileURLToPath } from 'node:url'
import staticPlugin from '@fastify/static'
import { buildApp } from './app.js'
import { apiPort, production } from './config.js'

const app = await buildApp({ logger: true, serveFrontend: production })
if (production) {
  await app.register(staticPlugin, {
    root: fileURLToPath(new URL('../dist/', import.meta.url)),
    prefix: '/',
  })
}
const shutdown = async () => {
  await app.close()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
try {
  await app.listen({ port: apiPort, host: process.env.API_HOST || '127.0.0.1' })
} catch (error) {
  app.log.error(error)
  await app.close()
  process.exitCode = 1
}
