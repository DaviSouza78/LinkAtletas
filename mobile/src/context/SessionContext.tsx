import { createContext, useContext } from 'react'
import type { AppUser } from '../../../shared/contracts'

export const SessionContext = createContext<AppUser | null>(null)
export function useSession() {
  const user = useContext(SessionContext)
  if (!user) throw new Error('Sessao autenticada obrigatoria.')
  return user
}
