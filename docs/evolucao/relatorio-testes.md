# Relatorio de testes - LinkAtletas

Data da revisão: 27/10/2026.

Este relatorio identifica cada cenario executado, seu resultado e o arquivo que comprova a execucao. As contagens sao de casos automatizados, nao de usuarios, requisitos, telas ou percentual de cobertura.

## O que significa API neste relatorio?

**API interna do LinkAtletas** e o back-end Node/Fastify usado pelo site e pelo aplicativo para autenticar, salvar perfis, contratar, prescrever treinos e consultar resultados. Exemplo: `POST /api/workouts`. **Nao ha API externa de CREF integrada.** Os testes de CREF verificam submissao de evidencia, decisao manual do administrador e permissoes; nao consultam um conselho profissional.

## Como interpretar os resultados

- Caso: uma verificacao identificada pelo nome, com preparacao, acao e assercao no codigo vinculado.
- Aprovado: a assercao passou naquela execucao. Nao significa que todos os comportamentos possiveis foram testados.
- Os 99 testes da raiz, os 15 testes de navegador e os 22 testes moveis sao execucoes distintas. Nao somar resultados de reexecucoes dos mesmos casos.
- Testes de integracao usam PostgreSQL e servicos locais isolados; resultados de nuvem estao identificados separadamente.
- A auditoria ampliada ainda local nao integra estas contagens. Arquivos de teste escritos e nao publicados nao sao evidencias de entrega.

## Execucoes de referencia

| Execucao | Quantidade e significado | Evidencia |
|---|---|---|
| Raiz: unidade e integracao | 99 casos aprovados, zero reprovados, distribuidos pelos 11 arquivos detalhados abaixo | [JSON Vitest](evidencias/nuvem-2026-10-26-vitest.json) |
| Navegador | 5 cenarios repetidos em Chromium, Firefox e WebKit: 15 execucoes aprovadas, zero inesperadas e zero instaveis | [JSON Playwright](evidencias/verificacao-nuvem-entrega-2026-10-26/playwright-results.json) |
| Aplicativo | 22 casos de transporte e configuracao aprovados, detalhados abaixo | [JSON mobile](evidencias/mobile-tests.json) |
| Referencia externa do treino | 12 casos de validacao executados nesta revisao, separados da base historica de 99 | [JSON da correcao](evidencias/referencia-treino-2026-10-27.json) |

## Casos da API interna e testes unitarios

### Execucao de referencia: raiz

Inicio registrado (UTC): `2026-10-26T22:51:37.515000+00:00`. Fonte: [nuvem-2026-10-26-vitest.json](evidencias/nuvem-2026-10-26-vitest.json).

#### integration/api.test.ts

Autenticacao, perfis, conferencia manual de CREF, vinculo, treino, execucao e persistencia.

