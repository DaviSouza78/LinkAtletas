# Checklist de pendências — Sprint 2 — LinkAtletas

> Registro histórico do incremento inicial. A ampliação aprovada e seus resultados atuais estão no [checklist ampliado](../evolucao/checklist-sprint-2.md).

Conferência: **14/10/2026**. Prazo informado no roteiro: **26/10/2026**. Branch local: `sprint-2`.

**Resposta direta:** os nove entregáveis obrigatórios possuem código, documentos ou evidências locais para o recorte aprovado por Lucca. Isso não significa que toda a ERS original foi implementada, que o professor aprovou as mudanças de escopo ou que a entrega já foi enviada.

`[x]` = feito, com referência para conferência. `[ ]` = pendente, não realizado ou dependente de validação indicada no próprio item. Os links relativos abrem arquivos do projeto; não apontam para alterações publicadas no GitHub.

## 1. Código-fonte atualizado e versionado

- [x] **Código-fonte atualizado e versionado localmente.** Implementação no commit `07940e4`, documentação/evidências na base `6de0e2d`, preservando o histórico original.
- [x] API Node/TypeScript implementada. Conferir [composição da API](../../server/app.ts) e [inicialização do servidor](../../server/index.ts).
- [x] Frontend integrado nas rotas de atleta, treinador e administrador. Conferir [rotas](../../src/App.tsx), [conexões e painéis](../../src/pages/integrated/Connections.tsx), [perfis e administração](../../src/pages/integrated/Profile.tsx) e [treinos](../../src/pages/integrated/Workouts.tsx).
- [x] Dependências, scripts e instalação documentados. Conferir [package.json](../../package.json), [lockfile](../../pnpm-lock.yaml) e [README](../../README.md).
- [x] Commits locais usam **Lucca <luccacc.contato@gmail.com>**. Conferir com `git log --format="%h %an <%ae> %s" main..sprint-2` na raiz do clone.
- [ ] **Publicar os commits no GitHub do grupo ou em um fork.** Não houve push, fork nem pull request. Versionamento local não equivale a disponibilização remota.

## 2. Fluxo principal funcional de ponta a ponta

- [x] **Fluxo central integrado e testado no navegador**, usando três sessões distintas. Conferir [teste completo](../../tests/e2e/sprint-2.spec.ts) e [resultado Playwright](evidencias/playwright-results.json).
- [x] Cadastro de atleta/treinador, login, consulta de sessão e logout reais. Conferir [API de autenticação](../../server/modules/auth.ts) e [contexto de sessão do frontend](../../src/context/AuthContext.tsx).
- [x] Perfis e preferências esportivas persistidos. Conferir [API de perfis](../../server/modules/profiles.ts).
- [x] Treinador submete CREF e referência de comprovação; administrador aprova ou reprova com justificativa e auditoria. Conferir [validação profissional](../../server/modules/verification.ts) e [captura administrativa](evidencias/aprovacao-administrativa.png).
- [x] Treinadores pendentes/reprovados ficam fora da busca; recomendações têm pontuação calculada e filtros. Conferir [matchmaking](../../server/modules/matching.ts) e [testes das regras](../../tests/unit/matching.test.ts).
- [x] Atleta solicita contratação; apenas o treinador destinatário aceita ou recusa; o aceite cria vínculo ativo sem duplicação. Conferir [API de vínculos](../../server/modules/contracts.ts).
- [x] Treinador prescreve para um vínculo ativo, salva rascunho privado e publica a ficha. Conferir [API de treinos](../../server/modules/workouts.ts).
- [x] Atleta consulta sua ficha publicada e registra blocos executados, métricas, esforço e comentário. O treinador consulta o feedback. Conferir [execução do atleta](evidencias/execucao-desktop.png) e [feedback do treinador](evidencias/feedback-treinador.png).
- [x] Dados permanecem após recarregar a página e reiniciar o processo servidor. Conferir [teste de navegador](../../tests/e2e/sprint-2.spec.ts) e [evidência do reinício](evidencias/persistencia-servidor.json).

**Limite do aceite:** o fluxo desta Sprint usa web responsiva, conferência manual de CREF e vínculo sem cobrança. Não comprova aplicativo nativo, validação oficial automática ou pagamento real. Mudanças registradas em [decisões](decisoes.md).

