import Fastify from 'fastify'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { buildApp } from './server/app.js'
import { production } from './server/config.js'
import { startServer } from './server/runtime.js'

export const config = { maxDuration: 300 }

let application: ReturnType<typeof buildApp> | undefined

function getApplication() {
  application ??= buildApp({ factory: Fastify, logger: true, serveFrontend: production })
    .then(async (app) => {
      await startServer(app, { listen: process.env.VERCEL !== '1' })
      return app
    })
  return application
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const app = await getApplication()
  app.server.emit('request', request, response)
}

if (process.env.VERCEL !== '1') {
  void getApplication().catch((error) => {
    console.error('Falha ao iniciar a aplicacao.', error)
    process.exitCode = 1
  })
}
