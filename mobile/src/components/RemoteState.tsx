import { Button, Loading, Notice } from './ui'

export function RemoteState({
  remote,
}: {
  remote: { loading: boolean; error: string; reload: () => Promise<void> }
}) {
  return (
    <>
      {remote.loading && <Loading />}
      {remote.error && <Notice message={remote.error} error />}
      <Button
        title="Atualizar dados"
        secondary
        disabled={remote.loading}
        onPress={() => void remote.reload()}
      />
    </>
  )
}
