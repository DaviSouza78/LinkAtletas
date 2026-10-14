# Modelos atualizados da solução

Data: 14/10/2026. Fontes editáveis abaixo refletem API/migrations cumulativas e [ERS v2](ERS-v2.md). Modelo conceitual de classes não equivale à declaração de classes ORM: o backend usa módulos e SQL explícito.

| Modelo | Fonte | Visualização |
|---|---|---|
| Casos de uso UML | [PlantUML](diagramas/casos-de-uso.puml) | [SVG vetorial](diagramas/casos-de-uso.svg) |
| Classes conceituais | [Mermaid](diagramas/classes.mmd) | [PNG](diagramas/classes.png) |
| DER relacional | [Mermaid](diagramas/der.mmd) | [PNG](diagramas/der.png) |
| Sequência contratação/financeiro | [Mermaid](diagramas/sequencia-contratacao.mmd) | [PNG](diagramas/sequencia-contratacao.png) |
| Sequência treino/mídia/chat | [Mermaid](diagramas/sequencia-treino.mmd) | [PNG](diagramas/sequencia-treino.png) |

![Casos de uso UML](diagramas/casos-de-uso.svg)

O SVG de casos de uso usa atores, elipses de casos, associações e limite de sistema em notação UML, com fonte PlantUML equivalente. Substitui a limitação declarada do fluxograma Mermaid histórico, sem reclassificar retroativamente o diagrama antigo como UML formal.

DER resume atributos/chaves relevantes das 35 tabelas de domínio das migrations 001–004; `schema_migrations` é a 36ª tabela técnica registrada pelo executor. Migration 005 garante correlação `provider_customer_id` e nulabilidade referencial da auditoria. Relações polimórficas `resource_id` de mídia/notificação e IDs de provedor/evento não são chaves estrangeiras relacionais; API os autoriza/concilia. `metric_types` valida JSON pelo servidor, sem FK de cada chave JSON.

Cardinalidades e regras: uma execução por ficha, uma avaliação por ciclo e uma assinatura por ciclo; contrato permite vários ciclos históricos e só um vigente por par via índice parcial. Documento de verificação é opcional; arquivo tem proprietário/finalidade/recurso. Saúde privada é opcional; consentimento tem chave por usuário/finalidade e histórico separado. Descrição de consultoria, mensagem, feedback, mídia e payload privado de execução são cifrados; não sugerir que o esquema inteiro ou campos públicos de reviews estão cifrados.
