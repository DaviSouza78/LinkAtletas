# Hooks do aplicativo

| Arquivo | Função |
|---|---|
| [useRemote.ts](useRemote.ts) | Busca dados e expõe carregamento, erro, resultado e recarga. Descarta respostas de um efeito que já foi desmontado. |
| [useAction.ts](useAction.ts) | Executa ações com estado de processamento, erro e aviso de sucesso. |
| [useEvents.ts](useEvents.ts) | Mantém a assinatura WebSocket, atualiza o callback e encerra conexão/reconexão ao desmontar. |

Os hooks utilizam o [cliente da API](../services/api.ts). `useRemote` não implementa um cache global nem polling automático. Eventos ajudam a atualizar a tela; dados persistidos continuam sendo a referência. A disponibilidade de WebSocket depende do ambiente do servidor, especialmente em hospedagem serverless.

[Código do aplicativo](../README.md)