## 3. Banco de dados criado e integrado

- [x] **PostgreSQL criado e integrado à API**, com persistência real. Conferir [conexão e transações](../../server/db/pool.ts) e [testes de integração](../../tests/integration/api.test.ts).
- [x] Configuração Docker com volume persistente e healthcheck. Conferir [compose.yaml](../../compose.yaml).
- [x] Tabelas, chaves estrangeiras, restrições e índices versionados. Conferir [migration inicial](../../server/db/migrations/001_initial.sql) e [schema exportado do banco](banco-schema.sql).
- [x] Aplicador de migrations repetível e seed explícito de dados fictícios. Conferir [migrations](../../server/db/migrate.ts) e [seed](../../server/db/seed.ts).
- [x] Banco de testes separado do demonstrativo, com proteção contra uso de nome sem sufixo `_test`. Conferir [suíte de integração](../../tests/integration/api.test.ts) e [configuração E2E](../../playwright.config.ts).
- [x] Sessão e dashboard recuperados após encerrar e iniciar outro processo servidor. Conferir [script de verificação](../../scripts/smoke-server.ts) e [resultado](evidencias/persistencia-servidor.json). O teste não reiniciou o contêiner PostgreSQL.

## 4. Interface responsiva integrada ao back-end

- [x] **Interfaces centrais conectadas à API**, com cookies de sessão, em lugar dos mocks do fluxo principal. Conferir [cliente HTTP](../../src/services/api.ts) e [rotas integradas](../../src/App.tsx).
- [x] Telas de cadastro/login, perfil, administração, descoberta, solicitações, treinos e execução disponíveis. Conferir [tela de acesso](../../src/pages/LoginPage.tsx), [perfis/admin](../../src/pages/integrated/Profile.tsx), [conexões](../../src/pages/integrated/Connections.tsx) e [prescrição/execução](../../src/pages/integrated/Workouts.tsx).
- [x] Componentes de carregamento, erro, repetição da consulta e estado vazio. Conferir [componentes compartilhados](../../src/pages/integrated/common.tsx).
- [x] Verificação em **1440 × 1000** e **390 × 844**; checagem de largura e abertura/fechamento do menu mobile. Conferir [teste E2E](../../tests/e2e/sprint-2.spec.ts), [captura desktop](evidencias/execucao-desktop.png) e [captura mobile](evidencias/execucao-mobile.png).
- [x] Áreas fora do incremento exibem aviso de evolução futura. Conferir `FuturePage` nas [rotas](../../src/App.tsx).

**Limite:** os testes foram feitos no Chromium. Não representam homologação de quatro navegadores, auditoria completa de acessibilidade ou aplicativo Android/iOS.

## 5. Validações e tratamento básico de erros

- [x] **Validações no servidor e tratamento padronizado de erros.** Conferir [schemas de entrada](../../server/shared/validation.ts) e [tratamento de erros](../../server/shared/errors.ts).
- [x] E-mail duplicado, credenciais inválidas, sessão ausente/expirada e tentativa de criar administrador pelo cadastro público são rejeitados. Conferir [autenticação](../../server/modules/auth.ts) e [testes negativos](../../tests/integration/api.test.ts).
- [x] Senhas com hash e sal; token opaco com hash persistido; cookie HttpOnly e validação de origem das mutações. Conferir [segurança](../../server/shared/security.ts), [sessões](../../server/modules/auth.ts) e [hooks da API](../../server/app.ts).
- [x] Controle de papéis e propriedade impede acessar ficha alheia, aprovar CREF como atleta ou prescrever para vínculo indevido. Conferir [verificação profissional](../../server/modules/verification.ts), [treinos](../../server/modules/workouts.ts) e [testes](../../tests/integration/api.test.ts).
- [x] Aceite concorrente e solicitação duplicada tratados; rascunho oculto do atleta. Conferir [vínculos](../../server/modules/contracts.ts), [treinos](../../server/modules/workouts.ts) e [suíte de integração](../../tests/integration/api.test.ts).
- [x] Esforço de 1 a 10, blocos existentes e métricas dentro do catálogo da modalidade são validados; reenvio atualiza a mesma execução. Conferir [registro de execução](../../server/modules/workouts.ts) e [testes](../../tests/integration/api.test.ts).
- [x] Erro real de login apresentado na interface. Conferir [captura mobile](evidencias/login-mobile-erro.png).

