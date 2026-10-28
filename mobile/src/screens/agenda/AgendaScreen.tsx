import { useEffect, useState } from 'react'
import { Alert, Linking } from 'react-native'
import type { Contract } from '../../../../shared/contracts'
import type { Consultation } from '../../../../shared/interaction-contracts'
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
  Row,
} from '../../components/ui'
import { useEvents } from '../../hooks/useEvents'
import { ContractSelector } from '../../components/connections/ContractSelector'

export function AgendaScreen() {
  const remote = useRemote<{ consultations: Consultation[] }>('/consultations'),
    contracts = useRemote<{ contracts: Contract[] }>('/contracts'),
    action = useAction()
  const [contractId, setContractId] = useState(''),
    [title, setTitle] = useState(''),
    [description, setDescription] = useState(''),
    [startsAt, setStartsAt] = useState(
      new Date(Date.now() + 86400_000).toISOString(),
    ),
    [duration, setDuration] = useState('30')
  const [editing, setEditing] = useState<Consultation | null>(null),
    [newDate, setNewDate] = useState(''),
    [reason, setReason] = useState(''),
    [history, setHistory] = useState<
      Array<{ id: string; action: string; reason: string; createdAt: string }>
    >([])
  const choices =
    contracts.data?.contracts.filter(
      (contract) => contract.status === 'active',
    ) || []
  useEffect(() => {
    if (!contractId && choices.length) setContractId(choices[0].id)
  }, [contracts.data, contractId])
  useEvents((event) => {
    if (event.type === 'consultation') void remote.reload()
  })
  const update = (item: Consultation, status: 'cancelled' | 'scheduled') =>
    action.run(async () => {
      await api(`/consultations/${item.id}`, 'PATCH', {
        status,
        reason,
        ...(status === 'scheduled' ? { startsAt: newDate } : {}),
      })
      setEditing(null)
      await remote.reload()
    }, 'Agenda atualizada.')
  return (
    <>
      <Heading>Agenda</Heading>
      {remote.loading && <Loading />}
      {remote.error && <Notice message={remote.error} error />}
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      {choices.length > 0 && (
        <Panel>
          <Heading small>Nova consultoria</Heading>
          <ContractSelector
            contracts={choices}
            selected={contractId}
            onChange={setContractId}
          />
          <Field label="Propósito" value={title} onChange={setTitle} />
          <Field
            label="Descrição"
            value={description}
            onChange={setDescription}
            multiline
          />
          <Field
            label="Início (data e hora ISO com fuso)"
            value={startsAt}
            onChange={setStartsAt}
            hint="Ex.: 2026-10-28T19:00:00-03:00"
          />
          <Field
            label="Duração em minutos"
            value={duration}
            onChange={setDuration}
            numeric
          />
          <Button
            title="Agendar consultoria"
            disabled={action.busy || !contractId}
            onPress={() =>
              void action.run(async () => {
                await api('/consultations', 'POST', {
                  contractId,
                  title,
                  description,
                  startsAt,
                  durationMinutes: Number(duration),
                })
                setTitle('')
                setDescription('')
                await remote.reload()
              }, 'Consultoria registrada. Sem integração configurada, nenhuma reunião externa foi criada.')
            }
          />
        </Panel>
      )}
      {remote.data?.consultations.map((item) => (
        <Panel key={item.id}>
          <Heading small>{item.title}</Heading>
          <Body>
            {datetime(item.startsAt)} · {item.durationMinutes} minutos
          </Body>
          <Body>
            {item.coachName} ·{' '}
            {item.status === 'scheduled'
              ? 'Agendada'
              : item.status === 'cancelled'
                ? 'Cancelada'
                : 'Concluída'}
          </Body>
          <Body>{item.description}</Body>
          {item.meetingUrl ? (
            <Button
              title="Abrir reunião"
              secondary
              onPress={() => void Linking.openURL(item.meetingUrl!)}
            />
          ) : (
            <Body muted>
              Consultoria local. Nenhuma reunião externa vinculada.
            </Body>
          )}
          <Row>
            {item.status === 'scheduled' && (
              <Button
                title="Alterar ou cancelar"
                secondary
                onPress={() => {
                  setEditing(item)
                  setNewDate(item.startsAt)
                  setReason('')
                }}
              />
            )}
            <Button
              title="Ver histórico"
              secondary
              disabled={action.busy}
              onPress={() =>
                void action.run(async () => {
                  const result = await api<{ history: typeof history }>(
                    `/consultations/${item.id}/history`,
                  )
                  setHistory(result.history)
                })
              }
            />
          </Row>
          {editing?.id === item.id && (
            <>
              <Field
                label="Novo início ISO"
                value={newDate}
                onChange={setNewDate}
              />
              <Field
                label="Motivo da alteração"
                value={reason}
                onChange={setReason}
              />
              <Row>
                <Button
                  title="Confirmar reagendamento"
                  disabled={action.busy || reason.trim().length < 5}
                  onPress={() => void update(item, 'scheduled')}
                />
                <Button
                  title="Cancelar consultoria"
                  destructive
                  disabled={action.busy || reason.trim().length < 5}
                  onPress={() =>
                    Alert.alert(
                      'Cancelar consultoria',
                      'Confirmar o cancelamento?',
                      [
                        { text: 'Voltar', style: 'cancel' },
                        {
                          text: 'Confirmar',
                          style: 'destructive',
                          onPress: () => void update(item, 'cancelled'),
                        },
                      ],
                    )
                  }
                />
              </Row>
            </>
          )}
        </Panel>
      ))}
      {history.length > 0 && (
        <Panel>
          <Heading small>Histórico selecionado</Heading>
          {history.map((item) => (
            <Body key={item.id}>
              {datetime(item.createdAt)} · {item.action}: {item.reason}
            </Body>
          ))}
        </Panel>
      )}
      {remote.data && !remote.data.consultations.length && (
        <Empty>Nenhuma consultoria agendada.</Empty>
      )}
    </>
  )
}
