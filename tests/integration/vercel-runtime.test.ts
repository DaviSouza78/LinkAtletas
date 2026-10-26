import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { promisify } from 'node:util'
import { once } from 'node:events'
import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let child: ChildProcess
let base: string

beforeAll(async () => {
  child = spawn(process.execPath, ['--no-experimental-require-module', '--import', 'tsx', 'server.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      VERCEL: '1',
      API_HOST: '127.0.0.1',
      API_PORT: '0',
      APP_ORIGIN: 'https://link-atletas.vercel.app',
      DATABASE_URL: 'postgresql://runtime:runtime@127.0.0.1:1/runtime_test',
      DATA_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
      S3_ENDPOINT: 'https://storage.example.invalid',
      S3_ACCESS_KEY: 'runtime',
      S3_SECRET_KEY: 'runtime',
      S3_BUCKET: 'runtime',
      SMTP_HOST: 'smtp.example.invalid',
      SMTP_PORT: '587',
      SMTP_FROM: 'runtime@example.invalid',
      BILLING_MODE: 'academic',
      CRON_SECRET: randomBytes(32).toString('hex'),
    },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  base = await new Promise<string>((resolve, reject) => {
    let output = ''
    const timer = setTimeout(() => reject(new Error('Servidor nao iniciou')), 15000)
    child.stdout?.on('data', (chunk) => {
      output += String(chunk)
      const address = output.match(/Server listening at (http:\/\/127\.0\.0\.1:\d+)/)?.[1]
      if (address) {
        clearTimeout(timer)
        resolve(address)
      }
    })
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('exit', () => {
      clearTimeout(timer)
      reject(new Error('Servidor encerrou antes de iniciar'))
    })
  })
})

afterAll(async () => {
  if (child && child.exitCode === null && child.signalCode === null) {
    const exit = once(child, 'exit')
    child.kill()
    await exit
  }
})

describe('entrada de producao da vercel', () => {
  it('libera a importacao antes da confirmacao do listen pelo runtime', async () => {
    const script = `
      import http from 'node:http';
      import { setTimeout } from 'node:timers/promises';
      process.env.NODE_ENV = 'development';
      process.env.VERCEL = '1';
      let captured = false;
      let resolved = false;
      http.Server.prototype.listen = function () { captured = true; return this; };
      void import('./server.ts').then(() => { resolved = true; });
      await setTimeout(1500);
      console.log(JSON.stringify({ moduleResolved: resolved, listenerCaptured: captured }));
      process.exit(resolved && captured ? 0 : 1);
    `
    const { stdout } = await promisify(execFile)(process.execPath, [
      '--no-experimental-require-module', '--import', 'tsx', '--input-type=module', '-e', script,
    ], { cwd: process.cwd(), windowsHide: true, timeout: 10000 })
    expect(JSON.parse(stdout.trim())).toEqual({ moduleResolved: true, listenerCaptured: true })
  })

  it('serve a interface e uma rota interna do navegador', async () => {
    for (const path of ['/', '/mensagens']) {
      const response = await fetch(`${base}${path}`)
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/html')
      expect(await response.text()).toContain('id="root"')
    }
  })

  it('preserva a API no mesmo servidor sem devolver o HTML', async () => {
    const response = await fetch(`${base}/api/auth/session`)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ user: null })
    const missing = await fetch(`${base}/api/inexistente`)
    expect(missing.status).toBe(404)
    expect((await missing.json()).code).toBe('NOT_FOUND')
  })

  it('protege o agendador no servidor de producao', async () => {
    const response = await fetch(`${base}/api/internal/jobs`)
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ code: 'UNAUTHORIZED', message: 'Acesso nao autorizado.' })
  })
})
