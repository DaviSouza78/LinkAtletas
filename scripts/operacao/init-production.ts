import { randomBytes } from 'node:crypto'
import { writeFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'

const environmentFile = resolve('.env.production.local')
const storageFile = resolve('.s3-production.local')
for (const file of [environmentFile, storageFile]) {
  try {
    await access(file)
    throw new Error(`Arquivo existente preservado: ${file}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}
const databasePassword = randomBytes(24).toString('hex')
const accessKey = 'linkatletas-' + randomBytes(12).toString('hex')
const storageSecret = randomBytes(32).toString('hex')
const dataKey = randomBytes(32).toString('base64')
await writeFile(
  storageFile,
  JSON.stringify(
    {
      identities: [
        {
          name: 'private-application',
          credentials: [{ accessKey, secretKey: storageSecret }],
          actions: ['Admin', 'Read', 'Write', 'List', 'Tagging'],
        },
      ],
    },
    null,
    2,
  ),
  { flag: 'wx', mode: 0o600 },
)
await writeFile(
  environmentFile,
  [
    '# Instalação local com TLS: Mailpit captura e-mails, cobrança acadêmica sem pagamentos.',
    `POSTGRES_PASSWORD=${databasePassword}`,
    'APP_ORIGIN=https://localhost:8443',
    'SITE_HOST=localhost',
    'HTTPS_PORT=8443',
    'PROXY_BIND=127.0.0.1',
    `DATA_ENCRYPTION_KEY=${dataKey}`,
    'BILLING_MODE=academic',
    `S3_CONFIG_FILE=${storageFile.replaceAll('\\', '/')}`,
    'S3_BUCKET=linkatletas-private',
    `S3_ACCESS_KEY=${accessKey}`,
    `S3_SECRET_KEY=${storageSecret}`,
    'SMTP_HOST=mail',
    'SMTP_PORT=1025',
    'SMTP_FROM=no-reply@linkatletas.local',
    'SMTP_SECURE=false',
    '',
  ].join('\n'),
  { flag: 'wx', mode: 0o600 },
)
console.log(
  'Configuração local gerada em arquivos ignorados pelo Git; nenhum segredo foi impresso. Preserve a chave separadamente do backup.',
)
