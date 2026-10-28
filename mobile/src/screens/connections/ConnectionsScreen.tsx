import { useState } from 'react'
import { Alert } from 'react-native'
import type { Contract } from '../../../../shared/contracts'
import { api } from '../../services/api'
import { datetime } from '../../utils/format'
import { useAction } from '../../hooks/useAction'
import { useRemote } from '../../hooks/useRemote'
import {
  Body,
  Button,
  Empty,
  Field,
  Heading,
  Loading,
  Notice,
  Panel,
} from '../../components/ui'

const status: Record<string, string> = {
  active: 'Ativo',
  pending: 'Aguardando treinador',
  rejected: 'Recusado',
  cancelled: 'Encerrado',
  suspended: 'Suspenso',
}

export function ConnectionsScreen() {
  const remote = useRemote<{ contracts: Contract[] }>('/contracts'),
    action = useAction(),
    [reason, setReason] = useState('')
  const cancel = (contract: Contract) =>
    Alert.alert(
      'Encerrar vínculo',
      `Deseja encerrar seu vínculo com ${contract.coachName}? Se houver assinatura paga, a vigência segue a confirmação financeira.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Confirmar encerramento',
          style: 'destructive',
          onPress: () =>
            void action.run(async () => {
              await api(`/contracts/${contract.id}/cancel`, 'POST', { reason })
              await remote.reload()
            }, 'Solicitação de encerramento registrada.'),
        },
      ],
    )
  return (
    <>
      <Heading>Seus vínculos</Heading>
      {remote.loading && <Loading />}
      {remote.error && <Notice message={remote.error} error />}
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      <Panel>
        <Field
          label="Motivo para retirar solicitação ou encerrar"
          value={reason}
          onChange={setReason}
          hint="Ao menos 5 caracteres. Informe antes de confirmar o encerramento."
        />
      </Panel>
      {remote.data?.contracts.map((contract) => (
        <Panel key={contract.id}>
          <Heading small>{contract.coachName}</Heading>
          <Body>{status[contract.status] || contract.status}</Body>
          <Body muted>Solicitado em {datetime(contract.createdAt)}</Body>
          {['active', 'pending', 'suspended'].includes(contract.status) && (
            <Button
              title={
                contract.status === 'pending'
                  ? 'Retirar solicitação'
                  : 'Solicitar encerramento'
              }
              destructive
              disabled={action.busy || reason.trim().length < 5}
              onPress={() => cancel(contract)}
            />
          )}
        </Panel>
      ))}
      {remote.data && !remote.data.contracts.length && (
        <Empty>Você ainda não possui solicitações. Explore a aba Buscar.</Empty>
      )}
    </>
  )
}
