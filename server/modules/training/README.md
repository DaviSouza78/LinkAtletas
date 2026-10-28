# Vínculos e treinos

| Arquivo | Função |
|---|---|
| [matching.ts](matching.ts) | Busca de treinadores elegíveis e pontuação de compatibilidade por regras. |
| [contracts.ts](contracts.ts) | Solicitação, aceite/recusa e encerramento do vínculo. |
| [workouts.ts](workouts.ts) | Rascunho, publicação, edição permitida, blocos, métricas, execução e painel. |

Fluxo: **perfil compatível → solicitação → aceite → ficha publicada → execução → consulta pelo treinador**. Não há IA treinada na pontuação.

Rascunhos são privados do treinador. A ficha pertence ao vínculo e não pode ser transferida para outro. Fichas com execução são preservadas; ajustes exigem nova ficha. Cada ficha tem uma execução que pode ser atualizada pelo atleta autorizado, com métricas válidas para a modalidade.

Operações novas conferem vínculo, titularidade e acesso aplicável em [billing/access.ts](../billing/access.ts), inclusive em modo acadêmico quanto à elegibilidade profissional. Encerramento não equivale a apagar o histórico.

Tabelas centrais: `contracts`, `workouts`, `exercise_blocks`, `executions` e `metric_types`.

[Módulos](../README.md) · [Testes do fluxo](../../../tests/integration/api.test.ts)
