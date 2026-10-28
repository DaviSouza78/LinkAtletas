# Decisões, dificuldades e mudanças de escopo

Data: 14/10/2026. Registros técnicos do incremento. Não se trata de ata assinada, aprovação do professor ou evidência individual dos seis integrantes. O usuário aprovou a proposta recomendada nesta conversa e informou identidade Git `Lucca <luccacc.contato@gmail.com>`.

## Decisões

| ID | Problema e decisão | Consequência / alternativa reservada |
|---|---|---|
| D01 Web antes do nativo | Reutilizar React/TypeScript/Vite responsivo para concluir um fluxo integrado antes do prazo | React Native permanece futuro; RNF mobile nativos não são marcados concluídos |
| D02 Banco único | PostgreSQL 17 com migrations SQL e `pg` parametrizado | Resolve ambiguidade MySQL/PostgreSQL; sem duplicar persistência nem substituir por banco em memória |
| D03 API modular | Fastify/TypeScript, Zod e rotas REST `/api`; contratos TypeScript compartilhados | Cliente e servidor concordam nos DTOs; OpenAPI descreve fronteira HTTP |
| D04 Conferência manual | Admin decide CREF com referência, justificativa, responsável e horário; transação inclui auditoria | Sem alegar consulta oficial automática; arquivo privado e revogação periódica são futuros |
| D05 Vínculo sem pagamento | Solicitação pending; só aceite do destinatário ativa vínculo; recusa persiste | Alteração explícita de RF-09/10: não há pré-autorização/cobrança. Financeiro real fica para evolução |
| D06 Match explicável | Aprovação e modalidade filtram; atendimento presencial considera cidade; objetivo 30, nível 20, orçamento 25, horários 25 | Pontuação determinística sem IA treinada. RN-09 original exigia disponibilidade como condição; nesta etapa ela pontua e não reserva agenda |
| D07 Catálogo de métricas | Tipos/unidades/limites no PostgreSQL; valores JSONB validados pela modalidade | Extensibilidade de métricas sem colunas por esporte; novas modalidades ainda exigem ampliar catálogo de UI/validação |
| D08 Sessão no servidor | Senha com hash/sal, token opaco, hash do token no banco, cookie HttpOnly, expiração e proteção de origem | Remove dependência da autenticação simulada no localStorage; produção requer HTTPS e configuração explícita |
| D09 Evidência isolada | Testes usam `linkatletas_test` e contas fictícias; desenvolvimento usa `linkatletas`. E2E usa API 3002/UI 5174 e prepara migrations/seed | Reset de teste não deve atingir base de demonstração; não publicar logs com segredos/dados reais |
| D10 Documentação editável | ERS v1.1 Markdown e diagramas Mermaid, mantendo os originais históricos como referência | Fontes podem ser revisadas/versionadas; formato acadêmico adicional depende de orientação docente, sem fabricar aprovação |
| D11 Preservar código anterior | Mensagens, financeiro e consultorias mostram aviso de evolução futura; código demonstrativo original permanece como referência fora da navegação integrada | Não atribuir persistência de chat, pagamento ou convite Google ao fluxo central |
| D12 Versionamento local | Desenvolver em clone e branch `sprint-2`, com autoria informada por Lucca. Commit local `9c1cf69` registra proposta/plano | Falta de permissão de colaborador não bloqueia desenvolvimento local; envio ao remoto depende de acesso/fork e não é presumido realizado |

## Dificuldades e resposta observada

| ID | Situação observada | Resposta / evidência |
|---|---|---|
| T01 | Base original possuía telas com mocks, sem API ou migrations | Preservar interface e integrar fluxos progressivamente; [estado inicial](estado-inicial.md) registra build original |
| T02 | Docker Desktop instalado, mas engine indisponível na primeira inspeção | Engine foi ativado para usar PostgreSQL real; confirmação de serviço/migrations pertence às evidências de execução, sem mudar para SQLite/memória |
| T03 | Identidade Git ausente inicialmente | Usuário informou nome/e-mail nesta conversa; configuração e commits locais devem usar essa identidade, sem atribuir autoria a colegas |
| T04 | ERS tem 24 RF, mas cronograma cita até RF-32 e sequência usa IDs divergentes | Preservar RF-01–24, corrigir RF-02, atualizar sequências e registrar referências não especificadas |
| T05 | Escopo escrito inclui pagamentos, mídia, chat, nativo e nuvem além da base existente | Recorte web foi aprovado pelo usuário; manter requisitos futuros/parciais explícitos e orientar demonstração pelo fluxo central |
| T06 | Não foi comprovada API pública de consulta CREF | Implementar alternativa manual já admitida no documento; não gerar evidência falsa de validação externa |
| T07 | CLI Mermaid não encontrou seu navegador após pnpm ignorar download do Puppeteer; uma nota de sequência continha delimitador incompatível | Usar Chrome instalado via `PUPPETEER_EXECUTABLE_PATH`; corrigir nota, renderizar novamente e inspecionar cinco PNG. Dependências da aplicação preservadas |
| T08 | O filtro de preço da URL era rejeitado pelo schema numérico antes da conversão | Validar a representação textual na query e converter para número no domínio; teste de filtro aprovado |
| T09 | Login excedia a largura mobile; a sidebar aparecia parcialmente durante a transição | Corrigir breakpoints e transição de visibilidade; testar abrir/fechar menu, limites de largura e capturas em 390 px |
| T10 | Vite recarregava a página quando o relatório de teste escrevia HTML no projeto | Ignorar o diretório de evidências no watcher; nova execução E2E aprovada |
| T11 | Primeiro smoke de produção encontrou registro duplicado do handler 404 | Centralizar o fallback SPA no handler existente; reiniciar o processo e conferir frontend, API e persistência; evidência no relatório |

Falhas adicionais descobertas durante os testes devem ser descritas no [relatório](relatorio-testes.md), com correção e reexecução observadas. Não há registro inventado de reuniões, horas de trabalho ou revisão de terceiros.

## Impacto sobre os entregáveis

A Sprint 2 deve demonstrar banco, API e interface integrados no mesmo fluxo e fornecer código versionado, validações, testes, API documentada e artefatos atualizados. O recorte preserva esse objetivo, mas não fecha todos os RF da visão de produto. Os limites de LGPD, criptografia em repouso, compatibilidade nativa, carga, gateway e Google estão no [backlog](backlog.md) e na [ERS](ERS-v1.1.md).
