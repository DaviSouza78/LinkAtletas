# Ampliação LinkAtletas — Implementation Plan

> **For agentic workers:** Use executing-plans; tarefas independentes podem ser delegadas, com revisão da integração pela raiz. Steps use checkbox syntax for tracking.

**Goal:** Implementar a ampliação aprovada e demonstrar os controles locais, separando ativação externa de implementação.

**Architecture:** API Fastify modular, migrações cumulativas PostgreSQL, web React existente e aplicativo Expo atleta. S3 privado e SMTP locais são serviços reais; o adaptador Asaas usa contrato HTTP oficial e não simula confirmação externa.

**Tech Stack:** Node 24, TypeScript, PostgreSQL 17, Fastify 5, React 19, Expo, Docker, Playwright, Vitest.

Base: branch `evolucao-completa`, entrega anterior preservada em `sprint-2`. Autor: Lucca <luccacc.contato@gmail.com>. Não publicar nem cobrar durante testes.

## Interfaces e propriedade dos arquivos

Raiz: `server/app.ts`, `server/config.ts`, `server/modules/platform.ts`, `server/modules/media.ts`, `server/modules/auth.ts`, `server/modules/verification.ts`, `server/modules/workouts.ts`, `server/shared/crypto.ts`, migração `002_platform.sql`, compose e dependências.

Comunicação: `server/modules/interactions.ts`, `shared/interaction-contracts.ts`, migração `003_interactions.sql`, testes `tests/integration/interactions.test.ts`.

Financeiro: `server/modules/billing.ts`, `server/modules/contracts.ts`, `server/services/asaas.ts`, `shared/billing-contracts.ts`, migração `004_billing.sql`, testes `tests/integration/billing.test.ts`.

Web: `src/pages/integrated/Expansion.tsx`, App, navegação e CSS. Não editar os arquivos de backend de outro responsável. Aplicativo: diretório `mobile/`, dependências independentes. Documentação: `docs/evolucao/` com evidências novas, mantendo a Sprint 2 histórica.

## 1. Infraestrutura e segurança

- [ ] Instalar multipart, websocket, AWS S3 e SMTP; fixar versões resolvidas no manifesto. Comando: `pnpm add @fastify/multipart @fastify/websocket @aws-sdk/client-s3 nodemailer`.
- [ ] Criar `002_platform.sql`: usuários desativados, tokens de recuperação hash, outbox, consentimentos, arquivos, feedback, auditoria e campos privados cifrados. Executar `pnpm db:migrate`; deve preservar seed e migrações anteriores.
- [ ] Criar `server/shared/crypto.ts`, exportando `encryptPrivate(value: string): string` e `decryptPrivate(value: string): string`; AES-256-GCM com chave de 32 bytes `DATA_ENCRYPTION_KEY`, IV aleatório. Teste `expect(encryptPrivate('privado')).not.toContain('privado')` e roundtrip/integridade em `tests/unit/crypto.test.ts`.
- [ ] Acrescentar SeaweedFS autenticado e Mailpit ao `compose.yaml`, portas vinculadas a 127.0.0.1. `docker compose up -d --wait`: serviços saudáveis, sem SMTP externo.
- [ ] Corrigir inferência OpenAPI para preservar schema de resposta explícito e não inferir rotas novas por prefixo.

## 2. Autenticação nativa e recuperação

- [ ] Criar `/api/auth/native/login` e `/register` retornando `{user,token,expiresAt}`, sem cookie; armazenamento apenas do hash no banco. Aceitar Bearer válido antes do controle Origin; apenas esses endpoints públicos nativos e webhook autenticado dispensam Origin.
- [ ] Implementar `/auth/forgot-password` `{email}` com resposta genérica e `/auth/reset-password` `{token,password}`; transação bloqueia token, verifica expiração, troca hash e invalida sessões.
- [ ] Persistir e enviar outbox via SMTP; marcar enviado só após `sendMail`. Testar uso único, expiração e invalidação no PostgreSQL + captura Mailpit: `pnpm exec vitest run tests/integration/platform.test.ts`.

## 3. Arquivos, feedback e dados privados

- [ ] `POST /media?purpose=verification|instruction|performance|message&resourceId=UUID` multipart campo `file`; finalidades autorizadas pelo recurso, dono e consentimento. Validar assinatura JPEG/PNG/WebP/PDF/MP4/WebM, tamanho, nome seguro; gravar ciphertext S3 e metadados no banco.
- [ ] `GET /media/:id/content`, `GET /media?resourceId=...`, `DELETE /media/:id` e `POST /media/:id/feedback {text}`: conferir autorização a cada acesso, ler ciphertext e devolver original.
- [ ] Cifrar notas e métricas de execução sem perder os registros anteriores; ler através de decrypt antes da resposta. Testes devem consultar SQL e S3 e provar texto privado ausente, roundtrip correto e terceiro negado.

## 4. Comunicação, avaliações e consultorias

- [ ] Criar migração `003_interactions.sql` e módulo; API `GET/POST /contracts/:id/messages`, `PUT /contracts/:id/messages/read`, `GET/PUT /notifications`, `GET/POST /consultations`, `PATCH /consultations/:id`, `GET/POST /reviews`, `POST /reviews/:id/reply`, `/report`, `PATCH /admin/reviews/:id`.
- [ ] WS `/api/events`, cookie ou Authorization, autorização por sessão e Origin browser; publicar após commit, ler histórico com cursor. Mensagens cifradas via helper da raiz; recusar envio em vínculo encerrado.
- [ ] Avaliar só atleta elegível, uma avaliação por ciclo, média sem ocultos; agenda bloqueia conflito entre participantes. Testar persistência, isolamento, WebSocket, conflito e moderação em `interactions.test.ts`.

