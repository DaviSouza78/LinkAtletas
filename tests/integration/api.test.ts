import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance, InjectOptions } from 'fastify'
import type { Pool } from 'pg'
import type {
  AppUser,
  MetricType,
  ProfileInput,
  WorkoutInput,
} from '../../shared/contracts.js'
import { buildApp } from '../../server/app.js'
import { createPool } from '../../server/db/pool.js'
import { migrate } from '../../server/db/migrate.js'

const origin = 'http://localhost:5173'
const password = 'SenhaTeste123!'
const testUrl =
  process.env.TEST_DATABASE_URL ??
  'postgresql://linkatletas:linkatletas_dev@127.0.0.1:54329/linkatletas_test'
// This suite deletes fixtures. Never use DATABASE_URL or the demonstration database.
const databaseName = decodeURIComponent(new URL(testUrl).pathname.slice(1))
if (!databaseName.endsWith('_test'))
  throw new Error(
    'TEST_DATABASE_URL deve apontar para um banco com sufixo _test.',
  )

interface Actor {
  user: AppUser
  cookie: string
}
let app: FastifyInstance
let pool: Pool
let admin: Actor,
  athlete: Actor,
  stranger: Actor,
  coach: Actor,
  otherCoach: Actor,
  pendingCoach: Actor
let verificationId: string,
  contractId: string,
  workoutId: string,
  executionId: string
let metric: MetricType

const profile = (name: string): ProfileInput => ({
  name,
  city: 'São Paulo',
  bio: 'Perfil fictício de teste automatizado.',
  sports: ['Corrida'],
  goals: ['Performance'],
  levels: ['Iniciante'],
  availability: ['Segunda manhã'],
  mode: 'online',
  budget: 250,
  price: 150,
})
const workout = (): WorkoutInput => ({
  contractId,
  title: 'Corrida progressiva de teste',
  sport: 'Corrida',
  scheduledDate: '2026-10-20',
  instructions: 'Respeite os intervalos e registre a execução.',
  status: 'draft',
  blocks: [
    {
      name: 'Aquecimento',
      instructions: 'Caminhar confortavelmente.',
      durationMinutes: 10,
    },
  ],
})
async function request(
  actor: Actor | null,
  method: InjectOptions['method'],
  url: string,
  payload?: unknown,
) {
  return app.inject({
    method,
    url: `/api${url}`,
    headers: { origin, ...(actor ? { cookie: actor.cookie } : {}) },
    ...(payload === undefined
      ? {}
      : { payload: payload as Record<string, unknown> }),
  })
}
function assertError(
  response: { statusCode: number; json: () => any },
  status?: number,
) {
  if (status) expect(response.statusCode).toBe(status)
  else expect(response.statusCode).toBeGreaterThanOrEqual(400)
  expect(response.statusCode).toBeLessThan(500)
  expect(response.json()).toMatchObject({
    code: expect.any(String),
    message: expect.any(String),
  })
}
async function register(
  name: string,
  role: 'athlete' | 'coach',
): Promise<Actor> {
  const response = await request(null, 'POST', '/auth/register', {
    name,
    role,
    password,
    email: `${name.toLowerCase()}@api-test.local`,
  })
  expect(response.statusCode, response.body).toBe(201)
  const cookie = response.cookies.find((item) => item.name === 'la_session')
  expect(cookie?.value).toBeTruthy()
  expect(String(response.headers['set-cookie'])).toMatch(/HttpOnly/i)
  expect(String(response.headers['set-cookie'])).toMatch(/SameSite=Lax/i)
  return { user: response.json().user, cookie: `la_session=${cookie!.value}` }
}

