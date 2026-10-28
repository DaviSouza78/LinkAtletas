import { useState } from 'react'
import { Alert } from 'react-native'
import { openExternal } from '../../services/externalLinks'
import type { Contract } from '../../../../shared/contracts'
import type {
  BillingConfig,
  BillingSubscription,
  BillingSummary,
} from '../../../../shared/billing-contracts'
import { api } from '../../services/api'
import { datetime, money } from '../../utils/format'
import { useAction } from '../../hooks/useAction'
import { useRemote } from '../../hooks/useRemote'
import { useSession } from '../../context/SessionContext'
import { CoachBillingSettings } from './CoachBillingSettings'
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
  const coach = useSession().role === 'coach'
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
      {summary.data && (
        <Panel>
          <Body>
            Total confirmado: {money(summary.data.totals.receivedCents)}
          </Body>
          <Body>
            Parcela estimada dos treinadores:{' '}
            {money(summary.data.totals.coachShareCents)}
          </Body>
          <Body>
            Parcela estimada da plataforma:{' '}
            {money(summary.data.totals.platformShareCents)}
          </Body>
        </Panel>
      )}
      {coach && <CoachBillingSettings />}
      {!coach &&
        config.data?.available &&
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
                      await openExternal(subscription.checkoutUrl)
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
                disabled={action.busy}
                onPress={() =>
                  void action.run(() => openExternal(subscription.checkoutUrl!))
                }
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