Essas medidas não equivalem a auditoria independente de segurança ou comprovação integral de LGPD.

## 6. Testes iniciais com evidências

- [x] **Testes executados com evidências reais**, consolidados no [relatório de testes](relatorio-testes.md).
- [x] **13 testes de regras de recomendação aprovados.** Conferir [código dos testes](../../tests/unit/matching.test.ts) e [resultado Vitest](evidencias/vitest-results.json).
- [x] **20 testes de API/PostgreSQL aprovados.** Conferir [código dos testes](../../tests/integration/api.test.ts) e [resultado Vitest](evidencias/vitest-results.json). Total Vitest: **33 aprovados, zero falhas**.
- [x] **2 cenários Playwright aprovados**, incluindo o fluxo completo e login mobile com erro. Conferir [código](../../tests/e2e/sprint-2.spec.ts), [JSON](evidencias/playwright-results.json) e [relatório HTML](evidencias/playwright-report/index.html).
- [x] Verificação de tipos e build aprovados. Conferir [log da execução](evidencias/verificacao-build.txt) e [comandos disponíveis](../../package.json).
- [x] Verificação adicional de reinício real do processo aprovada. Conferir [resultado](evidencias/persistencia-servidor.json).
- [x] Capturas de aprovação, erro, desktop, mobile e feedback produzidas. Conferir a relação no [relatório](relatorio-testes.md).

Nesta conferência foram relidos os arquivos de resultado das execuções anteriores; as suítes não foram reexecutadas apenas para escrever o checklist.

## 7. Documentação de API, quando aplicável

