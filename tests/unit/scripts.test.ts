import { afterEach, describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const execute = promisify(execFile)
const loader = import.meta.resolve('tsx')
const directories: string[] = []
const script = (file: string) => fileURLToPath(new URL(`../../scripts/${file}`, import.meta.url))

afterEach(async () => {
  for (const directory of directories.splice(0)) {
    if (resolve(directory, '..') !== resolve(tmpdir()) || !basename(directory).startsWith('linkatletas-scripts-'))
      throw new Error('Diretorio temporario fora do escopo do teste.')
    await rm(directory, { recursive: true, force: true })
  }
})

describe('argumentos de conexao Android', () => {
  it.each([
    { args: ['--serial'], expected: 'Informe um valor apos --serial.' },
    { args: ['--install'], expected: 'Informe um valor apos --install.' },
    { args: ['--serial', '--install'], expected: 'Informe um valor apos --serial.' },
    { args: ['--unknown', 'value'], expected: 'Use apenas --serial' },
    { args: ['--serial', 'one', '--serial', 'two'], expected: 'sem repetir opcoes' },
    { args: ['--install', 'arquivo-inexistente-para-teste.apk'], expected: 'arquivo APK existente' },
  ])('recusa $args antes de conectar ou modificar o aparelho', async ({ args, expected }) => {
    await expect(execute(process.execPath, ['--import', loader, script('android/connect-android.ts'), ...args], {
      timeout: 10_000,
      windowsHide: true,
    })).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining(expected) })
  })
})

describe('configuracao local de instalacao', () => {
  async function workspace() {
    const directory = await mkdtemp(resolve(tmpdir(), 'linkatletas-scripts-'))
    directories.push(directory)
    return directory
  }

  const initialize = (directory: string) => execute(process.execPath, [
    '--import', loader, script('operacao/init-production.ts'),
  ], { cwd: directory, timeout: 10_000, windowsHide: true })

  it('gera arquivos privados coerentes sem imprimir os segredos', async () => {
    const directory = await workspace()
    const { stdout } = await initialize(directory)
    const environment = await readFile(resolve(directory, '.env.production.local'), 'utf8')
    const entries = Object.fromEntries(environment.split(/\r?\n/).filter((line) => line.includes('=')).map((line) => {
      const separator = line.indexOf('=')
      return [line.slice(0, separator), line.slice(separator + 1)]
    }))
    const storage = JSON.parse(await readFile(resolve(directory, '.s3-production.local'), 'utf8'))
    const credentials = storage.identities[0].credentials[0]
    expect(Buffer.from(entries.DATA_ENCRYPTION_KEY, 'base64').length).toBe(32)
    expect(credentials.accessKey === entries.S3_ACCESS_KEY).toBe(true)
    expect(credentials.secretKey === entries.S3_SECRET_KEY).toBe(true)
    expect(entries.BILLING_MODE).toBe('academic')
    for (const name of ['DATA_ENCRYPTION_KEY', 'POSTGRES_PASSWORD', 'S3_ACCESS_KEY', 'S3_SECRET_KEY'])
      expect(stdout.includes(entries[name])).toBe(false)
  })

  it.each(['.env.production.local', '.s3-production.local'])('preserva %s existente sem criar o outro arquivo', async (name) => {
    const directory = await workspace()
    await writeFile(resolve(directory, name), 'conteudo anterior')
    await expect(initialize(directory)).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('Arquivo existente preservado') })
    expect(await readFile(resolve(directory, name), 'utf8')).toBe('conteudo anterior')
    expect(await readdir(directory)).toEqual([name])
  })
})
