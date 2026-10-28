import type { Contract } from '../../../../shared/contracts'
import { Choices } from '../ui'
import { useSession } from '../../context/SessionContext'

export function ContractSelector({
  contracts,
  selected,
  onChange,
}: {
  contracts: Contract[]
  selected: string
  onChange: (id: string) => void
}) {
  const user = useSession()
  return (
    <Choices
      label="Vínculo"
      options={contracts.map((contract) => ({
        id: contract.id,
        label: `${user.role === 'coach' ? contract.athleteName : contract.coachName} · ${contract.status === 'active' ? 'ativo' : 'histórico'}`,
      }))}
      selected={[selected]}
      onChange={(ids) => onChange(ids[0])}
    />
  )
}
