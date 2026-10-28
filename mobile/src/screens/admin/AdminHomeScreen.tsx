import { Body, Button, Heading, Panel } from '../../components/ui'
import { useSession } from '../../context/SessionContext'
import { navigation } from '../../navigation/access'

export function AdminHomeScreen({
  navigate,
}: {
  navigate: (target: string) => void
}) {
  const user = useSession()
  return (
    <>
      <Heading>Painel administrativo</Heading>
      <Body>{user.name}</Body>
      <Panel>
        <Body>
          Conferencia manual de CREF, moderacao, regras financeiras e pedidos de
          privacidade.
        </Body>
        {navigation.admin
          .filter((item) => item !== 'Início')
          .map((item) => (
            <Button
              key={item}
              title={item}
              secondary
              onPress={() => navigate(item)}
            />
          ))}
      </Panel>
    </>
  )
}
