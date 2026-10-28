import { useRemote } from '../../hooks/useRemote'
import type { Review } from '../../../shared/interaction-contracts'
import { useState } from 'react'
import { api, json } from '../../services/api'
import { message } from '../../utils/errors'
import { PageTitle } from '../../components/ui/PageTitle'
import { Notice, State, Empty } from '../../components/ui/Feedback'
import { Badge } from '../../components/ui/Badge'

export function AdminReviewsPage() {
  const remote = useRemote<{
    reviews: Review[]
    reports: {
      id: string
      reviewId: string
      reason: string
      createdAt: string
    }[]
  }>('/admin/reviews')
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function moderate(r: Review) {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await api(
        '/admin/reviews/' + r.id,
        json('PATCH', { hidden: !r.hidden, reason: reasons[r.id] }),
      )
      await remote.reload()
      setSuccess('Decisão de moderação registrada.')
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageTitle
        title="Avaliações com responsabilidade"
        description="Revise denúncias e registre a justificativa de cada decisão de publicação."
      />
      <Notice error={error} success={success} />
      <State {...remote} retry={remote.reload} />
      <div className="live-stack">
        {remote.data?.reviews.map((r) => (
          <article className="live-panel live-form" key={r.id}>
            <div className="live-panel-heading">
              <h3>
                {r.coachName} · {r.rating}/5
              </h3>
              <Badge status={r.hidden ? 'hidden' : 'published'} />
            </div>
            <p>
              {r.athleteName}: {r.text}
            </p>
            {remote.data?.reports
              .filter((p) => p.reviewId === r.id)
              .map((p) => (
                <div className="exp-feedback" key={p.id}>
                  <strong>Denúncia</strong>
                  <p>{p.reason}</p>
                </div>
              ))}
            <label>
              Justificativa de moderação
              <textarea
                value={reasons[r.id] || ''}
                onChange={(e) =>
                  setReasons((v) => ({ ...v, [r.id]: e.target.value }))
                }
                minLength={5}
                maxLength={1000}
              />
            </label>
            <button
              className="button button--outline"
              disabled={busy || (reasons[r.id] || '').trim().length < 5}
              onClick={() => void moderate(r)}
            >
              {r.hidden ? 'Restaurar publicação' : 'Ocultar avaliação'}
            </button>
          </article>
        ))}
        {remote.data && !remote.data.reviews.length && (
          <Empty>Nenhuma avaliação para moderar.</Empty>
        )}
      </div>
    </>
  )
}
