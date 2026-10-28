import { randomUUID } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import Fastify, { type FastifyInstance, type InjectOptions } from 'fastify'
import type { Pool } from 'pg'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { createPool } from '../../server/db/pool.js'
import { migrate } from '../../server/db/migrate.js'
import { hashPassword } from '../../server/shared/security.js'
import { installErrors } from '../../server/shared/errors.js'
import { billingRoutes } from '../../server/modules/billing/routes.js'
import { assertContractAccess } from '../../server/modules/billing/access.js'
import { processBillingEvents } from '../../server/modules/billing/events.js'
import { expireBillingAccess, reconcileBilling, cancelContractBilling } from '../../server/modules/billing/lifecycle.js'
import { contractsRoutes } from '../../server/modules/training/contracts.js'
import { AsaasClient, AsaasError } from '../../server/services/asaas.js'
import type { AppUser } from '../../shared/contracts.js'

const testUrl =
  process.env.TEST_DATABASE_URL ??
  'postgresql://linkatletas:linkatletas_dev@127.0.0.1:54329/linkatletas_test'
if (!decodeURIComponent(new URL(testUrl).pathname.slice(1)).endsWith('_test'))
  throw new Error('Billing tests require isolated _test database.')
const prefix = `billing-${randomUUID()}`
const webhookToken = 'controlled-webhook-secret-32-characters-only'
let pool: Pool, app: FastifyInstance, stub: Server, provider: AsaasClient
let athlete: AppUser, coach: AppUser, stranger: AppUser, admin: AppUser
let contractId: string,
  subscriptionId: string,
  paidUntil: string,
  cancelledCycle: string
const ownedIds: string[] = []
let refusedStatus = 0
let createCount = 0,
  cancelCount = 0,
  failCreate = false,
  failCancel = false
