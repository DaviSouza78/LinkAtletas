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
  path.resolve('docs/README.md'),
  ...(await visit(path.resolve('docs/historico'))),
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
const database = JSON.parse(await readFile('docs/evolucao/evidencias/database-schema.json', 'utf8')) as {
  tables: string[]
  columns: Array<{ table_name: string; column_name: string }>
  constraints: Array<{ table_name: string; type: string; foreign_table: string | null; columns: string[] }>
}
const der = (await readFile('docs/evolucao/diagramas/der.mmd', 'utf8')).replaceAll('\r\n', '\n')
let diagramColumnsChecked = 0
for (const entity of der.matchAll(/^  (\w+) \{\n([\s\S]*?)^  \}/gm)) {
  assert(database.tables.includes(entity[1]), `Tabela ausente no banco: ${entity[1]}`)
  for (const column of entity[2].matchAll(/^\s+\w+ (\w+)/gm)) {
    assert(database.columns.some((c) => c.table_name === entity[1] && c.column_name === column[1]), `Coluna do DER não existe: ${entity[1]}.${column[1]}`)
    diagramColumnsChecked++
  }
}
for (const fk of database.constraints.filter((c) => c.type === 'f'))
  assert(der.split('\n').some((line) => line.trim().startsWith(`${fk.foreign_table} `) && line.endsWith(` ${fk.table_name} : ${fk.columns.join('_')}`)), `Relação FK ausente no DER: ${fk.table_name}.${fk.columns.join(',')}`)
let sequenceCallsChecked = 0
const useCases = await readFile('docs/evolucao/diagramas/casos-de-uso.puml', 'utf8')
const useCaseIds = [...useCases.matchAll(/usecase "(UC-[\d.]+) /g)].map((match) => match[1])
assert.equal(new Set(useCaseIds).size, useCaseIds.length, 'Identificadores de casos de uso repetidos.')
const useCaseSvg = await readFile('docs/evolucao/diagramas/casos-de-uso.svg', 'utf8')
for (const id of useCaseIds) assert(useCaseSvg.includes('>' + id + '<'), `Caso de uso ausente na imagem: ${id}`)
for (const name of ['sequencia-contratacao', 'sequencia-treino']) {
  const sequence = await readFile(`docs/evolucao/diagramas/${name}.mmd`, 'utf8')
  for (const call of sequence.matchAll(/->>API: (GET|POST|PUT|PATCH|DELETE) (\/[\w/:?-]+)/g)) {
    const endpoint = '/api' + call[2].split('?')[0].replace(/:(\w+)/g, '{$1}')
    assert(api.paths[endpoint]?.[call[1].toLowerCase()], `Chamada de sequência não existe: ${call[1]} ${endpoint}`)
    sequenceCallsChecked++
  }
}
const result = {
  executedAt: new Date().toISOString(),
  relativeLinksChecked: checked.length,
  openapiPaths: Object.keys(api.paths).length,
  brokenLinks: failures,
  diagramColumnsChecked,
  sequenceCallsChecked,
  useCasesChecked: useCaseIds.length,
  foreignKeysDocumented: database.constraints.filter((c) => c.type === 'f').length,
}
await mkdir('docs/evolucao/evidencias', { recursive: true })
await writeFile(
  'docs/evolucao/evidencias/documentation-check.json',
  JSON.stringify(result, null, 2) + '\n',
)
assert.equal(failures.length, 0, failures.join('\n'))
console.log(JSON.stringify(result, null, 2))
