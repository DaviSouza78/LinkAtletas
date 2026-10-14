import { useEffect, useState } from 'react'
import { Alert, Linking } from 'react-native'
import type { Contract } from '../../../shared/contracts'
import type {
  BillingConfig,
  BillingSubscription,
  BillingSummary,
} from '../../../shared/billing-contracts'
import { api, forgetSession, shareExport } from '../api'
import { datetime, money, useAction, useRemote } from '../hooks'
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

const billingState: Record<string, string> = {
  awaiting_payment: 'Aguardando pagamento',
  regular: 'Regular',
  grace: 'Carência',
  suspended: 'Suspensa',
  cancellation_requested: 'Cancelamento solicitado',
  ended: 'Encerrada',
  uncertain: 'Aguardando conciliação',
}
export function FinanceScreen() {
  const config = useRemote<BillingConfig>('/billing/config'),
    summary = useRemote<BillingSummary>('/billing/summary'),
    contracts = useRemote<{ contracts: Contract[] }>('/contracts'),
    action = useAction()
  const [reason, setReason] = useState('')
  const cancel = (subscription: BillingSubscription) =>
    Alert.alert(
      'Cancelar renovação',
      'A solicitação interrompe novas renovações após confirmação do provedor. A vigência já paga segue disponível.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: () =>
            void action.run(async () => {
              await api(
                `/billing/subscriptions/${subscription.id}/cancel`,
                'POST',
                { reason },
              )
              await summary.reload()
            }, 'Solicitação registrada. Confira o estado financeiro atualizado.'),
        },
      ],
    )
  return (
    <>
      <Heading>Financeiro</Heading>
      {config.loading && <Loading />}
      {config.error && <Notice message={config.error} error />}
      {summary.error && <Notice message={summary.error} error />}
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      {config.data && (
        <Panel>
          <Heading small>
            {config.data.mode === 'academic'
              ? 'Demonstração sem cobrança'
              : config.data.environment === 'sandbox'
                ? 'Gateway em sandbox'
                : 'Gateway em produção'}
          </Heading>
          <Body>
            {config.data.mode === 'academic'
              ? 'O acompanhamento acadêmico não gera pagamentos ou repasses.'
              : config.data.available
                ? 'O pagamento acontece no checkout hospedado. Retornar ao aplicativo não confirma pagamento.'
                : 'O gateway aguarda configuração do responsável. Nenhum pagamento será criado.'}
          </Body>
        </Panel>
      )}
      {config.data?.available &&
        contracts.data?.contracts
          .filter((contract) => contract.status === 'active')
          .map((contract) => (
            <Panel key={contract.id}>
              <Heading small>{contract.coachName}</Heading>
              <Button
                title="Obter checkout de assinatura"
                disabled={action.busy}
                onPress={() =>
                  void action.run(async () => {
                    const { subscription } = await api<{
                      subscription: BillingSubscription
                    }>('/billing/checkout', 'POST', { contractId: contract.id })
                    await summary.reload()
                    if (subscription.checkoutUrl?.startsWith('https://'))
                      await Linking.openURL(subscription.checkoutUrl)
                    else
                      throw new Error(
                        'Checkout aguarda confirmação do provedor.',
                      )
                  })
                }
              />
            </Panel>
          ))}
      {summary.data?.subscriptions.map((subscription) => (
        <Panel key={subscription.id}>
          <Heading small>
            {subscription.planName} · {subscription.coachName}
          </Heading>
          <Body>{money(subscription.amountCents)} / mês</Body>
          <Body>{billingState[subscription.state] || subscription.state}</Body>
          <Body muted>
            {subscription.environment === 'sandbox' ? 'Sandbox' : 'Produção'}
            {subscription.paidUntil
              ? ` · acesso pago até ${datetime(subscription.paidUntil)}`
              : ''}
          </Body>
          {subscription.checkoutUrl &&
            subscription.state === 'awaiting_payment' && (
              <Button
                title="Abrir checkout hospedado"
                secondary
                onPress={() => {
                  if (subscription.checkoutUrl?.startsWith('https://'))
                    void Linking.openURL(subscription.checkoutUrl)
                }}
              />
            )}
          <Body muted>
            {subscription.cancellationConfirmed
              ? 'Cancelamento confirmado pelo provedor.'
              : 'Cancelamento não confirmado pelo provedor.'}
          </Body>
          {!['ended', 'cancellation_requested'].includes(
            subscription.state,
          ) && (
            <>
              <Field
                label="Motivo do cancelamento"
                value={reason}
                onChange={setReason}
              />
              <Button
                title="Cancelar renovação"
                destructive
                disabled={action.busy || reason.trim().length < 5}
                onPress={() => cancel(subscription)}
              />
            </>
          )}
        </Panel>
      ))}
      {summary.data?.payments.map((payment) => (
        <Panel key={payment.id}>
          <Heading small>{money(payment.amountCents)}</Heading>
          <Body>{payment.status}</Body>
          <Body muted>
            {payment.environment} ·{' '}
            {payment.paidAt
              ? datetime(payment.paidAt)
              : 'Pagamento não confirmado'}
          </Body>
        </Panel>
      ))}
      {summary.data && !summary.data.subscriptions.length && (
        <Empty>Nenhuma assinatura financeira registrada.</Empty>
      )}
      <Button
        title="Atualizar financeiro"
        secondary
        onPress={() => void summary.reload()}
      />
    </>
  )
}
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
