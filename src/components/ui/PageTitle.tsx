import type { ReactNode } from 'react'

export function PageTitle({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="live-title">
      <div>
        <span className="eyebrow">Sua jornada em movimento</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}
