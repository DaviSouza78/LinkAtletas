import * as DocumentPicker from 'expo-document-picker'
import { useEffect, useState } from 'react'
import type { Message } from '../../../../shared/interaction-contracts'
import { api, shareMedia, upload, type Media } from '../../services/api'
import { datetime } from '../../utils/format'
import { useAction } from '../../hooks/useAction'
import { useRemote } from '../../hooks/useRemote'
import {
  Body,
  Button,
  Empty,
  Field,
  Loading,
  Notice,
  Panel,
  Row,
} from '../../components/ui'
import { useEvents } from '../../hooks/useEvents'

export function ChatWindow({
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
