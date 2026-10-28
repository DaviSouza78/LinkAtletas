import {
  SPORTS,
  type ExerciseBlock,
  type Workout,
  type WorkoutInput,
} from '../../../shared/contracts'

export type BlockDraft = Record<
  | 'name'
  | 'instructions'
  | 'sets'
  | 'repetitions'
  | 'loadKg'
  | 'durationMinutes'
  | 'distanceKm'
  | 'videoUrl',
  string
>
export const blockFields = [
  ['sets', 'Series', 1, 100],
  ['repetitions', 'Repeticoes', 1, 10000],
  ['loadKg', 'Carga (kg)', 0, 1000],
  ['durationMinutes', 'Duracao (min)', 0, 1440],
  ['distanceKm', 'Distancia (km)', 0, 1500],
] as const
export function blockDraft(block?: ExerciseBlock): BlockDraft {
  return {
    name: block?.name || '',
    instructions: block?.instructions || '',
    sets: block?.sets?.toString() || '',
    repetitions: block?.repetitions?.toString() || '',
    loadKg: block?.loadKg?.toString() || '',
    durationMinutes: block?.durationMinutes?.toString() || '',
    distanceKm: block?.distanceKm?.toString() || '',
    videoUrl: block?.videoUrl || '',
  }
}
export function serializeBlocks(blocks: BlockDraft[]): ExerciseBlock[] {
  if (!blocks.length || blocks.length > 50)
    throw new Error('Informe de 1 a 50 blocos.')
  return blocks.map((block) => {
    if (
      block.name.trim().length < 2 ||
      block.name.trim().length > 150 ||
      block.instructions.length > 2000
    )
      throw new Error('Revise nome e instrucoes dos blocos.')
    const result: ExerciseBlock = {
      name: block.name.trim(),
      instructions: block.instructions.trim(),
    }
    for (const [key, label, min, max] of blockFields) {
      if (!block[key].trim()) continue
      const value = Number(block[key].replace(',', '.'))
      if (
        !Number.isFinite(value) ||
        value < min ||
        value > max ||
        ((key === 'sets' || key === 'repetitions') && !Number.isInteger(value))
      )
        throw new Error(`Valor invalido: ${label}.`)
      result[key] = value
    }
    if (block.videoUrl.trim()) {
      const value = block.videoUrl.trim()
      let url: URL
      try {
        url = new URL(value)
      } catch {
        throw new Error('Referencia externa invalida.')
      }
      if (
        value.length > 2000 ||
        /[\u0000-\u0020\u007f<>"\\]/.test(value) ||
        url.protocol !== 'https:' ||
        url.username ||
        url.password
      )
        throw new Error(
          'Use referencia HTTPS sem credenciais ou caracteres invalidos.',
        )
      result.videoUrl = value
    }
    return result
  })
}
export function workoutPayload(
  form: Omit<WorkoutInput, 'blocks'>,
  blocks: BlockDraft[],
  original?: Workout,
): WorkoutInput {
  if (original?.execution)
    throw new Error(
      'Treino executado deve ser preservado. Crie uma nova ficha.',
    )
  if (original && original.contractId !== form.contractId)
    throw new Error('Nao e permitido transferir uma ficha para outro vinculo.')
  if (
    !form.contractId ||
    form.title.trim().length < 3 ||
    form.title.trim().length > 160 ||
    form.instructions.length > 3000 ||
    !(SPORTS as readonly string[]).includes(form.sport)
  )
    throw new Error('Revise vinculo, titulo, modalidade e instrucoes.')
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(form.scheduledDate) ||
    !Number.isFinite(Date.parse(form.scheduledDate)) ||
    new Date(form.scheduledDate).toISOString().slice(0, 10) !==
      form.scheduledDate
  )
    throw new Error('Informe uma data valida no formato AAAA-MM-DD.')
  return {
    ...form,
    title: form.title.trim(),
    instructions: form.instructions.trim(),
    blocks: serializeBlocks(blocks),
  }
}
