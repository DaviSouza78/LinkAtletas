import { useState } from 'react'
import { Alert } from 'react-native'
import type { Verification } from '../../../../shared/contracts'
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
  Row,
} from '../../components/ui'
import { RemoteState } from '../../components/RemoteState'
import { VerificationDocument } from '../../components/media/VerificationDocument'
import { datetime } from '../../utils/format'

function VerificationDecision({
  item,
  reload,
}: {
  item: Verification
  reload: () => Promise<void>
}) {
  const [reason, setReason] = useState(''),
    [expiresAt, setExpiresAt] = useState('')
  const action = useAction()
  const decide = (
    decision: 'approved' | 'rejected' | 'suspended',
    professional = false,
  ) => {
    Alert.alert(
      'Confirmar decisao profissional',
      `${item.coachName}: ${decision}. A decisao ficara registrada com sua justificativa.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () =>
            void action.run(async () => {
              const expiry =
                !professional && decision === 'approved' && expiresAt
                  ? new Date(`${expiresAt}T23:59:59`).toISOString()
                  : undefined
              await api(
                professional
                  ? `/admin/coaches/${item.coachId}/verification`
                  : `/admin/verifications/${item.id}`,
                'PATCH',
                {
                  status: decision,
                  reason: reason.trim(),
                  ...(!professional && decision === 'approved' && expiry
                    ? { expiresAt: expiry }
                    : {}),
                },
              )
              setReason('')
              await reload()
            }, 'Decisao registrada com auditoria.'),
        },
      ],
    )
  }
  return (
    <Panel>
      <Heading small>{item.coachName}</Heading>
      <Body>CREF {item.cref}</Body>
      <Body>
        Solicitacao: {item.status} | Situacao atual:{' '}
        {item.currentStatus || item.status}
      </Body>
      <Body>{item.evidence}</Body>
      <Body>{item.currentReason || item.reason}</Body>
      {item.expiresAt && <Body>Validade: {datetime(item.expiresAt)}</Body>}
      {item.documentId && (
        <VerificationDocument
          coachId={item.coachId}
          documentId={item.documentId}
        />
      )}
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      {(item.status === 'pending' ||
        (item.status === 'approved' &&
          ['approved', 'suspended', 'expired'].includes(
            item.currentStatus || 'approved',
          ))) && (
        <>
          <Field
            label="Justificativa da decisao"
            value={reason}
            onChange={setReason}
            multiline
            hint="De 5 a 1000 caracteres."
          />
          {item.status === 'pending' ? (
            <>
              <Field
                label="Validade opcional (AAAA-MM-DD)"
                value={expiresAt}
                onChange={setExpiresAt}
              />
              <Row>
                <Button
                  title="Aprovar"
                  disabled={action.busy || reason.trim().length < 5}
                  onPress={() => decide('approved')}
                />
                <Button
                  title="Recusar"
                  destructive
                  disabled={action.busy || reason.trim().length < 5}
                  onPress={() => decide('rejected')}
                />
              </Row>
            </>
          ) : (
            <Row>
              <Button
                title="Suspender profissional"
                disabled={
                  action.busy ||
                  reason.trim().length < 5 ||
                  item.currentStatus === 'suspended'
                }
                onPress={() => decide('suspended', true)}
              />
              <Button
                title="Revogar aprovacao"
                destructive
                disabled={action.busy || reason.trim().length < 5}
                onPress={() => decide('rejected', true)}
              />
            </Row>
          )}
        </>
      )}
    </Panel>
  )
}

export function AdminVerificationScreen() {
  const remote = useRemote<{ verifications: Verification[] }>(
    '/admin/verifications',
  )
  return (
    <>
      <Heading>Conferencia manual de CREF</Heading>
      <RemoteState remote={remote} />
      {remote.data?.verifications.map((item) => (
        <VerificationDecision
          key={item.id}
          item={item}
          reload={remote.reload}
        />
      ))}
      {remote.data && !remote.data.verifications.length && (
        <Empty>Nenhuma solicitacao registrada.</Empty>
      )}
    </>
  )
}
