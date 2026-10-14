import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { request } from 'node:https'
import { randomUUID, X509Certificate } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const exec = promisify(execFile)
const proxy =
  process.env.TLS_PROXY_CONTAINER ?? 'linkatletas-production-proxy-1'
if (!/^[a-zA-Z0-9_.-]+$/.test(proxy)) throw new Error('Container TLS inválido.')
const { stdout: ca } = await exec(
  'docker',
  ['exec', proxy, 'cat', '/data/caddy/pki/authorities/local/root.crt'],
  { windowsHide: true },
)
const port = Number(process.env.HTTPS_PORT ?? 8443),
  origin = `https://localhost:${port}`
async function call(
  path: string,
  method = 'GET',
  payload?: unknown,
  cookie?: string,
  trusted = true,
  withOrigin = true,
): Promise<{
  status: number
  headers: import('node:http').IncomingHttpHeaders
  body: string
  protocol: string
  cipher: string
}> {
  return new Promise((done, reject) => {
    const req = request(
      {
        hostname: 'localhost',
        family: 4,
        port,
        path,
        method,
        ...(trusted ? { ca } : {}),
        rejectUnauthorized: true,
        headers: {
          ...(withOrigin ? { Origin: origin } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
          ...(payload === undefined
            ? {}
            : { 'Content-Type': 'application/json' }),
        },
      },
      (res) => {
        const socket = res.socket as import('node:tls').TLSSocket
        const protocol = socket.getProtocol()!,
          cipher = socket.getCipher().name
        let body = ''
        res.on('data', (chunk) => {
          body += String(chunk)
        })
        res.on('end', () =>
          done({
            status: res.statusCode!,
            headers: res.headers,
            body,
            protocol,
            cipher,
          }),
        )
      },
    )
    req.on('error', reject)
    req.end(payload === undefined ? undefined : JSON.stringify(payload))
  })
}
let refusedUntrusted = false
try {
  await call('/api/health', 'GET', undefined, undefined, false)
} catch {
  refusedUntrusted = true
}
if (!refusedUntrusted)
  throw new Error(
    'A CA local foi aceita sem trust explícito; verificar ambiente.',
  )
const health = await call('/api/health'),
  frontend = await call('/login')
if (
  health.status !== 200 ||
  JSON.parse(health.body).database !== 'postgresql' ||
  frontend.status !== 200 ||
  !frontend.body.includes('id="root"')
)
  throw new Error('Frontend/banco atrás de TLS não responderam.')
const email = `tls-${randomUUID()}@example.invalid`
const register = await call('/api/auth/register', 'POST', {
  name: 'Verificação TLS fictícia',
  email,
  password: 'SenhaTLSFicticia123!',
  role: 'athlete',
})
if (register.status !== 201)
  throw new Error(`Cadastro TLS falhou ${register.status}`)
const cookie = register.headers['set-cookie']?.[0]
if (!cookie || !cookie.includes('HttpOnly') || !cookie.includes('Secure'))
  throw new Error('Cookie de produção não protegido.')
const session = await call(
  '/api/auth/session',
  'GET',
  undefined,
  cookie.split(';')[0],
)
if (JSON.parse(session.body).user?.email !== email)
  throw new Error('Sessão através de TLS inválida.')
const csrf = await call(
  '/api/auth/logout',
  'POST',
  {},
  cookie.split(';')[0],
  true,
  false,
)
if (csrf.status !== 403)
  throw new Error('Mutações de sessão sem Origin precisam ser negadas.')
const appContainer =
  process.env.TLS_APP_CONTAINER ?? 'linkatletas-production-app-1'
if (!/^[a-zA-Z0-9_.-]+$/.test(appContainer))
  throw new Error('Container da aplicação inválido.')
const before = await call(
  '/api/profiles/me',
  'GET',
  undefined,
  cookie.split(';')[0],
)
await exec('docker', ['restart', appContainer], { windowsHide: true })
let ready = false
for (let attempt = 0; attempt < 60; attempt++) {
  try {
    if ((await call('/api/health')).status === 200) {
      ready = true
      break
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 250))
}
if (!ready) throw new Error('Aplicação não respondeu após reinício.')
const afterSession = await call(
  '/api/auth/session',
  'GET',
  undefined,
  cookie.split(';')[0],
)
const after = await call(
  '/api/profiles/me',
  'GET',
  undefined,
  cookie.split(';')[0],
)
if (
  JSON.parse(afterSession.body).user?.email !== email ||
  before.body !== after.body
)
  throw new Error('Sessão/perfil não persistiram após reinício do container.')
const evidence = {
  date: new Date().toISOString(),
  url: origin,
  localOnly: true,
  caExplicit: true,
  systemTrustChanged: false,
  untrustedConnectionRefused: true,
  tlsProtocol: health.protocol,
  cipher: health.cipher,
  caFingerprint: new X509Certificate(ca).fingerprint256,
  healthStatus: health.status,
  frontendStatus: frontend.status,
  registrationStatus: register.status,
  authenticatedSession: true,
  secureHttpOnlyCookie: true,
  csrfWithoutOriginStatus: csrf.status,
  sessionSurvivedContainerRestart: true,
  profileIdenticalAfterRestart: true,
  billing: 'academic, no external payment',
  publicDeployment: false,
}
await mkdir(resolve('docs/evolucao/evidencias'), { recursive: true })
await writeFile(
  resolve('docs/evolucao/evidencias/production-tls.json'),
  JSON.stringify(evidence, null, 2),
)
await mkdir(resolve('tmp/tls'), { recursive: true })
await writeFile(resolve('tmp/tls/root-ca.local.pem'), ca)
console.log(JSON.stringify(evidence))
