import { mkdir, writeFile } from 'node:fs/promises'
import { buildApp } from '../server/app.js'
const app = await buildApp()
const directory = process.env.API_DOCS_DIR || 'docs/evolucao'
try {
  await app.ready()
  await mkdir(directory, { recursive: true })
  await writeFile(
    `${directory}/openapi.json`,
    JSON.stringify(app.swagger(), null, 2) + '\n',
  )
  console.log(`OpenAPI exportada para ${directory}/openapi.json`)
} finally {
  await app.close()
}
