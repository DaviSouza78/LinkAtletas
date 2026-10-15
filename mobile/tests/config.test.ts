import { describe, expect, it } from 'vitest'
import { nativeConfiguration } from '../src/config'

describe('Configuração de rede do aplicativo', () => {
  it('usa loopback na demonstração local e mantém produção com HTTPS', () => {
    expect(nativeConfiguration(undefined, 'local', false, 'android')).toEqual({
      apiUrl: 'http://localhost:3001/api',
      error: '',
      localDemo: true,
    })
    expect(nativeConfiguration('https://api.linkatletas.test/api', undefined, false, 'android').error).toBe('')
    expect(nativeConfiguration('http://localhost:3001/api', undefined, false, 'android').error).toContain('HTTPS')
  })

  it.each(['http://192.168.1.2:3001/api', 'http://localhost.evil.test/api', 'https://api.linkatletas.test/api'])('recusa destino fora do ambiente local: %s', (url) => {
    expect(nativeConfiguration(url, 'local', false, 'android').error).toContain('local')
  })

  it.each(['https://api.linkatletas.example/api', 'ftp://localhost/api', 'https://user:senha@api.linkatletas.test/api', 'https://api.linkatletas.test/api?token=segredo', 'endereco-invalido'])('recusa configuração imprópria: %s', (url) => {
    expect(nativeConfiguration(url, undefined, false, 'android').error).not.toBe('')
  })

  it('mantém o endereço do emulador em desenvolvimento', () => {
    expect(nativeConfiguration(undefined, undefined, true, 'android').apiUrl).toBe('http://10.0.2.2:3001/api')
  })
})
