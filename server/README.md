# Back-end do LinkAtletas

Esta pasta contém a API interna Node.js/TypeScript com Fastify. Ela recebe chamadas do site e do aplicativo, identifica o usuário, valida entradas e permissões, executa regras de negócio e acessa PostgreSQL, armazenamento privado e e-mail.

Não é uma API do conselho profissional. A conferência de CREF é manual e registrada pela administração. Os contratos compartilhados com os clientes ficam em [shared](../shared/README.md); as telas ficam em [src](../src/README.md) e [mobile](../mobile/README.md).

Guias por área: [banco](db/README.md), [módulos e suas subpastas](modules/README.md), [serviços externos](services/README.md) e [recursos internos](shared/README.md). Cada guia resume a responsabilidade local; este documento mantém a visão geral do servidor.

## Como uma requisição percorre o sistema

**Site ou aplicativo → entrada HTTP → sessão → rota do módulo → validação e autorização → banco/serviço → resposta.**

Por exemplo, publicar treino passa pelo módulo de treinos, verifica o treinador e seu vínculo, valida a ficha, grava `workouts` e `exercise_blocks` e responde à interface. O atleta consulta a ficha publicada e registra sua execução em `executions`. O navegador não se conecta diretamente ao Neon nem recebe as credenciais dos provedores.

## Estrutura

```text
server/
  app.ts                 montagem da API e registro dos módulos
  config.ts              configuração e exigências de produção
  index.ts               entrada do servidor convencional
  runtime.ts             inicialização HTTP, arquivos estáticos e jobs periódicos
  jobs.ts                processamento dos trabalhos pendentes e comando avulso
  scheduled.ts           trava de execução e rota autenticada do agendador
  db/                    conexão, transações, migrações e administração local
    migrations/          evolução sequencial do esquema SQL
  modules/
    accounts/            autenticação, perfis e conferência profissional
    training/            descoberta, vínculos e treinos
    interactions/        mensagens, notificações, avaliações e agenda
    media/               arquivos privados e uploads em partes
    privacy/             recuperação de senha, consentimentos e direitos da conta
    billing/             configuração financeira, eventos e ciclo das assinaturas
  services/              adaptadores SMTP e Asaas
  shared/                recursos exclusivos do back-end
```

Os módulos são organizados por assunto. Não há duplicação da API para atleta, treinador e administrador: cada operação aplica o papel e a titularidade necessários. As rotas públicas não mudam quando um arquivo é movido internamente.

## Arquivos de entrada e operação

| Arquivo | Responsabilidade |
|---|---|
| [app.ts](app.ts) | Cria a aplicação, configura cookies, multipart, WebSocket, limitadores de rotas, OpenAPI e erros. Carrega a sessão válida, confere a origem nas operações aplicáveis e registra os módulos sob `/api`. `/api/health` executa uma consulta ao banco. |
| [config.ts](config.ts) | Carrega ambiente, define origem/porta/banco e recusa configurações incompletas ou credenciais locais padrão em produção. Não contém as credenciais privadas implantadas. |
| [index.ts](index.ts) | Monta a API e inicia o servidor convencional usado no desenvolvimento e nos contêineres. |
| [runtime.ts](runtime.ts) | Inicializa o servidor, serve a interface compilada em produção convencional, prepara encerramento e jobs periódicos fora da Vercel. Registra a rota do agendador. |
| [jobs.ts](jobs.ts) | Processa validade de CREF, financeiro pendente, e-mails, partes de upload expiradas e limpeza de sessões/tokens. Pode ser chamado pelo runtime, pela rota protegida ou pelo comando `pnpm jobs`. |
| [scheduled.ts](scheduled.ts) | Coordena a trava PostgreSQL dos jobs e autentica `/api/internal/jobs` com `CRON_SECRET`. Se outra execução detém a trava, informa que a rodada foi pulada. |

A entrada da Vercel é o [server.ts da raiz](../server.ts). Ela inicializa a aplicação sob demanda e entrega requisições ao handler, sem abrir uma nova porta no modo serverless. `server/index.ts` é outra forma de iniciar a mesma API; não são dois back-ends independentes.

Em processo convencional, há um intervalo local. Na Vercel, esse intervalo fica desativado e cron-job.org chama a rota protegida. `pnpm jobs` executa uma rodada avulsa e não é um agendador; não iniciar várias rodadas avulsas concorrentes sem necessidade.

## Banco — `db/`

