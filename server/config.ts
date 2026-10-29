import 'dotenv/config'

export const production = process.env.NODE_ENV === 'production'
export const appOrigin =
  process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : process.env.APP_ORIGIN || 'http://localhost:5173'
if (process.env.VERCEL_ENV === 'preview' && process.env.BILLING_MODE !== 'academic')
  throw new Error('Preview exige BILLING_MODE academic.')
if (
  process.env.BILLING_MODE &&
  !['academic', 'asaas'].includes(process.env.BILLING_MODE)
)
  throw new Error(
    'BILLING_MODE deve ser academic ou asaas; cobrança fictícia não é permitida.',
  )
if (
  production &&
  (!process.env.DATABASE_URL || !appOrigin.startsWith('https://'))
) {
  throw new Error('Produção exige DATABASE_URL explícita e APP_ORIGIN HTTPS.')
}
if (production) {
  const required = [
    'DATA_ENCRYPTION_KEY',
    'S3_ENDPOINT',
    'S3_ACCESS_KEY',
    'S3_SECRET_KEY',
    'S3_BUCKET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_FROM',
    'BILLING_MODE',
  ]
  if (required.some((name) => !process.env[name]))
    throw new Error(
      'Produção exige chave privada, armazenamento, SMTP e modo financeiro explicitamente configurados.',
    )
  if (Buffer.from(process.env.DATA_ENCRYPTION_KEY!, 'base64').length !== 32)
    throw new Error('Chave de dados inválida.')
  if (
    process.env.S3_SECRET_KEY === 'local-only-change-in-production' ||
    new URL(process.env.DATABASE_URL!).password === 'linkatletas_dev'
  )
    throw new Error('Produção recusa credenciais locais padrão.')
  if (
    process.env.BILLING_MODE === 'asaas' &&
    (!process.env.ASAAS_API_KEY ||
      (process.env.ASAAS_WEBHOOK_TOKEN?.length || 0) < 32)
  )
    throw new Error(
      'Cobrança habilitada exige credenciais e token de webhook configurados.',
    )
}
export const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://linkatletas:linkatletas_dev@127.0.0.1:54329/linkatletas'
export const apiPort = Number(process.env.API_PORT || 3001)
