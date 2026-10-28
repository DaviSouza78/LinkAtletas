import type { Role } from '../../../shared/contracts'

export const navigation = {
  athlete: [
    'Início',
    'Treinos',
    'Buscar',
    'Vínculos',
    'Mensagens',
    'Agenda',
    'Avaliações',
    'Financeiro',
    'Avisos',
    'Perfil',
    'Privacidade',
  ],
  coach: [
    'Início',
    'Treinos',
    'Vínculos',
    'Mensagens',
    'Agenda',
    'Avaliações',
    'Financeiro',
    'Avisos',
    'Perfil',
    'Privacidade',
  ],
  admin: [
    'Início',
    'CREF',
    'Moderacao',
    'Regras financeiras',
    'Pedidos de privacidade',
    'Avisos',
  ],
} as const satisfies Record<Role, readonly string[]>

export type Destination = (typeof navigation)[Role][number]
export function validRole(value: unknown): value is Role {
  return value === 'athlete' || value === 'coach' || value === 'admin'
}
export function canNavigate(
  role: Role,
  destination: string,
): destination is Destination {
  return (navigation[role] as readonly string[]).includes(destination)
}