const requests: {
  method: string
  path: string
  payload: any
  token?: string
}[] = []
const originalMode = process.env.BILLING_MODE
async function actor(name: string, role: AppUser['role']) {
  const user = (
    await pool.query<AppUser>(
      'INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role',
      [
        name,
        `${prefix}-${role}-${randomUUID()}@example.invalid`,
        await hashPassword('SenhaTeste123!'),
        role,
      ],
    )
  ).rows[0]
  ownedIds.push(user.id)
  await pool.query(
    `INSERT INTO profiles(user_id,sports,goals,levels,availability,mode,price,budget,verification_status) VALUES($1,ARRAY['Corrida'],ARRAY['Performance'],ARRAY['Iniciante'],ARRAY['Segunda manhã'],'online',150,250,$2)`,
    [user.id, role === 'coach' ? 'approved' : 'unsubmitted'],
  )
  return user
}
async function api(
  user: AppUser | null,
  method: InjectOptions['method'],
  url: string,
  payload?: unknown,
) {
  return app.inject({
    method,
    url: `/api${url}`,
    headers: user ? { 'x-test-user': user.id } : {},
    ...(payload === undefined ? {} : { payload: payload as object }),
  })
}
async function event(
  eventName: string,
  fields: Record<string, unknown>,
  id = `${prefix}-${randomUUID()}`,
  dateCreated = '2026-10-14 10:00:00',
) {
  const result = await app.inject({
    method: 'POST',
    url: '/api/billing/webhook',
    headers: { 'asaas-access-token': webhookToken },
    payload: { id, event: eventName, dateCreated, ...fields },
  })
  expect(result.statusCode).toBe(200)
  await processBillingEvents(pool)
  return id
}
beforeAll(async () => {
  pool = createPool(testUrl)
  await migrate(pool)
  athlete = await actor('Atleta financeiro', 'athlete')
  coach = await actor('Treinador financeiro', 'coach')
  stranger = await actor('Terceiro financeiro', 'athlete')
  admin = await actor('Administrador financeiro', 'admin')
  contractId = (
    await pool.query(
      `INSERT INTO contracts(athlete_id,coach_id,status,decided_at) VALUES($1,$2,'active',now()) RETURNING id`,
      [athlete.id, coach.id],
    )
  ).rows[0].id
  stub = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    const payload = body ? JSON.parse(body) : null
    requests.push({
      method: req.method!,
      path: req.url!,
      payload,
      token: req.headers.access_token as string,
    })
    res.setHeader('Content-Type', 'application/json')
    if (req.method === 'POST' && req.url === '/v3/checkouts') {
      createCount++
      if (refusedStatus) {
        res.writeHead(refusedStatus)
        res.end('{"errors":[]}')
        return
      }
      if (failCreate) {
        res.writeHead(503)
        res.end('{"errors":[]}')
        return
      }
      res.end(JSON.stringify({ id: `checkout-${payload.externalReference}` }))
      return
    }
    if (req.method === 'DELETE') {
      cancelCount++
      if (failCancel) {
        res.writeHead(503)
        res.end('{}')
        return
      }
      res.end('{"deleted":true}')
      return
    }
    if (req.method === 'GET') {
      res.end(
        JSON.stringify({
          id: decodeURIComponent(req.url!.split('/').at(-1)!),
          status: failCancel ? 'ACTIVE' : 'INACTIVE',
          deleted: !failCancel,
        }),
      )
      return
    }
    res.end('{}')
  })
  await new Promise<void>((resolve) => stub.listen(0, '127.0.0.1', resolve))
  const address = stub.address()
  if (!address || typeof address === 'string')
    throw new Error('No local stub port')
  provider = new AsaasClient({
    apiKey: 'controlled-test-key-not-real',
    environment: 'sandbox',
    baseUrl: `http://127.0.0.1:${address.port}/v3`,
    timeoutMs: 1000,
  })
  app = Fastify({
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false } },
  })
  installErrors(app)
  app.decorateRequest('user', null)
  app.addHook('onRequest', async (req) => {
    const id = req.headers['x-test-user']
    req.user =
      typeof id === 'string'
        ? ((
            await pool.query<AppUser>(
              'SELECT id,name,email,role FROM users WHERE id=$1',
              [id],
            )
          ).rows[0] ?? null)
        : null
  })
  await app.register(
    async (child) => {
      await billingRoutes(child, pool, {
        client: provider,
        webhookToken,
        mode: 'asaas',
        environment: 'sandbox',
        callbackOrigin: 'https://local-test.invalid',
      })
      await contractsRoutes(child, pool)
    },
    { prefix: '/api' },
  )
})
afterAll(async () => {
  if (originalMode === undefined) delete process.env.BILLING_MODE
  else process.env.BILLING_MODE = originalMode
  await app?.close()
  if (stub)
    await new Promise<void>((resolve, reject) =>
      stub.close((error) => (error ? reject(error) : resolve())),
    )
  if (pool) {
    await pool.query('DELETE FROM billing_events WHERE id LIKE $1', [
      `${prefix}%`,
    ])
    await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])', [ownedIds])
    await pool.end()
  }
})

