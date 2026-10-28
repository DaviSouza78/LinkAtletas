import type { Contract } from '../../../../shared/contracts'
import { Choices } from '../ui'

export function ContractSelector({
  contracts,
  selected,
  onChange,
}: {
  contracts: Contract[]
  selected: string
  onChange: (id: string) => void
}) {
  return (
    <Choices
      label="Vínculo"
      options={contracts.map((contract) => ({
        id: contract.id,
        label: `${contract.coachName} · ${contract.status === 'active' ? 'ativo' : 'histórico'}`,
      }))}
      selected={[selected]}
      onChange={(ids) => onChange(ids[0])}
    />
  )
}
