# Comunicação e agenda

| Arquivo | Função |
|---|---|
| [routes.ts](routes.ts) | Registra os grupos de rotas desta área. |
| [access.ts](access.ts) | Confere participação no vínculo e reúne helpers comuns. |
| [events.ts](events.ts) | Conexões WebSocket, validade da sessão e publicação de eventos. |
| [messages.ts](messages.ts) | Conversa cifrada, anexos autorizados, paginação e leitura por cursor. |
| [notifications.ts](notifications.ts) | Criação, publicação, consulta e marcação de leitura dos avisos. |
| [reviews.ts](reviews.ts) | Avaliação elegível, carência, resposta, denúncia e moderação auditada. |
| [consultations.ts](consultations.ts) | Agenda, conflitos, reagendamento/cancelamento/conclusão e histórico. |

O banco é a referência persistente; eventos ajudam a atualizar a interface. Na Vercel, o cliente pode depender de consultas periódicas, sem garantia de conexão WebSocket contínua. Mensagens e notificações são registros diferentes: uma guarda a conversa; a outra avisa o destinatário.

A agenda trava os calendários dos participantes para conferir conflitos. A referência de evento Google informada pelo usuário não comprova consulta independente do provedor ou sincronização homologada.

Tabelas: `messages`, `notifications`, `reviews`, `review_reports`, `review_moderation`, `consultations` e `consultation_history`, relacionadas aos vínculos.

[Módulos](../README.md) · [Testes de interações](../../../tests/integration/interactions.test.ts)
