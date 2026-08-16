import { useMemo, useState } from 'react'
import { Calendar, Clock3, Copy, Dumbbell, LayoutGrid, List, MoreHorizontal, Plus, Search } from 'lucide-react'
import { trainings } from '../../data/mock'
import { Badge, Toast } from '../../components/Ui'

export function TrainingsPage() {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [toast, setToast] = useState(false)
  const filtered = useMemo(() => trainings.filter(t => `${t.title} ${t.athlete} ${t.sport}`.toLowerCase().includes(query.toLowerCase())), [query])
  return <div><div className="page-toolbar"><div className="toolbar-search"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar treino ou atleta" /></div><div className="view-switch"><button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><LayoutGrid /></button><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List /></button></div><button className="button button--dark" onClick={() => setToast(true)}><Plus /> Novo treino</button></div>
    <section className="training-summary"><article><span><Calendar /></span><div><small>Programados</small><strong>9</strong></div></article><article><span><Dumbbell /></span><div><small>Concluídos na semana</small><strong>38</strong></div></article><article><span><Copy /></span><div><small>Modelos na biblioteca</small><strong>24</strong></div></article></section>
    <div className={view === 'grid' ? 'training-grid' : 'training-list'}>{filtered.map((t, i) => <article className="training-card" key={t.id}><div className="training-card__stripe" /><div className="training-card__head"><Badge tone={t.status === 'Concluído' ? 'success' : 'accent'}>{t.status}</Badge><button className="icon-button"><MoreHorizontal /></button></div><span className="training-card__sport">{t.sport}</span><h3>{t.title}</h3><p>{t.athlete}</p><div className="training-card__meta"><span><Calendar /> {t.date}</span><span><Clock3 /> {t.duration}</span><span><Dumbbell /> {t.exercises} blocos</span></div><div className="training-card__bottom"><Badge tone={t.intensity === 'Alta' ? 'warning' : t.intensity === 'Leve' ? 'info' : 'neutral'}>Intensidade {t.intensity.toLowerCase()}</Badge><button onClick={() => setToast(true)}>{i === 0 ? 'Ver resultado' : 'Editar treino'}</button></div></article>)}</div>
    <Toast message="Treino atualizado com sucesso." visible={toast} onClose={() => setToast(false)} />
  </div>
}
