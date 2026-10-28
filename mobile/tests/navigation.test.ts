import { describe, expect, it } from 'vitest'
import { canNavigate, navigation, validRole } from '../src/navigation/access'

describe('navegacao por papel autenticado', () => {
  it.each(['athlete', 'coach', 'admin'] as const)(
    'possui inicio unico e destinos sem duplicacao para %s',
    (role) => {
      expect(validRole(role)).toBe(true)
      expect(navigation[role][0]).toBe('Início')
      expect(new Set(navigation[role]).size).toBe(navigation[role].length)
      for (const destination of navigation[role])
        expect(canNavigate(role, destination)).toBe(true)
    },
  )
  it.each(['athlete', 'coach'] as const)(
    'impede destinos administrativos para %s',
    (role) => {
      for (const destination of [
        'CREF',
        'Moderacao',
        'Regras financeiras',
        'Pedidos de privacidade',
      ])
        expect(canNavigate(role, destination)).toBe(false)
    },
  )
  it('separa descoberta, treino e administracao', () => {
    expect(canNavigate('athlete', 'Buscar')).toBe(true)
    expect(canNavigate('coach', 'Buscar')).toBe(false)
    expect(canNavigate('admin', 'Treinos')).toBe(false)
    expect(canNavigate('admin', 'Privacidade')).toBe(false)
    expect(canNavigate('admin', 'Pedidos de privacidade')).toBe(true)
  })
  it.each(['owner', '', null, undefined, 1, {}, 'ADMIN'])(
    'recusa papel invalido: %s',
    (role) => expect(validRole(role)).toBe(false),
  )
  it.each(['athlete', 'coach', 'admin'] as const)(
    'recusa destino desconhecido para %s',
    (role) => expect(canNavigate(role, '/admin/users')).toBe(false),
  )
})
