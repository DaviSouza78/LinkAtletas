# Contas e habilitação profissional

| Arquivo | Função |
|---|---|
| [auth.ts](auth.ts) | Cadastro de atleta/treinador, login web e nativo, consulta e encerramento de sessão. |
| [profiles.ts](profiles.ts) | Consulta e atualização do perfil próprio, com validação das preferências esportivas. |
| [verification.ts](verification.ts) | Submissão de CREF/evidência, decisão administrativa, auditoria, suspensão/revogação e expiração. |

O navegador usa cookie HttpOnly; o aplicativo recebe Bearer token. Senhas e tokens são guardados como hash. O cadastro público não permite criar administrador; isso é feito por [db/admin.ts](../../db/admin.ts).

**CREF é conferido manualmente**, sem API externa do conselho. A decisão histórica da solicitação e a situação atual do perfil são informações diferentes. Aprovar uma fixture não comprova habilitação real. Perfis sem aprovação vigente não devem iniciar novas operações que a exijam.

Tabelas centrais: `users`, `profiles`, `sessions`, `verifications`, `verification_audit` e `administrative_audit`. Recuperação de senha fica em [privacy](../privacy/README.md).

[Módulos](../README.md) · [Testes da API](../../../tests/integration/api.test.ts)
