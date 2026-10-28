import { describe, expect, it } from 'vitest'
import type { Profile } from '../../shared/contracts.js'
import { calculateMatch } from '../../server/modules/training/matching.js'

const athlete: Profile = {
  userId: '00000000-0000-4000-8000-000000000001',
  role: 'athlete',
  name: 'Atleta',
  email: 'athlete@test.local',
  city: 'São Paulo',
  bio: '',
  sports: ['Corrida'],
  goals: ['Performance'],
  levels: ['Iniciante'],
  availability: ['Segunda manhã'],
  mode: 'online',
  budget: 200,
  price: 0,
  cref: '',
  verificationStatus: 'unsubmitted',
  verificationReason: '',
}
const coach: Profile = {
  ...athlete,
  userId: '00000000-0000-4000-8000-000000000002',
  role: 'coach',
  name: 'Treinadora',
  email: 'coach@test.local',
  price: 150,
  budget: 0,
  verificationStatus: 'approved',
  cref: '123456-G/SP',
}

describe('recomendação explicável de profissionais', () => {
  it('soma os pesos documentados até 100 e informa os critérios', () => {
    const result = calculateMatch(athlete, coach)
    expect(result?.score).toBe(100)
    expect(result?.reasons.length).toBeGreaterThanOrEqual(4)
    expect(
      result?.reasons.every(
        (reason) => typeof reason === 'string' && reason.length > 0,
      ),
    ).toBe(true)
  })

  it.each(['pending', 'rejected', 'unsubmitted'] as const)(
    'exclui treinador %s',
    (verificationStatus) => {
      expect(
        calculateMatch(athlete, { ...coach, verificationStatus }),
      ).toBeNull()
    },
  )

  it('exige modalidade esportiva em comum', () => {
    expect(
      calculateMatch(athlete, { ...coach, sports: ['Natação'] }),
    ).toBeNull()
  })

  it('exige mesma cidade para atendimento presencial', () => {
    expect(
      calculateMatch(
        { ...athlete, mode: 'presencial' },
        { ...coach, mode: 'presencial', city: 'Curitiba' },
      ),
    ).toBeNull()
    expect(
      calculateMatch(
        { ...athlete, mode: 'presencial' },
        { ...coach, mode: 'presencial' },
      )?.score,
    ).toBe(100)
  })

  it('permite cidades distintas para atendimento online', () => {
    expect(calculateMatch(athlete, { ...coach, city: 'Curitiba' })?.score).toBe(
      100,
    )
  })

  it('não recomenda treinador exclusivamente presencial de outra cidade para atleta híbrido', () => {
    expect(
      calculateMatch(
        { ...athlete, mode: 'hibrido' },
        { ...coach, mode: 'presencial', city: 'Curitiba' },
      ),
    ).toBeNull()
  })

  it.each([
    [{ goals: [] }, 70],
    [{ levels: [] }, 80],
    [{ price: 201 }, 75],
    [{ availability: [] }, 75],
  ])(
    'retira apenas o peso do critério incompatível: %j',
    (change, expected) => {
      expect(calculateMatch(athlete, { ...coach, ...change })?.score).toBe(
        expected,
      )
    },
  )

  it('não atribui pontos a critérios ausentes no perfil do atleta', () => {
    expect(
      calculateMatch(
        { ...athlete, goals: [], levels: [], availability: [], budget: 0 },
        coach,
      )?.score,
    ).toBe(0)
  })
})
