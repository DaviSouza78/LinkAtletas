import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { api, forgetSession, shareExport } from '../../services/api'
import { datetime } from '../../utils/format'
import { useAction } from '../../hooks/useAction'
import { useRemote } from '../../hooks/useRemote'
import {
  Body,
  Button,
  Choices,
  Field,
  Heading,
  Loading,
  Notice,
  Panel,
} from '../../components/ui'

interface Consent {
  purpose: 'performance' | 'health' | 'communications'
  granted: boolean
  version: string
  updatedAt: string
}

interface Health {
  notes: string
  heightCm?: number
  weightKg?: number
}

export function PrivacyScreen({ onClosed }: { onClosed: () => void }) {
  const policy = useRemote<{
      policy: { version: string; text: string; retention: string }
    }>('/privacy/policy'),
    consent = useRemote<{ consents: Consent[] }>('/privacy/consents'),
    health = useRemote<{ health: Health | null }>('/privacy/health'),
    action = useAction()
  const [notes, setNotes] = useState(''),
    [height, setHeight] = useState(''),
    [weight, setWeight] = useState(''),
    [password, setPassword] = useState('')
  useEffect(() => {
    if (health.data?.health) {
      setNotes(health.data.health.notes)
      setHeight(String(health.data.health.heightCm ?? ''))
      setWeight(String(health.data.health.weightKg ?? ''))
    }
  }, [health.data])
  const labels: Record<Consent['purpose'], string> = {
    performance: 'Arquivos de performance',
    health: 'Dados privados de saúde',
    communications: 'Comunicações opcionais',
  }
  const toggle = (purpose: Consent['purpose'], granted: boolean) =>
    action.run(async () => {
      const response = await api<{ consents: Consent[] }>(
        '/privacy/consents',
        'PUT',
        { purpose, granted },
      )
      consent.setData(response)
      if (purpose === 'health' && !granted) {
        setNotes('')
        setHeight('')
        setWeight('')
        await health.reload()
      }
    }, 'Preferência registrada com versão e data.')
  const close = () =>
    Alert.alert(
      'Encerrar e excluir dados',
      'Sua conta será desativada e sessões encerradas. Arquivos e conteúdo próprios serão removidos conforme a política exibida. Registros financeiros pendentes podem exigir conciliação.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Confirmar encerramento',
          style: 'destructive',
          onPress: () =>
            void action.run(async () => {
              await api('/privacy/delete', 'POST', { password })
              await forgetSession()
              onClosed()
            }),
        },
      ],
    )
  const healthAllowed = consent.data?.consents.some(
    (item) => item.purpose === 'health' && item.granted,
  )
  return (
    <>
      <Heading>Privacidade</Heading>
      {policy.loading && <Loading />}
      {policy.error && <Notice message={policy.error} error />}
      {consent.error && <Notice message={consent.error} error />}
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      {policy.data && (
        <Panel>
          <Heading small>Política · {policy.data.policy.version}</Heading>
          <Body>{policy.data.policy.text}</Body>
          <Body muted>{policy.data.policy.retention}</Body>
        </Panel>
      )}
      <Panel>
        <Heading small>Seus consentimentos</Heading>
        {(['performance', 'health', 'communications'] as const).map(
          (purpose) => {
            const item = consent.data?.consents.find(
              (c) => c.purpose === purpose,
            )
            return (
              <Panel key={purpose}>
                <Heading small>{labels[purpose]}</Heading>
                <Body muted>
                  {item
                    ? `Versão ${item.version} · ${datetime(item.updatedAt)}`
                    : 'Ainda não concedido'}
                </Body>
                <Choices
                  label={labels[purpose]}
                  options={[
                    { id: 'yes', label: 'Permitir' },
                    { id: 'no', label: 'Não permitir' },
                  ]}
                  selected={[item?.granted ? 'yes' : 'no']}
                  onChange={(ids) => {
                    if (!action.busy) void toggle(purpose, ids[0] === 'yes')
                  }}
                />
              </Panel>
            )
          },
        )}
      </Panel>
      {healthAllowed && (
        <Panel>
          <Heading small>Dados privados de saúde</Heading>
          <Body muted>
            Visíveis ao titular nesta função. Armazenados cifrados pela API.
          </Body>
          <Field
            label="Notas privadas"
            value={notes}
            onChange={setNotes}
            multiline
          />
          <Field
            label="Altura (cm, opcional)"
            value={height}
            onChange={setHeight}
            numeric
          />
          <Field
            label="Peso (kg, opcional)"
            value={weight}
            onChange={setWeight}
            numeric
          />
          <Button
            title="Salvar dados privados"
            disabled={action.busy}
            onPress={() =>
              void action.run(async () => {
                await api('/privacy/health', 'PUT', {
                  notes,
                  ...(height
                    ? { heightCm: Number(height.replace(',', '.')) }
                    : {}),
                  ...(weight
                    ? { weightKg: Number(weight.replace(',', '.')) }
                    : {}),
                })
                await health.reload()
              }, 'Dados privados atualizados.')
            }
          />
        </Panel>
      )}
      <Panel>
        <Heading small>Exportar meus dados</Heading>
        <Body muted>
          A exportação contém dados privados. Compartilhe apenas com destinos
          escolhidos por você.
        </Body>
        <Button
          title="Gerar e compartilhar exportação"
          disabled={action.busy}
          onPress={() =>
            void action.run(async () => {
              await shareExport(await api('/privacy/export'))
            })
          }
        />
      </Panel>
      <Panel>
        <Heading small>Encerrar conta</Heading>
        <Field
          label="Confirme sua senha"
          value={password}
          onChange={setPassword}
          secure
        />
        <Button
          title="Solicitar exclusão e encerramento"
          destructive
          disabled={action.busy || !password}
          onPress={close}
        />
      </Panel>
    </>
  )
}
