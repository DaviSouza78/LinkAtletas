import { useEffect, useRef, useState } from 'react'
import { Alert, Linking } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import type { Contract } from '../../../shared/contracts'
import type {
  Consultation,
  InteractionEvent,
  Message,
  Notification,
  Review,
} from '../../../shared/interaction-contracts'
import { api, connectEvents, shareMedia, upload, type Media } from '../api'
import { datetime, useAction, useRemote } from '../hooks'
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
  Row,
} from '../ui'

function useEvents(onEvent: (event: InteractionEvent) => void) {
  const callback = useRef(onEvent)
  callback.current = onEvent
  useEffect(() => {
    let mounted = true,
      socket: WebSocket | null = null,
      retry: ReturnType<typeof setTimeout> | null = null
    const connect = () => {
      if (!mounted) return
      socket = connectEvents(
        (event) => callback.current(event as InteractionEvent),
        () => {
          if (mounted) retry = setTimeout(connect, 3000)
        },
      )
    }
    connect()
    return () => {
      mounted = false
      if (retry) clearTimeout(retry)
      socket?.close()
    }
  }, [])
}
function ContractSelector({
  contracts,
  selected,
  onChange,
}: {
  contracts: Contract[]
  selected: string
  onChange: (id: string) => void
}) {
  return (
    <Choices
      label="Vínculo"
      options={contracts.map((contract) => ({
        id: contract.id,
        label: `${contract.coachName} · ${contract.status === 'active' ? 'ativo' : 'histórico'}`,
      }))}
      selected={[selected]}
      onChange={(ids) => onChange(ids[0])}
    />
  )
}
export function ChatScreen({ userId }: { userId: string }) {
  const contracts = useRemote<{ contracts: Contract[] }>('/contracts'),
    [selected, setSelected] = useState('')
  const choices =
    contracts.data?.contracts.filter((contract) =>
      ['active', 'cancelled', 'suspended'].includes(contract.status),
    ) || []
  useEffect(() => {
    if (!selected && choices.length) setSelected(choices[0].id)
  }, [contracts.data, selected])
  return (
    <>
      <Heading>Mensagens</Heading>
      {contracts.loading && <Loading />}
      {contracts.error && <Notice message={contracts.error} error />}
      <ContractSelector
        contracts={choices}
        selected={selected}
        onChange={setSelected}
      />
      {selected ? (
        <ChatWindow
          key={selected}
          contractId={selected}
          userId={userId}
          active={
            choices.find((contract) => contract.id === selected)?.status ===
            'active'
          }
        />
      ) : (
        <Empty>A conversa fica disponível após aprovação do vínculo.</Empty>
      )}
    </>
  )
}
function ChatWindow({
  contractId,
  userId,
  active,
}: {
  contractId: string
  userId: string
  active: boolean
}) {
  const remote = useRemote<{ messages: Message[]; nextCursor: string | null }>(
      `/contracts/${contractId}/messages`,
    ),
    files = useRemote<{ media: Media[] }>(`/media?resourceId=${contractId}`),
    action = useAction()
  const [text, setText] = useState(''),
    [older, setOlder] = useState<Message[]>([]),
    [cursor, setCursor] = useState<string | null>(null)
  useEffect(() => {
    if (!older.length) setCursor(remote.data?.nextCursor ?? null)
    if (remote.data?.messages.some((m) => m.senderId !== userId && !m.readAt))
      void api(`/contracts/${contractId}/messages/read`, 'PUT', {
        throughId: remote.data.messages[remote.data.messages.length - 1].id,
      }).catch(() => undefined)
  }, [remote.data])
  useEvents((event) => {
    if (
      (event.type === 'message' && event.message.contractId === contractId) ||
      (event.type === 'read' && event.contractId === contractId) ||
      event.type === 'ready'
    ) {
      void remote.reload()
      if (event.type === 'message' && event.message.mediaId) void files.reload()
    }
  })
  const displayed = [...older, ...(remote.data?.messages || [])].filter(
    (item, index, all) =>
      all.findIndex((other) => other.id === item.id) === index,
  )
  const send = (mediaId?: string) =>
    action.run(async () => {
      await api(`/contracts/${contractId}/messages`, 'POST', {
        text,
        ...(mediaId ? { mediaId } : {}),
      })
      setText('')
      await remote.reload()
    })
  const attach = () =>
    action.run(async () => {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'video/mp4',
          'video/webm',
        ],
        copyToCacheDirectory: true,
      })
      if (picked.canceled) return
      const { media } = await upload(picked.assets[0], 'message', contractId)
      await api(`/contracts/${contractId}/messages`, 'POST', {
        text,
        mediaId: media.id,
      })
      setText('')
      await Promise.all([remote.reload(), files.reload()])
    })
  return (
    <>
      {remote.loading && <Loading />}
      {remote.error && <Notice message={remote.error} error />}
      {action.error && <Notice message={action.error} error />}
      {cursor && (
        <Button
          title="Carregar mensagens anteriores"
          secondary
          disabled={action.busy}
          onPress={() =>
            void action.run(async () => {
              const page = await api<{
                messages: Message[]
                nextCursor: string | null
              }>(`/contracts/${contractId}/messages?before=${cursor}`)
              setOlder((current) => [...page.messages, ...current])
              setCursor(page.nextCursor)
            })
          }
        />
      )}
      {displayed.map((message) => (
        <Panel key={message.id}>
          <Body muted>
            {message.senderId === userId ? 'Você' : message.senderName} ·{' '}
            {datetime(message.createdAt)}
          </Body>
          {!!message.text && <Body>{message.text}</Body>}
          {message.mediaId && (
            <Button
              title="Abrir anexo privado"
              secondary
              disabled={action.busy}
              onPress={() =>
                void action.run(async () => {
                  const media =
                    files.data?.media.find(
                      (item) => item.id === message.mediaId,
                    ) ||
                    (
                      await api<{ media: Media[] }>(
                        `/media?resourceId=${contractId}`,
                      )
                    ).media.find((item) => item.id === message.mediaId)
                  if (!media) throw new Error('Anexo excluído ou indisponível.')
                  await shareMedia(media)
                })
              }
            />
          )}
          <Body muted>
            {message.senderId === userId && message.readAt ? 'Lida' : ''}
          </Body>
        </Panel>
      ))}
      {!displayed.length && !remote.loading && (
        <Empty>Comece a conversa com seu treinador.</Empty>
      )}
      {active ? (
        <Panel>
          <Field
            label="Mensagem ao treinador"
            value={text}
            onChange={setText}
            multiline
          />
          <Row>
            <Button
              title="Enviar mensagem"
              disabled={action.busy || !text.trim()}
              onPress={() => void send()}
            />
            <Button
              title="Enviar anexo"
              secondary
              disabled={action.busy}
              onPress={() => void attach()}
            />
          </Row>
          <Button
            title="Atualizar conversa"
            secondary
            disabled={remote.loading}
            onPress={() => void remote.reload()}
          />
        </Panel>
      ) : (
        <Notice message="O vínculo foi encerrado ou suspenso. O histórico continua disponível." />
      )}
    </>
  )
}
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
export function NotificationsScreen() {
  const remote = useRemote<{ notifications: Notification[]; unread: number }>(
      '/notifications',
    ),
    action = useAction()
  useEvents((event) => {
    if (event.type === 'notification') void remote.reload()
  })
  return (
    <>
      <Heading>Notificações</Heading>
      {remote.loading && <Loading />}
      {remote.error && <Notice message={remote.error} error />}
      {action.error && <Notice message={action.error} error />}
      {remote.data && (
        <Panel>
          <Body>{remote.data.unread} não lida(s)</Body>
          <Button
            title="Marcar todas como lidas"
            secondary
            disabled={action.busy || remote.data.unread === 0}
            onPress={() =>
              void action.run(async () => {
                await api('/notifications', 'PUT', { all: true })
                await remote.reload()
              })
            }
          />
        </Panel>
      )}
      {remote.data?.notifications.map((notification) => (
        <Panel key={notification.id}>
          <Heading small>{notification.title}</Heading>
          <Body muted>
            {datetime(notification.createdAt)} ·{' '}
            {notification.readAt ? 'Lida' : 'Não lida'}
          </Body>
          {!notification.readAt && (
            <Button
              title="Marcar como lida"
              secondary
              disabled={action.busy}
              onPress={() =>
                void action.run(async () => {
                  await api('/notifications', 'PUT', { ids: [notification.id] })
                  await remote.reload()
                })
              }
            />
          )}
        </Panel>
      ))}
      {remote.data && !remote.data.notifications.length && (
        <Empty>Você ainda não tem notificações.</Empty>
      )}
    </>
  )
}
