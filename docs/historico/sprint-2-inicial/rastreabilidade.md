# Matriz de rastreabilidade — Sprint 2

Data: 14/10/2026. Relaciona requisitos, implementação e verificações. Caminho de teste identifica o cenário disponível; resultado somente no [relatório](relatorio-testes.md). Não atribui contribuição a integrante sem registro efetivo.

## Requisitos funcionais → solução → verificação

| Requisitos | API / tela | Verificação / evidência |
|---|---|---|
| RF-01,02,05 | `/auth/*`, `/profiles/me`; login, perfil atleta/treinador | [API integrada](../../../tests/integration/api.test.ts): cadastro, administrador público negado, duplicidade, login, sessão/expiração, origem, logout; [E2E](../../../tests/e2e/sprint-2.spec.ts): novas contas e perfis |
| RF-03,04 parcial | `/verifications`, `/admin/verifications`; perfil treinador/admin | API: papel indevido, pendência/reprovação fora da busca, aprovação e auditoria; E2E: aprovação administrativa; captura `aprovacao-administrativa.png` quando executado |
| RF-06,07,08 parcial | `/coaches`; descoberta/perfil profissional | [Unidade](../../../tests/unit/matching.test.ts): pesos/elegibilidade/cidade; API: filtros e ausência de e-mail público; E2E: descoberta após aprovação |
| RF-09 parcial,10,23 parcial | `/contracts`; descoberta e carteira | API: pendência, duplicata, terceiros, aceite simultâneo e estado final; E2E: solicitar e aceitar |
| RF-14,15 parcial | `/workouts`; editor/lista treinador | API: vínculo inativo/alheio, bloco inválido, rascunho privado e publicação; E2E: publicar ficha |
| RF-16,17 | `/workouts/:id`, `/metrics`, `/workouts/:id/execution`; treino atleta e retorno treinador | API: propriedade, catálogo, limites/blocos, execução única e persistência; E2E: feedback após reload e consulta pelo treinador; capturas execução desktop/mobile e feedback |
| RF-11,12,13,18,19,20,21,22,24 | Fora do fluxo implementado | Não há evidência de implementação; [backlog futuro](backlog.md) |

## RNF e regras → verificação

| Grupo | Implementação/alcance | Verificação ou pendência |
|---|---|---|
| RNF-01,02; RN-14,15 | Minimização e autorização; consentimento integral e criptografia em repouso futuros | Isolamento API; governança, TLS/AES e dados reais não homologados |
| RNF-03,04; RN-01,02 | Decisão/auditoria transacional e filtros obrigatórios | API verifica auditoria, exclusão de pendente/reprovado e papel administrativo; prova de rollback/inviolabilidade completa separada |
| RN-03 | Revogação/expiração periódica futura | Sem evidência de suspensão automática |
| RNF-05,15; RN-04–07,16 | Financeiro/gateway futuro | Ausência de captura de cartão; não equivale à certificação/idempotência financeira |
| RNF-06; RN-08,09,10 | Match determinístico; disponibilidade pontua; solicitações persistem | Unidade/API; desempenho em carga, reserva e retroalimentação futura |
| RNF-07; RN-12 | Catálogo `metric_types` e métricas JSONB validadas | API rejeita chaves/valores; ampliar modalidades administrativas permanece futuro |
| RNF-08 | Docker local e banco persistente | Execução reproduzível não comprova nuvem/autoescala |
| RNF-09,10,11,13 | Web responsiva e feedback de operações | E2E 390/1440 px; demais navegadores, teclado/leitor de tela completos e autosave pendentes conforme relatório |
| RNF-12 | React Native futuro | Sem teste nativo iOS/Android |
| RNF-14 | OpenAPI e contratos HTTP | Runtime `/api/docs`, `/api/openapi.json`, testes API e contrato compartilhado |
| RNF-16 | Redação de logs e erro público genérico | Revisão/teste sanitizado; não publicar segredos |
| RN-11 | API exige vínculo ativo para ficha | API nega prescrição pré-aceite/por terceiro |
| RN-13 | Reviews futuros | Período de elegibilidade não definido |

## Integração das unidades curriculares

UCs conforme roteiro original. Esta matriz registra a relação técnica deste incremento; não certifica que a atividade foi realizada/avaliada por cada professor. O nome específico da Eletiva I precisa ser confirmado pela equipe.

| Unidade curricular | Conhecimento aplicado | Artefato e limite da evidência |
|---|---|---|
| Desenvolvimento Back-end | REST, autenticação, autorização, validação, transações e tratamento de erros | `server/modules`, `server/shared`, [API](api.md), testes de integração PostgreSQL |
| Frameworks Front-end | React/TypeScript, rotas, estado de sessão, formulários e consumo HTTP | `src/services/api.ts`, áreas por papel, E2E e capturas responsivas |
| Ciência de Dados | Modelar atributos, calcular/explicar compatibilidade, validar métricas por modalidade | `server/modules/matching.ts`, catálogo SQL e testes de pesos; não há IA treinada ou estudo estatístico |
| Computação em Nuvem | Configuração por ambiente, serviços isolados, persistência e preparação de implantação | `compose.yaml`, `.env.example`, README; implantação pública, autoescala e backups operacionais não demonstrados |
| Automação Industrial | Aquisição e estruturação de métricas em fluxo digital; interface extensível para futura instrumentação | `metric_types`, `/metrics`, validação de execuções; dados são inseridos manualmente, sem sensores/PLC/IoT conectados |
| Relações Humanas e Cidadania | Colaboração, acesso responsável a dados, transparência profissional, acessibilidade e impactos sociais | [Decisões](decisoes.md), limitações, autorização por usuário, revisão coletiva a registrar; participação e aprovação não inventadas |
| Eletiva I | Conteúdo específico ainda não identificado no material consultado | Confirmar nome/competências com equipe/professor antes de declarar integração concreta |
| Conhecimentos anteriores | Modelagem relacional, requisitos, engenharia de software e controle de versão | ERS, DER, chaves/constraints, migrations e histórico Git |

## Participação individual e apresentação

Equipe: João Gabriel Floriano Olimpio; Miguel Oliveira de Almeida; Lucas Souza Silva; Davi Marcondes Paes de Souza; João Pedro Fonseca Alves de Carvalho; Lucca Castilho Costa. Os responsáveis no cronograma da Sprint 1 representam planejamento, não execução comprovada da Sprint 2.

Para compor evidência real, cada integrante deve registrar seu commit/revisão/teste ou apresentação com data, descrição e referência verificável. Não preenchemos assinaturas, horas ou revisões presumidas. Os commits deste incremento usam a identidade informada por Lucca; isso não distribui autoria aos colegas. Cada integrante deve concluir sua própria entrega conforme instrução do professor.
