import { describe, expect, it } from 'vitest'
import { decryptPrivate, encryptPrivate } from '../../server/shared/crypto.js'
describe('AES-256-GCM privado', () => {
  it('preserva Unicode, varia o IV e não armazena conteúdo em claro', () => {
    const plain = 'Saúde privada 🏃'
    const first = encryptPrivate(plain)
    expect(first).not.toContain(plain)
    expect(encryptPrivate(plain)).not.toBe(first)
    expect(decryptPrivate(first)).toBe(plain)
  })
  it('rejeita bytes adulterados', () => {
    const bytes = Buffer.from(encryptPrivate('privado').slice(4), 'base64')
    bytes[bytes.length - 1] ^= 1
    expect(() => decryptPrivate(`la1:${bytes.toString('base64')}`)).toThrow()
  })
})
