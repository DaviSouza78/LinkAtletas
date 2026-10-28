# Testes do cliente móvel

| Arquivo | O que verifica |
|---|---|
| [api.test.ts](api.test.ts) | Login/restauração dos três papéis, cadastro público, SecureStore/Bearer, recusa de papel inválido, expiração/logout, erros, WebSocket, arquivos e limpeza de cache privado. |
| [config.test.ts](config.test.ts) | Perfil local, URL do emulador, exigência de HTTPS no perfil normal e recusa de destinos/configurações impróprios. |
| [navigation.test.ts](navigation.test.ts) | Destinos e separação dos três papéis; recusa de destinos e identidades desconhecidos. |
| [workouts.test.ts](workouts.test.ts) | Serialização/limites dos blocos, referência HTTPS em texto, datas e preservação de ficha executada/vínculo. |
| [screens.test.tsx](screens.test.tsx) | Renderização React com primitivas nativas controladas, menus/restauração/logout, decisão de vínculos, CREF, moderação, configuração financeira, publicação de treino, retorno do atleta, resposta e conclusão de agenda. |
| [hooks.test.tsx](hooks.test.tsx) | Descarte de resposta atrasada, polling somente em primeiro plano, ausência de polling em perfil e bloqueio de envio duplicado. |
| [external-links.test.ts](external-links.test.ts) | Recusa de endereços externos inseguros antes de acionar a abertura nativa. |

Executar `pnpm test` em `mobile`, ou `pnpm --dir mobile test` na raiz. A configuração está em [vitest.config.ts](../vitest.config.ts); consultar a saída de cada execução para contagem e resultado atuais.

Usa Vitest em Node, React Test Renderer na mesma versão de React do app e módulos nativos/HTTP controlados. Não exige Docker nem altera contas reais. Os testes de resposta 403 verificam o tratamento do cliente, não a autorização real do servidor. A suíte da raiz não inclui automaticamente estes arquivos; o workflow chama o comando móvel separadamente.

Tipos, compatibilidade e exportação são verificações complementares: `pnpm typecheck`, `pnpm check` e `pnpm export`. Nenhuma substitui instalar e operar o APK. O [workflow Android](../../.github/workflows/android-integrated.yml) possui ensaio separado por UIAutomator. O roteiro anterior ainda espera que treinador seja recusado pelo aplicativo: ele precisa de atualização fora de `mobile` antes de testar os novos três perfis. Não apresentar seu resultado histórico como validação desta ampliação.

[Aplicativo](../README.md) · [Relatório geral](../../docs/evolucao/relatorio-testes.md)