describe.sequential('API integrada com PostgreSQL exclusivo de testes', () => {
  beforeAll(async () => {
    pool = createPool(testUrl)
    await migrate(pool)
    await pool.query('TRUNCATE TABLE users CASCADE')
    app = await buildApp({ pool, logger: false, origin, secureCookies: false })
    await app.ready()
    admin = await register('Administrador', 'athlete')
    await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [
      admin.user.id,
    ])
    athlete = await register('Atleta', 'athlete')
    stranger = await register('OutraAtleta', 'athlete')
    coach = await register('Treinador', 'coach')
    otherCoach = await register('OutroTreinador', 'coach')
    pendingCoach = await register('Pendente', 'coach')
    for (const actor of [athlete, stranger, coach, otherCoach, pendingCoach]) {
      const response = await request(
        actor,
        'PUT',
        '/profiles/me',
        profile(actor.user.name),
      )
      expect(response.statusCode, response.body).toBe(200)
    }
  })

  afterAll(async () => {
    await app?.close()
    await pool?.end()
  })

  it('não cria administrador pelo cadastro público nem aceita senha fraca', async () => {
    assertError(
      await request(null, 'POST', '/auth/register', {
        name: 'Invasor',
        email: 'admin-invalid@api-test.local',
        password,
        role: 'admin',
      }),
      400,
    )
    assertError(
      await request(null, 'POST', '/auth/register', {
        name: 'Fraca',
        email: 'weak@api-test.local',
        password: '123',
        role: 'athlete',
      }),
      400,
    )
  })

  it('impede e-mail duplicado sem distinguir maiúsculas e senha incorreta', async () => {
    assertError(
      await request(null, 'POST', '/auth/register', {
        name: 'Duplicado',
        email: athlete.user.email.toUpperCase(),
        password,
        role: 'athlete',
      }),
      409,
    )
    assertError(
      await request(null, 'POST', '/auth/login', {
        email: athlete.user.email,
        password: 'SenhaErrada123!',
      }),
      401,
    )
  })

  it('exige sessão e rejeita cookie inválido', async () => {
    assertError(await request(null, 'GET', '/profiles/me'), 401)
    const response = await app.inject({
      method: 'GET',
      url: '/api/profiles/me',
      headers: { cookie: 'la_session=invalida' },
    })
    assertError(response, 401)
    expect(
      (await request(athlete, 'GET', '/auth/session')).json().user.id,
    ).toBe(athlete.user.id)
  })

  it('não autentica sessão que ultrapassou a validade persistida', async () => {
    const expired = await register('SessaoExpirada', 'athlete')
    await pool.query(
      "UPDATE sessions SET expires_at = now() - interval '1 minute' WHERE user_id = $1",
      [expired.user.id],
    )
    assertError(await request(expired, 'GET', '/profiles/me'), 401)
    expect(
      (await request(expired, 'GET', '/auth/session')).json().user,
    ).toBeNull()
  })

  it('autentica com senha correta e armazena somente hash com sal', async () => {
    const saved = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [athlete.user.id],
    )
    expect(saved.rows[0].password_hash).not.toContain(password)
    const login = await request(null, 'POST', '/auth/login', {
      email: athlete.user.email,
      password,
    })
    expect(login.statusCode, login.body).toBe(200)
    expect(login.json().user).toEqual(athlete.user)
    expect(login.json().user).not.toHaveProperty('password_hash')
    const cookie = login.cookies.find((item) => item.name === 'la_session')
    expect(cookie?.value).toBeTruthy()
    expect(
      (
        await request(
          { user: athlete.user, cookie: `la_session=${cookie!.value}` },
          'GET',
          '/profiles/me',
        )
      ).json().profile.userId,
    ).toBe(athlete.user.id)
  })

  it('protege mutações contra origem ausente e externa', async () => {
    for (const headers of [
      { cookie: athlete.cookie },
      { cookie: athlete.cookie, origin: 'https://outro-site.example' },
    ]) {
      assertError(
        await app.inject({
          method: 'PUT',
          url: '/api/profiles/me',
          headers,
          payload: profile('Alterado'),
        }),
        403,
      )
    }
    expect(
      (await request(athlete, 'GET', '/profiles/me')).json().profile.name,
    ).toBe(athlete.user.name)
  })

  it('valida perfil e não permite a atleta aprovar CREF', async () => {
    assertError(
      await request(athlete, 'PUT', '/profiles/me', {
        ...profile('Inválido'),
        budget: -1,
      }),
      400,
    )
    assertError(await request(athlete, 'GET', '/admin/verifications'), 403)
    assertError(
      await request(athlete, 'POST', '/verifications', {
        cref: '123456-G/SP',
        evidence: 'https://example.com/comprovante.pdf',
      }),
      403,
    )
  })

  it('oculta treinador ainda não aprovado e impede sua contratação', async () => {
    const response = await request(athlete, 'GET', '/coaches')
    expect(
      response
        .json()
        .coaches.some(
          (item: { userId: string }) => item.userId === coach.user.id,
        ),
    ).toBe(false)
    assertError(
      await request(athlete, 'POST', '/contracts', { coachId: coach.user.id }),
    )
  })

  it('submete comprovação e registra aprovação administrativa com auditoria', async () => {
    const submitted = await request(coach, 'POST', '/verifications', {
      cref: '123456-G/SP',
      evidence: 'https://example.com/comprovante-ficticio.pdf',
    })
    expect(submitted.statusCode, submitted.body).toBe(201)
    verificationId = submitted.json().verification.id
    const approved = await request(
      admin,
      'PATCH',
      `/admin/verifications/${verificationId}`,
      { status: 'approved', reason: 'Conferência manual fictícia para teste.' },
    )
    expect(approved.statusCode, approved.body).toBe(200)
    expect(approved.json().verification).toMatchObject({
      status: 'approved',
      reviewerId: admin.user.id,
      reviewedAt: expect.any(String),
    })
    const audit = await pool.query(
      'SELECT reviewer_id, decision FROM verification_audit WHERE verification_id = $1',
      [verificationId],
    )
    expect(audit.rows).toEqual([
      { reviewer_id: admin.user.id, decision: 'approved' },
    ])
    assertError(
      await request(admin, 'PATCH', `/admin/verifications/${verificationId}`, {
        status: 'approved',
        reason: 'Decisão repetida.',
      }),
      409,
    )
  })

  it('mantém profissional reprovado fora dos resultados', async () => {
    const submitted = await request(pendingCoach, 'POST', '/verifications', {
      cref: '654321-G/SP',
      evidence: 'Referência fictícia para teste de rejeição.',
    })
    expect(submitted.statusCode, submitted.body).toBe(201)
    const rejected = await request(
      admin,
      'PATCH',
      `/admin/verifications/${submitted.json().verification.id}`,
      {
        status: 'rejected',
        reason: 'Comprovação insuficiente no cenário de teste.',
      },
    )
    expect(rejected.statusCode, rejected.body).toBe(200)
    expect(
      (await request(athlete, 'GET', '/coaches'))
        .json()
        .coaches.some(
          (item: { userId: string }) => item.userId === pendingCoach.user.id,
        ),
    ).toBe(false)
  })

  it('retorna recomendação calculada e respeita filtros', async () => {
    const response = await request(
      athlete,
      'GET',
      '/coaches?sport=Corrida&maxPrice=200',
    )
    expect(response.statusCode, response.body).toBe(200)
    const found = response
      .json()
      .coaches.find((item: { userId: string }) => item.userId === coach.user.id)
    expect(found).toMatchObject({ score: 100, name: coach.user.name })
    expect(found.reasons.length).toBeGreaterThan(0)
    expect(
      (await request(athlete, 'GET', '/coaches?maxPrice=1')).json().coaches,
    ).toEqual([])
    expect(found).not.toHaveProperty('email')
  })

  it('revalida elegibilidade ao contratar diretamente sem passar pela descoberta', async () => {
    const incompatible = await request(athlete, 'PUT', '/profiles/me', {
      ...profile(athlete.user.name),
      mode: 'presencial',
      city: 'Curitiba',
    })
    expect(incompatible.statusCode, incompatible.body).toBe(200)
    assertError(
      await request(athlete, 'POST', '/contracts', { coachId: coach.user.id }),
      400,
    )
    expect(
      (await request(athlete, 'GET', '/contracts')).json().contracts,
    ).toEqual([])
    const restored = await request(
      athlete,
      'PUT',
      '/profiles/me',
      profile(athlete.user.name),
    )
    expect(restored.statusCode, restored.body).toBe(200)
  })

  it('cria solicitação pendente, bloqueia duplicata e aceite por terceiros', async () => {
    const created = await request(athlete, 'POST', '/contracts', {
      coachId: coach.user.id,
    })
    expect(created.statusCode, created.body).toBe(201)
    contractId = created.json().contract.id
    expect(created.json().contract.status).toBe('pending')
    assertError(
      await request(athlete, 'POST', '/contracts', { coachId: coach.user.id }),
      409,
    )
    assertError(
      await request(athlete, 'PATCH', `/contracts/${contractId}`, {
        status: 'active',
      }),
    )
    assertError(
      await request(otherCoach, 'PATCH', `/contracts/${contractId}`, {
        status: 'active',
      }),
    )
    assertError(await request(coach, 'POST', '/workouts', workout()))
  })

  it('aceita uma única vez mesmo com requisições simultâneas', async () => {
    const responses = await Promise.all([
      request(coach, 'PATCH', `/contracts/${contractId}`, { status: 'active' }),
      request(coach, 'PATCH', `/contracts/${contractId}`, { status: 'active' }),
    ])
    expect(responses.map((item) => item.statusCode).sort()).toEqual([200, 409])
    const contracts = (await request(coach, 'GET', '/contracts')).json()
      .contracts
    expect(
      contracts.filter(
        (item: { id: string; status: string }) =>
          item.id === contractId && item.status === 'active',
      ),
    ).toHaveLength(1)
    assertError(
      await request(coach, 'PATCH', `/contracts/${contractId}`, {
        status: 'rejected',
      }),
      409,
    )
  })

  it('valida a prescrição e protege o rascunho', async () => {
    assertError(
      await request(coach, 'POST', '/workouts', {
        ...workout(),
        blocks: [{ name: 'Inválido', instructions: '', durationMinutes: -1 }],
      }),
      400,
    )
    assertError(await request(otherCoach, 'POST', '/workouts', workout()))
    const created = await request(coach, 'POST', '/workouts', workout())
    expect(created.statusCode, created.body).toBe(201)
    workoutId = created.json().workout.id
    const listed = (await request(athlete, 'GET', '/workouts')).json().workouts
    expect(listed.some((item: { id: string }) => item.id === workoutId)).toBe(
      false,
    )
    assertError(await request(athlete, 'GET', `/workouts/${workoutId}`))
    assertError(
      await request(athlete, 'PUT', `/workouts/${workoutId}/execution`, {
        completedBlocks: [0],
        effort: 5,
        notes: '',
        metrics: {},
      }),
    )
  })

  it('publica e mostra a ficha somente ao atleta do vínculo', async () => {
    const published = await request(coach, 'PUT', `/workouts/${workoutId}`, {
      ...workout(),
      status: 'published',
    })
    expect(published.statusCode, published.body).toBe(200)
    expect(
      (await request(athlete, 'GET', `/workouts/${workoutId}`)).json().workout
        .status,
    ).toBe('published')
    assertError(await request(stranger, 'GET', `/workouts/${workoutId}`))
    assertError(await request(otherCoach, 'GET', `/workouts/${workoutId}`))
    expect(
      (await request(stranger, 'GET', '/workouts')).json().workouts,
    ).toEqual([])
  })

  it('rejeita métricas desconhecidas, fora dos limites e blocos inexistentes', async () => {
    metric = (await request(athlete, 'GET', '/metrics?sport=Corrida')).json()
      .metrics[0]
    expect(metric).toMatchObject({
      sport: 'Corrida',
      key: expect.any(String),
      min: expect.any(Number),
      max: expect.any(Number),
    })
    const valid = {
      completedBlocks: [0],
      effort: 6,
      notes: 'Teste',
      metrics: {},
    }
    for (const change of [
      { metrics: { inexistente: 2 } },
      { metrics: { [metric.key]: metric.min - 1 } },
      { metrics: { [metric.key]: metric.max + 1 } },
      { completedBlocks: [99] },
      { effort: 11 },
    ]) {
      assertError(
        await request(athlete, 'PUT', `/workouts/${workoutId}/execution`, {
          ...valid,
          ...change,
        }),
        400,
      )
    }
    assertError(
      await request(stranger, 'PUT', `/workouts/${workoutId}/execution`, valid),
    )
    assertError(
      await request(coach, 'PUT', `/workouts/${workoutId}/execution`, valid),
    )
  })

  it('grava e atualiza uma única execução visível ao treinador', async () => {
    const payload = {
      completedBlocks: [0],
      effort: 6,
      notes: 'Concluído sem dificuldade.',
      metrics: { [metric.key]: Math.max(metric.min, Math.min(5, metric.max)) },
    }
    const first = await request(
      athlete,
      'PUT',
      `/workouts/${workoutId}/execution`,
      payload,
    )
    expect(first.statusCode, first.body).toBe(200)
    executionId = first.json().workout.execution.id
    const updated = await request(
      athlete,
      'PUT',
      `/workouts/${workoutId}/execution`,
      { ...payload, effort: 7, notes: 'Atualizei o esforço.' },
    )
    expect(updated.statusCode, updated.body).toBe(200)
    expect(updated.json().workout.execution).toMatchObject({
      id: executionId,
      effort: 7,
    })
    expect(
      (await request(coach, 'GET', `/workouts/${workoutId}`)).json().workout
        .execution,
    ).toMatchObject({ id: executionId, notes: 'Atualizei o esforço.' })
  })

  it('preserva sessão, vínculo, ficha e execução ao recriar a aplicação', async () => {
    await app.close()
    app = await buildApp({ pool, logger: false, origin, secureCookies: false })
    await app.ready()
    expect(
      (await request(athlete, 'GET', '/auth/session')).json().user.id,
    ).toBe(athlete.user.id)
    const dashboard = (await request(athlete, 'GET', '/dashboard')).json()
    expect(
      dashboard.contracts.some(
        (item: { id: string; status: string }) =>
          item.id === contractId && item.status === 'active',
      ),
    ).toBe(true)
    expect(
      dashboard.workouts.find((item: { id: string }) => item.id === workoutId)
        .execution,
    ).toMatchObject({ id: executionId, effort: 7 })
  })

  it('encerra sessão e invalida o cookie anterior', async () => {
    const loggedOut = await request(stranger, 'POST', '/auth/logout', {})
    expect(loggedOut.statusCode, loggedOut.body).toBe(200)
    assertError(await request(stranger, 'GET', '/profiles/me'), 401)
  })
})
