# Relatório de testes do LinkAtletas

Referência de unidade/API e navegador: execução de 28/10/2026. Este documento foi organizado a partir dos resultados preservados; não representa uma nova execução.

## Escopo e resultados

| Conjunto | Resultado e significado | Fonte |
|---|---|---|
| Unidade e integração/API | 215 casos aprovados; 0 reprovados; 0 pendentes. Casos individuais estão abaixo. | [Vitest](execucoes/server-2026-10-28/vitest-results.json) |
| Navegador | 5 cenários repetidos em Chromium, Firefox e WebKit, totalizando 15 execuções aprovadas. | [Playwright](execucoes/server-2026-10-28/playwright-results.json) |
| Backup e restauração | Ensaio separado; consultar o resultado e seu ambiente. | [Backup](execucoes/server-2026-10-28/backup-restore.json) |
| HTTPS em contêineres | Ensaio separado do deployment da Vercel. | [TLS](execucoes/server-2026-10-28/production-tls.json) |
| Produção | Conferências remotas específicas, sem equivalência com a suíte completa. | [Produção](execucoes/server-2026-10-28/producao.json) |

Commit de referência: `34a153d8cd5bb08b99da21910a2a8c65cdd3078f`. [Execução da CI](https://github.com/DaviSouza78/LinkAtletas/actions/runs/40632347453). Ambiente: GitHub Actions com PostgreSQL, SMTP capturado e S3 isolados.

## Como interpretar

- API significa a API própria Node/Fastify do LinkAtletas; não há integração automática com uma API de CREF. A conferência de CREF é manual pelo administrador.
- Uma aprovação significa que a asserção passou naquela execução; não é percentual de cobertura ou garantia de ausência de bugs.
- Unidade/API, navegador e aplicativo são conjuntos distintos. Reexecuções não devem ser somadas como novos casos.
- O adaptador financeiro é verificado com provedor HTTP controlado; isso não comprova cobranças ou split reais.
- Arquivos locais ainda não publicados e testes apenas escritos não integram automaticamente estas contagens.

## Casos de unidade e integração

Os nomes abaixo foram extraídos do JSON Vitest. O código contém preparação, ação e asserções de cada caso.

### integration/api.test.ts

[Código](../../tests/integration/api.test.ts) · 20 casos registrados.

| Caso | Resultado |
|---|---|
| API integrada com PostgreSQL exclusivo de testes não cria administrador pelo cadastro público nem aceita senha fraca | passed |
| API integrada com PostgreSQL exclusivo de testes impede e-mail duplicado sem distinguir maiúsculas e senha incorreta | passed |
| API integrada com PostgreSQL exclusivo de testes exige sessão e rejeita cookie inválido | passed |
| API integrada com PostgreSQL exclusivo de testes não autentica sessão que ultrapassou a validade persistida | passed |
| API integrada com PostgreSQL exclusivo de testes autentica com senha correta e armazena somente hash com sal | passed |
| API integrada com PostgreSQL exclusivo de testes protege mutações contra origem ausente e externa | passed |
| API integrada com PostgreSQL exclusivo de testes valida perfil e não permite a atleta aprovar CREF | passed |
| API integrada com PostgreSQL exclusivo de testes oculta treinador ainda não aprovado e impede sua contratação | passed |
| API integrada com PostgreSQL exclusivo de testes submete comprovação e registra aprovação administrativa com auditoria | passed |
| API integrada com PostgreSQL exclusivo de testes mantém profissional reprovado fora dos resultados | passed |
| API integrada com PostgreSQL exclusivo de testes retorna recomendação calculada e respeita filtros | passed |
| API integrada com PostgreSQL exclusivo de testes revalida elegibilidade ao contratar diretamente sem passar pela descoberta | passed |
| API integrada com PostgreSQL exclusivo de testes cria solicitação pendente, bloqueia duplicata e aceite por terceiros | passed |
| API integrada com PostgreSQL exclusivo de testes aceita uma única vez mesmo com requisições simultâneas | passed |
| API integrada com PostgreSQL exclusivo de testes valida a prescrição e protege o rascunho | passed |
| API integrada com PostgreSQL exclusivo de testes publica e mostra a ficha somente ao atleta do vínculo | passed |
| API integrada com PostgreSQL exclusivo de testes rejeita métricas desconhecidas, fora dos limites e blocos inexistentes | passed |
| API integrada com PostgreSQL exclusivo de testes grava e atualiza uma única execução visível ao treinador | passed |
| API integrada com PostgreSQL exclusivo de testes preserva sessão, vínculo, ficha e execução ao recriar a aplicação | passed |
| API integrada com PostgreSQL exclusivo de testes encerra sessão e invalida o cookie anterior | passed |

### integration/billing.test.ts

[Código](../../tests/integration/billing.test.ts) · 18 casos registrados.

| Caso | Resultado |
|---|---|
| Billing: controlled HTTP provider contract (not Asaas sandbox) refuses checkout for unavailable coach: suspended | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) refuses checkout for unavailable coach: expired | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) refuses checkout for unavailable coach: disabled | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) keeps academic access explicit and denies a foreign actor | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) validates ownership, whole cents, receiver wallet and audited admin settings | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) creates exactly one hosted recurring checkout under simultaneous requests and keeps unpaid access blocked | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) does not let admin or another coach cancel a private subscription | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) authenticates webhook before persistence; minimizes card data and consumes duplicate event only once | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) ignores old and regressive unpaid events without reducing the paid period | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) does not mix events from a production endpoint with sandbox subscriptions | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) preserves paid access during confirmed cancellation, idempotence and immutable history | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) withdraws a pending cycle idempotently, refusing outsiders and new writes | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) records uncertain checkout responses without blindly issuing another provider operation | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) preserves a definitely refused attempt and permits a new contract cycle after configuration is corrected | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) enforces grace expiry, professional suspension and denies further prescriptions | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) keeps failed cancellation pending, reconciles by safe GET and does not issue a second DELETE | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) retains unmatched authenticated events for reconciliation instead of crediting an unrelated account | passed |
| Billing: controlled HTTP provider contract (not Asaas sandbox) treats provider timeout as an uncertain result with no retry in the adapter | passed |

