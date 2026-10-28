import type { Dashboard } from '../../../../shared/contracts'
import { useRemote } from '../../hooks/useRemote'
import { useSession } from '../../context/SessionContext'
import {
  Body,
  Button,
  Heading,
  Loading,
  Notice,
  Panel,
  Row,
} from '../../components/ui'

export function HomeScreen({
  name,
  navigate,
}: {
  name: string
  navigate: (target: string) => void
}) {
  const user = useSession()
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
              {
                remote.data.workouts.filter(
                  (w) => !w.execution && w.status === 'published',
                ).length
              }{' '}
              treino(s) publicados aguardando registro
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
          {!remote.data.contracts.length && user.role === 'athlete' && (
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
          {user.role === 'coach' && (
            <Panel>
              <Heading small>Seu trabalho como treinador</Heading>
              <Body>
                {
                  remote.data.contracts.filter(
                    (item) => item.status === 'pending',
                  ).length
                }{' '}
                solicitacoes aguardando decisao.
              </Body>
              <Button
                title="Gerenciar vinculos"
                onPress={() => navigate('Vínculos')}
              />
              <Button
                title="Perfil e CREF"
                secondary
                onPress={() => navigate('Perfil')}
              />
            </Panel>
          )}
        </>
      )}
    </>
  )
}
