import { fileURLToPath } from 'node:url'
import type { FastifyInstance } from 'fastify'
import staticPlugin from '@fastify/static'
import { apiPort, production } from './config.js'
import { runJobs } from './jobs.js'
import { createPool } from './db/pool.js'
import { runScheduledJobs, scheduledRoutes } from './scheduled.js'

export async function startServer(app: FastifyInstance) {
  const jobsPool = createPool()
  scheduledRoutes(app, () => runScheduledJobs(jobsPool))
  let jobsRunning = false
  const jobsTimer = process.env.VERCEL === '1' ? undefined : setInterval(
    async () => {
      if (jobsRunning) return
      jobsRunning = true
      try {
        await runJobs(jobsPool)
      } catch {
        app.log.error(
          { code: 'JOBS_FAILED' },
          'Falha na tarefa periodica; dados pendentes preservados.',
        )
      } finally {
        jobsRunning = false
      }
    },
    Number(process.env.JOBS_INTERVAL_MS || 10000),
  )
  jobsTimer?.unref()
  app.addHook('onClose', async () => {
    if (jobsTimer) clearInterval(jobsTimer)
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
}
