import 'dotenv/config'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, mkdir, realpath } from 'node:fs/promises'
import { resolve, relative, isAbsolute, join } from 'node:path'
import { S3Client } from '@aws-sdk/client-s3'

export interface BackupManifest {
  version: 1
  createdAt: string
  database: string
  keyFingerprint: string
  dumpSha256: string
  objects: { key: string; file: string; sha256: string; size: number }[]
  tableCounts: Record<string, number>
  consistency: 'requires-quiesced-writes'
}
export const sha256 = (bytes: Buffer | string) =>
  createHash('sha256').update(bytes).digest('hex')
export async function backupKey() {
  const encoded =
    process.env.DATA_ENCRYPTION_KEY?.trim() ||
    (
      await readFile(
        resolve(process.env.DATA_KEY_FILE || '.data-key.local'),
        'utf8',
      )
    ).trim()
  const key = Buffer.from(encoded, 'base64')
  if (key.length !== 32)
    throw new Error('A chave AES original de 32 bytes é obrigatória.')
  return key
}
export function safeIdentifier(value: string, name: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,120}$/.test(value))
    throw new Error(`${name} inválido.`)
  return value
}
export async function backupDirectory(input: string, create = false) {
  const root = resolve(process.env.BACKUP_ROOT ?? 'tmp/backups')
  if (create) await mkdir(root, { recursive: true, mode: 0o700 })
  const absolute = resolve(root, input),
    rel = relative(root, absolute)
  if (!rel || rel.startsWith('..') || isAbsolute(rel))
    throw new Error('Destino deve ficar estritamente dentro de BACKUP_ROOT.')
  if (create) await mkdir(absolute, { recursive: true, mode: 0o700 })
  const actualRoot = await realpath(root),
    actualPath = await realpath(absolute),
    actualRel = relative(actualRoot, actualPath)
  if (!actualRel || actualRel.startsWith('..') || isAbsolute(actualRel))
    throw new Error('O caminho resolvido escapa de BACKUP_ROOT.')
  return absolute
}
export function databaseContainer() {
  return safeIdentifier(
    process.env.BACKUP_DB_CONTAINER ?? 'linkatletas-db-1',
    'Container PostgreSQL',
  )
}
export function databaseUser() {
  return safeIdentifier(
    process.env.BACKUP_DB_USER ?? 'linkatletas',
    'Usuário PostgreSQL',
  )
}
export function sourceDatabase() {
  return safeIdentifier(
    process.env.BACKUP_DB_NAME ?? 'linkatletas',
    'Banco origem',
  )
}
export function storageClient() {
  if (process.env.BACKUP_DOCKER_NETWORK) return new PrivateNetworkStorage()
  return new S3Client({
    region: process.env.S3_REGION ?? 'us-east-1',
    endpoint: process.env.S3_ENDPOINT ?? 'http://127.0.0.1:8333',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? 'linkatletas-local',
      secretAccessKey:
        process.env.S3_SECRET_KEY ?? 'local-only-change-in-production',
    },
  })
}
/** Short-lived SDK worker reaches private production S3 without exposing a port.
 * Secrets are inherited from an ignored env file, never interpolated in code or CLI arguments.
 */
