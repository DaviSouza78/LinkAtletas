import Fastify from 'fastify'
import { buildApp } from './server/app.js'
import { production } from './server/config.js'
import { startServer } from './server/runtime.js'

export const config = { maxDuration: 300 }

void buildApp({ factory: Fastify, logger: true, serveFrontend: production })
  .then((app) => startServer(app))
  .catch((error) => {
    console.error('Falha ao iniciar a aplicacao.', error)
    process.exitCode = 1
  })
