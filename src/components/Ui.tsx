import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'accent' | 'info' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Avatar({ initials, color = '#d7f266', size = 'md' }: { initials: string; color?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  return <span className={`avatar avatar--${size}`} style={{ '--avatar-color': color } as React.CSSProperties}>{initials}</span>
}

export function Progress({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'cyan' | 'orange' }) {
  return <div className="progress" aria-label={`${value}%`}><span className={`progress__bar progress__bar--${tone}`} style={{ width: `${value}%` }} /></div>
}

export function Toast({ message, visible, onClose }: { message: string; visible: boolean; onClose: () => void }) {
  return <div className={`toast ${visible ? 'toast--visible' : ''}`} role="status"><span className="toast__icon"><Check size={16} /></span><span>{message}</span><button onClick={onClose} aria-label="Fechar"><X size={16} /></button></div>
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>
}
