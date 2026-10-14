import 'dotenv/config'

export const production = process.env.NODE_ENV === 'production'
export const appOrigin = process.env.APP_ORIGIN || 'http://localhost:5173'
if (
  production &&
  (!process.env.DATABASE_URL || !appOrigin.startsWith('https://'))
) {
  throw new Error('Produção exige DATABASE_URL explícita e APP_ORIGIN HTTPS.')
}
export const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://linkatletas:linkatletas_dev@127.0.0.1:54329/linkatletas'
export const apiPort = Number(process.env.API_PORT || 3001)
