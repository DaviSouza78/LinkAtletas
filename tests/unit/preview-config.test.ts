import { afterEach, describe, expect, it, vi } from 'vitest'

describe('modo financeiro de preview', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('recusa ativacao de cobrancas externas em preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('BILLING_MODE', 'asaas')
    vi.resetModules()
    await expect(import('../../server/config.js')).rejects.toThrow('Preview exige BILLING_MODE academic.')
  })

  it('aceita demonstracao academica em preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('BILLING_MODE', 'academic')
    vi.stubEnv('NODE_ENV', 'test')
    vi.resetModules()
    await expect(import('../../server/config.js')).resolves.toHaveProperty('production', false)
  })

  it('usa a origem do branch de preview em vez do dominio de producao', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_BRANCH_URL', 'preview.example.test')
    vi.stubEnv('APP_ORIGIN', 'https://production.example.test')
    vi.stubEnv('BILLING_MODE', 'academic')
    vi.stubEnv('NODE_ENV', 'test')
    vi.resetModules()
    await expect(import('../../server/config.js')).resolves.toHaveProperty('appOrigin', 'https://preview.example.test')
  })
})
