import { useState } from 'react'
import type { Contract, Workout } from '../../../../shared/contracts'
import { useRemote } from '../../hooks/useRemote'
import { Body, Button, Empty, Heading, Panel } from '../../components/ui'
import { RemoteState } from '../../components/RemoteState'
import { WorkoutEditor } from './WorkoutEditor'
import { WorkoutDetail } from './WorkoutDetail'

export function CoachWorkoutsScreen() {
  const remote = useRemote<{ workouts: Workout[] }>('/workouts'),
    contracts = useRemote<{ contracts: Contract[] }>('/contracts')
  const [editing, setEditing] = useState<Workout | 'new' | null>(null),
    [view, setView] = useState<string | null>(null)
  const active =
    contracts.data?.contracts.filter((item) => item.status === 'active') || []
  const selected = remote.data?.workouts.find((item) => item.id === view)
  if (selected)
    return (
      <WorkoutDetail
        key={selected.id}
        workout={selected}
        onBack={() => {
          setView(null)
          void remote.reload()
        }}
      />
    )
  return (
    <>
      <Heading>Treinos dos atletas</Heading>
      <RemoteState remote={remote} />
      <RemoteState remote={contracts} />
      <Button
        title="Novo treino"
        disabled={!active.length || !!editing}
        onPress={() => setEditing('new')}
      />
      {!active.length && (
        <Body>
          Aceite uma solicitacao e confira sua habilitacao profissional antes de
          prescrever.
        </Body>
      )}
      {editing && (
        <WorkoutEditor
          key={editing === 'new' ? 'new' : editing.id}
          workout={editing === 'new' ? undefined : editing}
          contracts={active}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await remote.reload()
          }}
        />
      )}
      {remote.data?.workouts.map((workout) => (
        <Panel key={workout.id}>
          <Heading small>{workout.title}</Heading>
          <Body>
            {workout.athleteName} | {workout.sport} |{' '}
            {workout.scheduledDate.slice(0, 10)} | {workout.status}
          </Body>
          <Button
            title="Ver detalhes e execucao"
            secondary
            onPress={() => setView(workout.id)}
          />
          {!workout.execution ? (
            <Button
              title="Editar treino"
              disabled={!!editing}
              onPress={() => setEditing(workout)}
            />
          ) : (
            <Body>Execucao registrada. Ficha preservada para consulta.</Body>
          )}
        </Panel>
      ))}
      {remote.data && !remote.data.workouts.length && (
        <Empty>Nenhum treino prescrito.</Empty>
      )}
    </>
  )
}
