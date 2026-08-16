import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

export function LoginPage() {
  const [params] = useSearchParams()
  const initial: UserRole = params.get('perfil') === 'atleta' ? 'athlete' : 'coach'
  const [role, setRole] = useState<UserRole>(initial)
  const [email, setEmail] = useState('emailtreinador@email.com')
  const [password, setPassword] = useState('senhatreinador')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (role === 'coach') { setEmail('emailtreinador@email.com'); setPassword('senhatreinador') }
    else { setEmail('emailatleta@email.com'); setPassword('senhaatleta') }
    setError('')
  }, [role])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError('')
    try { await login(email, password, role); navigate(role === 'coach' ? '/treinador' : '/atleta') }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível entrar.') }
    finally { setLoading(false) }
  }

  return <div className="login-page">
    <div className="login-brand-panel"><Link to="/"><Logo light /></Link><div className="login-brand-panel__content"><span className="eyebrow">Conecte. Treine. Evolua.</span><h1>Resultados melhores começam com a conexão certa.</h1><p>Uma plataforma desenhada para aproximar atletas e treinadores e dar clareza a cada etapa da evolução.</p><ul><li><CheckCircle2 /> Profissionais com credenciais verificadas</li><li><CheckCircle2 /> Gestão de treinos em um só ambiente</li><li><CheckCircle2 /> Seus dados protegidos desde a base</li></ul></div><div className="login-brand-panel__quote"><p>“Agora consigo acompanhar cada aluno sem perder o lado humano do meu trabalho.”</p><span>André Martins · Treinador de endurance</span></div></div>
    <main className="login-form-panel"><Link to="/" className="back-link"><ArrowLeft size={17} /> Voltar para o início</Link><div className="login-mobile-logo"><Logo /></div><form onSubmit={handleSubmit} className="login-form"><span className="login-form__icon"><UserRound /></span><h2>Bem-vindo de volta</h2><p>Acesse sua área para continuar evoluindo.</p>
      <div className="role-switch"><button type="button" className={role === 'coach' ? 'active' : ''} onClick={() => setRole('coach')}>Sou treinador</button><button type="button" className={role === 'athlete' ? 'active' : ''} onClick={() => setRole('athlete')}>Sou atleta</button></div>
      <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
      <label>Senha<div className="password-field"><input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /><button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>{show ? <EyeOff /> : <Eye />}</button></div></label>
      <div className="login-options"><label><input type="checkbox" defaultChecked /> Lembrar de mim</label><button type="button">Esqueci minha senha</button></div>
      {error && <div className="form-error">{error}</div>}
      <button className="button button--dark button--large login-submit" disabled={loading}>{loading ? 'Entrando...' : <>Entrar na plataforma <ArrowRight size={18} /></>}</button>
      <div className="demo-hint"><LockKeyhole size={16} /><div><strong>Acesso de demonstração preenchido</strong><span>Use o seletor acima para alternar entre os dois perfis.</span></div></div>
      <p className="signup-copy">Ainda não tem uma conta? <button type="button">Criar cadastro</button></p>
      <small className="login-privacy"><ShieldCheck size={14} /> Ambiente protegido e adequado à LGPD</small>
    </form></main>
  </div>
}
