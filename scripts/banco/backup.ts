import { createCipheriv, randomBytes } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, open, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import {
  backupDirectory,
  backupKey,
  containerProcess,
  databaseUser,
  sourceDatabase,
  storageClient,
  sha256,
  tableCounts,
  type BackupManifest,
} from './backup-shared.js'

const directory = await backupDirectory(
  process.argv[2] ?? new Date().toISOString().replaceAll(/[:.]/g, '-'),
  true,
)
const key = await backupKey(),
  iv = randomBytes(12),
  cipher = createCipheriv('aes-256-gcm', key, iv)
const dump = join(directory, 'database.dump.enc')
await writeFile(
  dump,
  Buffer.concat([Buffer.from('LAB1'), iv, Buffer.alloc(16)]),
  { flag: 'wx', mode: 0o600 },
)
const child = containerProcess([
  'pg_dump',
  '-U',
  databaseUser(),
  '-d',
  sourceDatabase(),
  '--format=custom',
  '--no-owner',
  '--no-privileges',
])
let stderr = ''
child.stderr.on('data', (bytes) => {
  stderr += String(bytes)
})
child.stdin.end()
const exited = new Promise<number | null>((done, reject) => {
  child.once('error', reject)
  child.once('close', done)
})
await pipeline(
  child.stdout,
  cipher,
  createWriteStream(dump, { flags: 'a', mode: 0o600 }),
)
if ((await exited) !== 0)
  throw new Error(`pg_dump falhou: ${stderr.slice(0, 500)}`)
const handle = await open(dump, 'r+')
try {
  await handle.write(cipher.getAuthTag(), 0, 16, 16)
} finally {
  await handle.close()
}
await mkdir(join(directory, 'objects'), { mode: 0o700 })
const storage = storageClient(),
  bucket = process.env.S3_BUCKET ?? 'linkatletas-private'
const objects: BackupManifest['objects'] = []
try {
  let token: string | undefined
  do {
    const page = await storage.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }),
    )
    for (const item of page.Contents ?? []) {
      if (!item.Key) continue
      const content = await storage.send(
        new GetObjectCommand({ Bucket: bucket, Key: item.Key }),
      )
      const bytes = Buffer.from(await content.Body!.transformToByteArray())
      const file = `object-${String(objects.length).padStart(6, '0')}.enc`
      await writeFile(join(directory, 'objects', file), bytes, {
        flag: 'wx',
        mode: 0o600,
      })
      objects.push({
        key: item.Key,
        file,
        sha256: sha256(bytes),
        size: bytes.length,
      })
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (token)
} finally {
  storage.destroy()
}
const manifest: BackupManifest = {
  version: 1,
  createdAt: new Date().toISOString(),
  database: sourceDatabase(),
  keyFingerprint: sha256(key),
  dumpSha256: sha256(await readFile(dump)),
  objects,
  tableCounts: await tableCounts(sourceDatabase()),
  consistency: 'requires-quiesced-writes',
}
await writeFile(
  join(directory, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  { flag: 'wx', mode: 0o600 },
)
console.log(
  JSON.stringify({
    backup: directory,
    database: manifest.database,
    objects: objects.length,
    tables: Object.keys(manifest.tableCounts).length,
    databaseEncrypted: true,
    keyIncluded: false,
  }),
)