### integration/interactions.test.ts

[Código](../../tests/integration/interactions.test.ts) · 13 casos registrados.

| Caso | Resultado |
|---|---|
| Comunicação, avaliações e agenda persistidas nega conversa a terceiro e visitantes, valida mensagem vazia e anexo alheio | passed |
| Comunicação, avaliações e agenda persistidas persiste mensagens cifradas, mantém ordem e pagina sem perda/duplicação | passed |
| Comunicação, avaliações e agenda persistidas confirma leitura até o cursor e conserva mensagens posteriores não lidas | passed |
| Comunicação, avaliações e agenda persistidas publica para duas sessões autenticadas após gravação e fecha sessão revogada | passed |
| Comunicação, avaliações e agenda persistidas recusa upgrade WebSocket anônimo e com origem indevida | passed |
| Comunicação, avaliações e agenda persistidas notificações pertencem ao destinatário e não são marcadas por terceiros | passed |
| Comunicação, avaliações e agenda persistidas avalia apenas depois de sete dias e impede duplicação por vínculo | passed |
| Comunicação, avaliações e agenda persistidas permite edição só ao autor e resposta só ao treinador avaliado | passed |
| Comunicação, avaliações e agenda persistidas denúncia e moderação auditada removem todo conteúdo da publicação/média | passed |
| Comunicação, avaliações e agenda persistidas agenda persistida cifra descrição e isola dados por vínculo | passed |
| Comunicação, avaliações e agenda persistidas bloqueia conflitos do treinador entre diferentes vínculos e horários passados | passed |
| Comunicação, avaliações e agenda persistidas reagenda, registra histórico e cancela sem criar evento externo fictício | passed |
| Comunicação, avaliações e agenda persistidas histórico sobrevive recriação da API e contrato encerrado recusa novas interações | passed |

