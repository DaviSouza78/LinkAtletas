# Checklist da Sprint 2 — versão ampliada

Atualizado em 21/10/2026. Use este documento para revisar os nove entregáveis obrigatórios. A [entrega inicial](../sprint-2/checklist-sprint-2.md) permanece histórica. `[x]` indica artefato/implementação existente com referência; execução consolidada e homologação externa têm marcação própria. A [ERS v2](ERS-v2.md) define o alcance e o [relatório](relatorio-testes.md) registra resultados sem presumir aprovação. As [pendências humanas](pendencias-lucca.md) distinguem a entrega acadêmica da ativação externa.

## 1. Código-fonte atualizado e versionado

- [x] Clone local separado e branch de ampliação; código de [API](../../server/), [web](../../src/) e [app](../../mobile/); base anterior preservada em `sprint-2`.
- [x] Autor Git definido como Lucca com e-mail fornecido; [decisões](decisoes.md) explicam autoria e limites.
- [x] Implementação versionada no commit local `fca8a18`, com autoria Lucca; documentação/evidências versionadas na mesma branch. Pacotes ZIP e Git bundle serão gerados a partir do commit de entrega, conforme o [índice](entrega.md).
- [x] Branch publicada no [GitHub do grupo](https://github.com/DaviSouza78/LinkAtletas/tree/evolucao-completa), com commits de Lucca; [pull request #1](https://github.com/DaviSouza78/LinkAtletas/pull/1) integrado após autorização de publicação e aprovação dos checks.
- [x] Merge na `main`, commit `f6a5a56`: [registro do PR](evidencias/github-pr-1.json) e [CI aprovada na main](evidencias/github-ci-main.json).

## 2. Fluxo principal funcional de ponta a ponta

- [x] Cadastro → perfil → CREF manual → descoberta → solicitação → aceite → prescrição → execução/feedback: [API original](../../tests/integration/api.test.ts), [web](../../src/App.tsx), [roteiro](manual.md).
- [x] Funcionalidades antes abertas agora possuem código e telas: [mensagens/agenda/reviews/notificações](../../src/pages/integrated/InteractionPages.tsx), [financeiro](../../src/pages/integrated/BillingPages.tsx), [privacidade/mídia/reset](../../src/pages/integrated/Expansion.tsx).
- [x] Cancelamento, novos ciclos, carência e conciliação: [billing](../../server/modules/billing.ts), [contratos](../../server/modules/contracts.ts), [testes de financeiro](../../tests/integration/billing.test.ts).
- [x] Fluxo ampliado em Chromium, Firefox e WebKit: [15/15 E2E](evidencias/playwright-results.json) e [relatório](relatorio-testes.md).
- [ ] Cobrança e split em sandbox real/produção; consulta CREF oficial e Google OAuth real: exigem configuração/acessos e evidências externas.

## 3. Banco de dados criado e integrado

- [x] PostgreSQL e migrations cumulativas [001–005](../../server/db/migrations/), sem substituição da base da Sprint 2.
- [x] Relações/chaves/índices para conta, ciclos, treino, arquivos, chat, agenda, review, financeiro e privacidade: [DER](diagramas/der.mmd).
- [x] Isolamento de testes com banco `_test` e dados fictícios: [testes](../../tests/integration/), [configuração](../../vitest.config.ts).
- [x] Backup/restauração isolados: [36 tabelas e objetos com checksums iguais](evidencias/backup-restore.json), campo/mídia decifrados e [worker de rede privada](evidencias/private-network-backup.json).

## 4. Interface responsiva integrada ao back-end

- [x] Web real para atleta, treinador e administrador; [rotas](../../src/App.tsx), [navegação](../../src/components/AppShell.tsx), [cliente HTTP](../../src/services/api.ts).
- [x] Formulários novos com rótulos/erro/espera/sucesso e layout responsivo: [CSS](../../src/styles.css) e páginas integradas.
- [x] Fonte do app Expo com a mesma API e SecureStore: [app](../../mobile/App.tsx), [cliente](../../mobile/src/api.ts).
- [x] Evidências Chromium 390/1440 e seis telas sem violações axe: [E2E](evidencias/playwright-results.json), [axe](evidencias/chromium-axe.json), [chat desktop](evidencias/chromium-chat.png) e [privacidade mobile](evidencias/chromium-privacidade-mobile.png).
- [x] App: tipos/dependências/Doctor, [21/22 testes de transporte/configuração](evidencias/mobile-tests.json) e [bundles Hermes Android/iOS](evidencias/mobile-bundles.json); ver [limites](evidencias/mobile-verificacao.md).
- [x] Firefox e WebKit executados: [resultados](evidencias/playwright-results.json), [axe Firefox](evidencias/firefox-axe.json) e [axe WebKit](evidencias/webkit-axe.json).
- [x] APK Android de verificação compilado no GitHub, com assinatura de desenvolvimento: [execução e hash](publicacao.md). O perfil local permite backend por USB: [manual](manual-apk-local.md); o APK documental antigo permanece histórico.
- [x] APK instalado e tela de login aberta no emulador Android API 35: [resultado](evidencias/android-emulator-result.json), [captura](evidencias/android-emulator-startup.png) e [run aprovado](https://github.com/DaviSouza78/LinkAtletas/actions/runs/38675093814). O ensaio integrado do APK local é registrado separadamente na [verificação móvel](evidencias/mobile-verificacao.md); aparelho físico continua pendente.
- [ ] Assinatura de distribuição, IPA e homologação completa em aparelhos Android/iOS; Safari/Edge reais e leitor de tela: não presumidos por compilação, bundles ou viewport.

## 5. Validações e tratamento básico de erros

- [x] Papel/propriedade/estado, Zod, CSRF/Origin, sessão, limites e mensagens públicas sanitizadas: [segurança](../../server/shared/security.ts), [erros](../../server/shared/errors.ts).
- [x] Arquivo por assinatura/MIME/extensão/limite, S3 privado e cifra: [media](../../server/modules/media.ts), [crypto](../../server/shared/crypto.ts).
- [x] Consentimento/saúde/recuperação/encerramento com senha e sessão revogada: [platform](../../server/modules/platform.ts).
- [x] Webhook autenticado/idempotente, resultado incerto e cancelamento sem falso sucesso: [Asaas](../../server/services/asaas.ts), billing e testes.
- [x] Review elegível, moderação, horário/conflito e WS: [interactions](../../server/modules/interactions.ts).

## 6. Testes iniciais com evidências

- [x] Evidência inicial preservada: [33 Vitest e 2 E2E históricos](../sprint-2/relatorio-testes.md).
- [x] Novos testes de [plataforma](../../tests/integration/platform.test.ts), [interações](../../tests/integration/interactions.test.ts), [financeiro](../../tests/integration/billing.test.ts), [cifra](../../tests/unit/crypto.test.ts).
- [x] [82/82 Vitest](evidencias/vitest-results.json), [15/15 E2E nos três motores](evidencias/playwright-results.json), testes/bundles do app e operação TLS/backup/carga: [relatório](relatorio-testes.md).
- [x] Corridas de privacidade verificadas com bloqueios reais: [três testes](../../tests/integration/privacy-races.test.ts) de perfil, senha/sessão e feedback eliminado.
- [x] [TLS 1.3 local](evidencias/production-tls.json) com CA explícita, sem alteração do trust global; [carga](evidencias/carga-matchmaking.json) 200 chamadas/500 perfis sintéticos e p95 97,78 ms.
- [x] [CI versionada](../../.github/workflows/ci.yml) e executada com sucesso no GitHub após merge: [run 38656142290](https://github.com/DaviSouza78/LinkAtletas/actions/runs/38656142290), [registro verificável](evidencias/github-ci-main.json).
- [x] Correção do indicador de chat após evento tardio de socket descartado e regressão no navegador: [CI final aprovada](evidencias/github-ci-finalizacao.json), [cenário de chat](../../tests/e2e/expansion.spec.ts).
- [x] [Tipos e build final aprovados](evidencias/verificacao-build.txt); engines adicionais incluídos no relatório.
- [ ] Homologações externas e dispositivos não executadas não recebem check de aprovação.

## 7. Documentação de API

- [x] [Guia ampliado](api.md), contratos compartilhados e Swagger/OpenAPI runtime `/api/docs` e `/api/openapi.json`.
- [x] Documentados autenticação web/nativa, multipart, WS, erro, papel, finalidade e limites externos.
- [x] [Snapshot OpenAPI](openapi.json) gerado da aplicação e [conferência](evidencias/documentation-check.json) das rotas e links relativos.

## 8. ERS, diagramas e backlog atualizados

- [x] [ERS v2](ERS-v2.md): RF-01–24, RNF-01–16, RN-01–16 preservados, RF-A explícitos e fluxos/exceções.
- [x] [Backlog](backlog.md), [matriz de UCs/rastreabilidade](rastreabilidade.md) e [diagramas](diagramas.md) com fontes editáveis.
- [x] Casos de uso UML: atores, elipses e limite de sistema, [PlantUML](diagramas/casos-de-uso.puml) e [SVG](diagramas/casos-de-uso.svg).
- [x] ERS em [Word](ERS-v2.docx) e [PDF](ERS-v2.pdf); relatório em [Word](relatorio-testes.docx) e [PDF](relatorio-testes.pdf), com [renderização para inspeção](evidencias/documentos/render.json).
- [x] Identificar a Eletiva I como Projeto Integrador Interdisciplinar, conforme confirmação de Lucca em 23/10/2026, e relacionar atividades/evidências na [matriz](rastreabilidade.md).
- [ ] Realizar revisão coletiva/docente e conferir anexos acadêmicos específicos quando solicitados.

## 9. Registro de dificuldades, decisões e mudanças de escopo

- [x] [Decisões](decisoes.md): arquitetura/provedores, ciclos, cifra, dependências externas, mudanças em relação à ERS original e limites de autoria.
- [x] [Manual](manual.md): instalação, serviços locais, conta, privacidade, financeiro, app e roteiro de demonstração.
- [x] Limitações preservadas: IA treinada, autoescala, autosave contínuo, sincronização Google bidirecional e novos esportes administrativos estão no backlog.
- [ ] Ativar serviços externos somente com credenciais/configuração/autorização do responsável; homologar e registrar resultados reais.
- [ ] Cada integrante realizar sua entrega e registrar participação própria; nenhuma submissão acadêmica foi feita automaticamente.

## Estado de conclusão

Conferência de 22/10/2026: [diferenças em relação aos originais, Eletiva I e obrigação de homologações](aceite-escopo-sprint-2.md). CREF automático e integração com nuvem prevista precisam de resolução específica; a existência dos nove artefatos não equivale a aceite integral do escopo original.

Os nove entregáveis obrigatórios possuem implementação ou artefato referenciado acima, com publicação e CI confirmadas. Acesso externo, homologação completa em aparelho, revisão docente e participação individual permanecem conforme as [pendências](pendencias-lucca.md). IA treinada, autosave contínuo, novas modalidades administrativas e sincronização Google bidirecional são evoluções futuras do [backlog](backlog.md). A existência de código de integração não certifica operação externa nem conformidade integral LGPD/PCI/WCAG.

## Revisão complementar de 15–20/10/2026

- [x] Todos os materiais originais inventariados e comparados: [revisão](revisao-materiais.md) e [hashes](evidencias/materiais-originais.json).
- [x] Checklist dos fornecedores, obrigação por Sprint, alternativas locais e homologações: [serviços externos](servicos-externos-sprint-2.md).
- [x] DER e sequências conferidos automaticamente contra 36 tabelas/257 colunas/45 FKs e OpenAPI: [dicionário](dicionario-dados.md), [verificador](../../scripts/check-docs.ts).
- [x] Docker reiniciado com dados preservados, migrations e saúde: [ambiente](evidencias/ambiente-local-revisado.json).
- [x] Correções de limpeza de arquivos privados, backup com variável vazia e bibliotecas: [decisões](decisoes.md), [auditoria](seguranca-dependencias.md).
- [x] Página pública com informações coerentes, menu móvel e layout sem overflow em 320/390/1440: [Chrome](evidencias/chrome-landing-revisada.json); contraste corrigido e [axe sem violações nas regras verificadas](evidencias/chrome-landing-axe.json).
- [x] APK corrigido conectado à API/PostgreSQL/SMTP/S3: [18/18 etapas aprovadas](evidencias/android-integrated-result.json), [execução remota](evidencias/github-android-integrated.json), [upload e correção](evidencias/android-integrated-midia-feedback.png), [encerramento](evidencias/android-integrated-conta-encerrada.png).
- [ ] Validar com professor as diferenças de escopo frente à ERS/proposta originais e concluir entregas individuais. A identificação da Eletiva I foi resolvida em 23/10/2026 na matriz.

- [x] CI completa da revisão, com tipos/build, 82 testes, backup, 15 E2E, nativo e TLS: [run 39645457806](https://github.com/DaviSouza78/LinkAtletas/actions/runs/39645457806), [registro](evidencias/github-ci-pr-2.json).
