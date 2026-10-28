import { afterEach, describe, expect, it, vi } from 'vitest'
import Fastify from 'fastify'

const dependencies = vi.hoisted(() => ({
  runScheduledJobs: vi.fn().mockResolvedValue({ skipped: false }),
  scheduledRoutes: vi.fn(),
  pool: { end: vi.fn().mockResolvedValue(undefined) },
}))
vi.mock('../../server/db/pool.js', () => ({ createPool: () => dependencies.pool }))
vi.mock('../../server/scheduled.js', () => ({
  runScheduledJobs: dependencies.runScheduledJobs,
  scheduledRoutes: dependencies.scheduledRoutes,
}))

import { startServer } from '../../server/runtime.js'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('agendamento do runtime', () => {
  it('intervalo local utiliza o executor com trava e fecha seu pool', async () => {
    vi.stubEnv('VERCEL', '0')
    vi.stubEnv('JOBS_INTERVAL_MS', '10000')
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const app = Fastify()
    try {
      await startServer(app, { listen: false })
      await vi.advanceTimersByTimeAsync(10000)
      expect(dependencies.runScheduledJobs).toHaveBeenCalledExactlyOnceWith(dependencies.pool)
    } finally {
      await app.close()
    }
    expect(dependencies.pool.end).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(10000)
    expect(dependencies.runScheduledJobs).toHaveBeenCalledOnce()
  })

  it('modo Vercel registra o cron sem iniciar intervalo local', async () => {
    vi.stubEnv('VERCEL', '1')
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const app = Fastify()
    try {
      await startServer(app, { listen: false })
      expect(dependencies.scheduledRoutes).toHaveBeenCalledOnce()
      await vi.advanceTimersByTimeAsync(60000)
      expect(dependencies.runScheduledJobs).not.toHaveBeenCalled()
    } finally {
      await app.close()
    }
  })
})
