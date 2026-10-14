import { fileURLToPath } from 'node:url'
import staticPlugin from '@fastify/static'
import { buildApp } from './app.js'
import { apiPort, production } from './config.js'
import { runJobs } from './jobs.js'
import { createPool } from './db/pool.js'

const app = await buildApp({ logger: true, serveFrontend: production })
const jobsPool = createPool()
let jobsRunning = false
const jobsTimer = setInterval(
  async () => {
    if (jobsRunning) return
    jobsRunning = true
    try {
      await runJobs(jobsPool)
    } catch {
      app.log.error(
        { code: 'JOBS_FAILED' },
        'Falha na tarefa periódica; dados pendentes preservados.',
      )
    } finally {
      jobsRunning = false
    }
  },
  Number(process.env.JOBS_INTERVAL_MS || 10000),
)
jobsTimer.unref()
app.addHook('onClose', async () => {
  clearInterval(jobsTimer)
  await jobsPool.end()
})
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