- [x] **Documentação da API preparada e versionada.** Conferir [guia da API](api.md) e [OpenAPI JSON](openapi.json).
- [x] Métodos, rotas, schemas de entrada/saída, autenticação e respostas de erro descritos. Conferir [contrato compartilhado](../../shared/contracts.ts), [schemas de resposta](../../server/shared/openapi.ts) e [OpenAPI](openapi.json).
- [x] Swagger disponível quando o servidor está rodando: [abrir documentação local](http://localhost:3001/api/docs/).
- [x] Exportação reproduzível da OpenAPI: `pnpm api:export`. Conferir [script](../../scripts/export-openapi.ts).

## 8. ERS, diagramas e backlog atualizados

- [x] **ERS, diagramas e backlog revisados para o incremento local.** Conferir [ERS v1.1](ERS-v1.1.md), [índice dos diagramas](diagramas.md) e [backlog](backlog.md).
- [x] ERS com os **24 RF detalhados na versão original, 16 RNF e 16 RN**, prioridades, fluxos e limites de atendimento. Conferir [ERS v1.1](ERS-v1.1.md). Requisitos parciais/futuros estão identificados.
- [x] Representação de atores/casos de uso atualizada, com fonte e imagem. Conferir [fonte](diagramas/casos-de-uso.mmd) e [PNG](diagramas/casos-de-uso.png). **A representação usa fluxograma Mermaid, não a notação UML formal de casos de uso.**
- [x] Diagrama de classes de domínio atualizado. Conferir [fonte](diagramas/classes.mmd) e [PNG](diagramas/classes.png).
- [x] DER atualizado com as tabelas e chaves do incremento. Conferir [fonte](diagramas/der.mmd), [PNG](diagramas/der.png) e [migration](../../server/db/migrations/001_initial.sql).
- [x] Sequência de conferência/recomendação/contratação atualizada. Conferir [fonte](diagramas/sequencia-contratacao.mmd) e [PNG](diagramas/sequencia-contratacao.png).
- [x] Sequência de prescrição/execução/feedback atualizada. Conferir [fonte](diagramas/sequencia-treino.mmd) e [PNG](diagramas/sequencia-treino.png).
- [x] Backlog identifica incremento implementado, requisitos parciais e evolução. Conferir [backlog](backlog.md).
- [x] Matriz de rastreabilidade relaciona requisitos, código, testes/evidências e UCs. Conferir [matriz](rastreabilidade.md).
- [ ] Confirmar o formato documental exigido pelo professor. A ERS revisada está em Markdown; não foi gerado um novo PDF/Word.
- [ ] Confirmar a aceitação da representação de casos de uso ou produzir sua versão em notação UML formal, se exigida na revisão acadêmica.

## 9. Registro de dificuldades, decisões e mudanças de escopo

- [x] **Registro preparado**, com decisões e dificuldades efetivamente encontradas. Conferir [decisões e dificuldades](decisoes.md) e [estado inicial](estado-inicial.md).
- [x] Recorte web responsiva antes do aplicativo nativo documentado. Conferir [proposta aprovada](https://github.com/DaviSouza78/LinkAtletas/blob/c472f2709d4053dda051d8d4da18fc9bf3096d8a/docs/historico/planejamento/specs/2026-10-14-sprint-2-design.md) e [decisões](decisoes.md).
- [x] PostgreSQL como banco único; conferência CREF manual; vínculo sem pagamento; critérios de match e métricas registrados. Conferir [decisões](decisoes.md).
- [x] Dificuldades de ambiente, filtro de preço, layout mobile, watcher de testes, renderização dos diagramas e inicialização do servidor registradas com suas soluções. Conferir [dificuldades T01–T11](decisoes.md).
- [x] Limitações e funcionalidades futuras mantidas no [backlog](backlog.md) e na [ERS](ERS-v1.1.md), sem declarar pagamentos, chat ou upload como concluídos.

## Pendências para fechar e enviar a entrega

Estas ações não foram realizadas automaticamente nem estão comprovadas pelos testes locais:

- [ ] O grupo revisar o código e reproduzir a demonstração na máquina que será usada na apresentação. Instruções: [README](../../README.md).
- [ ] Alinhar com o professor o recorte de escopo: web antes do nativo, CREF manual, vínculo sem gateway e flexibilizações explicitadas na ERS/decisões. A aprovação de Lucca nesta conversa não comprova aprovação docente.
- [ ] Resolver o acesso de contribuição ou usar um fork e disponibilizar código/documentos no GitHub. Até esta conferência, nenhuma alteração foi enviada por mim ao remoto.
- [ ] Conferir eventuais exigências de formato da ERS e notação do diagrama de casos de uso indicadas no item 8.
- [ ] Identificar qual é a Eletiva I efetiva e complementar sua contribuição/evidência na [matriz curricular](rastreabilidade.md).
- [ ] Cada integrante finalizar sua própria entrega na plataforma acadêmica. Não houve acesso ou submissão ao Classroom.

## Funcionalidades ainda não feitas, registradas como evolução

Não confundir estes itens com os nove tipos de entregável acima. São partes da visão original que não estão encerradas pelo recorte implementado:

- [ ] Aplicativo React Native e homologação Android/iOS.
- [ ] Consulta automática oficial ao CREF, verificação periódica e revogação de credenciais.
- [ ] Gateway, cobrança, recorrência, split, carência e métodos de pagamento.
- [ ] Cancelamento de assinatura e encerramento de contrato pelo fluxo financeiro.
- [ ] Chat em tempo real, avaliações públicas e respostas.
- [ ] Upload de documentos/vídeos e armazenamento S3; URL HTTPS de orientação não equivale a upload.
- [ ] Recuperação de senha por e-mail.
- [ ] Implantação pública em nuvem, domínio, TLS operacional, backups/restauração e testes de carga.
- [ ] Governança completa de dados pessoais/sensíveis e criptografia em repouso.
- [ ] Homologação completa de navegadores e acessibilidade.

Referências para acompanhar a evolução: [backlog](backlog.md), [ERS](ERS-v1.1.md) e [limites dos testes](relatorio-testes.md).

**Conclusão da conferência:** há implementação e artefatos locais para os nove entregáveis no recorte aprovado. Publicação remota, revisão do grupo, validação acadêmica das adaptações, ajustes documentais condicionais e submissão individual continuam pendentes. Este checklist não certifica entrega ou aprovação do professor.