| Arquivo | Responsabilidade |
|---|---|
| [pool.ts](db/pool.ts) | Cria o pool PostgreSQL e executa transações. Confirma operações com `COMMIT`, tenta `ROLLBACK` nas falhas e descarta conexão cujo rollback falhou. |
| [migrate.ts](db/migrate.ts) | Aplica os SQLs em ordem, com trava transacional e registro em `schema_migrations`. Também protege em cifra o conteúdo legado de execuções que ainda estava em campos abertos. |
| [seed.ts](db/seed.ts) | Prepara contas e dados fictícios locais sem sobrescrever contas existentes. Recusa execução com `NODE_ENV=production`. Não é ferramenta para popular a demonstração pública. |
| [admin.ts](db/admin.ts) | Cria administrador com `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` definidos no ambiente. O cadastro público não cria administrador. Não registra a senha no log. |
| [init-test.sql](db/init-test.sql) | Cria as bases isoladas previstas para testes na primeira inicialização do volume PostgreSQL pelo Compose. Não cria as tabelas da aplicação. |

### Migrações — `db/migrations/`

| Arquivo | Evolução introduzida |
|---|---|
| [001_initial.sql](db/migrations/001_initial.sql) | Usuários, perfis, sessões, conferência de CREF, vínculos, fichas, blocos, execuções e catálogo inicial de métricas. |
| [002_platform.sql](db/migrations/002_platform.sql) | Encerramento de conta, validade profissional, recuperação de senha, fila de e-mail, consentimentos, dados privados, mídia, auditoria e pedidos de privacidade. |
| [003_interactions.sql](db/migrations/003_interactions.sql) | Mensagens, notificações, avaliações, denúncias, moderação, agenda e histórico de consultorias. |
| [004_billing.sql](db/migrations/004_billing.sql) | Novos ciclos e estados do vínculo, planos, carteira, assinaturas, pagamentos, splits, eventos e auditoria financeira. |
| [005_billing_compatibility.sql](db/migrations/005_billing_compatibility.sql) | Compatibilidade do identificador de cliente do provedor e da referência administrativa financeira. |
| [006_media_uploads.sql](db/migrations/006_media_uploads.sql) | Sessões temporárias de upload em partes, associação ao arquivo final e expiração. |

Não editar uma migração já aplicada para tentar atualizar um banco existente. Uma mudança futura de esquema precisa de nova migração e verificação de compatibilidade. Consultar o [dicionário do banco](../docs/banco/dicionario-dados.md) e os [diagramas](../docs/diagramas/README.md).

## Funcionalidades — `modules/`

### Contas — `accounts/`

| Arquivo | Operações e dados principais |
|---|---|
| [auth.ts](modules/accounts/auth.ts) | Cadastro de atleta/treinador, login web/nativo, consulta e encerramento de sessão. Senhas usam scrypt com salt; tokens aleatórios são guardados como hash. Tabelas: `users`, `profiles`, `sessions`. |
| [profiles.ts](modules/accounts/profiles.ts) | Consulta e edição do perfil próprio, catálogos esportivos e opções duplicadas. Tabelas: `users`, `profiles`. |
| [verification.ts](modules/accounts/verification.ts) | Submissão de evidência fictícia/real conforme o ambiente, decisão administrativa justificada, suspensão/revogação e expiração. Distingue decisão histórica da solicitação e situação atual do perfil. Tabelas: `verifications`, `verification_audit`, `administrative_audit` e `profiles`. |

O sistema registra a análise; o administrador precisa conferir a fonte oficial e a titularidade antes de uma aprovação real. Uma fixture aprovada não comprova habilitação profissional. A revogação administrativa é representada pelo estado `rejected` do perfil; não existe um estado separado chamado `revoked` no contrato atual.

### Acompanhamento — `training/`

| Arquivo | Operações e dados principais |
|---|---|
| [matching.ts](modules/training/matching.ts) | Descoberta de treinadores elegíveis e pontuação por regras de compatibilidade. Filtra conta, situação profissional, validade, modalidade e atendimento. Não executa IA treinada. |
| [contracts.ts](modules/training/contracts.ts) | Solicitação e decisão do vínculo e encerramento de ciclo. Confere titularidade, compatibilidade e elegibilidade profissional nas transições aplicáveis. |
| [workouts.ts](modules/training/workouts.ts) | Rascunho, publicação, edição permitida, blocos, métricas, execução única por ficha e painéis. Protege rascunhos e impede transferir ficha entre vínculos. |

Tabelas centrais: `contracts`, `workouts`, `exercise_blocks`, `executions` e `metric_types`. Consultas de histórico e novas operações têm finalidades diferentes: encerrar um vínculo não deve apagar o histórico; operações novas exigem acesso ativo conforme a regra.

### Comunicação e agenda — `interactions/`

