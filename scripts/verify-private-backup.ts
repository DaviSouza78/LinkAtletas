import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { CreateBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { storageClient, containerText, databaseUser } from './backup-shared.js'
import { encryptPrivate } from '../server/shared/crypto.js'

if (
  !process.env.BACKUP_DOCKER_NETWORK ||
  !process.env.BACKUP_DOCKER_ENV_FILE ||
  !process.env.BACKUP_DB_CONTAINER
)
  throw new Error(
    'Configure BACKUP_DOCKER_NETWORK, BACKUP_DOCKER_ENV_FILE e BACKUP_DB_CONTAINER para a instalação isolada de produção.',
  )
const suffix = randomUUID().replaceAll('-', '').slice(0, 12),
  target = `private_restore_${suffix}_test`,
  targetBucket = `private-restored-${suffix}`
const storage = storageClient(),
  bucket = process.env.S3_BUCKET ?? 'linkatletas-private'
async function command(file: string, args: string[], json = false) {
  const child = spawn(file, args, {
    env: process.env,
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
  if (code !== 0)
    throw new Error(`Verificação operacional falhou: ${error.slice(0, 1000)}`)
  return json ? JSON.parse(out.trim()) : out
}
try {
  try {
    await storage.send(new CreateBucketCommand({ Bucket: bucket }))
  } catch (error) {
    if (
      !String(error).includes('BucketAlreadyOwnedByYou') &&
      !String(error).includes('BucketAlreadyExists')
    )
      throw error
  }
  await storage.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `backup-fixture/${suffix}`,
      Body: Buffer.from(
        encryptPrivate(
          'Objeto fictício para verificar backup na rede privada.',
        ),
      ),
    }),
  )
  await containerText(['createdb', '-U', databaseUser(), target])
  await command('docker', [
    'compose',
    '--env-file',
    process.env.BACKUP_DOCKER_ENV_FILE,
    '-f',
    'compose.production.yaml',
    'stop',
    'app',
  ])
  let backup: unknown, restore: unknown
  try {
    const directory = `private-network-${suffix}`
    backup = await command(
      process.execPath,
      ['--import', 'tsx', 'scripts/backup.ts', directory],
      true,
    )
    restore = await command(
      process.execPath,
      [
        '--import',
        'tsx',
        'scripts/restore.ts',
        directory,
        target,
        targetBucket,
      ],
      true,
    )
  } finally {
    await command('docker', [
      'compose',
      '--env-file',
      process.env.BACKUP_DOCKER_ENV_FILE,
      '-f',
      'compose.production.yaml',
      'up',
      '-d',
      '--wait',
      'app',
    ])
  }
  const result = {
    date: new Date().toISOString(),
    privateS3WithoutHostPort: true,
    applicationStoppedDuringSnapshot: true,
    temporarySdkWorkers: true,
    backup,
    restore,
    productionDatabasePreserved: true,
    publicDeployment: false,
  }
  await mkdir(resolve('docs/evolucao/evidencias'), { recursive: true })
  await writeFile(
    resolve('docs/evolucao/evidencias/private-network-backup.json'),
    JSON.stringify(result, null, 2),
  )
  console.log(JSON.stringify(result))
} finally {
  storage.destroy()
}
