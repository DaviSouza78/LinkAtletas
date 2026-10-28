import { useState } from 'react'
import type { Workout } from '../../../../shared/contracts'
import { useRemote } from '../../hooks/useRemote'
import {
  Body,
  Button,
  Empty,
  Heading,
  Loading,
  Notice,
  Panel,
} from '../../components/ui'
import { WorkoutDetail } from './WorkoutDetail'

export function WorkoutsScreen() {
  const remote = useRemote<{ workouts: Workout[] }>('/workouts'),
    [selected, setSelected] = useState<string | null>(null)
  const workout = remote.data?.workouts.find((item) => item.id === selected)
  if (workout)
    return (
      <WorkoutDetail
        key={workout.id}
        workout={workout}
        onBack={() => {
          setSelected(null)
          void remote.reload()
        }}
      />
    )
  return (
    <>
      <Heading>Seus treinos</Heading>
      {remote.loading && <Loading />}
      {remote.error && <Notice message={remote.error} error />}
      {remote.data?.workouts.map((item) => (
        <Panel key={item.id}>
          <Body muted>
            {item.scheduledDate.split('-').reverse().join('/')} · {item.sport}
          </Body>
          <Heading small>{item.title}</Heading>
          <Body>{item.coachName}</Body>
          <Body muted>
            {item.execution
              ? `Execução registrada · percepção ${item.execution.effort}/10`
              : 'Aguardando execução'}
          </Body>
          <Button
            title={`Abrir ${item.title}`}
            onPress={() => setSelected(item.id)}
          />
        </Panel>
      ))}
      {remote.data && !remote.data.workouts.length && (
        <Empty>Seu treinador ainda não publicou treinos.</Empty>
      )}
    </>
  )
}
