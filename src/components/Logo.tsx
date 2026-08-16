interface LogoProps { compact?: boolean; light?: boolean }

export function Logo({ compact = false, light = false }: LogoProps) {
  return (
    <div className={`brand ${light ? 'brand--light' : ''}`} aria-label="LinkAtletas">
      <svg className="brand__mark" viewBox="0 0 42 42" aria-hidden="true">
        <path d="M11 8.5h12.5a7 7 0 0 1 0 14H18" fill="none" stroke="currentColor" strokeWidth="5.2" strokeLinecap="round" />
        <path d="M31 33.5H18.5a7 7 0 0 1 0-14H24" fill="none" stroke="currentColor" strokeWidth="5.2" strokeLinecap="round" />
      </svg>
      {!compact && <span>Link<span>Atletas</span></span>}
    </div>
  )
}
