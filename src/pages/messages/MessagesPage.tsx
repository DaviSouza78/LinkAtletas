import { useAuth } from '../../context/AuthContext'
import { useRemote } from '../../hooks/useRemote'
import type { Contract } from '../../../shared/contracts'
import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { PageTitle } from '../../components/ui/PageTitle'
import { State, Empty } from '../../components/ui/Feedback'
import { Badge } from '../../components/ui/Badge'
import { Conversation } from './Conversation'

export function MessagesPage() {
  const { user } = useAuth()
  const contracts = useRemote<{ contracts: Contract[] }>('/contracts')
  const [params] = useSearchParams()
  const [selected, setSelected] = useState(params.get('vinculo') || '')
  const current =
    contracts.data?.contracts.find((c) => c.id === selected) ||
    contracts.data?.contracts[0]
  return (
    <>
      <PageTitle
        title="Conversa que acompanha seu treino"
        description="Orientações e mensagens privadas entre você e seu vínculo esportivo."
      />
      <State {...contracts} retry={contracts.reload} />
      {contracts.data && !contracts.data.contracts.length && (
        <Empty>
          Suas conversas ficam disponíveis depois que você se conecta a um
          treinador.
        </Empty>
      )}
      {current && (
        <div className="exp-chat-layout">
          <aside
            className="live-panel exp-conversations"
            aria-label="Conversas"
          >
            {contracts.data?.contracts.map((c) => (
              <button
                key={c.id}
                className={
                  c.id === current.id
                    ? 'exp-conversation active'
                    : 'exp-conversation'
                }
                onClick={() => setSelected(c.id)}
              >
                <span className="live-avatar">
                  {(user?.role === 'coach' ? c.athleteName : c.coachName)
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span>
                  <strong>
                    {user?.role === 'coach' ? c.athleteName : c.coachName}
                  </strong>
                  <Badge status={c.status} />
                </span>
              </button>
            ))}
          </aside>
          <Conversation key={current.id} contract={current} />
        </div>
      )}
    </>
  )
}
