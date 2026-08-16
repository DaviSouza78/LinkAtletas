import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Bell, CalendarDays, ChevronDown, CircleUserRound, Dumbbell, LayoutDashboard,
  LogOut, Menu, MessageCircle, Search, ShieldCheck, Sparkles, Users, WalletCards, X,
} from 'lucide-react'
import { Logo } from './Logo'
import { Avatar } from './Ui'
import { useAuth } from '../context/AuthContext'
import { getAthleteNotifications, markAthleteNotificationsRead, subscribeToConsultations } from '../services/consultations'

const coachItems = [
  { to: '/treinador', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/treinador/alunos', label: 'Alunos', icon: Users },
  { to: '/treinador/treinos', label: 'Treinos', icon: Dumbbell },
  { to: '/treinador/consultorias', label: 'Consultorias', icon: CalendarDays },
  { to: '/treinador/mensagens', label: 'Mensagens', icon: MessageCircle, count: 3 },
  { to: '/treinador/financeiro', label: 'Financeiro', icon: WalletCards },
  { to: '/treinador/perfil', label: 'Perfil profissional', icon: CircleUserRound },
]

const athleteItems = [
  { to: '/atleta', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/atleta/descobrir', label: 'Descobrir', icon: Search },
  { to: '/atleta/treino', label: 'Meu treino', icon: Dumbbell },
  { to: '/atleta/mensagens', label: 'Mensagens', icon: MessageCircle, count: 1 },
  { to: '/atleta/perfil', label: 'Perfil', icon: CircleUserRound },
]

const titles: Record<string, string> = {
  '/treinador': 'Visão geral', '/treinador/alunos': 'Meus alunos', '/treinador/treinos': 'Treinos', '/treinador/consultorias': 'Consultorias', '/treinador/mensagens': 'Mensagens', '/treinador/financeiro': 'Financeiro', '/treinador/perfil': 'Perfil profissional',
  '/atleta': 'Olá, Marina!', '/atleta/descobrir': 'Encontre seu treinador', '/atleta/treino': 'Meu treino', '/atleta/mensagens': 'Mensagens', '/atleta/perfil': 'Meu perfil',
}

export function AppShell({ children, role }: { children: ReactNode; role: 'coach' | 'athlete' }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState(() => role === 'athlete' ? getAthleteNotifications() : [])
  const items = role === 'coach' ? coachItems : athleteItems
  const isCoach = role === 'coach'
  const title = titles[location.pathname] ?? 'LinkAtletas'
  const unread = notifications.filter(item => !item.read).length

  useEffect(() => subscribeToConsultations(() => setNotifications(role === 'athlete' ? getAthleteNotifications() : [])), [role])

  function toggleNotifications() {
    const next = !notificationOpen
    setNotificationOpen(next)
    if (next && role === 'athlete' && unread) {
      markAthleteNotificationsRead()
      setNotifications(getAthleteNotifications())
    }
  }

  return (
    <div className={`app-shell ${isCoach ? 'app-shell--coach' : 'app-shell--athlete'}`}>
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__top"><Logo light /><button className="icon-button sidebar__close" onClick={() => setOpen(false)}><X size={20} /></button></div>
        <div className="sidebar__role"><span>{isCoach ? 'Área do treinador' : 'Área do atleta'}</span><ChevronDown size={14} /></div>
        <nav className="sidebar__nav" aria-label="Navegação principal">
          {items.map(({ to, label, icon: Icon, count, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
              <Icon size={19} strokeWidth={1.9} /><span>{label}</span>{count && <b>{count}</b>}
            </NavLink>
          ))}
        </nav>
        {isCoach && <div className="sidebar__verify"><ShieldCheck size={24} /><div><strong>Perfil verificado</strong><span>CREF 012345-G/SC</span></div></div>}
        <div className="sidebar__user"><Avatar initials={isCoach ? 'AM' : 'MC'} color={isCoach ? '#d7f266' : '#74d6d1'} /><div><strong>{user?.name}</strong><span>{isCoach ? 'Treinador' : 'Atleta'}</span></div><button onClick={logout} title="Sair"><LogOut size={18} /></button></div>
      </aside>
      {open && <button className="sidebar-backdrop" onClick={() => setOpen(false)} aria-label="Fechar menu" />}

      <div className="app-main">
        <header className="app-header">
          <button className="icon-button app-header__menu" onClick={() => setOpen(true)}><Menu size={21} /></button>
          <div><span className="app-header__kicker">{isCoach ? 'Domingo, 16 de agosto' : 'Seu próximo passo'}</span><h1>{title}</h1></div>
          <div className="app-header__actions">
            {isCoach && <label className="header-search"><Search size={17} /><input placeholder="Buscar aluno, treino..." /></label>}
            <button className="icon-button notification" onClick={toggleNotifications} aria-label="Notificações"><Bell size={20} />{(isCoach || unread > 0) && <i />}{unread > 0 && <b className="notification-count">{unread}</b>}</button>
            <Avatar initials={isCoach ? 'AM' : 'MC'} color={isCoach ? '#d7f266' : '#74d6d1'} />
            {notificationOpen && <div className="notification-popover"><header><strong>Notificações</strong><span>{unread ? `${unread} nova${unread > 1 ? 's' : ''}` : 'Tudo em dia'}</span></header>{role === 'athlete' && notifications.length ? <div>{notifications.slice(0, 5).map(item => <article key={item.id}><span><CalendarDays /></span><div><strong>{item.title}</strong><p>{item.message}</p><small>Agora mesmo</small></div></article>)}</div> : <div className="notification-empty"><Bell /><span>Nenhuma notificação nova.</span></div>}</div>}
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>

      {!isCoach && <nav className="bottom-nav" aria-label="Navegação mobile">
        {athleteItems.slice(0, 5).map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={20} /><span>{label}</span></NavLink>)}
      </nav>}

      <button className="privacy-chip" title="Privacidade e proteção de dados"><ShieldCheck size={15} /> LGPD</button>
      <div className="assistant-orb" title="Assistente Link"><Sparkles size={18} /></div>
    </div>
  )
}
