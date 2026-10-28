# Conta e privacidade

[routes.ts](routes.ts) reúne recuperação/redefinição de senha, política, consentimentos, saúde privada, exportação, encerramento da conta e consulta administrativa dos pedidos.

- Recuperação emite token de uso único e com expiração; redefinir a senha revoga as sessões anteriores. E-mail é enviado pela [fila SMTP](../../services/mail.ts).
- Saúde exige consentimento e é armazenada cifrada. Revogar consentimento de saúde remove esses dados; revogar performance inicia a remoção das mídias correspondentes.
- Exportação exige sessão e seleciona os registros do titular conforme o fluxo.
- Encerramento exige senha, revoga sessões, remove/anonimiza conteúdo e preserva referências mínimas previstas. Assinatura não encerrada bloqueia a operação até regularização.

Tabelas principais: `password_resets`, `mail_outbox`, `consents`, `consent_history`, `private_health` e `privacy_requests`, além dos registros relacionados nas outras áreas.

A política acadêmica não substitui a definição operacional de retenção e expiração de backups. Uma restauração precisa considerar exclusões anteriores. Não testar encerramento com contas reais para demonstrar a funcionalidade.

[Módulos](../README.md) · [Testes de plataforma](../../../tests/integration/platform.test.ts) · [Concorrência](../../../tests/integration/privacy-races.test.ts)