**20 aprovados de 20 casos deste arquivo.** [Codigo](../../tests/integration/api.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| não cria administrador pelo cadastro público nem aceita senha fraca | Aprovado |
| impede e-mail duplicado sem distinguir maiúsculas e senha incorreta | Aprovado |
| exige sessão e rejeita cookie inválido | Aprovado |
| não autentica sessão que ultrapassou a validade persistida | Aprovado |
| autentica com senha correta e armazena somente hash com sal | Aprovado |
| protege mutações contra origem ausente e externa | Aprovado |
| valida perfil e não permite a atleta aprovar CREF | Aprovado |
| oculta treinador ainda não aprovado e impede sua contratação | Aprovado |
| submete comprovação e registra aprovação administrativa com auditoria | Aprovado |
| mantém profissional reprovado fora dos resultados | Aprovado |
| retorna recomendação calculada e respeita filtros | Aprovado |
| revalida elegibilidade ao contratar diretamente sem passar pela descoberta | Aprovado |
| cria solicitação pendente, bloqueia duplicata e aceite por terceiros | Aprovado |
| aceita uma única vez mesmo com requisições simultâneas | Aprovado |
| valida a prescrição e protege o rascunho | Aprovado |
| publica e mostra a ficha somente ao atleta do vínculo | Aprovado |
| rejeita métricas desconhecidas, fora dos limites e blocos inexistentes | Aprovado |
| grava e atualiza uma única execução visível ao treinador | Aprovado |
| preserva sessão, vínculo, ficha e execução ao recriar a aplicação | Aprovado |
| encerra sessão e invalida o cookie anterior | Aprovado |

#### integration/billing.test.ts

Financeiro com respostas HTTP controladas do adaptador Asaas; sem cobranca real ou homologacao externa.

**14 aprovados de 14 casos deste arquivo.** [Codigo](../../tests/integration/billing.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| keeps academic access explicit and denies a foreign actor | Aprovado |
| validates ownership, whole cents, receiver wallet and audited admin settings | Aprovado |
| creates exactly one hosted recurring checkout under simultaneous requests and keeps unpaid access blocked | Aprovado |
| authenticates webhook before persistence; minimizes card data and consumes duplicate event only once | Aprovado |
| ignores old and regressive unpaid events without reducing the paid period | Aprovado |
| does not mix events from a production endpoint with sandbox subscriptions | Aprovado |
| preserves paid access during confirmed cancellation, idempotence and immutable history | Aprovado |
| withdraws a pending cycle idempotently, refusing outsiders and new writes | Aprovado |
| records uncertain checkout responses without blindly issuing another provider operation | Aprovado |
| preserves a definitely refused attempt and permits a new contract cycle after configuration is corrected | Aprovado |
| enforces grace expiry, professional suspension and denies further prescriptions | Aprovado |
| keeps failed cancellation pending, reconciles by safe GET and does not issue a second DELETE | Aprovado |
| retains unmatched authenticated events for reconciliation instead of crediting an unrelated account | Aprovado |
| treats provider timeout as an uncertain result with no retry in the adapter | Aprovado |

#### integration/interactions.test.ts

Mensagens, leitura, autorizacao, avaliacoes e conflitos de agenda.

**13 aprovados de 13 casos deste arquivo.** [Codigo](../../tests/integration/interactions.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| nega conversa a terceiro e visitantes, valida mensagem vazia e anexo alheio | Aprovado |
| persiste mensagens cifradas, mantém ordem e pagina sem perda/duplicação | Aprovado |
| confirma leitura até o cursor e conserva mensagens posteriores não lidas | Aprovado |
| publica para duas sessões autenticadas após gravação e fecha sessão revogada | Aprovado |
| recusa upgrade WebSocket anônimo e com origem indevida | Aprovado |
| notificações pertencem ao destinatário e não são marcadas por terceiros | Aprovado |
| avalia apenas depois de sete dias e impede duplicação por vínculo | Aprovado |
| permite edição só ao autor e resposta só ao treinador avaliado | Aprovado |
| denúncia e moderação auditada removem todo conteúdo da publicação/média | Aprovado |
| agenda persistida cifra descrição e isola dados por vínculo | Aprovado |
| bloqueia conflitos do treinador entre diferentes vínculos e horários passados | Aprovado |
| reagenda, registra histórico e cancela sem criar evento externo fictício | Aprovado |
| histórico sobrevive recriação da API e contrato encerrado recusa novas interações | Aprovado |

#### integration/platform.test.ts

Consentimento, arquivos privados, cifra, recuperacao e sessoes.

**13 aprovados de 13 casos deste arquivo.** [Codigo](../../tests/integration/platform.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| Bearer permite mutação nativa, cookie continua exigindo Origin | Aprovado |
| saúde exige consentimento, cifra e exporta exclusivamente os dados próprios | Aprovado |
| upload exige consentimento e recusa assinatura falsa/extensão indevida | Aprovado |
| S3 contém bytes cifrados, bucket é privado e download autorizado recupera original | Aprovado |
| envio em partes preserva arquivo grande, impede terceiro e finaliza sem duplicar | Aprovado |
| video no limite de 50 MiB atravessa partes e retorna em stream | Aprovado |
| partes invalidas, sessao expirada e assinatura falsa sao recusadas | Aprovado |
| feedback é privado e revogação elimina mídia do S3 e impede download | Aprovado |
| execução mantém notas e métricas cifradas em SQL | Aprovado |
| expiração e suspensão profissional removem descoberta e registram auditoria | Aprovado |
| recuperação envia via SMTP, token só tem hash SQL, uso único e invalida sessões | Aprovado |
| token expirado falha e logout Bearer invalida a sessão | Aprovado |
| exclusão reautentica, anonimiza e invalida a conta | Aprovado |

#### integration/privacy-races.test.ts

Concorrencia durante alteracao e eliminacao de dados privados.

**3 aprovados de 3 casos deste arquivo.** [Codigo](../../tests/integration/privacy-races.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| edição de perfil já autenticada aguarda e recusa conta encerrada | Aprovado |
| login com senha antiga não cria sessão após a troca concorrente | Aprovado |
| feedback aguardando arquivo eliminado não é recriado | Aprovado |

#### integration/vercel-runtime.test.ts

Contrato da entrada serverless e inicializacao da API.

**4 aprovados de 4 casos deste arquivo.** [Codigo](../../tests/integration/vercel-runtime.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| exporta um handler sem abrir outra porta durante a importacao | Aprovado |
| serve a interface e uma rota interna do navegador | Aprovado |
| preserva a API no mesmo servidor sem devolver o HTML | Aprovado |
| protege o agendador no servidor de producao | Aprovado |

#### unit/backup-key.test.ts

Validacao da chave de backup.

**2 aprovados de 2 casos deste arquivo.** [Codigo](../../tests/unit/backup-key.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| usa a chave existente quando a variavel do exemplo esta vazia | Aprovado |
| recusa uma chave configurada invalida sem substituir o arquivo existente | Aprovado |

#### unit/crypto.test.ts

Cifra, integridade e variacao do vetor de inicializacao.

**2 aprovados de 2 casos deste arquivo.** [Codigo](../../tests/unit/crypto.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| preserva Unicode, varia o IV e não armazena conteúdo em claro | Aprovado |
| rejeita bytes adulterados | Aprovado |

#### unit/matching.test.ts

Regras de elegibilidade e compatibilidade de perfis.

**13 aprovados de 13 casos deste arquivo.** [Codigo](../../tests/unit/matching.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| soma os pesos documentados até 100 e informa os critérios | Aprovado |
| exclui treinador pending | Aprovado |
| exclui treinador rejected | Aprovado |
| exclui treinador unsubmitted | Aprovado |
| exige modalidade esportiva em comum | Aprovado |
| exige mesma cidade para atendimento presencial | Aprovado |
| permite cidades distintas para atendimento online | Aprovado |
| não recomenda treinador exclusivamente presencial de outra cidade para atleta híbrido | Aprovado |
| retira apenas o peso do critério incompatível: {"goals":[]} | Aprovado |
| retira apenas o peso do critério incompatível: {"levels":[]} | Aprovado |
| retira apenas o peso do critério incompatível: {"price":201} | Aprovado |
| retira apenas o peso do critério incompatível: {"availability":[]} | Aprovado |
| não atribui pontos a critérios ausentes no perfil do atleta | Aprovado |

#### unit/scheduled.test.ts

Autenticacao, trava e tratamento de falhas dos jobs.

**10 aprovados de 10 casos deste arquivo.** [Codigo](../../tests/unit/scheduled.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| recusa acesso sem autorizacao: undefined | Aprovado |
| recusa acesso sem autorizacao: curta | Aprovado |
| recusa acesso sem autorizacao: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa | Aprovado |
| recusa token incorreto: Bearer errada | Aprovado |
| recusa token incorreto: Bearer bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb | Aprovado |
| executa somente com o segredo correto | Aprovado |
| evita outra execucao enquanto a trava esta ocupada | Aprovado |
| mantem a trava dentro de uma transacao ate concluir o trabalho | Aprovado |
| libera a trava mesmo quando o trabalho falha | Aprovado |
| descarta a conexao quando nao consegue encerrar a transacao | Aprovado |

#### unit/static-security.test.ts

Protecao contra acesso a arquivos fora da raiz publica.

**5 aprovados de 5 casos deste arquivo.** [Codigo](../../tests/unit/static-security.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| mantem o acesso ao arquivo publico | Aprovado |
| nao expoe arquivo fora da raiz publica: /files/../private.txt | Aprovado |
| nao expoe arquivo fora da raiz publica: /files/%2e%2e/private.txt | Aprovado |
| nao expoe arquivo fora da raiz publica: /files/..%2fprivate.txt | Aprovado |
| nao expoe arquivo fora da raiz publica: /files/..%5cprivate.txt | Aprovado |

### Execucao de referencia: aplicativo

Inicio registrado (UTC): `2026-10-20T23:55:42.832000+00:00`. Fonte: [mobile-tests.json](evidencias/mobile-tests.json).

#### api.test.ts

Autenticacao, perfis, conferencia manual de CREF, vinculo, treino, execucao e persistencia.

**12 aprovados de 12 casos deste arquivo.** [Codigo](../../mobile/tests/api.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| envia bytes e nome original do arquivo em multipart compativel com fetch | Aprovado |
| cadastro com nome vazio mantém a rota de cadastro e recebe validação do servidor | Aprovado |
| guarda sessão no SecureStore e usa Bearer sem token em URLs | Aprovado |
| recusa perfil treinador e invalida sessão criada antes de persistir | Aprovado |
| nega sessão expirada, apaga token e avisa a aplicação | Aprovado |
| senha de confirmação incorreta permite tentar novamente sem perder sessão válida | Aprovado |
| limpa sessão local mesmo quando logout não consegue acessar a rede | Aprovado |
| WebSocket usa cabeçalho nativo e mantém segredo fora da URL | Aprovado |
| download autorizado usa cabeçalho e elimina cópia do cache após ação do usuário | Aprovado |
| produção sem HTTPS apresenta erro de configuração sem transmitir credenciais | Aprovado |
| remove cópia parcial de mídia quando o download falha | Aprovado |
| remove exportação parcial quando a gravação falha | Aprovado |

#### config.test.ts

Transporte e configuracao do cliente movel.

**10 aprovados de 10 casos deste arquivo.** [Codigo](../../mobile/tests/config.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| usa loopback na demonstração local e mantém produção com HTTPS | Aprovado |
| recusa destino fora do ambiente local: http://192.168.1.2:3001/api | Aprovado |
| recusa destino fora do ambiente local: http://localhost.evil.test/api | Aprovado |
| recusa destino fora do ambiente local: https://api.linkatletas.test/api | Aprovado |
| recusa configuração imprópria: https://api.linkatletas.example/api | Aprovado |
| recusa configuração imprópria: ftp://localhost/api | Aprovado |
| recusa configuração imprópria: https://user:senha@api.linkatletas.test/api | Aprovado |
| recusa configuração imprópria: https://api.linkatletas.test/api?token=segredo | Aprovado |
| recusa configuração imprópria: endereco-invalido | Aprovado |
| mantém o endereço do emulador em desenvolvimento | Aprovado |

### Regressao adicional: referencia externa

Inicio registrado (UTC): `2026-10-28T01:31:44.935000+00:00`. Fonte: [referencia-treino-2026-10-27.json](evidencias/referencia-treino-2026-10-27.json).

#### unit/workout-reference.test.ts

HTTPS, tipo de entrada, tamanho, caracteres de controle e credenciais na referencia do treino.

**12 aprovados de 12 casos deste arquivo.** [Codigo](../../tests/unit/workout-reference.test.ts). Cada linha abaixo corresponde a um caso do JSON.

| Caso executado | Resultado observado |
|---|---|
| aceita HTTPS como dado sem alterar o texto | Aprovado |
| permite omitir a referencia | Aprovado |
| rejeita referencia insegura: "javascript:alert(1)" | Aprovado |
| rejeita referencia insegura: "data:text/html,<script>alert(1)</script>" | Aprovado |
| rejeita referencia insegura: "http://example.com/video" | Aprovado |
| rejeita referencia insegura: "https://user:password@example.com/video" | Aprovado |
| rejeita referencia insegura: "https://example.com/\nvideo" | Aprovado |
| rejeita referencia insegura: "https://example.com/<script>" | Aprovado |
| rejeita referencia insegura: "https://example.com/\"onclick=" | Aprovado |
| rejeita referencia insegura: "https://example.com/\\video" | Aprovado |
| rejeita referencia insegura: "https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" | Aprovado |
| rejeita referencia insegura: {"href":"https://example.com/video"} | Aprovado |

## Cenarios de navegador: o que sao as 15 execucoes?

O [codigo do fluxo principal](../../tests/e2e/sprint-2.spec.ts) verifica login invalido e a jornada de cadastro ate execucao persistida. O [codigo dos cenarios ampliados](../../tests/e2e/expansion.spec.ts) verifica comunicacao/agenda/privacidade/financeiro academico, recuperacao e acessibilidade/responsividade. Cada um dos cinco cenarios e repetido nos tres motores; isso explica 15, sem afirmar quinze funcionalidades distintas.

[Resultados completos por cenario, motor e tentativa](evidencias/verificacao-nuvem-entrega-2026-10-26/playwright-results.json). [Captura administrativa](evidencias/verificacao-nuvem-entrega-2026-10-26/aprovacao-administrativa.png) e [captura movel](evidencias/verificacao-nuvem-entrega-2026-10-26/execucao-mobile.png).

### Lista das execucoes de navegador

| Cenario | Motor | Resultado registrado |
|---|---|---|
| chat ao vivo → agenda → avaliação → consentimento e mídia → financeiro | chromium | passed |
| recuperação pela interface usa SMTP local e permite senha nova | chromium | passed |
| telas ampliadas têm acesso por teclado, responsividade e auditoria axe | chromium | passed |
| chat ao vivo → agenda → avaliação → consentimento e mídia → financeiro | firefox | passed |
| recuperação pela interface usa SMTP local e permite senha nova | firefox | passed |
| telas ampliadas têm acesso por teclado, responsividade e auditoria axe | firefox | passed |
| chat ao vivo → agenda → avaliação → consentimento e mídia → financeiro | webkit | passed |
| recuperação pela interface usa SMTP local e permite senha nova | webkit | passed |
| telas ampliadas têm acesso por teclado, responsividade e auditoria axe | webkit | passed |
| login informa erro real e mantém formulário utilizável em celular | chromium | passed |
| cadastro → aprovação → contratação → publicação → execução persistida | chromium | passed |
| login informa erro real e mantém formulário utilizável em celular | firefox | passed |
| cadastro → aprovação → contratação → publicação → execução persistida | firefox | passed |
| login informa erro real e mantém formulário utilizável em celular | webkit | passed |
| cadastro → aprovação → contratação → publicação → execução persistida | webkit | passed |

## Verificacoes manuais, producao e operacao

| Verificacao | O que foi conferido | Evidencia e limites |
|---|---|---|
| Revisao manual | Login, perfis, vinculo, treino, execucao, mensagens, agenda e erros | [Cenarios, resultados e limites](testes-manuais-2026-10-27.md); administracao manual local distinguida da preparacao por API em producao |
| Banco em producao | Gravacao por HTTPS, leitura direta no Neon e releitura pela API; perfil restaurado | [Registro da demonstracao](evidencias/demonstracao-preparada-2026-10-27.json); nao e teste manual de navegador |
| Producao e Preview | Banco, arquivos privados, recuperacao, jobs e APK | [Registro por ambiente](implantacao-2026-10-26.md); aceite SMTP nao comprova caixa de entrada |
| Backup | Restauracao isolada de banco e arquivos cifrados | [Resultados e verificacoes](evidencias/backup-restore.json); nao comprova rotina recorrente automatizada de backup da producao |
| Carga | 200 chamadas com 500 perfis sinteticos | [Metricas](evidencias/carga-matchmaking.json); nao extrapolar para capacidade de producao |

## CI, casos na ERS e reproducao

- [Casos de teste documentados na ERS](ERS-template-original-atualizada.pdf), secao 6. Os nomes dos testes automatizados acima identificam verificacoes implementadas; nao se presume correspondencia um-para-um com todos os CTs da ERS.
- [CI aprovada registrada](https://github.com/DaviSouza78/LinkAtletas/actions/runs/40420233293/attempts/2) e [workflow](../../.github/workflows/ci.yml). Uma execucao anterior nao comprova sucesso de um commit posterior.
- `pnpm test`: unidade/integracao. `pnpm test:e2e`: navegador. `pnpm --dir mobile test`: cliente movel. Usar banco isolado `_test`, nunca producao. Nao executar suites concorrentes na mesma base.
- [Guia de apresentacao](apresentacao-completa-sprint-2.md): demonstracao, consultas SQL e respostas ao professor.

## Limites e documentos anteriores

Na revisao da referencia externa, os 12 testes unitarios passaram, o build web passou e os tipos e 22 testes do aplicativo passaram. A tentativa adicional de repetir os 20 testes de integracao da API **nao executou os casos**, pois o Docker/banco local estava indisponivel: [resultado com 20 pendentes](evidencias/regressao-api-referencia-2026-10-27.json). Isso nao e uma nova aprovacao dos 20 casos nem altera o resultado da execucao historica de referencia.

A referencia externa e recebida como string JSON, validada no servidor e mostrada como texto sem abertura automatica na web e no aplicativo. Foram acrescentadas recusas para protocolos diferentes de HTTPS, credenciais, caracteres de controle e tamanho excessivo. Nao foi demonstrada exploracao de XSS no fluxo anterior; esta revisao reduz a superficie de navegacao externa. HTTPS e conversao para texto nao certificam a confiabilidade do destino. [Referencia tecnica OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

Sem homologacao Asaas real, API oficial de CREF, Google OAuth, aparelho fisico/iOS ou lojas. Testes automatizados de acessibilidade nao equivalem a auditoria manual integral. O ajuste da referencia externa e uma regressao adicional, nao uma reexecucao de todos os 99 testes.

Este Markdown e o relatorio atualizado. As exportacoes PDF/Word anteriores representam a organizacao antiga e nao devem substituir esta versao. O [relatorio anterior no historico](https://github.com/DaviSouza78/LinkAtletas/blob/fc9ed73/docs/evolucao/relatorio-testes.md) preserva detalhes operacionais e tentativas anteriores, sem misturar suas contagens com esta leitura.
