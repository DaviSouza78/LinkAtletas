import { api, shareMedia, type Media } from '../../services/api'
import { useAction } from '../../hooks/useAction'
import { Button, Notice } from '../ui'

export function VerificationDocument({
  coachId,
  documentId,
}: {
  coachId: string
  documentId: string
}) {
  const action = useAction()
  return (
    <>
      {action.error && <Notice message={action.error} error />}
      <Button
        title="Conferir documento privado"
        secondary
        disabled={action.busy}
        onPress={() =>
          void action.run(async () => {
            const { media } = await api<{ media: Media[] }>(
              `/media?resourceId=${coachId}`,
            )
            const document = media.find(
              (item) =>
                item.id === documentId && item.purpose === 'verification',
            )
            if (!document)
              throw new Error('Documento indisponivel para esta sessao.')
            await shareMedia(document)
          })
        }
      />
    </>
  )
}
