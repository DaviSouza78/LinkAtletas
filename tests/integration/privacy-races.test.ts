import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { createPool } from '../../server/db/pool.js'
import { migrate } from '../../server/db/migrate.js'
import { buildApp } from '../../server/app.js'
import { hashPassword } from '../../server/shared/security.js'
import { randomUUID } from 'node:crypto'

const url =
  process.env.PRIVACY_TEST_DATABASE_URL ||
  'postgresql://linkatletas:linkatletas_dev@127.0.0.1:54329/linkatletas_privacy_test'
if (!new URL(url).pathname.endsWith('_privacy_test'))
  throw new Error('Banco exclusivo _privacy_test obrigatório.')
const pool = createPool(url),
  origin = 'http://localhost:5173'
let app: FastifyInstance
const request = (token: string, method: any, endpoint: string, payload?: any) =>
  app.inject({
    method,
    url: `/api${endpoint}`,
    headers: { origin, authorization: `Bearer ${token}` },
    ...(payload === undefined ? {} : { payload }),
  })
async function actor(name: string, role = 'athlete') {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/native/register',
    payload: {
      name,
      role,
      email: `${name}@privacy-test.local`,
      password: 'SenhaTeste123!',
    },
  })
  expect(response.statusCode, response.body).toBe(201)
  return response.json()
}
async function blocked(queryPart: string) {
  for (let attempt = 0; attempt < 150; attempt++) {
    const result = await pool.query(
      "SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query ILIKE $1",
      [`%${queryPart}%`],
    )
    if (result.rowCount) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error(`A requisição não chegou ao bloqueio esperado: ${queryPart}`)
}
describe.sequential(
  'Operações simultâneas não recriam dados eliminados',
  () => {
    beforeAll(async () => {
      await migrate(pool)
      await pool.query('TRUNCATE users CASCADE')
      app = await buildApp({ pool })
    })
    afterAll(async () => {
      await app?.close()
      await pool.end()
    })
    it('edição de perfil já autenticada aguarda e recusa conta encerrada', async () => {
      const user = await actor('PerfilCorrida'),
        lock = await pool.connect()
      try {
        await lock.query('BEGIN')
        await lock.query('SELECT 1 FROM users WHERE id=$1 FOR UPDATE', [
          user.user.id,
        ])
        const pending = request(user.token, 'PUT', '/profiles/me', {
          name: 'Dados que não devem voltar',
          city: 'Cidade privada',
          bio: 'Texto privado',
          sports: ['Corrida'],
          goals: ['Performance'],
          levels: ['Iniciante'],
          availability: ['Segunda manhã'],
          mode: 'online',
          budget: 200,
          price: 0,
        }).then((r) => r)
        await blocked('UPDATE users SET name')
        await lock.query(
          "UPDATE users SET disabled_at=now(),name='Conta encerrada',email=$1 WHERE id=$2",
          [`closed-${user.user.id}@deleted.local`, user.user.id],
        )
        await lock.query(
          "UPDATE profiles SET city='',bio='' WHERE user_id=$1",
          [user.user.id],
        )
        await lock.query('COMMIT')
        expect((await pending).statusCode).toBe(401)
        const row = (
          await pool.query(
            'SELECT u.name,p.city,p.bio FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=$1',
            [user.user.id],
          )
        ).rows[0]
        expect(row).toEqual({ name: 'Conta encerrada', city: '', bio: '' })
      } finally {
        await lock.query('ROLLBACK')
        lock.release()
      }
    })
    it('login com senha antiga não cria sessão após a troca concorrente', async () => {
      const user = await actor('SenhaCorrida'),
        lock = await pool.connect(),
        newHash = await hashPassword('NovaSenha123!')
      try {
        await lock.query('BEGIN')
        await lock.query('SELECT 1 FROM users WHERE id=$1 FOR UPDATE', [
          user.user.id,
        ])
        const pending = app
          .inject({
            method: 'POST',
            url: '/api/auth/native/login',
            payload: { email: user.user.email, password: 'SenhaTeste123!' },
          })
          .then((r) => r)
        await blocked('SELECT password_hash FROM users')
        await lock.query('UPDATE users SET password_hash=$1 WHERE id=$2', [
          newHash,
          user.user.id,
        ])
        await lock.query('DELETE FROM sessions WHERE user_id=$1', [
          user.user.id,
        ])
        await lock.query('COMMIT')
        expect((await pending).statusCode).toBe(401)
        expect(
          (
            await pool.query(
              'SELECT count(*)::int AS n FROM sessions WHERE user_id=$1',
              [user.user.id],
            )
          ).rows[0].n,
        ).toBe(0)
      } finally {
        await lock.query('ROLLBACK')
        lock.release()
      }
    })
    it('feedback aguardando arquivo eliminado não é recriado', async () => {
      const athlete = await actor('MidiaAtleta'),
        coach = await actor('MidiaCoach', 'coach')
      await pool.query(
        "UPDATE profiles SET verification_status='approved' WHERE user_id=$1",
        [coach.user.id],
      )
      const contract = (
        await pool.query(
          "INSERT INTO contracts(athlete_id,coach_id,status) VALUES($1,$2,'active') RETURNING id",
          [athlete.user.id, coach.user.id],
        )
      ).rows[0].id
      const workout = (
        await pool.query(
          "INSERT INTO workouts(contract_id,title,sport,scheduled_date,status) VALUES($1,'Treino corrida','Corrida',current_date,'published') RETURNING id",
          [contract],
        )
      ).rows[0].id
      const media = randomUUID()
      await pool.query(
        "INSERT INTO media(id,owner_id,purpose,resource_id,name,mime_type,size,object_key) VALUES($1,$2,'performance',$3,'fixture.png','image/png',68,$4)",
        [media, athlete.user.id, workout, `race-fixture/${media}`],
      )
      const lock = await pool.connect()
      try {
        await lock.query('BEGIN')
        await lock.query('SELECT 1 FROM media WHERE id=$1 FOR UPDATE', [media])
        const pending = request(
          coach.token,
          'POST',
          `/media/${media}/feedback`,
          { text: 'Não recriar este comentário.' },
        ).then((r) => r)
        await blocked('SELECT 1 FROM media WHERE id')
        await lock.query('UPDATE media SET deleted_at=now() WHERE id=$1', [
          media,
        ])
        await lock.query('DELETE FROM media_feedback WHERE media_id=$1', [
          media,
        ])
        await lock.query('COMMIT')
        expect((await pending).statusCode).toBe(404)
        expect(
          (
            await pool.query(
              'SELECT count(*)::int AS n FROM media_feedback WHERE media_id=$1',
              [media],
            )
          ).rows[0].n,
        ).toBe(0)
      } finally {
        await lock.query('ROLLBACK')
        lock.release()
      }
    })
  },
)
