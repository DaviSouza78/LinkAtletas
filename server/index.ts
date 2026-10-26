import { buildApp } from './app.js'
import { production } from './config.js'
import { startServer } from './runtime.js'

await startServer(await buildApp({ logger: true, serveFrontend: production }))