### integration/permissions.test.ts

[Código](../../tests/integration/permissions.test.ts) · 92 casos registrados.

| Caso | Resultado |
|---|---|
| Matriz de papeis e isolamento entre contas 'GET' '/profiles/me' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PUT' '/profiles/me' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/verifications' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/verifications' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/admin/verifications' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PATCH' '/admin/verifications/{id}' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PATCH' '/admin/coaches/{id}/verification' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/coaches' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/contracts' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/contracts' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PATCH' '/contracts/{id}' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/contracts/{id}/cancel' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/workouts' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/workouts' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/workouts/{id}' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PUT' '/workouts/{id}' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PUT' '/workouts/{id}/execution' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/metrics' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/dashboard' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/privacy/consents' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PUT' '/privacy/consents' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/privacy/health' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PUT' '/privacy/health' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/privacy/export' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/privacy/delete' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/admin/privacy/requests' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/media/uploads' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PUT' '/media/uploads/{id}/parts/{part}' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'DELETE' '/media/uploads/{id}' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/media/uploads/{id}/complete' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/media' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/media' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/media/{id}/content' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'DELETE' '/media/{id}' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/media/{id}/feedback' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/contracts/{id}/messages' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/contracts/{id}/messages' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PUT' '/contracts/{id}/messages/read' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/notifications' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PUT' '/notifications' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/reviews' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/reviews' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PUT' '/reviews/{id}' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/reviews/{id}/reply' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/reviews/{id}/report' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/admin/reviews' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PATCH' '/admin/reviews/{id}' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/consultations' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/consultations' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PATCH' '/consultations/{id}' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/consultations/{id}/history' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/consultations/{id}/google-event' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/admin/billing/jobs' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/admin/billing/reconcile' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/billing/config' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/billing/wallet' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PUT' '/billing/wallet' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/billing/plan' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PUT' '/billing/plan' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/billing/plans' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'PATCH' '/admin/billing/settings' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/billing/checkout' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'GET' '/billing/summary' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas 'POST' '/billing/subscriptions/{id}/cancel' exige autenticacao e respeita os papeis | passed |
| Matriz de papeis e isolamento entre contas inventaria todas as operacoes REST documentadas sem deixar rotas novas fora da matriz | passed |
| Matriz de papeis e isolamento entre contas todos os papeis autenticados consultam apenas suas listas e dados proprios | passed |
| Matriz de papeis e isolamento entre contas titulares dos dois papeis atualizam o proprio perfil sem promover privilegios | passed |
| Matriz de papeis e isolamento entre contas admin nao recebe acesso implicito a treinos, mensagens ou agenda privados | passed |
| Matriz de papeis e isolamento entre contas somente o treinador do pedido aceita ou recusa o vinculo | passed |
| Matriz de papeis e isolamento entre contas rascunho fica exclusivo do treinador e execucao exclusiva do atleta correto | passed |
| Matriz de papeis e isolamento entre contas atleta e treinador enviam mensagens mas terceiros nao marcam notificacoes alheias | passed |
| Matriz de papeis e isolamento entre contas saude e consentimentos sao proprios inclusive para treinador e administrador | passed |
| Matriz de papeis e isolamento entre contas somente autor edita avaliacao, treinador correto responde e admin modera | passed |
| Matriz de papeis e isolamento entre contas ambos participantes gerenciam consultoria sem duplicar evento externo | passed |
| Matriz de papeis e isolamento entre contas planos e carteiras pertencem ao treinador e configuracao financeira ao admin | passed |
| Matriz de papeis e isolamento entre contas arquivos de performance e orientacao respeitam papeis, vinculo e titularidade | passed |
| Matriz de papeis e isolamento entre contas comprovacao profissional e privada entre treinador titular e administrador | passed |
| Matriz de papeis e isolamento entre contas nao publica planos nem aceita solicitacao para treinador expired | passed |
| Matriz de papeis e isolamento entre contas nao publica planos nem aceita solicitacao para treinador disabled | passed |
| Matriz de papeis e isolamento entre contas upload multipart atende atleta e treinador e apenas o dono aborta envio parcial | passed |
| Matriz de papeis e isolamento entre contas recusa solicitacao direta para treinador expired | passed |
| Matriz de papeis e isolamento entre contas recusa solicitacao direta para treinador disabled | passed |
| Matriz de papeis e isolamento entre contas treinador com aprovacao vencida nao aceita um pedido antigo | passed |
| Matriz de papeis e isolamento entre contas vinculo encerrado bloqueia escritas novas para atleta e treinador | passed |
| Matriz de papeis e isolamento entre contas sessao de athlete expira, logout revoga e encerramento bloqueia toda a API privada | passed |
| Matriz de papeis e isolamento entre contas sessao de coach expira, logout revoga e encerramento bloqueia toda a API privada | passed |
| Matriz de papeis e isolamento entre contas sessao de admin expira, logout revoga e encerramento bloqueia toda a API privada | passed |
| Matriz de papeis e isolamento entre contas jornada completa de atleta e treinador na modalidade Corrida | passed |
| Matriz de papeis e isolamento entre contas jornada completa de atleta e treinador na modalidade Musculação | passed |
| Matriz de papeis e isolamento entre contas jornada completa de atleta e treinador na modalidade Natação | passed |
| Matriz de papeis e isolamento entre contas jornada completa de atleta e treinador na modalidade Ciclismo | passed |
| Matriz de papeis e isolamento entre contas jornada completa de atleta e treinador na modalidade Triatlo | passed |

