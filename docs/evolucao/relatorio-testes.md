# Relatório de testes — ampliação LinkAtletas

Consolidação revisada em 21/10/2026, com evidências datadas de cada execução; registros de 14–15/10 preservados quando não houve mudança no cenário. Este relatório registra evidência efetivamente produzida; testes escritos, aprovação técnica, build, sandbox e homologação de aparelho são estados distintos. As evidências históricas da Sprint 2 inicial permanecem em [docs/sprint-2/evidencias](../sprint-2/evidencias/).

## Ambiente

Windows, Node 24.15.0, pnpm 10.33.2, PostgreSQL 17 em Docker; CI reproduzida em runner Ubuntu do GitHub Actions. API Fastify, React web, SeaweedFS S3 privado e Mailpit SMTP locais. Banco de testes termina em `_test`; migrations sequenciais, sem limpeza da base demonstrativa. Dados fictícios. Cliente Expo tem manifesto e lock próprios. Não houve cobrança, abertura de conta financeira ou implantação de site/API públicos. O código foi publicado no GitHub com autorização.

## Resultados executados e verificações pendentes

Suíte local Windows: **82/82 Vitest aprovados**, nenhuma falha, conforme [JSON gerado](evidencias/vitest-results.json). Na CI Ubuntu, **15/15 E2E aprovados** — cinco cenários em cada motor Chromium, Firefox e WebKit — sem falhas/retries, conforme [Playwright JSON](evidencias/playwright-results.json). O cliente nativo possui 22 testes de transporte/configuração separados; suas verificações não substituem homologação em aparelho.

