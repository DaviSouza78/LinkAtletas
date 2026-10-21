import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

describe('arquivos estaticos e autorizacao', () => {
  const app = Fastify()
  let directory: string
  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'linkatletas-static-'))
    await mkdir(path.join(directory, 'public'))
    await writeFile(path.join(directory, 'public/public.txt'), 'conteudo publico')
    await writeFile(path.join(directory, 'private.txt'), 'conteudo protegido')
    await app.register(fastifyStatic, { root: path.join(directory, 'public'), prefix: '/files/' })
    await app.ready()
  })
  afterAll(async () => {
    await app.close()
    // mkdtemp returns this test's own directory, never a computed user target.
    if (directory) await rm(directory, { recursive: true, force: true })
  })
  it('mantem o acesso ao arquivo publico', async () => {
    const response = await app.inject('/files/public.txt')
    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('conteudo publico')
  })
  it.each(['/files/../private.txt', '/files/%2e%2e/private.txt', '/files/..%2fprivate.txt', '/files/..%5cprivate.txt'])(
    'nao expoe arquivo fora da raiz publica: %s', async (url) => {
      const response = await app.inject(url)
      expect(response.body).not.toContain('conteudo protegido')
      expect([400, 401, 403, 404]).toContain(response.statusCode)
    },
  )
})
