import { mkdir, writeFile } from 'node:fs/promises'
import { buildApp } from '../server/app.js'
const app = await buildApp()
try {
  await app.ready()
  await mkdir('docs/sprint-2', { recursive: true })
  await writeFile(
    'docs/sprint-2/openapi.json',
    JSON.stringify(app.swagger(), null, 2) + '\n',
  )
  console.log('OpenAPI exportada para docs/sprint-2/openapi.json')
} finally {
  await app.close()
}
