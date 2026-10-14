import { spawn, type ChildProcess } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createPool } from '../server/db/pool.js'
import { seed } from '../server/db/seed.js'
import type { AppUser, Dashboard } from '../shared/contracts.js'

const url =
  process.env.TEST_DATABASE_URL ||
  'postgresql://linkatletas:linkatletas_dev@127.0.0.1:54329/linkatletas_test'
assert(
  new URL(url).pathname.endsWith('_test'),
  'Smoke exige banco com sufixo _test.',
)
const pool = createPool(url)
const base = 'http://127.0.0.1:3003'
const origin = 'https://linkatletas.example'
let child: ChildProcess | undefined
let output = ''
async function start() {
  output = ''
  child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL: url,
      APP_ORIGIN: origin,
      API_PORT: '3003',
    },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout?.on('data', (chunk) => {
    output += String(chunk)
  })
  child.stderr?.on('data', (chunk) => {
    output += String(chunk)
  })
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null)
      throw new Error(`Servidor encerrou durante inicialização: ${output}`)
    try {
      if ((await fetch(base + '/api/health')).ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Servidor não iniciou: ${output}`)
}
async function stop() {
  if (!child || child.exitCode !== null) return
  const exiting = new Promise<void>((resolve) =>
    child!.once('exit', () => resolve()),
  )
  child.kill('SIGTERM')
  await exiting
}
async function getJson<T>(path: string, cookie = ''): Promise<T> {
  const response = await fetch(base + path, {
    headers: cookie ? { cookie } : {},
  })
  assert.equal(response.status, 200, `Falha GET ${path}`)
  return response.json() as Promise<T>
}
try {
  await seed(pool)
  await start()
  const staticResponse = await fetch(base + '/atleta/treino')
  assert.equal(staticResponse.status, 200)
  assert((await staticResponse.text()).includes('id="root"'))
  const swagger = await fetch(base + '/api/docs/')
  assert.equal(swagger.status, 200)
  const login = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'emailatleta@email.com',
      password: 'senhaatleta',
    }),
  })
  assert.equal(login.status, 200)
  const setCookie = login.headers.getSetCookie()[0]
  assert(setCookie.includes('HttpOnly') && setCookie.includes('Secure'))
  const cookie = setCookie.split(';')[0]
  const before = await getJson<Dashboard>('/api/dashboard', cookie)
  assert(before.contracts.length > 0 && before.workouts.length > 0)
  const sessionBefore = await getJson<{user:AppUser|null}>('/api/auth/session', cookie)
  await stop()
  await start()
  const after = await getJson<Dashboard>('/api/dashboard', cookie)
  const sessionAfter = await getJson<{user:AppUser|null}>('/api/auth/session', cookie)
  assert(sessionBefore.user && sessionAfter.user)
  assert.equal(sessionAfter.user.id, sessionBefore.user.id)
  assert.deepEqual(after, before)
  const unknown = await fetch(base + '/api/inexistente')
  assert.equal(unknown.status, 404)
  const db = (
    await pool.query(
      `SELECT (SELECT count(*)::int FROM users) AS users,(SELECT count(*)::int FROM contracts) AS contracts,(SELECT count(*)::int FROM workouts) AS workouts,(SELECT count(*)::int FROM executions) AS executions`,
    )
  ).rows[0]
  const result = {
    generatedAt: new Date().toISOString(),
    success: true,
    database: 'linkatletas_test',
    mode: 'production',
    transport:
      'HTTP em loopback, sem implantação TLS; HTTPS configurado apenas como origem para verificar flags de cookie.',
    staticFrontend: 200,
    swagger: 200,
    unknownApi: 404,
    secureHttpOnlyCookie: true,
    sessionSurvivedProcessRestart: true,
    dashboardIdenticalAfterRestart: true,
    contractIds: after.contracts.map((c: { id: string }) => c.id),
    workoutIds: after.workouts.map((w: { id: string }) => w.id),
    databaseCounts: db,
  }
  await mkdir('docs/sprint-2/evidencias', { recursive: true })
  await writeFile(
    'docs/sprint-2/evidencias/persistencia-servidor.json',
    JSON.stringify(result, null, 2) + '\n',
  )
  console.log(JSON.stringify(result, null, 2))
} finally {
  await stop()
  await pool.end()
}