### integration/platform.test.ts

[Código](../../tests/integration/platform.test.ts) · 13 casos registrados.

| Caso | Resultado |
|---|---|
| Plataforma, SMTP e S3 reais locais Bearer permite mutação nativa, cookie continua exigindo Origin | passed |
| Plataforma, SMTP e S3 reais locais saúde exige consentimento, cifra e exporta exclusivamente os dados próprios | passed |
| Plataforma, SMTP e S3 reais locais upload exige consentimento e recusa assinatura falsa/extensão indevida | passed |
| Plataforma, SMTP e S3 reais locais S3 contém bytes cifrados, bucket é privado e download autorizado recupera original | passed |
| Plataforma, SMTP e S3 reais locais envio em partes preserva arquivo grande, impede terceiro e finaliza sem duplicar | passed |
| Plataforma, SMTP e S3 reais locais video no limite de 50 MiB atravessa partes e retorna em stream | passed |
| Plataforma, SMTP e S3 reais locais partes invalidas, sessao expirada e assinatura falsa sao recusadas | passed |
| Plataforma, SMTP e S3 reais locais feedback é privado e revogação elimina mídia do S3 e impede download | passed |
| Plataforma, SMTP e S3 reais locais execução mantém notas e métricas cifradas em SQL | passed |
| Plataforma, SMTP e S3 reais locais expiração e suspensão profissional removem descoberta e registram auditoria | passed |
| Plataforma, SMTP e S3 reais locais recuperação envia via SMTP, token só tem hash SQL, uso único e invalida sessões | passed |
| Plataforma, SMTP e S3 reais locais token expirado falha e logout Bearer invalida a sessão | passed |
| Plataforma, SMTP e S3 reais locais exclusão reautentica, anonimiza e invalida a conta | passed |

### integration/privacy-races.test.ts

[Código](../../tests/integration/privacy-races.test.ts) · 3 casos registrados.