| Camada | Cenários implementados | Estado desta revisão |
|---|---|---|
| Match | [matching.test.ts](../../tests/unit/matching.test.ts): pesos/elegibilidade/cidade | 13/13 aprovados no JSON consolidado |
| API original | [api.test.ts](../../tests/integration/api.test.ts): conta/perfil/vínculo/treino/propriedade | 20/20 aprovados; evidência inicial preservada |
| Criptografia | [crypto.test.ts](../../tests/unit/crypto.test.ts): roundtrip, integridade e IV | 2/2 aprovados |
| Plataforma | [platform.test.ts](../../tests/integration/platform.test.ts): consentimento, SQL/S3 cifrados, mídia, recuperação SMTP, sessão nativa, expiração e exclusão | 10/10 aprovados |
| Comunicação | [interactions.test.ts](../../tests/integration/interactions.test.ts): persistência/WS/leitura/isolações/reviews/agenda | 13/13 aprovados |
| Financeiro | [billing.test.ts](../../tests/integration/billing.test.ts): contrato HTTP, duplicata, evento/timeout/conciliação/acesso | 14/14 aprovados; nenhum sandbox real do Asaas foi utilizado |
| Concorrência e privacidade | [privacy-races.test.ts](../../tests/integration/privacy-races.test.ts): perfil, sessão e feedback durante eliminação/troca de senha | 3/3 aprovados; bloqueios reais PostgreSQL, sem sleeps usados como prova de ordenação |
| Arquivos públicos | [static-security.test.ts](../../tests/unit/static-security.test.ts): acesso normal e tentativa de sair da raiz estática | 5/5 aprovados |
| Chave de backup | [backup-key.test.ts](../../tests/unit/backup-key.test.ts): variável vazia e chave inválida, preservando o arquivo original | 2/2 aprovados |
| Tipos web | `pnpm exec tsc -p tsconfig.app.json --noEmit` | Passou após integração das novas telas |
| Navegador e acessibilidade | Fluxo ampliado, 390/1440, três motores e axe | 15 E2E aprovados; seis telas por motor sem violações nas regras automáticas WCAG 2 A/AA e 2.1 A/AA: [Chromium](evidencias/chromium-axe.json), [Firefox](evidencias/firefox-axe.json), [WebKit](evidencias/webkit-axe.json) |
| App Expo | Tipos, dependências, Doctor, transporte, Hermes Android/iOS e compilação APK | Passaram: [verificação detalhada](evidencias/mobile-verificacao.md), [22/22 transporte/configuração](evidencias/mobile-tests.json), [hashes dos bundles](evidencias/mobile-bundles.json) e [build APK local](evidencias/github-android-local-build.json). Ensaio integrado no emulador registrado abaixo; aparelho físico e IPA pendentes |
| APK local integrado | 18 etapas na interface Android com API/PostgreSQL/SMTP/S3 reais | [18/18 aprovadas](evidencias/android-integrated-result.json), [execução remota, tentativa 2](https://github.com/DaviSouza78/LinkAtletas/actions/runs/39522996463/attempts/2), [upload e feedback](evidencias/android-integrated-midia-feedback.png); aparelho físico não validado |
| APK documental histórico | Instalação e abertura da tela de login no Android API 35 x86_64 | [Resultado anterior](evidencias/android-emulator-result.json), [captura](evidencias/android-emulator-startup.png). Esse teste inicial não é a evidência de integração do APK local corrigido |
| TLS local | Container/HTTPS, banco, autenticação, origem e reinício | [TLS 1.3](evidencias/production-tls.json): CA explícita, cookie Secure/HttpOnly, HTTP 200/201, mutation sem Origin 403 e sessão/perfil preservados após reinício da aplicação; sem trust global/domínio público |
| Backup/restauração | Banco e S3 cifrados em destinos isolados | [36 tabelas e checksums iguais](evidencias/backup-restore.json), roundtrip de campo/mídia e dump sem texto claro; [worker privado](evidencias/private-network-backup.json) |
| Carga do match | 500 treinadores sintéticos, 200 chamadas HTTP, concorrência 10 | [Medição](evidencias/carga-matchmaking.json): 200 respostas 200, p50 78,54 ms, p95 97,78 ms, p99 132,54 ms; não extrapolar nuvem/escala |
| CI e build final | Instalação, tipos/build, Vitest, backup, browsers/axe, Expo e TLS/reinício | [Tipos/build locais aprovados](evidencias/verificacao-build.txt); [CI após Vite 8.2.4 aprovada](https://github.com/DaviSouza78/LinkAtletas/actions/runs/39645457806), [registro remoto](evidencias/github-ci-pr-2.json) |
| Documentação | Links relativos e OpenAPI runtime | [Conferência reproduzível](evidencias/documentation-check.json), sem links quebrados; ERS/relatório DOCX validados e PDFs renderizados pelo LibreOffice |

Contagens acima foram conferidas em arquivos de resultado, não inferidas apenas da existência de cenários. Falhas de tentativas anteriores não substituem o resultado final; correções e limites permanecem explícitos. O manifesto de backup registra necessidade de pausar escritas em operação, pois não existe transação distribuída banco/objetos.

Na finalização de 15/10, o cenário de chat passou a forçar o fechamento atrasado da conexão descartada pelo StrictMode depois de aberta a conexão válida. O indicador permaneceu conectado e a troca real de mensagens foi verificada nos três motores. A [CI após a correção](https://github.com/DaviSouza78/LinkAtletas/actions/runs/38675094079) aprovou novamente todas as etapas; [registro remoto](evidencias/github-ci-finalizacao.json).

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

Asaas sandbox real, split/repasse de carteira real, CREF autorizado, SMTP externo, S3 hospedado, domínio público, stores e fluxo completo em aparelhos Android/iOS. Google OAuth/Agenda/Meet reais também não foram exercitados. Axe não substitui ensaio com leitor de tela ou revisão integral WCAG. WebKit não comprova Safari real; Chromium não comprova Edge real. Carga local não comprova autoescala em nuvem. Veja [publicação e APK](publicacao.md) e [pendências humanas](pendencias-lucca.md).

## Revisão técnica e documental de 15–21/10/2026

A [CI mais recente no commit b931e44](evidencias/github-ci-revisao-mais-recente.json) também passou integralmente: [run 39508144201](https://github.com/DaviSouza78/LinkAtletas/actions/runs/39508144201). As capturas consolidadas dos browsers e provas SQL/S3/TLS foram atualizadas com a execução aprovada 39645457806, após Vite 8.2.4 e a checagem do SDK fixado. A nova CI confirma 82 testes de API/unidade, 15 E2E e 22 testes móveis.

O [ambiente local](evidencias/ambiente-local-revisado.json) foi recuperado preservando containers, volumes e chave. Os sockets transitórios inválidos voltaram a impedir a partida após nova sessão do Windows; ambos os diretórios de runtime foram preservados e recriados em 20/10. Não foi realizado reset de fábrica. Os 82 testes passaram novamente com os serviços saudáveis e Vitest 4.1.11. O primeiro ensaio dessa retomada encontrou o banco ainda desligado e foi descartado; sua falha não foi contada como teste aprovado.

Os 15 E2E de 15/10 foram repetidos após a atualização dos plugins HTTP e passaram sem retry; a execução aprovada substitui o relatório parcial de uma tentativa interrompida. O cliente Expo 57.0.30 passou em 22 testes, tipos, dependências, Doctor 21/21 e exportação Hermes (631 módulos Android e 633 iOS). [Hashes dos bundles](evidencias/mobile-bundles.json) não equivalem a IPA ou homologação física.

A auditoria completa das dependências de produção e desenvolvimento retornou zero alertas na raiz e dois alertas altos sem correção oficial nas ferramentas transitivas do Expo: [resultado](evidencias/auditoria-dependencias.json), [exposição e tratamento](seguranca-dependencias.md). Não foram suprimidos avisos. O perfil normal Android foi pré-gerado com tráfego claro desabilitado e sem exceção local; o perfil de demonstração permite apenas três destinos locais explícitos.

A [revisão dos materiais](revisao-materiais.md) preserva os originais e identifica ajustes de escopo que exigem alinhamento docente. Os modelos foram conferidos automaticamente contra 36 tabelas/257 colunas/45 FKs, 16 casos de uso únicos e 11 chamadas das sequências/OpenAPI, sem exportar dados de usuários.

Na CI de 20/10, a regressão do socket descartado falhou no WebKit porque esse navegador pode não emitir `close` quando a conexão é abortada antes de abrir. O ensaio agora injeta explicitamente o callback atrasado após abrir a conexão válida, mantendo o transporte real; a asserção não foi removida. A prontidão do E2E passou a consultar `/api/health` através do proxy web, evitando iniciar a primeira requisição quando somente o Vite já estava disponível.

No Windows, a jornada WebKit com três contextos concluiu individualmente suas ações, mas somou 80 segundos apenas nos cadastros/perfis e atingiu o limite global de 90 segundos durante a aprovação. O limite dessa única jornada nesse sistema foi ajustado para 180 segundos; os limites por ação (15 s), por asserção (10 s) e a ausência de retries foram preservados. O trace não mostrou falha de API nessa tentativa. A CI Ubuntu executou a jornada completa e os outros 14 cenários sem esse ajuste de plataforma.

A jornada multiperfil do WebKit voltou a passar no Windows, em 2,7 minutos, com o orçamento total ajustado e os limites por ação preservados: [resultado do cenário isolado](evidencias/webkit-windows-fluxo.json). O Chrome instalado neste computador também abriu a interface em 1440/390 sem overflow ou erro JavaScript e alcançou a API pelo proxy: [smoke local](evidencias/chrome-local-smoke.json). Esse smoke de Chrome não substitui os fluxos completos executados nas três engines.

O teste curto de mídia reproduziu no APK anterior a mensagem `Unsupported FormDataPart implementation`: [resultado de falha histórica](evidencias/android-upload-legado.json), [captura](evidencias/android-upload-legado.png). O `fetch` global do Expo rejeita o objeto legado com URI; o cliente foi corrigido para transmitir `File`, preservando o nome original, com regressão de bytes/MIME/nome/autenticação. Os 22 testes móveis passaram. A fixture PNG também teve seu CRC corrigido. Esse registro histórico não é contabilizado como teste aprovado do APK corrigido.

Em 21/10, o Chrome instalado revelou overflow na página inicial a 390 px, fora das jornadas autenticadas existentes. O cabeçalho e as colunas públicas receberam regras responsivas; o menu móvel ganhou rótulo, estado expandido e navegação que fecha após escolher uma seção. A página passou em 320/390/1440, sem overflow ou erro JavaScript: [resultado e navegação](evidencias/chrome-landing-revisada.json), [captura móvel](evidencias/chrome-landing-390.png). A quantidade de modalidades agora usa o catálogo real de cinco itens; a média de avaliações fictícia foi removida e o gráfico foi identificado como ilustrativo.

A checagem axe da página pública apontou contraste insuficiente na faixa de informações, numeração dos cartões/passos e indicador de exemplo. As cores foram corrigidas; o cabeçalho móvel recebeu fundo escuro para manter a leitura sobre a imagem. A nova execução em 320/390/1440 retornou zero violações nas regras WCAG 2 A/AA e 2.1 A/AA verificadas: [resultado, incluindo verificações incompletas](evidencias/chrome-landing-axe.json). Essa análise automática não substitui avaliação manual integral ou leitor de tela.

## APK conectado — jornada completa aprovada em 21/10/2026

O APK de SHA-256 `5e8365264c329bbb5539b0ab3b5affb664440705c3fe12ec9eb833dbf39fdc0b`, fonte `e3393fa`, passou pelas 18 etapas no Android API 35 x86_64: [resultado completo](evidencias/android-integrated-result.json), [registro do GitHub](evidencias/github-android-integrated.json). A automação usou o commit `588071d`; o código do APK e o roteiro de teste possuem proveniências distintas e explícitas.

Foram conferidos acesso inválido/perfil recusado, cadastro, restauração real do SecureStore, consentimentos/saúde, perfil, contratação, execução de treino, chat bidirecional, consultoria, avaliação elegível na fixture, modo financeiro sem cobrança, seletor/upload S3/correção, notificações, reinicialização, recuperação por SMTP/token/senha nova, revogação da mídia e encerramento/revogação da sessão. Os dados são fictícios, o banco termina em `_test` e a carência da avaliação foi reduzida só nessa fixture. Não houve crash detectado nos logs examinados: [log](evidencias/android-integrated-errors.log).

Uma tentativa anterior aprovou 17 etapas, mas procurou o botão final com capitalização diferente da exibida pelo diálogo Android; o seletor foi corrigido para o texto nativo em maiúsculas. A primeira tentativa do run final perdeu o ADB durante `dumpsys input_method`, sem diagnóstico suficiente para atribuir causa ao aplicativo. A tentativa 2 repetiu a jornada inteira e passou, em 802,68 s, sem evento do launcher registrado. As tentativas incompletas não foram somadas para produzir o resultado de 18/18.

Na verificação de 21/10, o catálogo online do Expo recomendou 57.0.31/Sharing 57.0.24; o APK validado utiliza 57.0.30/57.0.23. A CI agora verifica instalação exata e compatibilidade dos nove pacotes de runtime contra `bundledNativeModules.json` do SDK 57.0.30 fixado: [resultado](evidencias/mobile-compatibility-locked.json). `pnpm --dir mobile check:updates` mantém a consulta separada a recomendações online. A compatibilidade do runtime permanece verificada; atualizações do runtime exigem novo APK e novo ensaio. Doctor e auditorias anteriores conservam suas datas próprias.
