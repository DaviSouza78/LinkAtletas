# Módulos da API

Cada área reúne rotas e regras de um assunto. [app.ts](../app.ts) registra os módulos sob `/api`; os endereços HTTP não dependem do nome da pasta.

| Área | Responsabilidade |
|---|---|
| [accounts](accounts/README.md) | Autenticação, perfis e conferência manual de CREF. |
| [training](training/README.md) | Descoberta de treinador, vínculos, fichas e execução dos treinos. |
| [interactions](interactions/README.md) | Mensagens, eventos, notificações, avaliações e agenda. |
| [media](media/README.md) | Arquivos privados, uploads em partes e feedback. |
| [privacy](privacy/README.md) | Recuperação de acesso, consentimentos, exportação e encerramento. |
| [billing](billing/README.md) | Planos, assinaturas, eventos e conciliação financeira. |

Os módulos usam [db](../db/README.md), [recursos internos](../shared/README.md), [serviços](../services/README.md) e [contratos compartilhados](../../shared/README.md). Uma operação pode envolver mais de uma área: por exemplo, prescrever treino exige vínculo e elegibilidade profissional/financeira.

Ao alterar uma rota, conferir sessão, papel, titularidade, entrada e efeito no banco. Preservar o histórico previsto e os contratos dos clientes. Consulte o [guia da API](../../docs/evolucao/api.md) e os [testes](../../tests/README.md).

[Voltar ao servidor](../README.md)