describe('Billing: controlled HTTP provider contract (not Asaas sandbox)', () => {
  it.each(['suspended', 'expired', 'disabled'] as const)('refuses checkout for unavailable coach: %s', async (state) => {
    const testAthlete = await actor('Atleta bloqueio checkout', 'athlete')
    const testCoach = await actor('Treinador bloqueio checkout', 'coach')
    const id = (await pool.query(
      "INSERT INTO contracts(athlete_id,coach_id,status,decided_at) VALUES($1,$2,'active',now()) RETURNING id",
      [testAthlete.id, testCoach.id],
    )).rows[0].id
    await pool.query(
      "INSERT INTO billing_plans(coach_id,name,amount_cents,active) VALUES($1,'Plano ficticio',15000,true)", [testCoach.id],
    )
    await pool.query('INSERT INTO billing_wallets(coach_id,wallet_id) VALUES($1,$2)', [testCoach.id, randomUUID()])
    if (state === 'suspended')
      await pool.query("UPDATE profiles SET verification_status='suspended' WHERE user_id=$1", [testCoach.id])
    else if (state === 'expired')
      await pool.query("UPDATE profiles SET verification_expires_at=now()-interval '1 second' WHERE user_id=$1", [testCoach.id])
    else
      await pool.query('UPDATE users SET disabled_at=now() WHERE id=$1', [testCoach.id])
    const count = createCount
    const response = await api(testAthlete, 'POST', '/billing/checkout', { contractId: id })
    expect(response.statusCode, response.body).toBe(409)
    expect(response.json().code).toBe('UNAVAILABLE_COACH')
    expect(createCount).toBe(count)
    expect((await pool.query('SELECT 1 FROM billing_subscriptions WHERE contract_id=$1', [id])).rowCount).toBe(0)
  })
  it('keeps academic access explicit and denies a foreign actor', async () => {
    process.env.BILLING_MODE = 'academic'
    await expect(
      assertContractAccess(pool, contractId, athlete.id),
    ).resolves.toBeUndefined()
    await expect(
      assertContractAccess(pool, contractId, stranger.id),
    ).rejects.toMatchObject({ statusCode: 404 })
    const academicApp = Fastify()
    installErrors(academicApp)
    academicApp.decorateRequest('user', null)
    academicApp.addHook('onRequest', async (req) => {
      req.user = athlete
    })
    await billingRoutes(academicApp, pool, { mode: 'academic' })
    const disabled = await academicApp.inject({
      method: 'POST',
      url: '/billing/checkout',
      payload: { contractId },
    })
    expect(disabled.statusCode).toBe(503)
    expect(disabled.json().code).toBe('BILLING_DISABLED')
    expect(
      (
        await academicApp.inject({
          method: 'POST',
          url: '/billing/webhook',
          headers: { 'asaas-access-token': webhookToken },
          payload: {
            id: 'ignored',
            event: 'CHECKOUT_PAID',
            dateCreated: '2026-10-14 10:00:00',
          },
        })
      ).statusCode,
    ).toBe(503)
    await academicApp.close()
    process.env.BILLING_MODE = 'asaas'
    await expect(
      assertContractAccess(pool, contractId, athlete.id),
    ).rejects.toMatchObject({ statusCode: 403 })
  })
  it('validates ownership, whole cents, receiver wallet and audited admin settings', async () => {
    expect(
      (await api(athlete, 'PUT', '/billing/wallet', { walletId: randomUUID() }))
        .statusCode,
    ).toBe(403)
    expect(
      (
        await api(coach, 'PUT', '/billing/wallet', {
          walletId: 'bank account in plain text',
        })
      ).statusCode,
    ).toBe(400)
    expect(
      (await api(coach, 'PUT', '/billing/wallet', { walletId: randomUUID() }))
        .statusCode,
    ).toBe(200)
    expect(
      (
        await api(coach, 'PUT', '/billing/plan', {
          name: 'Mensal',
          amountCents: 100.25,
          active: true,
        })
      ).statusCode,
    ).toBe(400)
    expect(
      (
        await api(coach, 'PUT', '/billing/plan', {
          name: 'Plano de acompanhamento',
          amountCents: 15000,
          active: true,
        })
      ).statusCode,
    ).toBe(200)
    expect(
      (
        await api(coach, 'PATCH', '/admin/billing/settings', {
          commissionBps: 2000,
          graceDays: 3,
        })
      ).statusCode,
    ).toBe(403)
    expect(
      (
        await api(admin, 'PATCH', '/admin/billing/settings', {
          commissionBps: 1000,
          graceDays: 3,
        })
      ).statusCode,
    ).toBe(200)
    expect(
      (await api(athlete, 'GET', `/billing/plans?coachId=${coach.id}`)).json()
        .plans,
    ).toHaveLength(1)
  })
  it('creates exactly one hosted recurring checkout under simultaneous requests and keeps unpaid access blocked', async () => {
    expect(
      (await api(stranger, 'POST', '/billing/checkout', { contractId }))
        .statusCode,
    ).toBe(404)
    const results = await Promise.all([
      api(athlete, 'POST', '/billing/checkout', { contractId }),
      api(athlete, 'POST', '/billing/checkout', { contractId }),
    ])
    expect(results.every((r) => r.statusCode === 200)).toBe(true)
    subscriptionId = results[0].json().subscription.id
    expect(createCount).toBe(1)
    const request = requests.find((r) => r.method === 'POST')!
    expect(request.token).toBe('controlled-test-key-not-real')
    expect(request.payload).toMatchObject({
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      externalReference: subscriptionId,
      subscription: { cycle: 'MONTHLY' },
      splits: [{ percentualValue: 90 }],
    })
    expect(request.payload.items[0].value).toBe(150)
    expect(JSON.stringify(request.payload)).not.toMatch(
      /password|creditCardNumber|cpfCnpj/,
    )
    expect(
      (await api(athlete, 'GET', '/billing/summary')).json().subscriptions[0]
        .state,
    ).toBe('awaiting_payment')
    await expect(
      assertContractAccess(pool, contractId, athlete.id),
    ).rejects.toMatchObject({ statusCode: 403 })
  })
  it('does not let admin or another coach cancel a private subscription', async () => {
    const anotherCoach = await actor('Treinador sem vinculo financeiro', 'coach')
    const previous = (await pool.query('SELECT state FROM billing_subscriptions WHERE id=$1', [subscriptionId])).rows[0].state
    for (const user of [admin, stranger, anotherCoach]) {
      const response = await api(user, 'POST', `/billing/subscriptions/${subscriptionId}/cancel`, { reason: 'Tentativa de terceiro' })
      expect(response.statusCode, response.body).toBe(404)
    }
    expect((await api(anotherCoach, 'GET', '/billing/summary')).body).not.toContain(subscriptionId)
    expect((await pool.query('SELECT state FROM billing_subscriptions WHERE id=$1', [subscriptionId])).rows[0].state).toBe(previous)
  })
  it('authenticates webhook before persistence; minimizes card data and consumes duplicate event only once', async () => {
    const payload = {
      id: `${prefix}-paid`,
      event: 'PAYMENT_RECEIVED',
      dateCreated: '2026-10-14 10:00:00',
      payment: {
        id: `${prefix}-payment`,
        subscription: `${prefix}-provider-sub`,
        externalReference: subscriptionId,
        value: 150,
        netValue: 145,
        dueDate: '2099-10-14',
        paymentDate: '2026-10-14',
        creditCard: { creditCardToken: 'never-persist-this' },
      },
    }
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/billing/webhook',
          payload,
        })
      ).statusCode,
    ).toBe(401)
    expect(
      (
        await pool.query('SELECT id FROM billing_events WHERE id=$1', [
          payload.id,
        ])
      ).rowCount,
    ).toBe(0)
    const delivered = () =>
      app.inject({
        method: 'POST',
        url: '/api/billing/webhook',
        headers: { 'asaas-access-token': webhookToken },
        payload,
      })
    await Promise.all([delivered(), delivered()])
    await Promise.all([processBillingEvents(pool), processBillingEvents(pool)])
    const stored = (
      await pool.query('SELECT * FROM billing_events WHERE id=$1', [payload.id])
    ).rows[0]
    expect(stored.processed_at).toBeTruthy()
    expect(stored.attempts).toBe(1)
    expect(JSON.stringify(stored.payload)).not.toContain('never-persist-this')
    const summary = (await api(athlete, 'GET', '/billing/summary')).json()
    expect(summary.payments).toHaveLength(1)
    expect(summary.totals).toEqual({
      receivedCents: 15000,
      coachShareCents: 13050,
      platformShareCents: 1450,
    })
    paidUntil = summary.subscriptions[0].paidUntil
    await expect(
      assertContractAccess(pool, contractId, athlete.id),
    ).resolves.toBeUndefined()
    expect(
      (await api(stranger, 'GET', '/billing/summary')).json().subscriptions,
    ).toHaveLength(0)
  })
  it('ignores old and regressive unpaid events without reducing the paid period', async () => {
    const fields = {
      payment: {
        id: `${prefix}-payment`,
        subscription: `${prefix}-provider-sub`,
        value: 150,
        netValue: 145,
        dueDate: '2099-10-14',
      },
    }
    await event('PAYMENT_OVERDUE', fields, undefined, '2026-10-13 10:00:00')
    await event('PAYMENT_OVERDUE', fields, undefined, '2026-10-15 10:00:00')
    const summary = (await api(athlete, 'GET', '/billing/summary')).json()
    expect(summary.payments[0].status).toBe('RECEIVED')
    expect(summary.subscriptions[0].paidUntil).toBe(paidUntil)
  })
  it('does not mix events from a production endpoint with sandbox subscriptions', async () => {
    const productionEndpoint = Fastify()
    installErrors(productionEndpoint)
    await billingRoutes(productionEndpoint, pool, {
      mode: 'asaas',
      environment: 'production',
      client: provider,
      webhookToken,
    })
    const id = `${prefix}-wrong-environment`
    const result = await productionEndpoint.inject({
      method: 'POST',
      url: '/billing/webhook',
      headers: { 'asaas-access-token': webhookToken },
      payload: {
        id,
        event: 'PAYMENT_RECEIVED',
        dateCreated: '2026-10-14 10:00:00',
        payment: {
          id: `${prefix}-wrong-payment`,
          externalReference: subscriptionId,
          value: 150,
          netValue: 145,
          dueDate: '2099-10-14',
        },
      },
    })
    expect(result.statusCode).toBe(200)
    await processBillingEvents(pool)
    expect(
      (
        await pool.query(
          'SELECT id FROM billing_payments WHERE provider_payment_id=$1',
          [`${prefix}-wrong-payment`],
        )
      ).rowCount,
    ).toBe(0)
    expect(
      (
        await pool.query(
          'SELECT processing_note FROM billing_events WHERE id=$1',
          [id],
        )
      ).rows[0].processing_note,
    ).toContain('Ambiente divergente')
    await productionEndpoint.close()
  })
  it('preserves paid access during confirmed cancellation, idempotence and immutable history', async () => {
    expect(
      (
        await api(
          stranger,
          'POST',
          `/billing/subscriptions/${subscriptionId}/cancel`,
          { reason: 'Encerrar acompanhamento' },
        )
      ).statusCode,
    ).toBe(404)
    await cancelContractBilling(
      pool,
      contractId,
      athlete.id,
      'Encerrar acompanhamento mensal',
      { client: provider },
    )
    await cancelContractBilling(
      pool,
      contractId,
      coach.id,
      'Encerrar novamente',
      { client: provider },
    )
    expect(cancelCount).toBe(1)
    const subscription = (await api(athlete, 'GET', '/billing/summary')).json()
      .subscriptions[0]
    expect(subscription.cancellationConfirmed).toBe(true)
    expect(subscription.state).toBe('cancellation_requested')
    await expect(
      assertContractAccess(pool, contractId, athlete.id),
    ).resolves.toBeUndefined()
    await pool.query(
      `UPDATE billing_subscriptions SET paid_until=now()-interval '1 day' WHERE id=$1`,
      [subscriptionId],
    )
    await expireBillingAccess(pool)
    expect(
      (
        await pool.query('SELECT status FROM contracts WHERE id=$1', [
          contractId,
        ])
      ).rows[0].status,
    ).toBe('cancelled')
    const newCycle = await api(athlete, 'POST', '/contracts', {
      coachId: coach.id,
    })
    expect(newCycle.statusCode).toBe(201)
    cancelledCycle = newCycle.json().contract.id
    expect(cancelledCycle).not.toBe(contractId)
    expect(
      (await api(athlete, 'POST', '/contracts', { coachId: coach.id }))
        .statusCode,
    ).toBe(409)
    expect(
      (await api(athlete, 'GET', '/contracts')).json().contracts,
    ).toHaveLength(2)
  })
  it('withdraws a pending cycle idempotently, refusing outsiders and new writes', async () => {
    expect(
      (
        await api(stranger, 'POST', `/contracts/${cancelledCycle}/cancel`, {
          reason: 'Pedido indevido',
        })
      ).statusCode,
    ).toBe(404)
    expect(
      (
        await api(athlete, 'POST', `/contracts/${cancelledCycle}/cancel`, {
          reason: 'Retirar solicitação pendente',
        })
      ).statusCode,
    ).toBe(200)
    expect(
      (
        await api(athlete, 'POST', `/contracts/${cancelledCycle}/cancel`, {
          reason: 'Retirar de novo',
        })
      ).statusCode,
    ).toBe(200)
    await expect(
      assertContractAccess(pool, cancelledCycle, athlete.id),
    ).rejects.toMatchObject({ statusCode: 403 })
  })
  it('records uncertain checkout responses without blindly issuing another provider operation', async () => {
    failCreate = true
    const cycle = (
      await api(athlete, 'POST', '/contracts', { coachId: coach.id })
    ).json().contract
    await pool.query(`UPDATE contracts SET status='active' WHERE id=$1`, [
      cycle.id,
    ])
    expect(
      (
        await api(athlete, 'POST', '/billing/checkout', {
          contractId: cycle.id,
        })
      ).statusCode,
    ).toBe(502)
    expect(
      (
        await api(athlete, 'POST', '/billing/checkout', {
          contractId: cycle.id,
        })
      ).statusCode,
    ).toBe(200)
    expect(createCount).toBe(2)
    expect(
      (
        await pool.query(
          'SELECT state FROM billing_subscriptions WHERE contract_id=$1',
          [cycle.id],
        )
      ).rows[0].state,
    ).toBe('uncertain')
    failCreate = false
    const intent = (
      await pool.query(
        'SELECT id FROM billing_subscriptions WHERE contract_id=$1',
        [cycle.id],
      )
    ).rows[0].id
    await event('CHECKOUT_CREATED', {
      checkout: { id: `recovered-${intent}`, externalReference: intent },
    })
    const recovered = (
      await api(athlete, 'POST', '/billing/checkout', { contractId: cycle.id })
    ).json().subscription
    expect(recovered.state).toBe('awaiting_payment')
    expect(recovered.checkoutUrl).toContain(`recovered-${intent}`)
    expect(createCount).toBe(2)
  })
  it('preserves a definitely refused attempt and permits a new contract cycle after configuration is corrected', async () => {
    const newAthlete = await actor('Atleta recusa definitiva', 'athlete')
    const cycle = (
      await pool.query(
        `INSERT INTO contracts(athlete_id,coach_id,status) VALUES($1,$2,'active') RETURNING id`,
        [newAthlete.id, coach.id],
      )
    ).rows[0].id
    refusedStatus = 400
    const result = await api(newAthlete, 'POST', '/billing/checkout', {
      contractId: cycle,
    })
    expect(result.statusCode).toBe(502)
    expect(result.json().code).toBe('CHECKOUT_REFUSED')
    expect(
      (await pool.query('SELECT status FROM contracts WHERE id=$1', [cycle]))
        .rows[0].status,
    ).toBe('cancelled')
    expect(
      (
        await pool.query(
          'SELECT j.state FROM billing_jobs j JOIN billing_subscriptions s ON s.id=j.subscription_id WHERE s.contract_id=$1',
          [cycle],
        )
      ).rows[0].state,
    ).toBe('failed')
    refusedStatus = 0
    expect(
      (await api(newAthlete, 'POST', '/contracts', { coachId: coach.id }))
        .statusCode,
    ).toBe(201)
  })
  it('enforces grace expiry, professional suspension and denies further prescriptions', async () => {
    const cycle = (
      await pool.query(
        `INSERT INTO contracts(athlete_id,coach_id,status) VALUES($1,$2,'active') RETURNING id`,
        [stranger.id, coach.id],
      )
    ).rows[0].id
    const sub = (
      await pool.query(
        `INSERT INTO billing_subscriptions(contract_id,plan_name,amount_cents,commission_bps,environment,state,paid_until,grace_until,provider_subscription_id) VALUES($1,'Teste',15000,1000,'sandbox','grace',now()-interval '1 day',now()+interval '1 day',$2) RETURNING id`,
        [cycle, `${prefix}-grace-sub`],
      )
    ).rows[0].id
    await expect(
      assertContractAccess(pool, cycle, stranger.id),
    ).resolves.toBeUndefined()
    await pool.query(
      `UPDATE profiles SET verification_status='suspended' WHERE user_id=$1`,
      [coach.id],
    )
    await expect(
      assertContractAccess(pool, cycle, stranger.id),
    ).rejects.toMatchObject({ statusCode: 403, code: 'UNAVAILABLE_COACH' })
    await pool.query(
      `UPDATE profiles SET verification_status='approved' WHERE user_id=$1`,
      [coach.id],
    )
    await pool.query(
      `UPDATE billing_subscriptions SET grace_until=now()-interval '1 second' WHERE id=$1`,
      [sub],
    )
    await expireBillingAccess(pool)
    expect(
      (await pool.query('SELECT status FROM contracts WHERE id=$1', [cycle]))
        .rows[0].status,
    ).toBe('suspended')
    await expect(
      assertContractAccess(pool, cycle, stranger.id),
    ).rejects.toMatchObject({ statusCode: 403 })
  })
  it('keeps failed cancellation pending, reconciles by safe GET and does not issue a second DELETE', async () => {
    const cycle = (
      await pool.query(
        'SELECT id FROM contracts WHERE athlete_id=$1 AND coach_id=$2',
        [stranger.id, coach.id],
      )
    ).rows[0].id
    await pool.query(`UPDATE contracts SET status='active' WHERE id=$1`, [
      cycle,
    ])
    await pool.query(
      `UPDATE billing_subscriptions SET state='regular',paid_until=now()+interval '10 days' WHERE contract_id=$1`,
      [cycle],
    )
    failCancel = true
    await expect(
      cancelContractBilling(
        pool,
        cycle,
        stranger.id,
        'Solicitar cancelamento com falha',
        { client: provider },
      ),
    ).rejects.toMatchObject({ statusCode: 502, code: 'CANCELLATION_PENDING' })
    const initialCount = cancelCount
    await cancelContractBilling(
      pool,
      cycle,
      stranger.id,
      'Solicitar cancelamento de novo',
      { client: provider },
    )
    expect(cancelCount).toBe(initialCount)
    const pending = (
      await pool.query(
        'SELECT * FROM billing_subscriptions WHERE contract_id=$1',
        [cycle],
      )
    ).rows[0]
    expect(pending.cancellation_confirmed).toBe(false)
    expect(pending.state).toBe('cancellation_requested')
    failCancel = false
    await reconcileBilling(pool, provider)
    expect(cancelCount).toBe(initialCount)
    expect(
      (
        await pool.query(
          'SELECT cancellation_confirmed FROM billing_subscriptions WHERE id=$1',
          [pending.id],
        )
      ).rows[0].cancellation_confirmed,
    ).toBe(true)
  })
  it('retains unmatched authenticated events for reconciliation instead of crediting an unrelated account', async () => {
    const id = await event('PAYMENT_RECEIVED', {
      payment: {
        id: `${prefix}-unrelated-payment`,
        subscription: 'unknown-subscription',
        value: 150,
        netValue: 145,
        dueDate: '2026-10-14',
      },
    })
    const row = (
      await pool.query('SELECT * FROM billing_events WHERE id=$1', [id])
    ).rows[0]
    expect(row.processed_at).toBeNull()
    expect(row.attempts).toBe(1)
    expect(
      (
        await pool.query(
          'SELECT id FROM billing_payments WHERE provider_payment_id=$1',
          [`${prefix}-unrelated-payment`],
        )
      ).rowCount,
    ).toBe(0)
    expect((await api(athlete, 'GET', '/admin/billing/jobs')).statusCode).toBe(
      403,
    )
    expect(
      (await api(admin, 'GET', '/admin/billing/jobs'))
        .json()
        .pendingEvents.some((item: { id: string }) => item.id === id),
    ).toBe(true)
  })
  it('treats provider timeout as an uncertain result with no retry in the adapter', async () => {
    const slow = createServer((_req, res) =>
      setTimeout(() => res.end('{"id":"late"}'), 80),
    )
    await new Promise<void>((resolve) => slow.listen(0, '127.0.0.1', resolve))
    const address = slow.address()
    if (!address || typeof address === 'string')
      throw new Error('No timeout stub')
    const client = new AsaasClient({
      apiKey: 'controlled',
      environment: 'sandbox',
      baseUrl: `http://127.0.0.1:${address.port}/v3`,
      timeoutMs: 10,
    })
    await expect(
      client.createCheckout({
        reference: randomUUID(),
        name: 'Mensal',
        amountCents: 100,
        walletId: randomUUID(),
        commissionBps: 1000,
        callbackOrigin: 'https://local.invalid',
        nextDueDate: '2026-10-14',
      }),
    ).rejects.toMatchObject({ uncertain: true })
    slow.closeAllConnections()
    await new Promise<void>((resolve) => slow.close(() => resolve()))
  })
})
