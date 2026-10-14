import { useState } from 'react'
import type { AppUser } from '../../../shared/contracts'
import { api, authenticate } from '../api'
import { useAction } from '../hooks'
import { Body, Button, Field, Heading, Notice, Panel, Row } from '../ui'

export function AuthScreen({
  onAuthenticated,
  notice,
}: {
  onAuthenticated: (user: AppUser) => void
  notice: string
}) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(
    'login',
  )
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [name, setName] = useState(''),
    [token, setToken] = useState('')
  const action = useAction()
  const submit = () =>
    action.run(
      async () => {
        if (mode === 'forgot') {
          await api('/auth/native/forgot-password', 'POST', { email })
          return
        }
        if (mode === 'reset') {
          await api('/auth/native/reset-password', 'POST', {
            token: token.trim(),
            password,
          })
          setPassword('')
          setMode('login')
          return
        }
        onAuthenticated(
          await authenticate(
            email.trim(),
            password,
            mode === 'register' ? name.trim() : undefined,
          ),
        )
      },
      mode === 'forgot'
        ? 'Se a conta existir, as instruções serão enviadas. Abra o link recebido ou use o token em Redefinir senha.'
        : mode === 'reset'
          ? 'Senha atualizada. Entre com sua nova senha.'
          : '',
    )
  return (
    <>
      <Heading>
        {mode === 'login'
          ? 'Bom ter você aqui'
          : mode === 'register'
            ? 'Comece seu acompanhamento'
            : mode === 'forgot'
              ? 'Recuperar acesso'
              : 'Redefinir senha'}
      </Heading>
      <Body muted>
        Aplicativo do atleta. Treinadores e administradores usam a interface
        web.
      </Body>
      {notice && <Notice message={notice} />}
      {action.error && <Notice message={action.error} error />}
      {action.notice && <Notice message={action.notice} />}
      <Panel>
        {mode === 'register' && (
          <Field label="Nome" value={name} onChange={setName} />
        )}
        {mode !== 'reset' && (
          <Field label="E-mail" value={email} onChange={setEmail} email />
        )}
        {mode === 'reset' && (
          <Field
            label="Token do link de recuperação"
            value={token}
            onChange={setToken}
            hint="Copie o valor após token= no link recebido por e-mail."
          />
        )}
        {mode !== 'forgot' && (
          <Field
            label={mode === 'reset' ? 'Nova senha' : 'Senha'}
            value={password}
            onChange={setPassword}
            secure
            hint={
              mode === 'register' || mode === 'reset'
                ? 'Pelo menos 8 caracteres.'
                : undefined
            }
          />
        )}
        <Button
          title={
            action.busy
              ? 'Aguarde…'
              : mode === 'login'
                ? 'Entrar'
                : mode === 'register'
                  ? 'Criar conta'
                  : mode === 'forgot'
                    ? 'Enviar instruções'
                    : 'Atualizar senha'
          }
          disabled={action.busy}
          onPress={() => void submit()}
        />
      </Panel>
      <Row>
        <Button
          title={mode === 'register' ? 'Já tenho conta' : 'Criar conta'}
          secondary
          onPress={() => setMode(mode === 'register' ? 'login' : 'register')}
        />
        <Button
          title={
            mode === 'forgot' ? 'Voltar para entrar' : 'Esqueci minha senha'
          }
          secondary
          onPress={() => setMode(mode === 'forgot' ? 'login' : 'forgot')}
        />
        <Button
          title="Redefinir senha"
          secondary
          onPress={() => setMode('reset')}
        />
      </Row>
    </>
  )
}
