import nodemailer from 'nodemailer'
import type { Pool, PoolClient } from 'pg'
import { encryptPrivate, decryptPrivate } from '../shared/crypto.js'
import { transaction } from '../db/pool.js'

export async function queueMail(
  client: Pool | PoolClient,
  userId: string,
  recipient: string,
  subject: string,
  text: string,
) {
  await client.query(
    'INSERT INTO mail_outbox(user_id,recipient,subject,encrypted_body) VALUES($1,$2,$3,$4)',
    [userId, recipient, subject, encryptPrivate(text)],
  )
}
export async function deliverOutbox(pool: Pool) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || '127.0.0.1',
    port: Number(process.env.SMTP_PORT || 1025),
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS:
      process.env.NODE_ENV === 'production' &&
      process.env.SMTP_SECURE !== 'true',
    connectionTimeout: 5000,
    socketTimeout: 5000,
    ...(process.env.SMTP_USER
      ? {
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        }
      : {}),
  })
  let sent = 0
  for (let i = 0; i < 25; i++) {
    const found = await transaction(pool, async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM mail_outbox WHERE sent_at IS NULL AND attempts<5 AND next_attempt_at<=now() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1',
      )
      if (!rows[0]) return false
      const item = rows[0]
      try {
        await transporter.sendMail({
          from:
            process.env.SMTP_FROM || 'LinkAtletas <no-reply@linkatletas.local>',
          to: item.recipient,
          subject: item.subject,
          text: decryptPrivate(item.encrypted_body),
        })
        await client.query(
          "UPDATE mail_outbox SET sent_at=now(),encrypted_body='',attempts=attempts+1,last_error=NULL WHERE id=$1",
          [item.id],
        )
        sent++
      } catch {
        await client.query(
          "UPDATE mail_outbox SET attempts=attempts+1,next_attempt_at=now()+interval '1 minute'*power(2,attempts),last_error='SMTP indisponível' WHERE id=$1",
          [item.id],
        )
      }
      return true
    })
    if (!found) break
  }
  transporter.close()
  return { sent }
}
