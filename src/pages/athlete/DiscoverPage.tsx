import { useMemo, useState } from 'react'
import { ArrowRight, Check, MapPin, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Video } from 'lucide-react'
import { coaches } from '../../data/mock'
import { Avatar, Badge, Toast } from '../../components/Ui'

export function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [sport, setSport] = useState('Todos')
  const [toast, setToast] = useState(false)
  const filtered = useMemo(() => coaches.filter(c => (sport === 'Todos' || c.sports.includes(sport)) && `${c.name} ${c.specialty} ${c.location}`.toLowerCase().includes(query.toLowerCase())), [query, sport])
  return <div className="discover-page"><section className="match-hero"><div><span><Sparkles /> Matches personalizados</span><h2>Encontramos profissionais que combinam com <em>seu momento.</em></h2><p>Recomendações baseadas no seu objetivo de correr 21 km, orçamento e disponibilidade.</p></div><div className="match-score"><strong>12</strong><span>matches encontrados</span><small>Atualizado hoje</small></div></section>
    <div className="discover-toolbar"><div className="toolbar-search"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar nome, especialidade ou cidade" /></div><button className="button button--outline"><SlidersHorizontal /> Filtros</button></div><div className="filter-tabs athlete-filters">{['Todos','Corrida','Triatlo','Musculação','Natação'].map(item => <button key={item} className={sport === item ? 'active' : ''} onClick={() => setSport(item)}>{item}</button>)}</div>
    <div className="coach-match-grid">{filtered.map((coach, i) => <article className="coach-match-card" key={coach.id}><div className="coach-match-card__score"><Sparkles /> {coach.match}% match</div><div className="coach-match-card__person"><Avatar initials={coach.initials} color={coach.color} size="xl" /><span className="verified-dot"><Check /></span></div><div className="coach-match-card__title"><h3>{coach.name}</h3><Badge tone="success"><ShieldCheck /> CREF verificado</Badge></div><p className="coach-match-card__specialty">{coach.specialty}</p><div className="coach-rating"><Star fill="currentColor" /><strong>{coach.rating}</strong><span>({coach.reviews} avaliações)</span></div><p className="coach-match-card__bio">{coach.bio}</p><div className="coach-tags">{coach.sports.map(s => <span key={s}>{s}</span>)}</div><div className="coach-info"><span><MapPin /> {coach.location}</span><span><Video /> {coach.mode}</span></div><div className="coach-match-card__price"><span>A partir de <strong>R$ {coach.price}/mês</strong></span><button onClick={() => setToast(true)}>Ver perfil <ArrowRight /></button></div>{i === 0 && <div className="top-match">Melhor match</div>}</article>)}</div>
    <Toast message="Solicitação de conexão enviada ao treinador." visible={toast} onClose={() => setToast(false)} />
  </div>
}
