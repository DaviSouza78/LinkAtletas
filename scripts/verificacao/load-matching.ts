import { performance } from 'node:perf_hooks'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import { strict as assert } from 'node:assert'
import { createPool } from '../../server/db/pool.js'
import { migrate } from '../../server/db/migrate.js'
import { buildApp } from '../../server/app.js'
import { newToken, tokenHash } from '../../server/shared/security.js'

const url =
  process.env.LOAD_TEST_DATABASE_URL ||
  'postgresql://linkatletas:linkatletas_dev@127.0.0.1:54329/linkatletas_load_test'
assert(
  new URL(url).pathname.endsWith('_load_test'),
  'Carga exige banco exclusivo com sufixo _load_test.',
)
const pool = createPool(url),
  origin = 'http://127.0.0.1:3009'
const app = await buildApp({ pool, origin })
const totalCoaches = 500,
  requests = 200,
  concurrency = 10,
  latencies: number[] = [],
  statuses: Record<string, number> = {}
try {
  await migrate(pool)
  await pool.query('TRUNCATE users CASCADE')
  const athlete = (
    await pool.query(
      "INSERT INTO users(name,email,password_hash,role) VALUES('Carga atleta','athlete@load-test.local','fixture-not-a-valid-password-hash','athlete') RETURNING id",
    )
  ).rows[0].id
  await pool.query(
    "INSERT INTO profiles(user_id,sports,goals,levels,availability,budget) VALUES($1,ARRAY['Corrida'],ARRAY['Performance'],ARRAY['Iniciante'],ARRAY['Segunda manhã'],300)",
    [athlete],
  )
  await pool.query(
    "WITH added AS(INSERT INTO users(name,email,password_hash,role) SELECT 'Treinador carga '||n,'coach'||n||'@load-test.local','fixture-not-a-valid-password-hash','coach' FROM generate_series(1,$1) n RETURNING id) INSERT INTO profiles(user_id,sports,goals,levels,availability,price,verification_status,verification_expires_at) SELECT id,ARRAY['Corrida'],ARRAY['Performance'],ARRAY['Iniciante'],ARRAY['Segunda manhã'],150,'approved',now()+interval '1 day' FROM added",
    [totalCoaches],
  )
  const token = newToken()
  await pool.query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
    [tokenHash(token), athlete],
  )
  await app.listen({ port: 3009, host: '127.0.0.1' })
  const run = async (measure = true) => {
    const start = performance.now()
    const response = await fetch(`${origin}/api/coaches?sport=Corrida`, {
      headers: { authorization: `Bearer ${token}` },
    })
    const body = (await response.json()) as { coaches: unknown[] }
    assert.equal(response.status, 200)
    assert.equal(body.coaches.length, totalCoaches)
    if (measure) {
      latencies.push(performance.now() - start)
      statuses[response.status] = (statuses[response.status] || 0) + 1
    }
  }
  for (let i = 0; i < 5; i++) await run(false)
  let issued = 0
  const started = performance.now()
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (issued++ < requests) await run()
    }),
  )
  const elapsed = performance.now() - started
  latencies.sort((a, b) => a - b)
  const percentile = (n: number) =>
    Number(
      latencies[
        Math.min(latencies.length - 1, Math.ceil(n * latencies.length) - 1)
      ].toFixed(2),
    )
  const result = {
    executedAt: new Date().toISOString(),
    transport:
      'HTTP real em loopback; Fastify + PostgreSQL, sem cache de resultados',
    dataset: {
      coaches: totalCoaches,
      athletes: 1,
      synthetic: true,
      seedHash: 'fixture sem login público válido',
    },
    requests,
    concurrency,
    statuses,
    durationMs: Number(elapsed.toFixed(2)),
    requestsPerSecond: Number(((requests * 1000) / elapsed).toFixed(2)),
    latencyMs: {
      p50: percentile(0.5),
      p95: percentile(0.95),
      p99: percentile(0.99),
      max: percentile(1),
    },
    environment: {
      os: os.platform(),
      release: os.release(),
      node: process.version,
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      ramGiB: Math.round(os.totalmem() / 1024 ** 3),
    },
    limits:
      'Uma instância local, 500 perfis fictícios, consulta sem paginação. Não valida dados reais, nuvem, autoescala ou multi-instância WS.',
  }
  await mkdir('docs/evolucao/evidencias/infraestrutura', { recursive: true })
  await writeFile(
    'docs/evolucao/evidencias/infraestrutura/carga-matchmaking.json',
    JSON.stringify(result, null, 2) + '\n',
  )
  console.log(JSON.stringify(result, null, 2))
} finally {
  await app.close()
  await pool.end()
}