| Arquivo | Responsabilidade |
|---|---|
| [routes.ts](modules/interactions/routes.ts) | Registra os submódulos de eventos, mensagens, notificações, avaliações e consultorias. |
| [access.ts](modules/interactions/access.ts) | Helpers de participação no vínculo, participantes e parâmetro UUID compartilhado. |
| [events.ts](modules/interactions/events.ts) | Registro dos sockets, autenticação e verificação da validade da sessão antes de publicar eventos; remoção de conexões e encerramento. |
| [messages.ts](modules/interactions/messages.ts) | Histórico paginado, mensagem cifrada, anexo autorizado e confirmação de leitura por cursor. |
| [notifications.ts](modules/interactions/notifications.ts) | Criação, publicação, listagem e marcação de leitura das notificações do usuário. |
| [reviews.ts](modules/interactions/reviews.ts) | Avaliação elegível, carência, edição, resposta, denúncia e moderação com auditoria. |
| [consultations.ts](modules/interactions/consultations.ts) | Agenda, travas dos calendários, conflito de horário, reagendamento/cancelamento/conclusão, histórico e referência de evento Google informada pelo participante. |

Os registros persistidos no banco são a referência. Eventos WebSocket são um mecanismo complementar: na implantação serverless, a interface pode depender da consulta periódica. Registrar referência de reunião não é validação independente pelo Google nem sincronização bidirecional homologada.

### Arquivos — `media/`

| Arquivo | Responsabilidade |
|---|---|
| [routes.ts](modules/media/routes.ts) | Cliente S3, autorização por finalidade/recurso, assinatura do arquivo, nome seguro, cifra, listagem, leitura/Range, exclusão e feedback. Confere conta e consentimento antes de persistir. |
| [uploads.ts](modules/media/uploads.ts) | Sessões de envio, partes de 3 MiB cifradas, validação de tamanho/índice, finalização, repetição de conclusão e limpeza de partes expiradas. |

Os objetos ficam no Tigris em nuvem ou SeaweedFS local. `media`, `media_feedback` e `media_uploads` guardam metadados e relações no PostgreSQL. Imagens/PDF têm limite de 10 MiB; vídeos, 50 MiB. Comprovação profissional não aceita vídeo. O nome enviado não é usado como chave de armazenamento.

A finalização e o download ainda precisam reunir/decifrar os bytes em memória. Assinatura e MIME não equivalem a inspeção antimalware. Banco e armazenamento não compartilham uma transação distribuída; existem rotinas de compensação e limpeza, com limites descritos na auditoria.

### Conta e privacidade — `privacy/`

| Arquivo | Responsabilidade |
|---|---|
| [routes.ts](modules/privacy/routes.ts) | Recuperação de senha web/nativa, política, consentimentos, dados de saúde cifrados, exportação do titular, encerramento com senha e consulta administrativa dos pedidos. |

Esse módulo inclui recuperação porque a operação está ligada à proteção e manutenção da conta. O token é de uso único, tem expiração e sua conclusão revoga as sessões anteriores. A exportação exige autenticação. Encerramento anonimiza/remove dados conforme o fluxo, mas retém referências mínimas previstas no modelo e é bloqueado por situação financeira não encerrada.

### Financeiro — `billing/`

| Arquivo | Responsabilidade |
|---|---|
| [routes.ts](modules/billing/routes.ts) | Rotas de plano, carteira, configuração, checkout, resumo, cancelamento, jobs administrativos e webhook. |
| [types.ts](modules/billing/types.ts) | Tipos internos de conexão e opções de injeção do provedor nos testes. Não contém credenciais. |
| [configuration.ts](modules/billing/configuration.ts) | Modo acadêmico/Asaas, ambiente, disponibilidade e construção do adaptador configurado. |
| [validation.ts](modules/billing/validation.ts) | Schemas financeiros, token de webhook, data do evento e cálculo de fim do período mensal. |
| [access.ts](modules/billing/access.ts) | Elegibilidade profissional, conta/vínculo e vigência financeira necessária às operações de acompanhamento. |
| [subscriptions.ts](modules/billing/subscriptions.ts) | Seleção de assinaturas e leitura restrita aos participantes. |
| [events.ts](modules/billing/events.ts) | Localização da assinatura, processamento persistido/idempotente dos eventos e atualização de pagamentos, splits e estados. |
| [lifecycle.ts](modules/billing/lifecycle.ts) | Expiração, carência, conciliação e cancelamento preservando a vigência já paga e a incerteza de respostas externas. |
| [notifications.ts](modules/billing/notifications.ts) | Registro dos avisos financeiros aos participantes do vínculo. |

**Modo acadêmico não cobra.** A existência dessas tabelas e funções não comprova homologação real do Asaas. Os testes financeiros usam servidor HTTP controlado. Estados incertos não devem ser apresentados como pagamento ou cancelamento confirmado.

## Integrações — `services/`

| Arquivo | Responsabilidade |
|---|---|
| [mail.ts](services/mail.ts) | Enfileira e-mail com corpo cifrado e entrega os pendentes por SMTP, com tentativas limitadas e recuo entre falhas. Fecha o transporte inclusive se o acesso ao banco falhar. Brevo é o provedor remoto; Mailpit captura mensagens locais. |
| [asaas.ts](services/asaas.ts) | Adaptador HTTP de checkout, consulta e cancelamento, com timeout e validação das respostas relevantes. O endpoint alternativo de teste é restrito a loopback. |

