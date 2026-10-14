import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  CircleUserRound,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Users,
  X,
  Bell,
  CalendarDays,
  CreditCard,
  MessageSquare,
  Shield,
  Star,
} from 'lucide-react'
import { Logo } from './Logo'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../../shared/contracts'
const coachItems = [
  { to: '/treinador', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/treinador/alunos', label: 'Alunos e solicitações', icon: Users },
  { to: '/treinador/treinos', label: 'Treinos', icon: Dumbbell },
  {
    to: '/treinador/perfil',
    label: 'Perfil profissional',
    icon: CircleUserRound,
  },
]
const athleteItems = [
  { to: '/atleta', label: 'Início', icon: LayoutDashboard },
  { to: '/atleta/descobrir', label: 'Descobrir', icon: Search },
  { to: '/atleta/treino', label: 'Meu treino', icon: Dumbbell },
  { to: '/atleta/perfil', label: 'Perfil', icon: CircleUserRound },
]
function expansionItems(root: string) {
  return [
    { to: root + '/mensagens', label: 'Mensagens', icon: MessageSquare },
    {
      to: root + (root === '/treinador' ? '/consultorias' : '/agenda'),
      label: 'Agenda e consultorias',
      icon: CalendarDays,
    },
    { to: root + '/financeiro', label: 'Financeiro', icon: CreditCard },
    { to: root + '/avaliacoes', label: 'Avaliações', icon: Star },
    { to: root + '/notificacoes', label: 'Notificações', icon: Bell },
    { to: root + '/privacidade', label: 'Privacidade', icon: Shield },
  ]
}
export function AppShell({
  children,
  role,
}: {
  children: ReactNode
  role: Role
}) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    function close(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])
  const items =
    role === 'admin'
      ? [
          {
            to: '/admin',
            label: 'Verificações profissionais',
            icon: ShieldCheck,
          },
          {
            to: '/admin/avaliacoes',
            label: 'Moderação de avaliações',
            icon: Star,
          },
          {
            to: '/admin/financeiro',
            label: 'Regras financeiras',
            icon: CreditCard,
          },
          {
            to: '/admin/privacidade',
            label: 'Pedidos de privacidade',
            icon: Shield,
          },
          { to: '/admin/notificacoes', label: 'Notificações', icon: Bell },
        ]
      : role === 'coach'
        ? [...coachItems, ...expansionItems('/treinador')]
        : [
            ...athleteItems,
            { to: '/atleta/conexoes', label: 'Minhas conexões', icon: Users },
            ...expansionItems('/atleta'),
          ]
  async function exit() {
    setError('')
    try {
      await logout()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao sair.')
    }
  }
  const initials =
    user?.name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('') || 'LA'
  return (
    <div
      className={`app-shell app-shell--${role === 'athlete' ? 'athlete' : 'coach'}`}
    >
      <aside
        id="application-sidebar"
        className={`sidebar ${open ? 'sidebar--open' : ''}`}
      >
        <div className="sidebar__top">
          <Logo light />
          <button
            className="icon-button sidebar__close"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <div className="sidebar__role">
          Área{' '}
          {role === 'admin'
            ? 'administrativa'
            : role === 'coach'
              ? 'do treinador'
              : 'do atleta'}
        </div>
        <nav className="sidebar__nav" aria-label="Navegação principal">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item--active' : ''}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__user">
          <span className="live-avatar">{initials}</span>
          <div>
            <strong>{user?.name}</strong>
            <span>
              {role === 'admin'
                ? 'Administrador'
                : role === 'coach'
                  ? 'Treinador'
                  : 'Atleta'}
            </span>
          </div>
          <button onClick={exit} title="Sair" aria-label="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="app-main">
        <header className="app-header">
          <button
            className="icon-button app-header__menu"
            aria-label="Abrir menu"
            aria-expanded={open}
            aria-controls="application-sidebar"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div>
            <span className="app-header__kicker">Conecte. Treine. Evolua.</span>
            <h1>
              {items.find((i) => i.to === location.pathname)?.label ||
                'LinkAtletas'}
            </h1>
          </div>
          <span className="live-header-name">{user?.name}</span>
        </header>
        <main className="app-content">
          {error && (
            <div role="alert" className="form-error">
              {error}
            </div>
          )}
          {children}
        </main>
      </div>
      {role === 'athlete' && (
        <nav className="bottom-nav" aria-label="Navegação mobile">
          {athleteItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
