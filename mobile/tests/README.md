# Testes do cliente móvel

| Arquivo | O que verifica |
|---|---|
| [api.test.ts](api.test.ts) | Autenticação, SecureStore, Bearer, recusa de treinador, expiração/logout, erros, WebSocket, envio de arquivo e limpeza de cópias privadas. |
| [config.test.ts](config.test.ts) | Perfil local, URL do emulador, exigência de HTTPS no perfil normal e recusa de destinos/configurações impróprios. |

Executar `pnpm test` em `mobile`, ou `pnpm --dir mobile test` na raiz. A configuração está em [vitest.config.ts](../vitest.config.ts). A suíte existente contém **22 testes**; consultar a saída de cada execução para o resultado atual.

Usa Vitest em Node com módulos nativos e HTTP controlados. Não exige Docker e não altera contas reais. A suíte da raiz não inclui automaticamente estes arquivos; o workflow chama o comando móvel separadamente.

Tipos, compatibilidade e exportação são verificações complementares: `pnpm typecheck`, `pnpm check` e `pnpm export`. Nenhuma dessas etapas substitui instalar e operar o APK. O [workflow Android](../../.github/workflows/android-integrated.yml) executa um ensaio separado por UIAutomator, conforme seus próprios pré-requisitos.

[Aplicativo](../README.md) · [Relatório geral](../../docs/evolucao/relatorio-testes.md)
