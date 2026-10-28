import { createDecipheriv, randomBytes } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { open, readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { z } from 'zod'
import {
  CreateBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import {
  backupDirectory,
  backupKey,
  containerText,
  containerProcess,
  databaseUser,
  storageClient,
  safeIdentifier,
  sha256,
  tableCounts,
  objectFile,
  type BackupManifest,
} from './backup-shared.js'

if (!process.argv[2] || !process.argv[3] || !process.argv[4])
  throw new Error(
    'Uso: restore.ts <backup-dentro-BACKUP_ROOT> <banco_vazio_test> <bucket_vazio>',
  )
const directory = await backupDirectory(process.argv[2]),
  database = safeIdentifier(process.argv[3], 'Banco de restauração'),
  bucket = process.argv[4]
if (!database.endsWith('_test'))
  throw new Error(
    'Restauração automatizada exige banco isolado com sufixo _test. Restauração operacional deve seguir o manual.',
  )
if (!/^[a-z0-9][a-z0-9.-]{2,62}$/.test(bucket))
  throw new Error('Bucket inválido.')
const manifest = z
  .object({
    version: z.literal(1),
    keyFingerprint: z.string().length(64),
    dumpSha256: z.string().length(64),
    objects: z.array(
      z.object({
        key: z.string().min(1).max(1024),
        file: z.string(),
        sha256: z.string().length(64),
        size: z.number().int().min(1),
      }),
    ),
    tableCounts: z.record(z.string(), z.number().int().min(0)),
  })
  .parse(
    JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8')),
  ) as BackupManifest
const key = await backupKey()
if (sha256(key) !== manifest.keyFingerprint)
  throw new Error(
    'A chave não corresponde ao backup; nenhuma alteração foi feita.',
  )
const dump = join(directory, 'database.dump.enc'),
  bytes = await readFile(dump)
if (
  sha256(bytes) !== manifest.dumpSha256 ||
  bytes.subarray(0, 4).toString() !== 'LAB1'
)
  throw new Error('Backup do banco corrompido; nenhuma alteração foi feita.')
if (Object.keys(await tableCounts(database)).length)
  throw new Error(
    'O banco destino precisa existir e estar vazio. Nenhum objeto foi removido.',
  )
// Verify every object before changing the destination; paths supplied by the manifest are never trusted.
for (const object of manifest.objects) {
  const content = await readFile(objectFile(directory, object.file))
  if (content.length !== object.size || sha256(content) !== object.sha256)
    throw new Error('Objeto do backup corrompido.')
}
const temporary = join(
  directory,
  `restore-${randomBytes(12).toString('hex')}.dump.local`,
)
const storage = storageClient()
try {
  try {
    await storage.send(new CreateBucketCommand({ Bucket: bucket }))
  } catch (error) {
    if (
      !['BucketAlreadyOwnedByYou', 'BucketAlreadyExists'].includes(
        (error as Error).name,
      )
    )
      throw error
  }
  const existing = await storage.send(
    new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }),
  )
  if (existing.Contents?.length)
    throw new Error(
      'O bucket destino precisa estar vazio. Nenhum objeto foi removido.',
    )
  const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(4, 16))
  decipher.setAuthTag(bytes.subarray(16, 32))
  // Complete authentication before pg_restore can mutate the destination database.
  await pipeline(
    createReadStream(dump, { start: 32 }),
    decipher,
    createWriteStream(temporary, { flags: 'wx', mode: 0o600 }),
  )
  const child = containerProcess([
    'pg_restore',
    '-U',
    databaseUser(),
    '-d',
    database,
    '--no-owner',
    '--no-privileges',
    '--exit-on-error',
  ])
  let error = ''
  child.stderr.on('data', (chunk) => {
    error += String(chunk)
  })
  child.stdout.resume()
  const exited = new Promise<number | null>((done, reject) => {
    child.once('error', reject)
    child.once('close', done)
  })
  await pipeline(createReadStream(temporary), child.stdin)
  if ((await exited) !== 0)
    throw new Error(`pg_restore falhou: ${error.slice(0, 1000)}`)
  for (const object of manifest.objects)
    await storage.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: object.key,
        Body: await readFile(objectFile(directory, object.file)),
        ContentType: 'application/octet-stream',
      }),
    )
  const restored = await tableCounts(database)
  if (JSON.stringify(restored) !== JSON.stringify(manifest.tableCounts))
    throw new Error(
      'Contagens de tabelas divergentes; destino deve ser investigado.',
    )
  for (const object of manifest.objects) {
    const content = await storage.send(
      new GetObjectCommand({ Bucket: bucket, Key: object.key }),
    )
    if (
      sha256(Buffer.from(await content.Body!.transformToByteArray())) !==
      object.sha256
    )
      throw new Error('Objeto restaurado divergente.')
  }
  console.log(
    JSON.stringify({
      restoredDatabase: database,
      objects: manifest.objects.length,
      tables: Object.keys(restored).length,
      countsEqual: true,
      checksumsEqual: true,
      keyMatched: true,
    }),
  )
} finally {
  storage.destroy()
  try {
    await unlink(temporary)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}
