import { beforeEach, describe, expect, it, vi } from 'vitest'
const open = vi.hoisted(() => vi.fn(async () => undefined))
vi.mock('react-native', () => ({ Linking: { openURL: open } }))
import { openExternal } from '../src/services/externalLinks'
beforeEach(() => open.mockClear())
describe('enderecos externos no cliente nativo', () => {
  it.each([
    'javascript:alert(1)',
    'http://example.test',
    'https://user:secret@example.test',
    'https://example.test/<html>',
    'https://example.test/with space',
    'invalido',
  ])('nao abre endereco improprio: %s', async (value) => {
    await expect(openExternal(value)).rejects.toThrow()
    expect(open).not.toHaveBeenCalled()
  })
  it('abre HTTPS somente apos validacao do cliente', async () => {
    await openExternal('https://example.test/meeting')
    expect(open).toHaveBeenCalledWith('https://example.test/meeting')
  })
})