| Caso | Resultado |
|---|---|
| Operações simultâneas não recriam dados eliminados edição de perfil já autenticada aguarda e recusa conta encerrada | passed |
| Operações simultâneas não recriam dados eliminados login com senha antiga não cria sessão após a troca concorrente | passed |
| Operações simultâneas não recriam dados eliminados feedback aguardando arquivo eliminado não é recriado | passed |

### integration/vercel-runtime.test.ts

[Código](../../tests/integration/vercel-runtime.test.ts) · 4 casos registrados.

| Caso | Resultado |
|---|---|
| entrada de producao da vercel exporta um handler sem abrir outra porta durante a importacao | passed |
| entrada de producao da vercel serve a interface e uma rota interna do navegador | passed |
| entrada de producao da vercel preserva a API no mesmo servidor sem devolver o HTML | passed |
| entrada de producao da vercel protege o agendador no servidor de producao | passed |

### unit/backup-key.test.ts

[Código](../../tests/unit/backup-key.test.ts) · 2 casos registrados.

| Caso | Resultado |
|---|---|
| chave original do backup local usa a chave existente quando a variavel do exemplo esta vazia | passed |
| chave original do backup local recusa uma chave configurada invalida sem substituir o arquivo existente | passed |

### unit/crypto.test.ts

[Código](../../tests/unit/crypto.test.ts) · 2 casos registrados.

| Caso | Resultado |
|---|---|
| AES-256-GCM privado preserva Unicode, varia o IV e não armazena conteúdo em claro | passed |
| AES-256-GCM privado rejeita bytes adulterados | passed |

### unit/mail-cleanup.test.ts

[Código](../../tests/unit/mail-cleanup.test.ts) · 2 casos registrados.

| Caso | Resultado |
|---|---|
| liberacao do transporte SMTP fecha transporte quando nao existem mensagens pendentes | passed |
| liberacao do transporte SMTP fecha transporte e preserva a falha quando o banco esta indisponivel | passed |

### unit/matching.test.ts

[Código](../../tests/unit/matching.test.ts) · 13 casos registrados.

| Caso | Resultado |
|---|---|
| recomendação explicável de profissionais soma os pesos documentados até 100 e informa os critérios | passed |
| recomendação explicável de profissionais exclui treinador pending | passed |
| recomendação explicável de profissionais exclui treinador rejected | passed |
| recomendação explicável de profissionais exclui treinador unsubmitted | passed |
| recomendação explicável de profissionais exige modalidade esportiva em comum | passed |
| recomendação explicável de profissionais exige mesma cidade para atendimento presencial | passed |
| recomendação explicável de profissionais permite cidades distintas para atendimento online | passed |
| recomendação explicável de profissionais não recomenda treinador exclusivamente presencial de outra cidade para atleta híbrido | passed |
| recomendação explicável de profissionais retira apenas o peso do critério incompatível: {"goals":[]} | passed |
| recomendação explicável de profissionais retira apenas o peso do critério incompatível: {"levels":[]} | passed |
| recomendação explicável de profissionais retira apenas o peso do critério incompatível: {"price":201} | passed |
| recomendação explicável de profissionais retira apenas o peso do critério incompatível: {"availability":[]} | passed |
| recomendação explicável de profissionais não atribui pontos a critérios ausentes no perfil do atleta | passed |

### unit/runtime-jobs.test.ts

[Código](../../tests/unit/runtime-jobs.test.ts) · 2 casos registrados.

| Caso | Resultado |
|---|---|
| agendamento do runtime intervalo local utiliza o executor com trava e fecha seu pool | passed |
| agendamento do runtime modo Vercel registra o cron sem iniciar intervalo local | passed |

### unit/scheduled.test.ts

[Código](../../tests/unit/scheduled.test.ts) · 10 casos registrados.

