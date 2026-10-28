import { useAuth } from '../../context/AuthContext'
import { useRemote } from '../../hooks/useRemote'
import type { Contract } from '../../../shared/contracts'
import { useState } from 'react'
import { api, json } from '../../services/api'
import { message } from '../../utils/errors'
import { PageTitle } from '../../components/ui/PageTitle'
import { Notice, State, Empty } from '../../components/ui/Feedback'
import { day } from '../../utils/formatters'
import { Badge } from '../../components/ui/Badge'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ContractEndAction } from '../../components/connections/ContractEndAction'

export function ContractsPage() {
  const { user } = useAuth()
  const coach = user?.role === 'coach'
  const remote = useRemote<{ contracts: Contract[] }>('/contracts')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function decide(id: string, status: 'active' | 'rejected') {
    setBusy(id)
    setError('')
    setSuccess('')
    try {
      await api('/contracts/' + id, json('PATCH', { status }))
      setSuccess(
        status === 'active'
          ? 'Solicitação aceita. Você já pode prescrever treinos para este atleta.'
          : 'Solicitação recusada.',
      )
      await remote.reload()
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy('')
    }
  }
  return (
    <>
      <PageTitle
        title="Evolução se constrói em conjunto"
        description="Gerencie solicitações, vínculos ativos e o histórico do acompanhamento."
      />
      <Notice error={error} success={success} />
      <State {...remote} retry={remote.reload} />
      <div className="live-stack">
        {remote.data && !remote.data.contracts.length && (
          <Empty>
            {coach
              ? 'Você ainda não recebeu solicitações. Complete seu perfil e envie seu CREF para aparecer na busca.'
              : 'Você ainda não tem conexões. Descubra um treinador para começar.'}
          </Empty>
        )}
        {remote.data?.contracts.map((c) => (
          <article className="live-panel live-contract" key={c.id}>
            <div>
              <h3>{coach ? c.athleteName : c.coachName}</h3>
              <p>Solicitação de {day(c.createdAt)}</p>
              <Badge status={c.status} />
            </div>
            {c.status === 'pending' && coach ? (
              <div className="live-actions">
                <button
                  className="button button--dark"
                  disabled={!!busy}
                  onClick={() => decide(c.id, 'active')}
                >
                  Aceitar solicitação
                </button>
                <button
                  className="button button--outline"
                  disabled={!!busy}
                  onClick={() => decide(c.id, 'rejected')}
                >
                  Recusar solicitação
                </button>
              </div>
            ) : (
              c.status === 'active' &&
              coach && (
                <Link
                  className="button button--outline"
                  to={'/treinador/treinos?atleta=' + c.id}
                >
                  Prescrever treino
                  <ArrowRight size={16} />
                </Link>
              )
            )}
            {['pending', 'active', 'suspended'].includes(c.status) && (
              <ContractEndAction contract={c} onChange={remote.reload} />
            )}
          </article>
        ))}
      </div>
    </>
  )
}
