# Sprint 2 — índice e conferência da entrega

Para conferir item por item, com checks e referências ao código, documentos e evidências, abra o [checklist detalhado da Sprint 2](checklist-sprint-2.md).

Prazo informado no roteiro: **26/10/2026**. Preparação deste incremento: 14/10/2026. As marcações distinguem artefato preparado de verificação final; não certificam submissão no Classroom, aprovação docente ou publicação remota.

| Entregável obrigatório | Artefato verificável | Conferência antes da submissão |
|---|---|---|
| Código atualizado e versionado | API `server/`, frontend `src/`, contratos `shared/`, migrations, lockfile e histórico Git da branch `sprint-2` | Conferir commits locais; envio ao remoto depende de permissão/fork e não é presumido |
| Fluxo principal ponta a ponta | Cadastro → CREF manual → match → solicitação/aceite → ficha → execução/feedback | Executar [roteiro do README](../../../README.md) e conferir E2E real |
| Banco criado e integrado | `compose.yaml`, `server/db/migrations`, seed | Conferir serviço saudável, migrations e persistência; usar PostgreSQL real |
| Interface responsiva integrada | Cliente `/api`, sessão e áreas dos três papéis | Conferir fluxo em 390/1440 px e estados de erro/vazio |
| Validações e erros básicos | Schemas, autorização e erros padronizados na API | Conferir testes negativos, propriedade e mensagens da interface |
| Testes iniciais com evidências | [Relatório](relatorio-testes.md), testes e `evidencias/` | 33 testes de unidade/API e 2 E2E aprovados, build e smoke de reinício aprovados; reproduzir na máquina da apresentação |
| Documentação de API | [Guia](api.md), Swagger `/api/docs`, JSON `/api/openapi.json` | Conferir runtime da versão apresentada |
| ERS, diagramas e backlog atualizados | [ERS v1.1](ERS-v1.1.md), [diagramas](diagramas.md), [backlog](backlog.md), [rastreabilidade](rastreabilidade.md) | Conferir limites/parciais; não marcar futuros como implementados |
| Dificuldades, decisões e escopo | [Registro](decisoes.md), [estado inicial](estado-inicial.md), proposta aprovada | Rever mudanças web/mobile, manual/automático e vínculo sem gateway |

## Arquivos acadêmicos e revisão do grupo

O [schema exportado do PostgreSQL](banco-schema.sql) acompanha as [migrations](../../../server/db/migrations/001_initial.sql). O banco local mantém os dados no volume do Compose; a instalação reproduzível utiliza migrations e seed, sem depender da cópia do volume desta máquina.

A ERS editável desta Sprint está em Markdown; o [PDF original da Sprint 1](../../referencias/ERS-Sprint-1-original.pdf) permanece preservado, junto à proposta e ao roteiro, em `docs/referencias/`. Os cinco diagramas possuem fontes Mermaid e PNG renderizados e inspecionados. Relatório e capturas devem corresponder ao código apresentado. Banner, resumo expandido, apresentação da Mostra e manual final da Sprint 3 não são alegados concluídos aqui.

Antes de entregar, o grupo deve revisar o recorte aprovado nesta conversa à luz das orientações do professor, compreender o código e reproduzir a demonstração. A aprovação do usuário autoriza este desenvolvimento; não substitui o alinhamento acadêmico do grupo nem a avaliação docente.

**Todos os integrantes devem concluir a própria entrega**, conforme enunciado fornecido. Não foram criados registros presumidos de participação individual. Nomes e limites das UCs estão na [matriz](rastreabilidade.md).
