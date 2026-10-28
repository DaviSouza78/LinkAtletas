import { useEffect, useState } from 'react'
import type {
  BillingPlan,
  BillingWallet,
} from '../../../../shared/billing-contracts'
import { api } from '../../services/api'
import { useRemote } from '../../hooks/useRemote'
import { useAction } from '../../hooks/useAction'
import {
  Body,
  Button,
  Choices,
  Field,
  Heading,
  Notice,
  Panel,
} from '../../components/ui'
import { RemoteState } from '../../components/RemoteState'
import { number } from '../../utils/forms'

export function CoachBillingSettings() {
  const plan = useRemote<{ plan: BillingPlan | null }>('/billing/plan'),
    wallet = useRemote<{ wallet: BillingWallet | null }>('/billing/wallet'),
    action = useAction()
  const [name, setName] = useState('Acompanhamento mensal'),
    [amount, setAmount] = useState(''),
    [active, setActive] = useState(true),
    [walletId, setWalletId] = useState('')
  useEffect(() => {
    if (plan.data?.plan) {
      setName(plan.data.plan.name)
      setAmount(String(plan.data.plan.amountCents / 100))
      setActive(plan.data.plan.active)
    }
  }, [plan.data])
  useEffect(() => {
    if (wallet.data?.wallet) setWalletId(wallet.data.wallet.walletId)
  }, [wallet.data])
  return (
    <Panel>
      <Heading small>Plano e carteira de recebimento</Heading>
      <RemoteState remote={plan} />
      <RemoteState remote={wallet} />
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      <Field label="Nome do plano" value={name} onChange={setName} />
      <Field
        label="Mensalidade (R$)"
        value={amount}
        onChange={setAmount}
        numeric
      />
      <Choices
        label="Novas assinaturas"
        options={[
          { id: 'yes', label: 'Disponivel' },
          { id: 'no', label: 'Indisponivel' },
        ]}
        selected={[active ? 'yes' : 'no']}
        onChange={(values) => setActive(values[0] === 'yes')}
      />
      <Button
        title="Salvar plano"
        disabled={action.busy}
        onPress={() =>
          void action.run(async () => {
            if (
              !amount.trim() ||
              !Number.isFinite(number(amount)) ||
              number(amount) < 1 ||
              number(amount) > 100000
            )
              throw new Error('Informe mensalidade entre R$ 1 e R$ 100000.')
            await api('/billing/plan', 'PUT', {
              name,
              amountCents: Math.round(number(amount) * 100),
              active,
            })
            await plan.reload()
          }, 'Plano salvo.')
        }
      />
      <Field
        label="Identificador da carteira Asaas"
        value={walletId}
        onChange={setWalletId}
      />
      <Body>
        Use a carteira da sua conta elegivel no mesmo ambiente do provedor.
        Identificador nao e chave de API nem comprova homologacao.
      </Body>
      <Button
        title="Salvar carteira"
        disabled={action.busy}
        onPress={() =>
          void action.run(async () => {
            await api('/billing/wallet', 'PUT', { walletId: walletId.trim() })
            await wallet.reload()
          }, 'Carteira salva.')
        }
      />
    </Panel>
  )
}
