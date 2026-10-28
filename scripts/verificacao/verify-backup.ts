import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { createPool } from '../../server/db/pool.js'
import { migrate } from '../../server/db/migrate.js'
import { encryptPrivate, decryptPrivate } from '../../server/shared/crypto.js'
import { hashPassword } from '../../server/shared/security.js'
import { containerText, databaseUser, sha256 } from '../banco/backup-shared.js'

const suffix = randomUUID().replaceAll('-', '').slice(0, 12)
const source = `backup_source_${suffix}_test`,
  target = `backup_restore_${suffix}_test`
const bucket = `backup-source-${suffix}`,
  targetBucket = `backup-restored-${suffix}`
const databaseBase =
  process.env.TEST_DATABASE_URL ??
  'postgresql://linkatletas:linkatletas_dev@127.0.0.1:54329/linkatletas_test'
if (!new URL(databaseBase).pathname.endsWith('_test'))
  throw new Error('Verificação exige TEST_DATABASE_URL isolada.')
const sourceUrl = new URL(databaseBase)
sourceUrl.pathname = '/' + source
const targetUrl = new URL(databaseBase)
targetUrl.pathname = '/' + target
await containerText(['createdb', '-U', databaseUser(), source])
await containerText(['createdb', '-U', databaseUser(), target])
const pool = createPool(sourceUrl.toString())
const objectId = randomUUID(),
  objectKey = `private/${objectId}`
const privateText = 'Documento fictício de teste: informação privada de backup.'
const encrypted = encryptPrivate(privateText)
const storage = new S3Client({
  region: process.env.S3_REGION ?? 'us-east-1',
  endpoint: process.env.S3_ENDPOINT ?? 'http://127.0.0.1:8333',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? 'linkatletas-local',
    secretAccessKey:
      process.env.S3_SECRET_KEY ?? 'local-only-change-in-production',
  },
})
async function run(file: string, args: string[], env: Record<string, string>) {
  const child = spawn(process.execPath, ['--import', 'tsx', file, ...args], {
    env: { ...process.env, ...env },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let out = '',
    error = ''
  child.stdout.on('data', (chunk) => {
    out += String(chunk)
  })
  child.stderr.on('data', (chunk) => {
    error += String(chunk)
  })
  const code = await new Promise<number | null>((done, reject) => {
    child.once('error', reject)
    child.once('close', done)
  })
  if (code !== 0) throw new Error(`Verificação falhou ${file}: ${error}`)
  return JSON.parse(out.trim())
}
try {
  await migrate(pool)
  const user = (
    await pool.query(
      'INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id',
      [
        'Backup fictício',
        `backup-${suffix}@example.invalid`,
        await hashPassword('SenhaBackupFicticia123!'),
        'coach',
      ],
    )
  ).rows[0]
  await pool.query('INSERT INTO profiles(user_id) VALUES($1)', [user.id])
  await pool.query(
    'INSERT INTO private_health(user_id,encrypted_data) VALUES($1,$2)',
    [user.id, encryptPrivate(JSON.stringify({ note: privateText }))],
  )
  await pool.query(
    `INSERT INTO media(id,owner_id,purpose,resource_id,name,mime_type,size,object_key) VALUES($1,$2,'verification',$2,'fixture.pdf','application/pdf',$3,$4)`,
    [objectId, user.id, Buffer.byteLength(privateText), objectKey],
  )
  await storage.send(new CreateBucketCommand({ Bucket: bucket }))
  await storage.send(
    new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: encrypted }),
  )
  const directory = `verified-${suffix}`
  const backup = await run('scripts/banco/backup.ts', [directory], {
    BACKUP_DB_NAME: source,
    S3_BUCKET: bucket,
  })
  const restore = await run(
    'scripts/banco/restore.ts',
    [directory, target, targetBucket],
    { BACKUP_DB_NAME: source, S3_BUCKET: bucket },
  )
  const restored = createPool(targetUrl.toString())
  try {
    const health = (
      await restored.query(
        'SELECT encrypted_data FROM private_health WHERE user_id=$1',
        [user.id],
      )
    ).rows[0]
    if (JSON.parse(decryptPrivate(health.encrypted_data)).note !== privateText)
      throw new Error('Campo privado restaurado divergente.')
    const raw = await storage.send(
      new GetObjectCommand({ Bucket: targetBucket, Key: objectKey }),
    )
    const bytes = Buffer.from(await raw.Body!.transformToByteArray())
    if (decryptPrivate(bytes.toString()) !== privateText)
      throw new Error('Mídia restaurada divergente.')
    const encryptedDump = await readFile(
      resolve('tmp/backups', directory, 'database.dump.enc'),
    )
    if (encryptedDump.includes(Buffer.from(privateText)))
      throw new Error('Texto privado presente no backup cifrado.')
    const evidence = {
      date: new Date().toISOString(),
      source,
      target,
      backup,
      restore,
      privateFieldRoundtrip: true,
      mediaRoundtrip: true,
      dumpPlaintextAbsent: true,
      encryptedObjectSha256: sha256(bytes),
      testDatabasesPreserved: true,
      consistency:
        'Testes isolados sem escritas concorrentes. Produção requer pausar escritas e reaplicar eliminações posteriores.',
    }
    const evidenceDirectory = resolve('docs/evolucao/evidencias/infraestrutura')
    await mkdir(evidenceDirectory, { recursive: true })
    await writeFile(
      resolve(evidenceDirectory, 'backup-restore.json'),
      JSON.stringify(evidence, null, 2),
    )
    console.log(JSON.stringify(evidence))
  } finally {
    await restored.end()
  }
} finally {
  await pool.end()
  storage.destroy()
}
