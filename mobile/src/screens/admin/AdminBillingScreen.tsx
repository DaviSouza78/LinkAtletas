import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import type { BillingConfig } from '../../../../shared/billing-contracts'
import { api } from '../../services/api'
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
import { number } from '../../utils/forms'

export function AdminBillingScreen() {
  const remote = useRemote<BillingConfig>('/billing/config'),
    action = useAction()
  const [commission, setCommission] = useState(''),
    [grace, setGrace] = useState('')
  useEffect(() => {
    if (remote.data) {
      setCommission(String(remote.data.commissionBps / 100))
      setGrace(String(remote.data.graceDays))
    }
  }, [remote.data])
  return (
    <>
      <Heading>Regras financeiras</Heading>
      <RemoteState remote={remote} />
      {remote.data && (
        <Panel>
          <Body>
            Modo: {remote.data.mode} | Ambiente: {remote.data.environment}
          </Body>
          <Body>Modo academico nao gera cobranca nem repasses reais.</Body>
          <Field
            label="Comissao da plataforma (%)"
            value={commission}
            onChange={setCommission}
            numeric
            hint="De 0 a 50%."
          />
          <Field
            label="Carencia (dias)"
            value={grace}
            onChange={setGrace}
            numeric
            hint="Inteiro de 0 a 30."
          />
          {action.error && <Notice message={action.error} error />}
          {action.notice && <Notice message={action.notice} />}
          <Button
            title="Salvar regras"
            disabled={action.busy}
            onPress={() =>
              Alert.alert(
                'Alterar regras financeiras',
                'As novas operacoes usarao as regras registradas. Confirmar?',
                [
                  { text: 'Voltar', style: 'cancel' },
                  {
                    text: 'Confirmar',
                    onPress: () =>
                      void action.run(async () => {
                        if (
                          !commission.trim() ||
                          !grace.trim() ||
                          !Number.isFinite(number(commission)) ||
                          number(commission) < 0 ||
                          number(commission) > 50 ||
                          !Number.isInteger(number(grace)) ||
                          number(grace) < 0 ||
                          number(grace) > 30
                        )
                          throw new Error(
                            'Informe comissao e carencia dentro dos limites.',
                          )
                        await api('/admin/billing/settings', 'PATCH', {
                          commissionBps: Math.round(number(commission) * 100),
                          graceDays: number(grace),
                        })
                        await remote.reload()
                      }, 'Regras atualizadas.'),
                  },
                ],
              )
            }
          />
        </Panel>
      )}
    </>
  )
}
