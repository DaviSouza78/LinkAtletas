import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import type { Contract } from '../../../../shared/contracts'
import type { Review } from '../../../../shared/interaction-contracts'
import { api } from '../../services/api'
import { useAction } from '../../hooks/useAction'
import { useRemote } from '../../hooks/useRemote'
import {
  Body,
  Button,
  Choices,
  Empty,
  Field,
  Heading,
  Loading,
  Notice,
  Panel,
} from '../../components/ui'
import { ContractSelector } from '../../components/connections/ContractSelector'

export function ReviewsScreen() {
  const contracts = useRemote<{ contracts: Contract[] }>('/contracts'),
    [contractId, setContractId] = useState(''),
    [rating, setRating] = useState('5'),
    [text, setText] = useState(''),
    [editing, setEditing] = useState<string | null>(null)
  const action = useAction(),
    choices =
      contracts.data?.contracts.filter((contract) =>
        ['active', 'cancelled'].includes(contract.status),
      ) || [],
    selected = choices.find((contract) => contract.id === contractId)
  const remote = useRemote<{
    reviews: Review[]
    average: number
    count: number
  }>(`/reviews${selected ? `?coachId=${selected.coachId}` : ''}`)
  useEffect(() => {
    if (!contractId && choices.length) setContractId(choices[0].id)
  }, [contracts.data, contractId])
  const mine = remote.data?.reviews.find(
    (review) => review.contractId === contractId,
  )
  return (
    <>
      <Heading>Avaliações</Heading>
      {remote.loading && <Loading />}
      {remote.error && <Notice message={remote.error} error />}
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      <ContractSelector
        contracts={choices}
        selected={contractId}
        onChange={(id) => {
          setContractId(id)
          setEditing(null)
          setText('')
        }}
      />
      {remote.data && (
        <Panel>
          <Heading small>{remote.data.average.toFixed(1)} / 5</Heading>
          <Body>
            {remote.data.count} avaliação(ões) publicada(s)
            {selected ? ` de ${selected.coachName}` : ''}
          </Body>
        </Panel>
      )}
      {selected && (editing || !mine) && (
        <Panel>
          <Heading small>
            {editing ? 'Editar avaliação' : 'Avalie o acompanhamento'}
          </Heading>
          <Body muted>
            Nova avaliação exige vínculo ativo há pelo menos sete dias. Uma
            avaliação por ciclo.
          </Body>
          <Choices
            label="Nota"
            options={['1', '2', '3', '4', '5'].map((id) => ({
              id,
              label: `${id} estrela${id === '1' ? '' : 's'}`,
            }))}
            selected={[rating]}
            onChange={(ids) => setRating(ids[0])}
          />
          <Field
            label="Sua experiência"
            value={text}
            onChange={setText}
            multiline
          />
          <Button
            title="Publicar avaliação"
            disabled={action.busy || (!editing && selected.status !== 'active')}
            onPress={() =>
              void action.run(async () => {
                await api(
                  editing ? `/reviews/${editing}` : '/reviews',
                  editing ? 'PUT' : 'POST',
                  {
                    ...(editing ? {} : { contractId }),
                    rating: Number(rating),
                    text,
                  },
                )
                setEditing(null)
                setText('')
                await remote.reload()
              }, 'Avaliação publicada.')
            }
          />
        </Panel>
      )}
      {remote.data?.reviews.map((review) => (
        <Panel key={review.id}>
          <Heading small>
            {review.rating} / 5 · {review.athleteName}
          </Heading>
          <Body>{review.text}</Body>
          {review.reply && (
            <>
              <Body muted>Resposta de {review.coachName}</Body>
              <Body>{review.reply}</Body>
            </>
          )}
          {review.contractId === contractId && (
            <Button
              title="Editar minha avaliação"
              secondary
              onPress={() => {
                setEditing(review.id)
                setRating(String(review.rating))
                setText(review.text)
              }}
            />
          )}
          <Button
            title="Denunciar conteúdo"
            secondary
            disabled={action.busy}
            onPress={() =>
              Alert.alert(
                'Denunciar avaliação',
                'A administração receberá seu pedido de revisão deste conteúdo.',
                [
                  { text: 'Voltar', style: 'cancel' },
                  {
                    text: 'Pedir revisão',
                    onPress: () =>
                      void action.run(async () => {
                        await api(`/reviews/${review.id}/report`, 'POST', {
                          reason:
                            'Participante solicita análise desta publicação pelo aplicativo.',
                        })
                      }, 'Pedido de revisão registrado.'),
                  },
                ],
              )
            }
          />
        </Panel>
      ))}
      {remote.data && !remote.data.reviews.length && (
        <Empty>Nenhuma avaliação publicada neste filtro.</Empty>
      )}
    </>
  )
}
