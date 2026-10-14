import { z } from 'zod'
import { createPool, transaction } from './pool.js'
import { hashPassword } from '../shared/security.js'

const input = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(12).max(128),
  })
  .parse({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  })
const pool = createPool()
try {
  const hash = await hashPassword(input.password)
  await transaction(pool, async (client) => {
    const { rows } = await client.query(
      "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'admin') RETURNING id",
      [input.name, input.email, hash],
    )
    await client.query('INSERT INTO profiles(user_id) VALUES($1)', [rows[0].id])
  })
  console.log('Administrador criado. A senha não foi registrada no log.')
} finally {
  await pool.end()
}
