import { useEffect, useState } from 'react'
import type { Contract } from '../../../../shared/contracts'
import { useRemote } from '../../hooks/useRemote'
import { Empty, Heading, Loading, Notice } from '../../components/ui'
import { ContractSelector } from '../../components/connections/ContractSelector'
import { ChatWindow } from './ChatWindow'

export function ChatScreen({ userId }: { userId: string }) {
  const contracts = useRemote<{ contracts: Contract[] }>('/contracts'),
    [selected, setSelected] = useState('')
  const choices =
    contracts.data?.contracts.filter((contract) =>
      ['active', 'cancelled', 'suspended'].includes(contract.status),
    ) || []
  useEffect(() => {
    if (!selected && choices.length) setSelected(choices[0].id)
  }, [contracts.data, selected])
  return (
    <>
      <Heading>Mensagens</Heading>
      {contracts.loading && <Loading />}
      {contracts.error && <Notice message={contracts.error} error />}
      <ContractSelector
        contracts={choices}
        selected={selected}
        onChange={setSelected}
      />
      {selected ? (
        <ChatWindow
          key={selected}
          contractId={selected}
          userId={userId}
          active={
            choices.find((contract) => contract.id === selected)?.status ===
            'active'
          }
        />
      ) : (
        <Empty>A conversa fica disponível após aprovação do vínculo.</Empty>
      )}
    </>
  )
}
