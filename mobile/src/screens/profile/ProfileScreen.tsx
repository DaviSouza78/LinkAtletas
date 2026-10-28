import { useEffect, useState } from 'react'
import type { Profile, ProfileInput } from '../../../../shared/contracts'
import { GOALS, LEVELS, SLOTS, SPORTS } from '../../../../shared/contracts'
import { api } from '../../services/api'
import { useAction } from '../../hooks/useAction'
import { useRemote } from '../../hooks/useRemote'
import {
  Button,
  Choices,
  Field,
  Heading,
  Loading,
  Notice,
  Panel,
} from '../../components/ui'
import { items, number } from '../../utils/forms'
import { useSession } from '../../context/SessionContext'
import { CoachVerification } from '../verification/CoachVerification'

export function ProfileScreen({
  onUpdated,
}: {
  onUpdated: (name: string) => void
}) {
  const remote = useRemote<{ profile: Profile }>('/profiles/me'),
    action = useAction()
  const user = useSession()
  const [form, setForm] = useState<ProfileInput | null>(null),
    [budget, setBudget] = useState(''),
    [price, setPrice] = useState('')
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
      setPrice(String(p.price))
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
            label={
              user.role === 'coach'
                ? 'Preco mensal (R$)'
                : 'Orçamento mensal (R$)'
            }
            value={user.role === 'coach' ? price : budget}
            onChange={user.role === 'coach' ? setPrice : setBudget}
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
                  { ...form, budget: number(budget), price: number(price) },
                )
                onUpdated(profile.name)
                await remote.reload()
              }, 'Perfil atualizado.')
            }
          />
        </Panel>
      )}
      {user.role === 'coach' && remote.data && (
        <CoachVerification
          currentStatus={remote.data.profile.verificationStatus}
          onChange={remote.reload}
        />
      )}
    </>
  )
}
