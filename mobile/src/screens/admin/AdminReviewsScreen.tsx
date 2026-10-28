import { useState } from 'react'
import { Alert } from 'react-native'
import type { Review } from '../../../../shared/interaction-contracts'
import { api } from '../../services/api'
import { useRemote } from '../../hooks/useRemote'
import { useAction } from '../../hooks/useAction'
import {
  Body,
  Button,
  Empty,
  Field,
  Heading,
  Notice,
  Panel,
} from '../../components/ui'
import { RemoteState } from '../../components/RemoteState'

export function AdminReviewsScreen() {
  const remote = useRemote<{
    reviews: Review[]
    reports: { id: string; reviewId: string; reason: string }[]
  }>('/admin/reviews')
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const action = useAction()
  return (
    <>
      <Heading>Moderacao de avaliacoes</Heading>
      <RemoteState remote={remote} />
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      {remote.data?.reviews.map((review) => (
        <Panel key={review.id}>
          <Heading small>
            {review.coachName}: {review.rating}/5
          </Heading>
          <Body>
            {review.athleteName}: {review.text}
          </Body>
          <Body>{review.hidden ? 'Oculta' : 'Publicada'}</Body>
          {remote.data?.reports
            .filter((report) => report.reviewId === review.id)
            .map((report) => (
              <Body key={report.id}>Denuncia: {report.reason}</Body>
            ))}
          <Field
            label="Justificativa da moderacao"
            value={reasons[review.id] || ''}
            onChange={(value) =>
              setReasons((previous) => ({ ...previous, [review.id]: value }))
            }
            multiline
          />
          <Button
            title={review.hidden ? 'Restaurar publicacao' : 'Ocultar avaliacao'}
            disabled={
              action.busy || (reasons[review.id] || '').trim().length < 5
            }
            onPress={() =>
              Alert.alert(
                'Confirmar moderacao',
                'Registrar esta decisao e sua justificativa?',
                [
                  { text: 'Voltar', style: 'cancel' },
                  {
                    text: 'Confirmar',
                    onPress: () =>
                      void action.run(async () => {
                        await api(`/admin/reviews/${review.id}`, 'PATCH', {
                          hidden: !review.hidden,
                          reason: reasons[review.id],
                        })
                        await remote.reload()
                      }, 'Moderacao registrada.'),
                  },
                ],
              )
            }
          />
        </Panel>
      ))}
      {remote.data && !remote.data.reviews.length && (
        <Empty>Nenhuma avaliacao registrada.</Empty>
      )}
    </>
  )
}