class PrivateNetworkStorage {
  async send(command: {
    constructor: { name: string }
    input: unknown
  }): Promise<any> {
    const kind = command.constructor.name
    if (
      ![
        'ListObjectsV2Command',
        'GetObjectCommand',
        'PutObjectCommand',
        'CreateBucketCommand',
      ].includes(kind)
    )
      throw new Error('Comando S3 de backup não permitido.')
    const network = safeIdentifier(
      process.env.BACKUP_DOCKER_NETWORK!,
      'Rede Docker',
    )
    const file = resolve(
      process.env.BACKUP_DOCKER_ENV_FILE ?? '.env.production.local',
    )
    const image =
      process.env.BACKUP_DOCKER_IMAGE ?? 'linkatletas:local-production'
    if (!/^[a-zA-Z0-9_./:-]+$/.test(image))
      throw new Error('Imagem de backup inválida.')
    const program = `import * as s3 from '@aws-sdk/client-s3';
      let text=''; for await(const bytes of process.stdin)text+=String(bytes);
      const task=JSON.parse(text);if(task.input.Body?.type==='Buffer')task.input.Body=Buffer.from(task.input.Body.data);
      const client=new s3.S3Client({region:process.env.S3_REGION||'us-east-1',endpoint:process.env.S3_ENDPOINT,forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY,secretAccessKey:process.env.S3_SECRET_KEY}});
      try{const result=await client.send(new s3[task.kind](task.input));if(result.Body)result.BodyBase64=Buffer.from(await result.Body.transformToByteArray()).toString('base64');delete result.Body;console.log(JSON.stringify(result));}catch(error){console.error(JSON.stringify({name:error.name}));process.exitCode=1;}finally{client.destroy();}`
    const child = spawn(
      'docker',
      [
        'run',
        '--rm',
        '-i',
        '--network',
        network,
        '--env-file',
        file,
        '-e',
        `S3_ENDPOINT=${process.env.BACKUP_S3_ENDPOINT ?? 'http://storage:8333'}`,
        '--entrypoint',
        'node',
        image,
        '--input-type=module',
        '-e',
        program,
      ],
      { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] },
    )
    let out = '',
      error = ''
    child.stdout.on('data', (bytes) => {
      out += String(bytes)
    })
    child.stderr.on('data', (bytes) => {
      error += String(bytes)
    })
    child.stdin.end(JSON.stringify({ kind, input: command.input }))
    const code = await new Promise<number | null>((done, reject) => {
      child.once('error', reject)
      child.once('close', done)
    })
    if (code !== 0) {
      let name = 'StorageError'
      try {
        name = JSON.parse(error.trim()).name
      } catch {}
      const problem = new Error(`Worker S3 privado falhou (${code}): ${name}`)
      problem.name = name
      throw problem
    }
    const value = JSON.parse(out)
    if (value.BodyBase64 !== undefined) {
      const bytes = Buffer.from(value.BodyBase64, 'base64')
      value.Body = { transformToByteArray: async () => bytes }
      delete value.BodyBase64
    }
    return value
  }
  destroy() {}
}
export function containerProcess(args: string[]) {
  return spawn('docker', ['exec', '-i', databaseContainer(), ...args], {
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}
export async function containerText(args: string[], input?: string) {
  const child = containerProcess(args)
  let out = '',
    error = ''
  child.stdout.on('data', (bytes) => {
    out += String(bytes)
  })
  child.stderr.on('data', (bytes) => {
    error += String(bytes)
  })
  child.stdin.end(input)
  const code = await new Promise<number | null>((done, reject) => {
    child.on('error', reject)
    child.on('close', done)
  })
  if (code !== 0)
    throw new Error(
      `Comando do banco falhou (${code}): ${error.slice(0, 1000)}`,
    )
  return out
}
export async function tableCounts(database: string) {
  const tables = JSON.parse(
    await containerText([
      'psql',
      '-U',
      databaseUser(),
      '-d',
      database,
      '-At',
      '-c',
      "SELECT coalesce(json_agg(tablename),'[]') FROM pg_tables WHERE schemaname='public'",
    ]),
  ) as string[]
  const counts: Record<string, number> = {}
  for (const table of tables.sort()) {
    safeIdentifier(table, 'Tabela')
    counts[table] = Number(
      (
        await containerText([
          'psql',
          '-U',
          databaseUser(),
          '-d',
          database,
          '-At',
          '-c',
          `SELECT count(*) FROM "${table}"`,
        ])
      ).trim(),
    )
  }
  return counts
}
export function objectFile(directory: string, name: string) {
  if (!/^object-\d{6}\.enc$/.test(name))
    throw new Error('Nome de objeto no manifesto inválido.')
  return join(directory, 'objects', name)
}
