# Testes do LinkAtletas

| Pasta | Finalidade |
|---|---|
| [unit](unit/) | Regras isoladas, criptografia, validação, segurança estática e tarefas agendadas. |
| [integration](integration/) | Rotas da API interna, persistência, autorização, comunicação, privacidade e financeiro controlado. |
| [e2e](e2e/) | Jornadas pela interface com Playwright. |
| [Testes móveis](../mobile/tests/) | Transporte e configuração do cliente React Native. |

“API” significa o back-end do próprio LinkAtletas. Não há API externa de CREF integrada; os testes de CREF exercitam a decisão manual do administrador e suas permissões.

Para casos, resultados e evidências, abrir o [relatório atual](../docs/evolucao/relatorio-testes.md). Os resultados estão no [índice das evidências](../docs/evolucao/evidencias/README.md), separados por assunto. Um teste escrito não comprova uma execução aprovada.

Executar a partir da raiz: `pnpm test`, `pnpm test:e2e` ou `pnpm --dir mobile test`. Os testes de integração e navegador precisam dos serviços locais e de banco isolado com sufixo `_test`. Não usar produção nem executar suítes simultâneas sobre a mesma base.
