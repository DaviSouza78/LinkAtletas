import * as DocumentPicker from 'expo-document-picker'
import { useState } from 'react'
import { Alert } from 'react-native'
import type { MetricType, Workout } from '../../../../shared/contracts'
import { api, shareMedia, upload, type Media } from '../../services/api'
import { useAction } from '../../hooks/useAction'
import { useRemote } from '../../hooks/useRemote'
import {
  Body,
  Button,
  Choices,
  Field,
  Heading,
  Loading,
  Notice,
  Panel,
  Row,
} from '../../components/ui'

type MediaFeedback = Media & {
  feedback: Array<{
    id: string
    authorName: string
    text: string
    createdAt: string
  }>
}

export function WorkoutDetail({
  workout,
  onBack,
}: {
  workout: Workout
  onBack: () => void
}) {
  const action = useAction(),
    metrics = useRemote<{ metrics: MetricType[] }>(
      `/metrics?sport=${encodeURIComponent(workout.sport)}`,
    ),
    files = useRemote<{ media: MediaFeedback[] }>(
      `/media?resourceId=${workout.id}`,
    )
  const [completed, setCompleted] = useState(
      (workout.execution?.completedBlocks || []).map(String),
    ),
    [effort, setEffort] = useState(String(workout.execution?.effort || 5)),
    [notes, setNotes] = useState(workout.execution?.notes || '')
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(workout.execution?.metrics || {}).map(([key, value]) => [
        key,
        String(value),
      ]),
    ),
  )
  const save = () =>
    action.run(async () => {
      const metricValues = Object.fromEntries(
        Object.entries(values)
          .filter(([, value]) => value.trim() !== '')
          .map(([key, value]) => [key, Number(value.replace(',', '.'))]),
      )
      await api(`/workouts/${workout.id}/execution`, 'PUT', {
        completedBlocks: completed.map(Number),
        effort: Number(effort.replace(',', '.')),
        notes,
        metrics: metricValues,
      })
    }, 'Execução registrada. Seu treinador acompanha os dados enviados.')
  const attach = () =>
    action.run(async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'video/mp4',
          'video/webm',
          'application/pdf',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      })
      if (result.canceled) return
      await upload(result.assets[0], 'performance', workout.id)
      await files.reload()
    })
  return (
    <>
      <Button title="Voltar aos treinos" secondary onPress={onBack} />
      <Heading>{workout.title}</Heading>
      <Body muted>
        {workout.sport} · {workout.scheduledDate.split('-').reverse().join('/')}{' '}
        · {workout.coachName}
      </Body>
      <Panel>
        <Body>{workout.instructions}</Body>
      </Panel>
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      {workout.blocks.map((block, index) => (
        <Panel key={index}>
          <Heading small>
            {index + 1}. {block.name}
          </Heading>
          <Body>{block.instructions}</Body>
          <Body muted>
            {[
              block.sets !== undefined && `${block.sets} séries`,
              block.repetitions !== undefined &&
                `${block.repetitions} repetições`,
              block.loadKg !== undefined && `${block.loadKg} kg`,
              block.durationMinutes !== undefined &&
                `${block.durationMinutes} min`,
              block.distanceKm !== undefined && `${block.distanceKm} km`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Body>
          {block.videoUrl && (
            <Body>Referencia externa (texto): {block.videoUrl}</Body>
          )}
        </Panel>
      ))}
      <Panel>
        <Heading small>Registre sua execução</Heading>
        <Choices
          label="Blocos realizados"
          multiple
          options={workout.blocks.map((block, index) => ({
            id: String(index),
            label: block.name,
          }))}
          selected={completed}
          onChange={setCompleted}
        />
        <Field
          label="Percepção de esforço (1 a 10)"
          value={effort}
          onChange={setEffort}
          numeric
        />
        {metrics.loading && <Loading />}
        {metrics.error && <Notice message={metrics.error} error />}
        {metrics.data?.metrics.map((metric) => (
          <Field
            key={metric.key}
            label={`${metric.label} (${metric.unit})`}
            value={values[metric.key] || ''}
            onChange={(value) =>
              setValues((current) => ({ ...current, [metric.key]: value }))
            }
            numeric
            hint={`Valores de ${metric.min} a ${metric.max}. Deixe vazio se não mediu.`}
          />
        ))}
        <Field
          label="Notas ao treinador"
          value={notes}
          onChange={setNotes}
          multiline
        />
        <Button
          title="Salvar execução"
          disabled={action.busy}
          onPress={() => void save()}
        />
      </Panel>
      <Panel>
        <Heading small>Vídeos e correções</Heading>
        <Body muted>
          O envio de performance exige consentimento em Privacidade.
          Imagens/documentos até 10 MiB e vídeos até 50 MiB.
        </Body>
        <Button
          title="Enviar arquivo de performance"
          disabled={action.busy}
          onPress={() => void attach()}
        />
      </Panel>
      {files.loading && <Loading />}
      {files.error && <Notice message={files.error} error />}
      {files.data?.media.map((media) => (
        <Panel key={media.id}>
          <Heading small>{media.name}</Heading>
          <Body muted>
            {media.purpose === 'instruction'
              ? 'Orientação do treinador'
              : 'Arquivo de performance'}{' '}
            · {Math.round(media.size / 1024)} KiB
          </Body>
          <Row>
            <Button
              title="Abrir ou compartilhar arquivo"
              secondary
              disabled={action.busy}
              onPress={() =>
                void action.run(async () => {
                  await shareMedia(media)
                })
              }
            />
            {media.purpose === 'performance' && (
              <Button
                title="Excluir arquivo"
                destructive
                disabled={action.busy}
                onPress={() =>
                  Alert.alert(
                    'Excluir arquivo',
                    'O arquivo e as correções serão removidos. Confirmar?',
                    [
                      { text: 'Voltar', style: 'cancel' },
                      {
                        text: 'Excluir',
                        style: 'destructive',
                        onPress: () =>
                          void action.run(async () => {
                            await api(`/media/${media.id}`, 'DELETE')
                            await files.reload()
                          }),
                      },
                    ],
                  )
                }
              />
            )}
          </Row>
          {media.feedback.map((feedback) => (
            <Panel key={feedback.id}>
              <Body muted>Correção de {feedback.authorName}</Body>
              <Body>{feedback.text}</Body>
            </Panel>
          ))}
        </Panel>
      ))}
    </>
  )
}
