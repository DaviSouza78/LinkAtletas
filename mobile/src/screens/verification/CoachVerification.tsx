import { useState } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import type { Verification } from '../../../../shared/contracts'
import { api, upload } from '../../services/api'
import { useSession } from '../../context/SessionContext'
import { useRemote } from '../../hooks/useRemote'
import { useAction } from '../../hooks/useAction'
import {
  Body,
  Button,
  Field,
  Heading,
  Notice,
  Panel,
} from '../../components/ui'
import { RemoteState } from '../../components/RemoteState'
import { VerificationDocument } from '../../components/media/VerificationDocument'

export function CoachVerification({
  currentStatus,
  onChange,
}: {
  currentStatus: string
  onChange: () => Promise<void>
}) {
  const user = useSession(),
    remote = useRemote<{ verifications: Verification[] }>('/verifications'),
    action = useAction()
  const [cref, setCref] = useState(''),
    [evidence, setEvidence] = useState('')
  const [document, setDocument] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const pending = remote.data?.verifications.some(
    (item) => item.status === 'pending',
  )
  return (
    <Panel>
      <Heading small>Conferencia profissional manual</Heading>
      <Body>
        Situacao atual: {currentStatus}. A administracao confere o CREF e a
        evidencia profissional.
      </Body>
      <RemoteState remote={remote} />
      {remote.data?.verifications.map((item) => (
        <Panel key={item.id}>
          <Body>
            {item.cref} | {item.status}
          </Body>
          <Body>{item.reason || 'Aguardando analise.'}</Body>
          {item.expiresAt && <Body>Validade: {item.expiresAt}</Body>}
          {item.documentId && (
            <VerificationDocument
              coachId={user.id}
              documentId={item.documentId}
            />
          )}
        </Panel>
      ))}
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      {currentStatus !== 'approved' && (
        <>
          <Field label="CREF" value={cref} onChange={setCref} />
          <Field
            label="Evidencia profissional"
            value={evidence}
            onChange={setEvidence}
            multiline
            hint="Minimo de 10 caracteres. Informe dados profissionais para conferencia."
          />
          <Button
            title={
              document
                ? `Documento: ${document.name}`
                : 'Selecionar comprovante privado'
            }
            secondary
            disabled={action.busy}
            onPress={() =>
              void action.run(async () => {
                const selection = await DocumentPicker.getDocumentAsync({
                  type: [
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                    'application/pdf',
                  ],
                  copyToCacheDirectory: true,
                  multiple: false,
                })
                if (!selection.canceled) {
                  setDocument(selection.assets[0])
                  setDocumentId(null)
                }
              })
            }
          />
          <Button
            title={pending ? 'Analise em andamento' : 'Enviar para analise'}
            disabled={
              action.busy ||
              pending ||
              cref.trim().length < 4 ||
              evidence.trim().length < 10
            }
            onPress={() =>
              void action.run(async () => {
                let id = documentId
                if (document && !id) {
                  id = (await upload(document, 'verification', user.id)).media
                    .id
                  setDocumentId(id)
                }
                await api('/verifications', 'POST', {
                  cref: cref.trim(),
                  evidence: evidence.trim(),
                  ...(id ? { documentId: id } : {}),
                })
                await remote.reload()
                await onChange()
              }, 'Credenciais enviadas para conferencia manual.')
            }
          />
        </>
      )}
    </Panel>
  )
}
