# Modelos atualizados da solução

Revisado em 26/10/2026. Fontes editáveis abaixo refletem API/migrations cumulativas e a [ERS completa v2.6](ERS-template-original-atualizada.pdf). Modelo conceitual de classes não equivale à declaração de classes ORM: o backend usa módulos e SQL explícito. O adaptador contém as classes reais `AsaasClient` e `AsaasError`, identificadas no modelo técnico.

A ERS preserva as figuras conceituais originais de [casos de uso](template/originais/casos-de-uso-original.png) e [classes](template/originais/classes-original.png), com explicação da conferência manual do CREF. As versões técnicas ampliadas abaixo continuam disponíveis para manutenção. As duas sequências existentes foram mantidas; quatro sequências e dois diagramas de atividade completam a estrutura do modelo do professor.

| Modelo | Fonte | Visualização |
|---|---|---|
| Casos de uso UML | [PlantUML](diagramas/casos-de-uso.puml) | [SVG vetorial](diagramas/casos-de-uso.svg) |
| Classes conceituais | [Mermaid](diagramas/classes.mmd) | [PNG](diagramas/classes.png) |
| DER relacional | [Mermaid](diagramas/der.mmd) | [PNG](diagramas/der.png) / [SVG para ampliar](diagramas/der.svg) |
| Sequência contratação/financeiro | [Mermaid](diagramas/sequencia-contratacao.mmd) | [PNG](diagramas/sequencia-contratacao.png) |
| Sequência treino/mídia/chat | [Mermaid](diagramas/sequencia-treino.mmd) | [PNG](diagramas/sequencia-treino.png) |
| Sequência autenticação | [Mermaid](diagramas/sequencia-autenticacao.mmd) | [PNG](diagramas/sequencia-autenticacao.png) |
| Sequência CREF manual | [Mermaid](diagramas/sequencia-cref-manual.mmd) | [PNG](diagramas/sequencia-cref-manual.png) |
| Sequência recuperação de senha | [Mermaid](diagramas/sequencia-recuperacao.mmd) | [PNG](diagramas/sequencia-recuperacao.png) |
| Sequência arquivo privado | [Mermaid](diagramas/sequencia-upload-privado.mmd) | [PNG](diagramas/sequencia-upload-privado.png) |
| Atividade validação profissional | [Mermaid](diagramas/atividade-cref.mmd) | [PNG](diagramas/atividade-cref.png) |
| Atividade acompanhamento esportivo | [Mermaid](diagramas/atividade-acompanhamento.mmd) | [PNG](diagramas/atividade-acompanhamento.png) |

![Casos de uso UML](diagramas/casos-de-uso.svg)

O SVG de casos de uso usa atores, elipses de casos, associações e limite de sistema em notação UML, com fonte PlantUML equivalente. Substitui a limitação declarada do fluxograma Mermaid histórico, sem reclassificar retroativamente o diagrama antigo como UML formal.

O DER resume atributos/chaves relevantes das 37 tabelas das migrations 001–006, incluindo `schema_migrations` e `media_uploads`. As 47 relações FK foram conferidas no PostgreSQL, incluindo referências opcionais a usuário, revisor, auditoria, documento e sessões de upload. O [dicionário completo](dicionario-dados.md) registra 267 colunas, restrições e índices; [snapshot](evidencias/database-schema.json) e [exportador](../../scripts/export-schema.ts) permitem reproduzir a conferência. `pnpm docs:check` valida atributos/relações do DER e chamadas dos seis diagramas de sequência. A migration 005 garante correlação `provider_customer_id` e nulabilidade referencial da auditoria; a 006 acrescenta sessões de upload. Relações polimórficas `resource_id` de mídia/notificação e IDs de provedor/evento não são chaves estrangeiras relacionais; API os autoriza/concilia. `metric_types` valida JSON pelo servidor, sem FK de cada chave JSON.

O DER representa restrições físicas: por exemplo, um usuário pode ter zero ou um perfil no esquema relacional, enquanto o cadastro da aplicação cria ambos na mesma transação. O mínimo de um bloco por treino é validado pela aplicação; uma FK isolada não garante esse mínimo no banco. O modelo conceitual registra essas invariantes de domínio. Documento de verificação não tem unicidade global: várias submissões podem apontar para a mesma mídia autorizada.

Cardinalidades e regras: uma execução por ficha, uma avaliação por ciclo e uma assinatura por ciclo; contrato permite vários ciclos históricos e só um vigente por par via índice parcial. Documento de verificação é opcional; arquivo tem proprietário/finalidade/recurso. Saúde privada é opcional; consentimento tem chave por usuário/finalidade e histórico separado. Descrição de consultoria, mensagem, feedback, mídia e payload privado de execução são cifrados; não sugerir que o esquema inteiro ou campos públicos de reviews estão cifrados.