## 5. Financeiro e ciclos de vínculo

- [ ] Criar migração `004_billing.sql`: histórico de ciclos, planos, carteiras, assinaturas, pagamentos, eventos únicos e tentativas de conciliação. Substituir unicidade do par por índice parcial de vínculo vigente.
- [ ] Adaptador Asaas Checkout assinatura/split com API key no servidor, timeout e estado incerto sem nova cobrança automática. API `/billing/config`, `/billing/wallet`, `/billing/checkout`, `/billing/summary`, `/billing/subscriptions/:id/cancel`, `/billing/webhook`, `/admin/billing/settings`.
- [ ] Validar token `asaas-access-token` em tempo constante; persistir evento antes de aplicar, não confirmar por redirect; transição idempotente e preservação do período pago. Testar contrato HTTP com servidor local, duplicatas e falhas; documentar sandbox real pendente.
- [ ] `/contracts/:id/cancel {reason}` com autorização, motivo e auditoria; novo ciclo não altera treinos passados. Exportar `assertContractAccess(pool,contractId,userId)` para módulos. Executar `billing.test.ts` e regressão original.

## 6. Validação profissional e privacidade

- [ ] Aceitar `documentId` privado e `expiresAt` na conferência; registrar origem manual, suspensão/revogação e expiração com auditoria. `PATCH /admin/coaches/:id/verification {status,reason}`; tarefa expira aprovações e remove da descoberta.
- [ ] `/privacy/policy`, `GET/PUT /privacy/consents`, `GET /privacy/export`, `POST /privacy/delete {password}`, `GET /admin/privacy/requests`. Reautenticar, revogar sessões, anonimizar conta e conteúdo segundo política explícita, preservar registros necessários com minimização.
- [ ] Executar testes SQL de expiração, revogação, exportação sem dados alheios e exclusão; não apresentar esses controles como certificação jurídica.

## 7. Interfaces web

- [ ] Substituir FuturePage por Mensagens, Agenda, Financeiro, Avaliações, Notificações e Privacidade ligados às APIs; incluir reset, uploads e feedback em perfil/treinos, administração de expiração e moderação.
- [ ] Preservar navegação existente e responsividade 390/1440. Formulários com label, estados loading/erro/vazio, confirmação de ações e foco de teclado. Testar duas sessões e histórico de chat com Playwright.

## 8. Aplicativo Expo

- [ ] Criar `mobile/package.json`, `app.json`, `App.tsx`, `src/api.ts` e telas atleta; usar SecureStore para token, API configurável, sem chaves privadas no bundle.
- [ ] Login/cadastro, perfil, busca, vínculo/checkout, treinos/métricas/mídia, chat, consultas, avaliações/notificações e privacidade compartilham a API.
- [ ] Executar typecheck, validação de dependências e `expo export --platform android --platform ios`; guardar logs. Compilar/rodar Android somente com SDK/JDK disponíveis; IPA local depende Xcode, não marcar homologado sem execução real.

## 9. Implantação e recuperação

- [ ] Criar Dockerfile, `compose.production.yaml`, Caddyfile e scripts de init/configuração, migrations e jobs. Produção recusa demo, chave ausente e defaults inseguros.
- [ ] Exercitar HTTPS local usando CA de teste indicada explicitamente, sem alterar truststore do computador. Testar banco e frontend atrás do proxy.
- [ ] Criar `scripts/backup.ts` e `restore.ts` com destinos validados; exportar PostgreSQL, mídia cifrada e instruções de guarda da chave. Restaurar em banco isolado e comparar contagens/checksum.
- [ ] CI build/test com serviços, health/jobs e scripts reproduzíveis.

## 10. Qualidade e evidências

- [ ] `pnpm typecheck`, `pnpm test`, `pnpm build`; corrigir regressões antes de ampliar.
- [ ] Playwright Chromium, Firefox, WebKit instalados; axe nas telas, fluxo interações/financeiro/privacy/recuperação, screenshots e relatórios em `docs/evolucao/evidencias/`.
- [ ] Carga matchmaking com fixtures isoladas, concorrência e percentis p50/p95/p99 reais; registrar máquina e dataset sem atribuir escalabilidade não medida.

## 11. Documentação e pacote

- [ ] Atualizar ERS, regras, backlog, rastreabilidade, API, DER/classes/sequências, casos de uso UML formal, decisões, manual e roteiro de demonstração em `docs/evolucao/`.
- [ ] Gerar ERS/relatório editáveis e PDF, renderizar e verificar visualmente; links relativos portáteis, referências sem inventar participação/eletiva/submissão.
- [ ] Checklist distingue implementado e testado local, teste HTTP controlado, ativação externa e homologação em dispositivo. Cada check tem arquivo/evidência.
- [ ] Commits locais revisados com autoria fornecida; pacote zip/bundle contendo fonte/docs. Relatar explicitamente que não houve push/publicação.

## Revisão do plano

As 12 seções da proposta estão cobertas por tarefas 1–11. Testes de novos módulos usam banco com sufixo `_test`, sequenciais para não colidir com TRUNCATE; nunca usar banco da demonstração para limpeza. Integração e commits são controlados pela raiz. Resultados de pagamentos reais, conselho, lojas e hospedagem pública permanecem condicionados ao ambiente externo, conforme escopo aprovado.
