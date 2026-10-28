import { useState } from 'react'
import type { CoachCard } from '../../../../shared/contracts'
import { SPORTS } from '../../../../shared/contracts'
import { api } from '../../services/api'
import { money } from '../../utils/format'
import { useAction } from '../../hooks/useAction'
import { useRemote } from '../../hooks/useRemote'
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
} from '../../components/ui'
import { number, items } from '../../utils/forms'

export function DiscoverScreen() {
  const [sport, setSport] = useState(''),
    [query, setQuery] = useState(''),
    [maxPrice, setMaxPrice] = useState('')
  const remote = useRemote<{ coaches: CoachCard[] }>(
      `/coaches?${new URLSearchParams({ ...(sport ? { sport } : {}), ...(query ? { query } : {}), ...(maxPrice ? { maxPrice: String(number(maxPrice)) } : {}) })}`,
    ),
    action = useAction()
  return (
    <>
      <Heading>Encontre seu treinador</Heading>
      <Panel>
        <Field label="Buscar por nome" value={query} onChange={setQuery} />
        <Choices
          label="Modalidade"
          options={[{ id: '', label: 'Todas' }, ...items(SPORTS)]}
          selected={[sport]}
          onChange={(values) => setSport(values[0])}
        />
        <Field
          label="Preço máximo mensal (R$)"
          value={maxPrice}
          onChange={setMaxPrice}
          numeric
        />
      </Panel>
      {remote.loading && <Loading />}
      {remote.error && <Notice message={remote.error} error />}
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      {remote.data?.coaches.map((coach) => (
        <Panel key={coach.userId}>
          <Heading small>{coach.name}</Heading>
          <Body muted>
            {coach.city} · {coach.mode} · {coach.score}% de afinidade
          </Body>
          <Body>{coach.bio}</Body>
          <Body>{coach.sports.join(' · ')}</Body>
          <Body>CREF informado: {coach.cref}</Body>
          <Body muted>{coach.reasons.join(' · ')}</Body>
          <Body>{money(coach.price * 100)}/mês</Body>
          <Button
            title={`Solicitar acompanhamento de ${coach.name}`}
            disabled={action.busy}
            onPress={() =>
              void action.run(async () => {
                await api('/contracts', 'POST', { coachId: coach.userId })
              }, 'Solicitação enviada. Acompanhe na aba Vínculos.')
            }
          />
        </Panel>
      ))}
      {remote.data && !remote.data.coaches.length && (
        <Empty>
          Nenhum profissional compatível no filtro. Confira seu perfil e
          objetivos.
        </Empty>
      )}
    </>
  )
}
