import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { backupKey } from '../../scripts/backup-shared.js'

let directory: string | undefined
afterEach(async () => {
  vi.unstubAllEnvs()
  if (directory) await rm(directory, { recursive: true, force: true })
  directory = undefined
})
describe('chave original do backup local', () => {
  it('usa a chave existente quando a variavel do exemplo esta vazia', async () => {
    directory = await mkdtemp(join(tmpdir(), 'linkatletas-key-'))
    const file = join(directory, 'key'), key = randomBytes(32)
    await writeFile(file, key.toString('base64'))
    vi.stubEnv('DATA_ENCRYPTION_KEY', '')
    vi.stubEnv('DATA_KEY_FILE', file)
    expect(await backupKey()).toEqual(key)
    expect(await readFile(file, 'utf8')).toBe(key.toString('base64'))
  })
  it('recusa uma chave configurada invalida sem substituir o arquivo existente', async () => {
    directory = await mkdtemp(join(tmpdir(), 'linkatletas-key-'))
    const file = join(directory, 'key'), original = randomBytes(32).toString('base64')
    await writeFile(file, original)
    vi.stubEnv('DATA_ENCRYPTION_KEY', 'invalida')
    vi.stubEnv('DATA_KEY_FILE', file)
    await expect(backupKey()).rejects.toThrow('32 bytes')
    expect(await readFile(file, 'utf8')).toBe(original)
  })
})
