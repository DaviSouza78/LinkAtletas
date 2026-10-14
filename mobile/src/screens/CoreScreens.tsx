import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import type {
  CoachCard,
  Contract,
  Dashboard,
  Profile,
  ProfileInput,
} from '../../../shared/contracts'
import { GOALS, LEVELS, SLOTS, SPORTS } from '../../../shared/contracts'
import { api } from '../api'
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

const items = (options: readonly string[]) =>
  options.map((value) => ({ id: value, label: value }))
const number = (value: string) => Number(value.replace(',', '.'))
const status: Record<string, string> = {
  active: 'Ativo',
  pending: 'Aguardando treinador',
  rejected: 'Recusado',
  cancelled: 'Encerrado',
  suspended: 'Suspenso',
}
export function HomeScreen({
  name,
  navigate,
}: {
  name: string
  navigate: (target: string) => void
}) {
  const remote = useRemote<Dashboard>('/dashboard')
  return (
    <>
      <Heading>Olá, {name.split(' ')[0]}</Heading>
      <Body muted>
        Veja seus próximos passos e mantenha seu acompanhamento em dia.
      </Body>
      {remote.loading && <Loading />}
      {remote.error && <Notice message={remote.error} error />}
      {remote.data && (
        <>
          <Panel>
            <Heading small>Seu acompanhamento</Heading>
            <Body>
              {
                remote.data.contracts.filter((c) => c.status === 'active')
                  .length
              }{' '}
              vínculo(s) ativo(s)
            </Body>
            <Body>
              {remote.data.workouts.filter((w) => !w.execution).length}{' '}
              treino(s) aguardando registro
            </Body>
            <Row>
              <Button title="Ver treinos" onPress={() => navigate('Treinos')} />
              <Button
                title="Ver agenda"
                secondary
                onPress={() => navigate('Agenda')}
              />
            </Row>
          </Panel>
          {remote.data.workouts.slice(0, 3).map((workout) => (
            <Panel key={workout.id}>
              <Body muted>
                {workout.sport} ·{' '}
                {workout.scheduledDate.split('-').reverse().join('/')}
              </Body>
              <Heading small>{workout.title}</Heading>
              <Body>{workout.instructions}</Body>
              <Body muted>
                {workout.execution
                  ? 'Execução registrada'
                  : 'Aguardando sua execução'}
              </Body>
              <Button
                title="Abrir treinos"
                secondary
                onPress={() => navigate('Treinos')}
              />
            </Panel>
          ))}
          {!remote.data.contracts.length && (
            <Panel>
              <Heading small>Encontre seu treinador</Heading>
              <Body>
                Complete seu perfil para descobrir profissionais compatíveis com
                seus objetivos.
              </Body>
              <Row>
                <Button
                  title="Completar perfil"
                  onPress={() => navigate('Perfil')}
                />
                <Button
                  title="Buscar treinadores"
                  secondary
                  onPress={() => navigate('Buscar')}
                />
              </Row>
            </Panel>
          )}
        </>
      )}
    </>
  )
}
export function ProfileScreen({
  onUpdated,
}: {
  onUpdated: (name: string) => void
}) {
  const remote = useRemote<{ profile: Profile }>('/profiles/me'),
    action = useAction()
  const [form, setForm] = useState<ProfileInput | null>(null),
    [budget, setBudget] = useState('')
  useEffect(() => {
    if (remote.data) {
      const p = remote.data.profile
      setForm({
        name: p.name,
        city: p.city,
        bio: p.bio,
        sports: p.sports,
        goals: p.goals,
        levels: p.levels,
        availability: p.availability,
        mode: p.mode,
        budget: p.budget,
        price: p.price,
      })
      setBudget(String(p.budget))
    }
  }, [remote.data])
  const patch = (value: Partial<ProfileInput>) =>
    setForm((current) => (current ? { ...current, ...value } : current))
  return (
    <>
      <Heading>Seu perfil</Heading>
      {remote.loading && <Loading />}
      {remote.error && <Notice message={remote.error} error />}
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      {form && (
        <Panel>
          <Field
            label="Nome"
            value={form.name}
            onChange={(name) => patch({ name })}
          />
          <Field
            label="Cidade"
            value={form.city}
            onChange={(city) => patch({ city })}
          />
          <Field
            label="Sobre você"
            value={form.bio}
            onChange={(bio) => patch({ bio })}
            multiline
          />
          <Choices
            label="Modalidades"
            options={items(SPORTS)}
            selected={form.sports}
            onChange={(sports) => patch({ sports })}
            multiple
          />
          <Choices
            label="Objetivos"
            options={items(GOALS)}
            selected={form.goals}
            onChange={(goals) => patch({ goals })}
            multiple
          />
          <Choices
            label="Nível"
            options={items(LEVELS)}
            selected={form.levels}
            onChange={(levels) => patch({ levels })}
            multiple
          />
          <Choices
            label="Disponibilidade"
            options={items(SLOTS)}
            selected={form.availability}
            onChange={(availability) => patch({ availability })}
            multiple
          />
          <Choices
            label="Formato"
            options={[
              { id: 'online', label: 'Online' },
              { id: 'presencial', label: 'Presencial' },
              { id: 'hibrido', label: 'Híbrido' },
            ]}
            selected={[form.mode]}
            onChange={(mode) =>
              patch({ mode: mode[0] as ProfileInput['mode'] })
            }
          />
          <Field
            label="Orçamento mensal (R$)"
            value={budget}
            onChange={setBudget}
            numeric
          />
          <Button
            title="Salvar perfil"
            disabled={action.busy}
            onPress={() =>
              void action.run(async () => {
                const { profile } = await api<{ profile: Profile }>(
                  '/profiles/me',
                  'PUT',
                  { ...form, budget: number(budget) },
                )
                onUpdated(profile.name)
                await remote.reload()
              }, 'Perfil atualizado.')
            }
          />
        </Panel>
      )}
    </>
  )
}
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
export function ConnectionsScreen() {
  const remote = useRemote<{ contracts: Contract[] }>('/contracts'),
    action = useAction(),
    [reason, setReason] = useState('')
  const cancel = (contract: Contract) =>
    Alert.alert(
      'Encerrar vínculo',
      `Deseja encerrar seu vínculo com ${contract.coachName}? Se houver assinatura paga, a vigência segue a confirmação financeira.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Confirmar encerramento',
          style: 'destructive',
          onPress: () =>
            void action.run(async () => {
              await api(`/contracts/${contract.id}/cancel`, 'POST', { reason })
              await remote.reload()
            }, 'Solicitação de encerramento registrada.'),
        },
      ],
    )
  return (
    <>
      <Heading>Seus vínculos</Heading>
      {remote.loading && <Loading />}
      {remote.error && <Notice message={remote.error} error />}
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      <Panel>
        <Field
          label="Motivo para retirar solicitação ou encerrar"
          value={reason}
          onChange={setReason}
          hint="Ao menos 5 caracteres. Informe antes de confirmar o encerramento."
        />
      </Panel>
      {remote.data?.contracts.map((contract) => (
        <Panel key={contract.id}>
          <Heading small>{contract.coachName}</Heading>
          <Body>{status[contract.status] || contract.status}</Body>
          <Body muted>Solicitado em {datetime(contract.createdAt)}</Body>
          {['active', 'pending', 'suspended'].includes(contract.status) && (
            <Button
              title={
                contract.status === 'pending'
                  ? 'Retirar solicitação'
                  : 'Solicitar encerramento'
              }
              destructive
              disabled={action.busy || reason.trim().length < 5}
              onPress={() => cancel(contract)}
            />
          )}
        </Panel>
      ))}
      {remote.data && !remote.data.contracts.length && (
        <Empty>Você ainda não possui solicitações. Explore a aba Buscar.</Empty>
      )}
    </>
  )
}
