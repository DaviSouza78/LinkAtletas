import { useMemo, useState } from 'react'
import { Filter, Mail, MoreHorizontal, Plus, Search, SlidersHorizontal, UserPlus } from 'lucide-react'
import { athletes } from '../../data/mock'
import { Avatar, Badge, Progress, Toast } from '../../components/Ui'

export function StudentsPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [toast, setToast] = useState(false)
  const filtered = useMemo(() => athletes.filter(a => (filter === 'Todos' || (filter === 'Atenção' ? a.status === 'attention' : a.sport === filter)) && `${a.name} ${a.sport} ${a.goal}`.toLowerCase().includes(query.toLowerCase())), [query, filter])
  return <div>
    <div className="page-toolbar"><div className="toolbar-search"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nome, modalidade ou objetivo" /></div><button className="button button--outline"><SlidersHorizontal /> Filtros</button><button className="button button--dark" onClick={() => setToast(true)}><UserPlus /> Convidar aluno</button></div>
    <div className="filter-tabs">{['Todos', 'Corrida', 'Triatlo', 'Musculação', 'Natação', 'Atenção'].map(item => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}{item === 'Todos' && <span>{athletes.length}</span>}</button>)}</div>
    <div className="student-card-grid">{filtered.map(a => <article className="student-card" key={a.id}><div className="student-card__top"><Avatar initials={a.initials} color={a.color} size="lg" /><div><h3>{a.name}</h3><span>{a.sport} · Plano {a.plan}</span></div><button className="icon-button"><MoreHorizontal /></button></div><div className="student-card__goal"><small>Objetivo atual</small><strong>{a.goal}</strong></div><div className="student-card__metric"><span>Evolução do ciclo <b>{a.progress}%</b></span><Progress value={a.progress} tone="cyan" /></div><div className="student-card__row"><span><small>Adesão</small><Badge tone={a.compliance >= 90 ? 'success' : a.compliance >= 80 ? 'info' : 'warning'}>{a.compliance}%</Badge></span><span><small>Última atividade</small><b>{a.lastActivity}</b></span></div><div className="student-card__next"><span>Próximo</span><b>{a.nextWorkout}</b></div><div className="student-card__actions"><button onClick={() => setToast(true)}><Mail /> Mensagem</button><button onClick={() => setToast(true)}><Plus /> Prescrever</button></div></article>)}</div>
    {!filtered.length && <div className="empty-state"><Filter /><h3>Nenhum aluno encontrado</h3><p>Tente ajustar sua busca ou remover um filtro.</p></div>}
    <Toast message="Ação registrada no protótipo." visible={toast} onClose={() => setToast(false)} />
  </div>
}
