import { describe, expect, it } from 'vitest'
import type { Workout, WorkoutInput } from '../../shared/contracts'
import {
  blockDraft,
  serializeBlocks,
  workoutPayload,
} from '../src/utils/workouts'

const form: Omit<WorkoutInput, 'blocks'> = {
  contractId: '11111111-1111-4111-8111-111111111111',
  title: 'Treino teste',
  sport: 'Corrida',
  scheduledDate: '2026-10-28',
  instructions: 'Leve',
  status: 'draft',
}
const block = () => ({
  ...blockDraft(),
  name: 'Corrida leve',
  durationMinutes: '10,5',
})
describe('prescricao nativa de treinos', () => {
  it('converte virgula decimal e omite campos opcionais vazios', () =>
    expect(serializeBlocks([block()])).toEqual([
      { name: 'Corrida leve', instructions: '', durationMinutes: 10.5 },
    ]))
  it.each(['draft', 'published'] as const)(
    'serializa ficha %s sem campos privados de leitura',
    (status) => {
      const result = workoutPayload({ ...form, status }, [block()])
      expect(result).toEqual({
        ...form,
        status,
        blocks: serializeBlocks([block()]),
      })
      expect(result).not.toHaveProperty('coachId')
    },
  )
  it.each([
    'javascript:alert(1)',
    'http://example.test/video',
    'https://u:p@example.test/video',
    'https://example.test/<video>',
    'https://example.test/vi deo',
  ])('recusa referencia externa insegura: %s', (videoUrl) =>
    expect(() => serializeBlocks([{ ...block(), videoUrl }])).toThrow(),
  )
  it('mantem referencia HTTPS somente como texto sem fazer requisicoes', () =>
    expect(
      serializeBlocks([
        { ...block(), videoUrl: 'https://example.test/video' },
      ])[0].videoUrl,
    ).toBe('https://example.test/video'))
  it.each(['-1', '1001', 'NaN', 'Infinity'])(
    'recusa carga fora dos limites: %s',
    (loadKg) =>
      expect(() => serializeBlocks([{ ...block(), loadKg }])).toThrow(),
  )
  it('recusa series fracionarias e lista de blocos vazia', () => {
    expect(() => serializeBlocks([{ ...block(), sets: '2,5' }])).toThrow()
    expect(() => serializeBlocks([])).toThrow()
    expect(() => serializeBlocks(Array.from({ length: 51 }, block))).toThrow()
  })
  it.each(['2026-02-30', '28/10/2026', 'invalida'])(
    'recusa data invalida: %s',
    (scheduledDate) =>
      expect(() =>
        workoutPayload({ ...form, scheduledDate }, [block()]),
      ).toThrow(),
  )
  it('impede edicao de ficha executada ou transferencia de vinculo', () => {
    const original = {
      ...form,
      blocks: serializeBlocks([block()]),
      execution: {
        id: 'execucao',
        completedBlocks: [0],
        effort: 5,
        notes: '',
        metrics: {},
        updatedAt: '',
      },
    } as Workout
    expect(() => workoutPayload(form, [block()], original)).toThrow(
      'preservado',
    )
    expect(() =>
      workoutPayload({ ...form, contractId: 'outro' }, [block()], {
        ...original,
        execution: null,
      }),
    ).toThrow('transferir')
  })
})
