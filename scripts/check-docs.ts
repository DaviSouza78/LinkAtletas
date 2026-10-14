import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
const root = process.cwd(),
  failures: string[] = [],
  checked: string[] = []
async function visit(directory: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'evidencias') continue
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) result.push(...(await visit(file)))
    else if (file.endsWith('.md')) result.push(file)
  }
  return result
}
for (const file of [
  path.resolve('README.md'),
  ...(await visit(path.resolve('docs/evolucao'))),
]) {
  const text = await readFile(file, 'utf8')
  for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#')[0]
    if (!target || /^(https?:|mailto:|app:|codex:)/.test(target)) continue
    const destination = path.resolve(
      path.dirname(file),
      decodeURIComponent(target),
    )
    try {
      await stat(destination)
      checked.push(path.relative(root, destination))
    } catch {
      failures.push(`${path.relative(root, file)} -> ${target}`)
    }
  }
}
const api = JSON.parse(await readFile('docs/evolucao/openapi.json', 'utf8'))
assert(api.openapi.startsWith('3.0'), 'OpenAPI 3.0 exigida.')
for (const endpoint of [
  '/api/auth/native/login',
  '/api/auth/reset-password',
  '/api/media',
  '/api/consultations',
  '/api/reviews',
  '/api/billing/webhook',
  '/api/privacy/export',
])
  assert(api.paths[endpoint], `Endpoint ausente: ${endpoint}`)
assert(
  api.components.securitySchemes.bearerAuth,
  'Autenticação nativa documentada.',
)
const result = {
  executedAt: new Date().toISOString(),
  relativeLinksChecked: checked.length,
  openapiPaths: Object.keys(api.paths).length,
  brokenLinks: failures,
}
await mkdir('docs/evolucao/evidencias', { recursive: true })
await writeFile(
  'docs/evolucao/evidencias/documentation-check.json',
  JSON.stringify(result, null, 2) + '\n',
)
assert.equal(failures.length, 0, failures.join('\n'))
console.log(JSON.stringify(result, null, 2))