Os recursos privados de Tigris/Neon/Brevo são configurados por ambiente. Não expor chaves, tokens, senhas ou URLs de conexão em documentos, logs ou interface. Consulte o [mapa dos serviços](../docs/operacao/servicos-externos.md).

## Recursos internos — `server/shared/`

| Arquivo | Responsabilidade |
|---|---|
| [security.ts](shared/security.ts) | Hash/verificação da senha, tokens aleatórios, hash do token e exigência de sessão/papel. |
| [crypto.ts](shared/crypto.ts) | AES-256-GCM dos dados privados, chave de 32 bytes, chave local fora do Git e recusa de produção sem configuração. Perder a chave impede recuperar o conteúdo cifrado. |
| [validation.ts](shared/validation.ts) | Schemas Zod de perfil, ficha, blocos, execução e UUID; conversão de schemas para documentação. Usa catálogos de `shared/`. |
| [errors.ts](shared/errors.ts) | Erros de domínio, validação, conflito, limite e falhas internas com resposta adequada. Também trata o fallback de navegação da interface no servidor convencional. |
| [openapi.ts](shared/openapi.ts) | Documenta/serializa respostas das rotas e complementa erros e segurança no OpenAPI. Mudanças aqui podem afetar respostas reais; não é apenas texto de documentação. |

`server/shared/` é exclusivo do back-end. A pasta [shared da raiz](../shared/README.md) contém os contratos seguros para compartilhar com web e aplicativo. Nenhum tipo TypeScript substitui a validação dos dados recebidos pela rede.

## Executar e manter

Usar a raiz do repositório, Node.js 24 e pnpm conforme o `packageManager`. Preservar um `.env` existente; na primeira instalação, seguir o [.env.example](../.env.example) e o [manual](../docs/operacao/manual.md).

```powershell
pnpm install --frozen-lockfile
docker compose up -d --wait
pnpm db:migrate
pnpm db:seed
pnpm dev:all
```

Esses comandos são para desenvolvimento local. Não aplicar seed nem executar suítes de limpeza na produção. Banco e serviços locais são separados da nuvem; não há sincronização automática entre eles.

- `pnpm dev:api`: servidor com recarga durante o desenvolvimento.
- `pnpm start`: servidor convencional, com variáveis do ambiente selecionado.
- `pnpm jobs`: uma rodada avulsa sobre o banco configurado; pode enviar e-mails e processar estados, não é um comando somente de leitura.
- `pnpm db:admin`: criação administrativa; conferir ambiente e variáveis antes de executar.
- `pnpm api:export`: gera OpenAPI da aplicação.
- `pnpm build`, `pnpm test` e `pnpm test:e2e`: verificações; os testes exigem configuração isolada apropriada.

Swagger local: `http://localhost:3001/api/docs/`. Saúde local: `http://localhost:3001/api/health`. Configuração, migrations e seed são operações diferentes: conexão saudável não comprova que todos os fluxos e permissões estejam corretos.

## Como investigar um problema

| Sintoma | Começar por |
|---|---|
| Login/sessão inválida | `app.ts`, `accounts/auth.ts`, `shared/security.ts` e tabelas `users`/`sessions`. |
| Treinador não aparece ou não pode ser contratado | `accounts/verification.ts`, `training/matching.ts` e `training/contracts.ts`; conferir validade, conta e perfil. |
| Treino não aparece | Titularidade/vínculo e estado de publicação em `training/workouts.ts`; rascunho é privado do treinador. |
| Mensagem/agenda não atualiza | Persistência em `interactions`, sessão e atualização periódica do cliente; não depender somente do socket. |
| Arquivo negado | Finalidade, titularidade, vínculo, consentimento, conta e S3 em `media`. |
| E-mail pendente | `mail_outbox`, tentativas, SMTP e execução dos jobs; não exibir o corpo/token da recuperação. |
| Jobs não executam | Agendador, autenticação, trava e erro registrado no runtime; verificar dependências antes de repetir. |
| Financeiro | Modo configurado, assinatura/vínculo, eventos persistidos e conciliação; não reenviar cobrança incerta automaticamente. |

## Revisão e testes

O [guia de testes](../tests/README.md) explica as suítes. A [auditoria técnica do servidor](../docs/evidencias/relatorios/auditoria-server-2026-10-28.md) registra arquivos examinados, correções, verificações e limites desta reorganização.

Não interpretar esta revisão como certificação de segurança, cobertura de todas as combinações concorrentes ou autorização para ativar pagamentos reais. Mudanças futuras precisam atualizar os contratos e casos afetados e preservar os caminhos públicos de entrega.
