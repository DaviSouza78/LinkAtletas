import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  UserRound,
} from 'lucide-react'
import { Logo } from '../components/Logo'
import { homeFor, useAuth } from '../context/AuthContext'
export function LoginPage() {
  const [params] = useSearchParams()
  const [registering, setRegistering] = useState(params.get('cadastro') === '1')
  const [role, setRole] = useState<'athlete' | 'coach'>(
    params.get('perfil') === 'treinador' ? 'coach' : 'athlete',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const auth = useAuth()
  const navigate = useNavigate()
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = registering
        ? await auth.register(name, email, password, role)
        : await auth.login(email, password)
      navigate(homeFor(user.role))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <Link to="/">
          <Logo light />
        </Link>
        <div className="login-brand-panel__content">
          <span className="eyebrow">Conecte. Treine. Evolua.</span>
          <h1>Resultados melhores começam com a conexão certa.</h1>
          <p>
            Encontre orientação, organize seus treinos e acompanhe sua evolução.
          </p>
          <ul>
            <li>
              <CheckCircle2 /> Profissionais com verificação de credenciais
            </li>
            <li>
              <CheckCircle2 /> Prescrição e execução de treinos
            </li>
            <li>
              <CheckCircle2 /> Feedback para evoluir em conjunto
            </li>
          </ul>
        </div>
        <div className="login-brand-panel__quote">
          <p>Uma jornada de treino construída entre atleta e treinador.</p>
          <span>LinkAtletas · Projeto integrador</span>
        </div>
      </div>
      <main className="login-form-panel">
        <Link to="/" className="back-link">
          <ArrowLeft size={17} /> Voltar para o início
        </Link>
        <div className="login-mobile-logo">
          <Logo />
        </div>
        <form onSubmit={submit} className="login-form">
          <span className="login-form__icon">
            <UserRound />
          </span>
          <h2>{registering ? 'Comece sua jornada' : 'Bem-vindo de volta'}</h2>
          <p>
            {registering
              ? 'Crie seu perfil e dê o próximo passo.'
              : 'Entre com o e-mail da sua conta.'}
          </p>
          {registering && (
            <>
              <div className="role-switch">
                <button
                  type="button"
                  className={role === 'athlete' ? 'active' : ''}
                  onClick={() => setRole('athlete')}
                >
                  Sou atleta
                </button>
                <button
                  type="button"
                  className={role === 'coach' ? 'active' : ''}
                  onClick={() => setRole('coach')}
                >
                  Sou treinador
                </button>
              </div>
              <label>
                Nome completo
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </label>
            </>
          )}
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Senha
            <div className="password-field">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={registering ? 8 : 1}
                maxLength={128}
                autoComplete={registering ? 'new-password' : 'current-password'}
                required
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {show ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </label>
          {registering && (
            <small>
              Use pelo menos 8 caracteres. Treinadores precisam enviar o CREF
              para análise após o cadastro.
            </small>
          )}
          {error && (
            <div role="alert" className="form-error">
              {error}
            </div>
          )}
          <button
            className="button button--dark button--large login-submit"
            disabled={loading}
          >
            {loading
              ? 'Aguarde…'
              : registering
                ? 'Criar minha conta'
                : 'Entrar na plataforma'}
            <ArrowRight size={18} />
          </button>
          <p className="signup-copy">
            {registering ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setRegistering(!registering)
                setError('')
              }}
            >
              {registering ? 'Entrar' : 'Criar cadastro'}
            </button>
          </p>
        </form>
      </main>
    </div>
  )
}