| Caso | Resultado |
|---|---|
| tarefas agendadas recusa acesso sem autorizacao: undefined | passed |
| tarefas agendadas recusa acesso sem autorizacao: curta | passed |
| tarefas agendadas recusa acesso sem autorizacao: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa | passed |
| tarefas agendadas recusa token incorreto: Bearer errada | passed |
| tarefas agendadas recusa token incorreto: Bearer bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb | passed |
| tarefas agendadas executa somente com o segredo correto | passed |
| tarefas agendadas evita outra execucao enquanto a trava esta ocupada | passed |
| tarefas agendadas mantem a trava dentro de uma transacao ate concluir o trabalho | passed |
| tarefas agendadas libera a trava mesmo quando o trabalho falha | passed |
| tarefas agendadas descarta a conexao quando nao consegue encerrar a transacao | passed |

### unit/static-security.test.ts

[Código](../../tests/unit/static-security.test.ts) · 5 casos registrados.

| Caso | Resultado |
|---|---|
| arquivos estaticos e autorizacao mantem o acesso ao arquivo publico | passed |
| arquivos estaticos e autorizacao nao expoe arquivo fora da raiz publica: /files/../private.txt | passed |
| arquivos estaticos e autorizacao nao expoe arquivo fora da raiz publica: /files/%2e%2e/private.txt | passed |
| arquivos estaticos e autorizacao nao expoe arquivo fora da raiz publica: /files/..%2fprivate.txt | passed |
| arquivos estaticos e autorizacao nao expoe arquivo fora da raiz publica: /files/..%5cprivate.txt | passed |

### unit/transaction.test.ts

[Código](../../tests/unit/transaction.test.ts) · 4 casos registrados.

| Caso | Resultado |
|---|---|
| transacao PostgreSQL confirma operacao e devolve conexao utilizavel | passed |
| transacao PostgreSQL desfaz operacao sem substituir o erro original | passed |
| transacao PostgreSQL descarta conexao quando rollback falha e preserva a causa original | passed |
| transacao PostgreSQL descarta conexao quando commit e rollback falham | passed |

### unit/workout-reference.test.ts

[Código](../../tests/unit/workout-reference.test.ts) · 12 casos registrados.

| Caso | Resultado |
|---|---|
| referencia externa do treino aceita HTTPS como dado sem alterar o texto | passed |
| referencia externa do treino permite omitir a referencia | passed |
| referencia externa do treino rejeita referencia insegura: "javascript:alert(1)" | passed |
| referencia externa do treino rejeita referencia insegura: "data:text/html,<script>alert(1)</script>" | passed |
| referencia externa do treino rejeita referencia insegura: "http://example.com/video" | passed |
| referencia externa do treino rejeita referencia insegura: "https://user:password@example.com/video" | passed |
| referencia externa do treino rejeita referencia insegura: "https://example.com/\nvideo" | passed |
| referencia externa do treino rejeita referencia insegura: "https://example.com/<script>" | passed |
| referencia externa do treino rejeita referencia insegura: "https://example.com/\"onclick=" | passed |
| referencia externa do treino rejeita referencia insegura: "https://example.com/\\video" | passed |
| referencia externa do treino rejeita referencia insegura: "https://example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" | passed |
| referencia externa do treino rejeita referencia insegura: {"href":"https://example.com/video"} | passed |

## Cenários de navegador

| Cenário | Navegador | Resultado |
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

## Aplicativo e casos citados na ERS

Os resultados posteriores do aplicativo estão na [documentação móvel](../../mobile/docs/equivalencia-web-mobile.md) e nas [evidências Android](../../mobile/docs/evidencias/android/README.md). Não confundir compilação, inicialização em emulador, jornada integrada e autorização real de uma conta Google.

Os arquivos [vitest-results.json](vitest-results.json) e [android-integrated-result.json](android-integrated-result.json) na entrada desta pasta correspondem às execuções anteriores citadas na ERS fornecida. Foram preservados para rastrear aquelas afirmações; não compõem os 215 casos acima.

[Índice das evidências](README.md) · [Código dos testes](../../tests/README.md)
