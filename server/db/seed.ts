import type { Pool } from 'pg'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPool, transaction } from './pool.js'
import { migrate } from './migrate.js'
import { hashPassword } from '../shared/security.js'

export async function seed(pool: Pool) {
  if (process.env.NODE_ENV === 'production')
    throw new Error(
      'Seed demonstrativo é proibido em produção. Use db:admin para criar o administrador.',
    )
  await migrate(pool)
  const accounts = [
    {
      name: 'Administrador LinkAtletas',
      email: 'admin@linkatletas.local',
      password: 'SenhaAdmin123!',
      role: 'admin',
    },
    {
      name: 'André Martins',
      email: 'emailtreinador@email.com',
      password: 'senhatreinador',
      role: 'coach',
    },
    {
      name: 'Marina Costa',
      email: 'emailatleta@email.com',
      password: 'senhaatleta',
      role: 'athlete',
    },
  ] as const
  const hashes = await Promise.all(
    accounts.map((a) => hashPassword(a.password)),
  )
  await transaction(pool, async (client) => {
    const ids: Record<string, string> = {}
    for (const [index, account] of accounts.entries()) {
      const { rows } = await client.query(
        `INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4)
        ON CONFLICT(email) DO NOTHING RETURNING id`,
        [account.name, account.email, hashes[index], account.role],
      )
      if (!rows.length) {
        const existing = await client.query(
          'SELECT id,role FROM users WHERE email=$1',
          [account.email],
        )
        if (existing.rows[0].role !== account.role)
          throw new Error(
            'E-mail de demonstração já usado por outro perfil; seed não modifica usuários existentes.',
          )
        ids[account.role] = existing.rows[0].id
        continue
      }
      ids[account.role] = rows[0].id
      await client.query(
        `INSERT INTO profiles(user_id,city,bio,sports,goals,levels,availability,mode,budget,price) VALUES($1,'Joinville, SC',$2,$3,$4,$5,$6,'online',$7,$8)`,
        [
          rows[0].id,
          account.role === 'coach'
            ? 'Treinador de corrida e condicionamento. Perfil fictício para demonstração acadêmica.'
            : 'Conta fictícia para demonstração acadêmica.',
          account.role === 'admin' ? [] : ['Corrida'],
          ['Condicionamento', 'Performance'],
          ['Intermediário'],
          ['Segunda noite', 'Quarta noite'],
          account.role === 'athlete' ? 250 : 0,
          account.role === 'coach' ? 180 : 0,
        ],
      )
      if (account.role === 'coach') {
        const verification = await client.query(
          `INSERT INTO verifications(coach_id,cref,evidence,status,reason,reviewed_at,reviewer_id)
          VALUES($1,'DEMO-012345','Registro inteiramente fictício; não representa verificação junto ao CREF.','approved','Aprovação fictícia do seed acadêmico.',now(),$2) RETURNING id`,
          [rows[0].id, ids.admin],
        )
        await client.query(
          `UPDATE profiles SET cref='DEMO-012345',verification_status='approved',verification_reason='Aprovação fictícia do seed acadêmico.' WHERE user_id=$1`,
          [rows[0].id],
        )
        await client.query(
          `INSERT INTO verification_audit(verification_id,reviewer_id,decision,reason) VALUES($1,$2,'approved','Aprovação fictícia do seed acadêmico.')`,
          [verification.rows[0].id, ids.admin],
        )
      }
    }
    const { rows } = await client.query(
      `INSERT INTO contracts(athlete_id,coach_id,status,decided_at) VALUES($1,$2,'active',now()) ON CONFLICT(athlete_id,coach_id) DO NOTHING RETURNING id`,
      [ids.athlete, ids.coach],
    )
    if (rows[0]) {
      const workout = await client.query(
        `INSERT INTO workouts(contract_id,title,sport,scheduled_date,instructions,status) VALUES($1,'Corrida de adaptação','Corrida',CURRENT_DATE,'Mantenha ritmo confortável. Treino fictício para testar o sistema.','published') RETURNING id`,
        [rows[0].id],
      )
      for (const [index, block] of [
        {
          name: 'Aquecimento',
          instructions: 'Caminhada confortável.',
          durationMinutes: 5,
        },
        {
          name: 'Corrida leve',
          instructions: 'Registre como se sentiu ao finalizar.',
          durationMinutes: 20,
          distanceKm: 3,
        },
      ].entries()) {
        await client.query(
          'INSERT INTO exercise_blocks(workout_id,position,definition) VALUES($1,$2,$3::jsonb)',
          [workout.rows[0].id, index, JSON.stringify(block)],
        )
      }
    }
  })
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const pool = createPool()
  try {
    await seed(pool)
    console.log(
      'Dados fictícios inseridos sem sobrescrever contas existentes. Consulte o README para acessos de demonstração.',
    )
  } finally {
    await pool.end()
  }
}
