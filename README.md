# LinkAtletas

Aplicação publicada: [link-atletas.vercel.app](https://link-atletas.vercel.app). Interface e API no mesmo domínio, PostgreSQL Neon, armazenamento privado Tigris e SMTP Brevo. [Testes remotos, APK e limites da implantação](docs/evolucao/implantacao-2026-10-26.md). Modo financeiro acadêmico sem cobrança; cadastre contas próprias, sem usar as credenciais locais de demonstração na nuvem.

Projeto Integrador Interdisciplinar II — ADS, Faculdade de Tecnologia SENAI Félix Guisard. Plataforma para conectar atletas a treinadores e acompanhar o treinamento esportivo, em resposta à demanda SAGA nº 12871 da Ivi-it.

A ampliação preserva o fluxo da Sprint 2 e acrescenta chat em tempo real, avaliações/moderação, consultorias, arquivos privados cifrados, recuperação de senha, consentimentos/privacidade, ciclos de vínculo, financeiro Asaas e cliente React Native/Expo. A API é Node/TypeScript/Fastify com PostgreSQL; a web usa React. Modo acadêmico é explicitamente sem cobrança. Integrações escritas/testadas localmente e homologações externas são estados separados.

Consulte o [checklist com referências](docs/evolucao/checklist-sprint-2.md), o [relatório de testes](docs/evolucao/relatorio-testes.md), o [manual completo](docs/evolucao/manual.md) e as [pendências de Lucca e do grupo](docs/evolucao/pendencias-lucca.md). A entrega inicial continua preservada em [docs/sprint-2](docs/sprint-2/entrega.md).

Revisão de 21/10/2026: APK local aprovado em [18 etapas integradas](docs/evolucao/evidencias/android-integrated-result.json), com PostgreSQL, SMTP e S3 reais de desenvolvimento. [Instalação por USB](docs/evolucao/manual-apk-local.md), [necessidade dos serviços externos na Sprint 2](docs/evolucao/servicos-externos-sprint-2.md) e [pacote da revisão](https://github.com/DaviSouza78/LinkAtletas/releases/tag/v0.3.0-sprint-2-revisao-1). Aparelho físico, iOS e homologações externas conservam seus próprios estados de validação.

## Executar localmente

Para a implantação pública, consulte o [guia da Vercel](docs/evolucao/vercel.md), com configurações, evidências e limites. O Docker abaixo continua sendo o ambiente local.

Pré-requisitos: Node.js 24, pnpm 10 e Docker Desktop ativo. Na primeira instalação:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
docker compose up -d --wait
pnpm db:migrate
pnpm db:seed
pnpm dev:all
```

Preserve um `.env` já existente. Migrations são cumulativas e não exigem apagar volumes. `docker compose down` para serviços sem remover dados.

Se aparecer `Port 5173 is already in use`, confira se o projeto já está aberto em outro terminal e acesse o endereço existente. Para reiniciar, encerre a execução anterior com `Ctrl+C` naquele terminal antes de rodar `pnpm dev:all` novamente. A [seção de diagnóstico](docs/evolucao/manual.md) explica portas alternativas.

- Web: [localhost:5173](http://localhost:5173).
- Swagger/API: [localhost:3001/api/docs](http://localhost:3001/api/docs).
- OpenAPI: [localhost:3001/api/openapi.json](http://localhost:3001/api/openapi.json).
- E-mails locais: [Mailpit em 127.0.0.1:8025](http://127.0.0.1:8025), SMTP 1025, sem encaminhamento externo.
- S3 privado SeaweedFS: loopback 8333; PostgreSQL: loopback 54329.

A chave AES é gerada em `.data-key.local` ignorado pelo Git, ou configurada em `DATA_ENCRYPTION_KEY`. Preserve a chave correspondente aos dados, separadamente do backup e fora de relatórios/commits. Produção exige configuração explícita; não use credenciais locais de exemplo em ambiente público.

## Contas fictícias

| Papel | E-mail | Senha local |
|---|---|---|
| Atleta | `emailatleta@email.com` | `senhaatleta` |
| Treinador | `emailtreinador@email.com` | `senhatreinador` |
| Admin | `admin@linkatletas.local` | `SenhaAdmin123!` |

Seed é explícito e restrito ao desenvolvimento. Cadastro público cria atleta/treinador; para admin próprio configure `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e execute `pnpm db:admin`. Sessão web usa cookie HttpOnly; cliente nativo usa Bearer opaco com SecureStore. Senhas e chaves privadas não vão para localStorage nem para o bundle.

## Fluxos disponíveis

Cadastro/perfil → conferência profissional manual → descoberta compatível → solicitação/aceite → treino publicado → execução/feedback. Além do fluxo principal, a navegação contém mensagens, agenda, financeiro, avaliações, notificações e privacidade. Documentos/vídeos são privados, vinculados a recurso e autorizados; upload de performance exige consentimento. Avaliações exigem vínculo ativo pelo período mínimo configurado, sete dias por padrão. Consulte o roteiro de demonstração e as exceções no manual/ERS.

`BILLING_MODE=academic` não processa cobranças. `asaas` usa checkout hospedado, carteiras elegíveis, webhook autenticado e conciliação; depende de credenciais e homologação da conta. Redirect não confirma pagamento. Totais de participação são estimados sobre valor líquido; não comprovam repasse bancário. CREF aprovado significa conferência manual auditada com validade, suspensão e expiração, conforme o requisito atual da ERS. Consulta automática oficial é evolução futura.

Google Agenda/Meet é opcional mediante Client ID público e ação OAuth explícita do treinador. A API guarda a referência criada; o fluxo integrado não inclui convidados. Alterações locais ainda precisam ser refletidas também na agenda externa. Nenhum teste cria evento ou envia convite real.

## Cliente do atleta

Para instalar o APK standalone e conectar por USB, siga o [manual do APK local](docs/evolucao/manual-apk-local.md). Ele usa o backend deste computador sem exigir Metro/Expo Go nem hospedagem pública. Os comandos abaixo são para trabalhar no código Expo.

```powershell
pnpm --dir mobile install --frozen-lockfile
Copy-Item mobile/.env.example mobile/.env
pnpm --dir mobile typecheck
pnpm --dir mobile check
pnpm --dir mobile export
pnpm --dir mobile start
```

Configurar `EXPO_PUBLIC_API_URL` sem segredos de serviço; detalhes em [mobile/README.md](mobile/README.md). Bundles Hermes Android/iOS são distintos de APK/IPA assinado, instalação, teste em aparelho e publicação em loja. Compilação Android depende de JDK/SDK; iOS de Xcode/serviço autorizado. O app usa a mesma API e não tem backend próprio.

## Qualidade e evidências

```powershell
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e
```

Integração usa banco isolado `_test`. Não execute Vitest e E2E simultaneamente na mesma base; não aponte testes para dados importantes. [Resultados locais](docs/evolucao/relatorio-testes.md) identificam suíte, data e limites. Chromium/Firefox/WebKit são engines específicos; não presumem homologação Edge/Safari reais. Auditoria axe não substitui revisão com leitor de tela. Carga local não comprova autoescala em nuvem.

## Container, TLS e recuperação

```powershell
pnpm exec tsx scripts/init-production.ts
docker compose --env-file .env.production.local -f compose.production.yaml up -d --build --wait
pnpm exec tsx scripts/verify-tls.ts
```

A configuração gerada é local, com segredos próprios em arquivos ignorados e HTTPS em `https://localhost:8443`. Caddy usa CA local de teste; o script passa a CA explicitamente e não instala confiança no sistema. Não foi publicada URL pública. Proxy público requer domínio/conta/segredos e configuração própria. Migrations precedem o processo da aplicação. Operação, SMTP externo, banco/S3 e autorização de publicação estão descritos no manual.

Backup cifrado de banco/objetos e restauração somente em destinos isolados vazios:

```powershell
pnpm exec tsx scripts/backup.ts revisao-local
pnpm exec tsx scripts/verify-backup.ts
```

O primeiro comando usa `BACKUP_ROOT` (padrão `tmp/backups`), preserva chave separada e requer escritas pausadas para consistência entre SQL/objetos. `restore.ts` recebe diretório, banco vazio com sufixo `_test` e bucket vazio. Confira o manual e o manifesto antes de restaurar. O teste conserva bases isoladas, compara 36 tabelas e checksums de objetos; não apaga sua base. Backups restaurados precisam reaplicar pedidos posteriores de eliminação.

## Estrutura e documentação

```text
server/              API, segurança, serviços, jobs e migrations
shared/              contratos web/nativo
src/                 interface React integrada
mobile/              cliente Expo atleta, manifesto/lock próprios
tests/               unidade, PostgreSQL e navegador
infra/               S3 e proxy TLS
scripts/             documentação, carga, TLS e backup/restauração
docs/sprint-2/       entrega inicial e evidências históricas
docs/evolucao/       ERS v2, API, manual, modelos, checklist e novas evidências
```

[Índice](docs/evolucao/entrega.md) · [ERS v2](docs/evolucao/ERS-v2.md) · [API](docs/evolucao/api.md) · [Diagramas](docs/evolucao/diagramas.md) · [Backlog](docs/evolucao/backlog.md) · [Rastreabilidade/UCs](docs/evolucao/rastreabilidade.md) · [Decisões](docs/evolucao/decisoes.md).

ERS de apresentação v2.5: [PDF no template original](docs/evolucao/ERS-template-original-atualizada.pdf) e [Word completo editável](docs/evolucao/ERS-completa-v2.5-editavel.docx), revisados em 24/10/2026, com requisitos integrados, 16 casos de teste rastreáveis e modelos atuais. [Ajustes de estrutura e Word](docs/evolucao/ajustes-ers-v2.5.md); a fonte da Sprint 1 permanece preservada.

## Equipe e pendências externas

João Gabriel Floriano Olimpio; Miguel Oliveira de Almeida; Lucas Souza Silva; Davi Marcondes Paes de Souza; João Pedro Fonseca Alves de Carvalho; Lucca Castilho Costa. Cada integrante deve registrar sua participação efetiva e realizar sua entrega acadêmica. Autoria Git deste incremento usa o nome/e-mail fornecidos por Lucca, sem presumir participação dos demais.

Os commits foram publicados com autorização de Lucca e integrados à `main` pelo [PR #1](https://github.com/DaviSouza78/LinkAtletas/pull/1). A [CI completa na main](https://github.com/DaviSouza78/LinkAtletas/actions/runs/38656142290) passou. O APK documental anterior é histórico. A revisão acrescenta **LinkAtletas Local**, standalone, conectado por USB à API local: [instalação](docs/evolucao/manual-apk-local.md), [resultado e limites](docs/evolucao/evidencias/mobile-verificacao.md). O perfil normal continua exigindo HTTPS e nova compilação para outra URL.

Permanecem dependentes de acesso/homologação: sandbox/produção Asaas e split real, SMTP/S3 hospedados, Google OAuth real, domínio público, assinatura de distribuição/IPA/aparelhos/stores e política jurídica operacional. IA treinada, consulta automática de CREF, broker multi-instância, autoescala, autosave contínuo e catálogo administrativo de novos esportes constam como evolução. As decisões de escopo são da equipe. A entrega no ambiente acadêmico e o registro de participação cabem a cada integrante; consulte as [pendências detalhadas](docs/evolucao/pendencias-lucca.md).

## Revisão de 15–20/10/2026

Docker local recuperado com volumes preservados; Expo atualizado para 57.0.30, perfil de APK local conectado por USB, correções de privacidade e backup, dependências web/API corrigidas e documentação confrontada com os materiais originais do grupo. Consulte o [checklist de serviços externos](docs/evolucao/servicos-externos-sprint-2.md), a [revisão dos materiais](docs/evolucao/revisao-materiais.md), o [manual do APK local](docs/evolucao/manual-apk-local.md), o [dicionário do banco](docs/evolucao/dicionario-dados.md) e as [pendências reais](docs/evolucao/pendencias-lucca.md).

A revisao de 21/10 foi integrada pelo [PR #2](https://github.com/DaviSouza78/LinkAtletas/pull/2), commit `1e5f8fa`, com [CI completa aprovada na main](https://github.com/DaviSouza78/LinkAtletas/actions/runs/39648179775). Confira [publicacao e proveniencia dos artefatos](docs/evolucao/publicacao.md).
