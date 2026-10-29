# Evidências dos serviços na nuvem

Registros de 26/10/2026 utilizados na conferência da implantação. O [registro da operação remota](../relatorios/implantacao-2026-10-26.md) explica os resultados e as limitações.

| Grupo | O que consultar |
|---|---|
| Aplicação | Arquivos `vercel-*`: verificações de Preview, produção, fluxo integrado, uploads e recuperação. |
| Banco | [neon-migrations-2026-10-26.json](neon-migrations-2026-10-26.json): migrações e ambientes conferidos. |
| Armazenamento | Arquivos `tigris-*`: verificações do armazenamento privado por ambiente. |
| E-mail | [brevo-2026-10-26.json](brevo-2026-10-26.json): configuração e aceite SMTP; não confirma recebimento na caixa de entrada. |
| Agendamento | Arquivos `cron-*`: configuração e execução observada da tarefa. |
| Administração | Arquivos `administrador-*`: criação e verificação da conta de produção, sem publicar credenciais. |

Os registros comprovam os cenários da data, não o funcionamento permanente de um provedor. URLs privadas de conexão, senhas, tokens e chaves ficam nos ambientes autorizados.

[Índice das evidências](../README.md)
