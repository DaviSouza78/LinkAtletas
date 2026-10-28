import { useState } from 'react'
import {
  SPORTS,
  type Contract,
  type Workout,
  type WorkoutInput,
} from '../../../../shared/contracts'
import { api } from '../../services/api'
import { useAction } from '../../hooks/useAction'
import {
  Body,
  Button,
  Choices,
  Field,
  Heading,
  Notice,
  Panel,
  Row,
} from '../../components/ui'
import { blockDraft, blockFields, workoutPayload } from '../../utils/workouts'

export function WorkoutEditor({
  workout,
  contracts,
  onSaved,
  onCancel,
}: {
  workout?: Workout
  contracts: Contract[]
  onSaved: () => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<Omit<WorkoutInput, 'blocks'>>({
    contractId: workout?.contractId || contracts[0]?.id || '',
    title: workout?.title || '',
    sport: workout?.sport || 'Corrida',
    scheduledDate:
      workout?.scheduledDate.slice(0, 10) ||
      new Date().toLocaleDateString('en-CA'),
    instructions: workout?.instructions || '',
    status: workout?.status || 'draft',
  })
  const [blocks, setBlocks] = useState(
    workout ? workout.blocks.map(blockDraft) : [blockDraft()],
  )
  const action = useAction()
  const save = (status: 'draft' | 'published') =>
    action.run(async () => {
      await api(
        workout ? `/workouts/${workout.id}` : '/workouts',
        workout ? 'PUT' : 'POST',
        workoutPayload({ ...form, status }, blocks, workout),
      )
      await onSaved()
    })
  return (
    <Panel>
      <Heading small>
        {workout ? 'Editar ficha' : 'Nova ficha de treino'}
      </Heading>
      <Body>
        Somente vinculos ativos e elegiveis. Campos numericos vazios sao
        opcionais.
      </Body>
      {!workout && (
        <Choices
          label="Atleta"
          options={contracts.map((item) => ({
            id: item.id,
            label: item.athleteName,
          }))}
          selected={[form.contractId]}
          onChange={(values) => setForm({ ...form, contractId: values[0] })}
        />
      )}
      <Field
        label="Titulo do treino"
        value={form.title}
        onChange={(title) => setForm({ ...form, title })}
      />
      <Choices
        label="Modalidade do treino"
        options={SPORTS.map((sport) => ({ id: sport, label: sport }))}
        selected={[form.sport]}
        onChange={(values) => setForm({ ...form, sport: values[0] })}
      />
      <Field
        label="Data do treino (AAAA-MM-DD)"
        value={form.scheduledDate}
        onChange={(scheduledDate) => setForm({ ...form, scheduledDate })}
      />
      <Field
        label="Orientacoes gerais"
        value={form.instructions}
        onChange={(instructions) => setForm({ ...form, instructions })}
        multiline
      />
      {blocks.map((block, index) => (
        <Panel key={index}>
          <Heading small>Bloco {index + 1}</Heading>
          {(
            [
              ['name', 'Nome do exercicio'],
              ['instructions', 'Instrucoes do exercicio'],
              ['videoUrl', 'Referencia HTTPS (texto)'],
            ] as const
          ).map(([key, label]) => (
            <Field
              key={key}
              label={`${label} ${index + 1}`}
              value={block[key]}
              onChange={(value) =>
                setBlocks((previous) =>
                  previous.map((item, position) =>
                    position === index ? { ...item, [key]: value } : item,
                  ),
                )
              }
              multiline={key === 'instructions'}
            />
          ))}
          {blockFields.map(([key, label, min, max]) => (
            <Field
              key={key}
              label={`${label} ${index + 1}`}
              value={block[key]}
              onChange={(value) =>
                setBlocks((previous) =>
                  previous.map((item, position) =>
                    position === index ? { ...item, [key]: value } : item,
                  ),
                )
              }
              numeric
              hint={`${min} a ${max}; opcional.`}
            />
          ))}
          {blocks.length > 1 && (
            <Button
              title={`Remover bloco ${index + 1}`}
              destructive
              disabled={action.busy}
              onPress={() =>
                setBlocks((previous) =>
                  previous.filter((_, position) => position !== index),
                )
              }
            />
          )}
        </Panel>
      ))}
      <Button
        title="Adicionar bloco"
        secondary
        disabled={action.busy || blocks.length >= 50}
        onPress={() => setBlocks((previous) => [...previous, blockDraft()])}
      />
      {action.error && <Notice message={action.error} error />}
      <Row>
        <Button
          title="Salvar rascunho"
          disabled={action.busy}
          onPress={() => void save('draft')}
        />
        <Button
          title="Publicar treino"
          disabled={action.busy}
          onPress={() => void save('published')}
        />
        <Button
          title="Cancelar edicao"
          secondary
          disabled={action.busy}
          onPress={onCancel}
        />
      </Row>
    </Panel>
  )
}
