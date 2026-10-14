# Relatório de testes — ampliação LinkAtletas

Data: 14/10/2026. Este relatório registra evidência efetivamente produzida; testes escritos, aprovação técnica, build, sandbox e homologação de aparelho são estados distintos. As evidências históricas da Sprint 2 inicial permanecem em [docs/sprint-2/evidencias](../sprint-2/evidencias/).

## Ambiente

Windows, Node 24.15.0, pnpm 10.33.2, PostgreSQL 17 em Docker. API Fastify, React web, SeaweedFS S3 privado e Mailpit SMTP locais. Banco de testes termina em `_test`; migrations sequenciais, sem limpeza da base demonstrativa. Dados fictícios. Cliente Expo tem manifesto e lock próprios. Nenhuma cobrança/conta financeira/publicação pública foi executada durante testes.

## Resultados executados e verificações pendentes

Suíte consolidada local: **75/75 Vitest aprovados**, nenhuma falha, conforme [JSON gerado](evidencias/vitest-results.json). **15/15 E2E aprovados** — cinco cenários em cada motor Chromium, Firefox e WebKit — sem falhas/retries, conforme [Playwright JSON](evidencias/playwright-results.json). O cliente nativo possui nove testes de transporte separados; suas verificações não substituem homologação em aparelho.

| Camada | Cenários implementados | Estado desta revisão |
|---|---|---|
| Match | [matching.test.ts](../../tests/unit/matching.test.ts): pesos/elegibilidade/cidade | 13/13 aprovados no JSON consolidado |
| API original | [api.test.ts](../../tests/integration/api.test.ts): conta/perfil/vínculo/treino/propriedade | 20/20 aprovados; evidência inicial preservada |
| Criptografia | [crypto.test.ts](../../tests/unit/crypto.test.ts): roundtrip, integridade e IV | 2/2 aprovados |
| Plataforma | [platform.test.ts](../../tests/integration/platform.test.ts): consentimento, SQL/S3 cifrados, mídia, recuperação SMTP, sessão nativa, expiração e exclusão | 10/10 aprovados |
| Comunicação | [interactions.test.ts](../../tests/integration/interactions.test.ts): persistência/WS/leitura/isolações/reviews/agenda | 13/13 aprovados |
| Financeiro | [billing.test.ts](../../tests/integration/billing.test.ts): contrato HTTP, duplicata, evento/timeout/conciliação/acesso | 14/14 aprovados; nenhum sandbox real do Asaas foi utilizado |
| Concorrência e privacidade | [privacy-races.test.ts](../../tests/integration/privacy-races.test.ts): perfil, sessão e feedback durante eliminação/troca de senha | 3/3 aprovados; bloqueios reais PostgreSQL, sem sleeps usados como prova de ordenação |
| Tipos web | `pnpm exec tsc -p tsconfig.app.json --noEmit` | Passou após integração das novas telas |
| Navegador e acessibilidade | Fluxo ampliado, 390/1440, três motores e axe | 15 E2E aprovados; seis telas por motor sem violações nas regras automáticas WCAG 2 A/AA e 2.1 A/AA: [Chromium](evidencias/chromium-axe.json), [Firefox](evidencias/firefox-axe.json), [WebKit](evidencias/webkit-axe.json) |
| App Expo | Tipos, dependências, Doctor, transporte e Hermes Android/iOS | Passaram: [verificação detalhada](evidencias/mobile-verificacao.md), [9/9 transporte](evidencias/mobile-tests.json), [hashes dos bundles](evidencias/mobile-bundles.json); APK/IPA/aparelho não homologados |
| TLS local | Container/HTTPS, banco, autenticação, origem e reinício | [TLS 1.3](evidencias/production-tls.json): CA explícita, cookie Secure/HttpOnly, HTTP 200/201, mutation sem Origin 403 e sessão/perfil preservados após reinício da aplicação; sem trust global/domínio público |
| Backup/restauração | Banco e S3 cifrados em destinos isolados | [36 tabelas e checksums iguais](evidencias/backup-restore.json), roundtrip de campo/mídia e dump sem texto claro; [worker privado](evidencias/private-network-backup.json) |
| Carga do match | 500 treinadores sintéticos, 200 chamadas HTTP, concorrência 10 | [Medição](evidencias/carga-matchmaking.json): 200 respostas 200, p50 78,54 ms, p95 97,78 ms, p99 132,54 ms; não extrapolar nuvem/escala |
| CI e build final | Workflow e scripts versionados | [Tipos/build aprovados](evidencias/verificacao-build.txt); [CI](../../.github/workflows/ci.yml) preparada, execução remota não realizada |
| Documentação | Links relativos e OpenAPI runtime | [Conferência reproduzível](evidencias/documentation-check.json), sem links quebrados; ERS/relatório DOCX validados e PDFs renderizados pelo LibreOffice |

Contagens acima foram conferidas em arquivos de resultado, não inferidas apenas da existência de cenários. Falhas de tentativas anteriores não substituem o resultado final; correções e limites permanecem explícitos. O manifesto de backup registra necessidade de pausar escritas em operação, pois não existe transação distribuída banco/objetos.

No E2E, `REVIEW_MIN_DAYS=0` permite avaliar o vínculo recém-criado; os testes da API verificam a regra padrão de sete dias. SMTP e S3 são serviços locais reais. O teste de transporte Expo controla os módulos nativos e não executa Keychain/Keystore real. A auditoria axe não incluiu telas administrativas ou uma avaliação manual completa de leitores de tela. Os testes de concorrência reproduzem requisições já autenticadas enquanto o banco mantém um bloqueio e confirmam a resposta após a eliminação/troca concorrente.

## Controles examinados pelos testes de API

Credenciais e token não aparecem em URL de WebSocket. Reset guarda hash e expiração, token usado uma vez e sessões anteriores revogadas; e-mail capturado por Mailpit. S3 privado recebe ciphertext e download autorizado recupera bytes originais; consentimento negado/revogado, assinatura falsa e terceiro falham. SQL de saúde, mensagem, descrição de consultoria e execução não conserva conteúdo privado em claro. Conferência profissional expira/suspende e remove descoberta com auditoria.

Chat persiste depois de recriar API, pagina sem perder/duplicar mensagens, comunica duas sessões e nega upgrade anônimo/origem indevida. Reviews exigem prazo e titularidade, preservam uma por ciclo, resposta pelo treinador correto e ocultação retira conteúdo/média. Agenda protege conflitos entre diferentes vínculos, horários e histórico. Financeiro usa servidor HTTP controlado, verifica cabeçalho de autenticação e minimização; duplicatas, eventos antigos, timeouts e cancelamento incerto não viram cobrança nova ou confirmação falsa.

## Reprodução

```powershell
docker compose up -d --wait
pnpm db:migrate
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e
```

Não execute integração Vitest e E2E simultaneamente no mesmo banco de teste. Configuração final do E2E define portas e diretório de evidência; conferir arquivo de configuração antes de executar. Manual do cliente e operação estão em [manual.md](manual.md).

## Homologações externas pendentes

Asaas sandbox real, split/repasse de carteira real, CREF autorizado, SMTP externo, S3 hospedado, domínio público, stores e instalação/dispositivo Android/iOS. Google OAuth/Agenda/Meet reais também não foram exercitados. Axe não substitui ensaio com leitor de tela ou revisão integral WCAG. WebKit não comprova Safari real; Chromium não comprova Edge real. Carga local não comprova autoescala em nuvem.
