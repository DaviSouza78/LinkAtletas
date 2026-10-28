import { useSearchParams, Link } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { api, json } from '../../services/api'
import { message } from '../../utils/errors'
import { Notice } from '../../components/ui/Feedback'

export function PasswordRecoveryPage() {
  const [params] = useSearchParams()
  const [token] = useState(
    () =>
      new URLSearchParams(location.hash.slice(1)).get('token') ||
      params.get('token') ||
      '',
  )
  const reset = token.length > 0
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (reset && password !== confirmation) {
      setError('As senhas precisam ser iguais.')
      return
    }
    setBusy(true)
    try {
      await api(
        reset ? '/auth/reset-password' : '/auth/forgot-password',
        json('POST', reset ? { token, password } : { email }),
      )
      setSuccess(
        reset
          ? 'Senha alterada. Entre novamente com a nova senha.'
          : 'Se o e-mail estiver cadastrado, você receberá instruções para recuperar o acesso.',
      )
      setPassword('')
      setConfirmation('')
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="exp-recovery">
      <form className="live-panel live-form" onSubmit={submit}>
        <Link to="/login">← Voltar para o login</Link>
        <span className="eyebrow">LinkAtletas · Sua conta</span>
        <h1>{reset ? 'Escolha sua nova senha' : 'Recupere seu acesso'}</h1>
        <p>
          {reset
            ? 'O link pode ser usado uma única vez e expira em 30 minutos.'
            : 'Informe o e-mail que você usou no cadastro.'}
        </p>
        {reset ? (
          <>
            <label>
              Nova senha
              <input
                required
                minLength={8}
                maxLength={128}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              Repita a nova senha
              <input
                required
                minLength={8}
                maxLength={128}
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
          </>
        ) : (
          <label>
            E-mail
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        )}
        <Notice error={error} success={success} />
        <button className="button button--dark" disabled={busy}>
          {busy ? 'Aguarde…' : reset ? 'Alterar senha' : 'Enviar instruções'}
        </button>
      </form>
    </main>
  )
}
