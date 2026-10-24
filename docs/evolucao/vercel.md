# Implantação do LinkAtletas na Vercel

## Estado em 24/10/2026

A interface pública responde HTTP 200 em https://link-atletas.vercel.app/. A consulta de `/api/health` retornou HTTP 404 antes desta preparação. Publicar a interface não transferiu o PostgreSQL nem os arquivos do Docker para a nuvem.

Esta preparação usa o preset Fastify, `server.ts` na raiz, build Vite em `dist` incluído na função e o mesmo domínio para interface e API. Mantém as proteções e a execução local. Não foi implantada ou homologada em produção. Fica na branch `preparacao-vercel` até a configuração dos serviços.

## 1. Banco de dados

No projeto da Vercel, abrir Storage, criar/conectar Neon PostgreSQL e habilitar a variável `DATABASE_URL` para Production. A conexão deve exigir TLS; usar a URL fornecida pelo Neon, sem remover os parâmetros de segurança. Não copiar senhas de desenvolvimento. Não habilitar testes automatizados na base pública.

Se a integração oferecer prefixo e gerar outro nome de variável, conferir que o servidor recebe exatamente `DATABASE_URL`. Preview deve usar uma base/branch separada, nunca a base de produção para revisões com código não confiável.

Não executar `db:seed` em produção. Criar o administrador pelo comando `db:admin` depois das migrações, com credenciais próprias.

## 2. Arquivos privados e SMTP

Conectar um bucket privado compatível com S3. Tigris é uma opção oferecida no Marketplace da Vercel; conferir plano, limites e eventual cobrança antes de criar. O código existente usa API S3 e não usa Vercel Blob. Se escolher Blob, será necessário implementar outro adaptador. Não deixar comprovantes e vídeos acessíveis publicamente.

Configurar SMTP de um provedor real, incluindo remetente/domínio verificado quando exigido. Mailpit local não envia e-mails pela internet. Não usar credenciais do GitHub como credenciais SMTP.

## 3. Variáveis do servidor

Cadastrar em Settings → Environment Variables, ambiente Production. Não colocar prefixo `VITE_` em segredos. Não importar o `.env` local inteiro.

| Nome | Valor/origem |
| --- | --- |
| `NODE_ENV` | `production` |
| `APP_ORIGIN` | `https://link-atletas.vercel.app` sem barra final |
| `DATABASE_URL` | Conexão PostgreSQL TLS do Neon |
| `DATA_ENCRYPTION_KEY` | 32 bytes aleatórios codificados em base64; preservar em backup seguro |
| `BILLING_MODE` | `academic` para a entrega sem cobrança real |
| `S3_ENDPOINT` | Endpoint HTTPS do provedor de arquivos |
| `S3_REGION` | Região exigida pelo provedor |
| `S3_BUCKET` | Nome do bucket privado já criado |
| `S3_ACCESS_KEY` | Chave do serviço, com acesso ao bucket |
| `S3_SECRET_KEY` | Segredo do serviço de arquivos |
| `SMTP_HOST` | Host do provedor SMTP |
| `SMTP_PORT` | Porta fornecida pelo provedor |
| `SMTP_SECURE` | `true` para TLS implícito, normalmente 465; `false` para STARTTLS, normalmente 587 |
| `SMTP_FROM` | Remetente autorizado pelo provedor |
| `SMTP_USER` | Usuário SMTP |
| `SMTP_PASSWORD` | Senha ou chave SMTP |
| `CRON_SECRET` | Segredo aleatório independente, com pelo menos 32 caracteres |

A Vercel fornece `VERCEL=1`; nessa condição o timer contínuo de jobs não é iniciado. Não configurar API_HOST/API_PORT locais na Vercel. Asaas e Google Agenda permanecem opcionais; não cadastrar chaves fictícias para simular configuração completa.

## 4. Migrações e administrador

Executar as migrações uma vez com a configuração de produção carregada no terminal autorizado. Não migrar a cada build de Preview. O comando existente `pnpm db:migrate` aplica migrações cumulativas sob trava de transação.

Se usar a CLI da Vercel para obter as variáveis, vincular primeiro o projeto correto e salvar em `.env.cloud.local`, arquivo ignorado pelo Git. Conferir que são as variáveis Production antes de executar:

```powershell
pnpm dlx vercel env pull .env.cloud.local --environment=production
node --env-file=.env.cloud.local --import tsx server/db/migrate.ts
```

Para criar o administrador, fornecer `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` apenas no ambiente do terminal. Executar `node --env-file=.env.cloud.local --import tsx server/db/admin.ts`. Não usar senha de demonstração. Não publicar logs com variáveis de ambiente. Configuração privada completa é exigida também pelos scripts de produção.

## 5. Tarefas agendadas

`GET /api/internal/jobs` exige `Authorization: Bearer` com o valor exato de `CRON_SECRET`. Não colocar segredo em URL. A rota retorna 401 sem autorização e usa trava de transação PostgreSQL para evitar concorrência entre chamadas agendadas, inclusive com pool em modo de transação. Um processo encerrado libera a trava ao encerrar a transação. O modo local conserva o timer existente; não executar um segundo worker sobre a mesma base de produção.

É necessário configurar um agendador que chame a rota a cada minuto. No plano Hobby, o cron nativo permite apenas uma execução diária e não atende ao envio oportuno de recuperação de senha. Alternativas: agendador externo com cabeçalho secreto ou plano que permita frequência maior. Nenhum serviço pago foi contratado. `vercel.json` não ativa um cron diário inadequado.

## 6. Uploads e comunicação

Functions têm limite de corpo de requisição de 4,5 MB. Nosso upload atual aceita até 50 MiB e passa pelo servidor para validar e cifrar o conteúdo; esse fluxo exige adaptação antes de homologar vídeos grandes na Vercel. Aumentar `maxDuration` ou o limite do Fastify não remove o limite da plataforma. Não reduzir silenciosamente o limite da ERS e não enviar vídeos privados sem a proteção existente. Upload segmentado autenticado ou um serviço de ingestão compatível são trabalhos ainda pendentes.

WebSockets exigem Fluid Compute habilitado. Conexões podem terminar e o cliente já reconecta. Mensagens persistidas são consultadas também a cada 10 segundos nas páginas de conversas, notificações e agenda enquanto a página está visível; isso cobre eventos que não atravessam instâncias diferentes. O fanout instantâneo continua restrito à instância atual. Testar duas sessões atendidas por instâncias distintas antes de afirmar homologação em escala.

## 7. Publicar e verificar

Após configurar serviços, migrações e agendador, integrar a branch de preparação e sincronizar o fork conectado à Vercel. Confirmar preset Fastify, remover override antigo de Output Directory `dist` e manter Node 24. `vercel.json` já define build e instalação. Criar Preview isolado antes de promover a produção.

No painel Build and Deployment, selecionar Fastify e desativar os overrides de Build Command, Output Directory e Install Command para usar a configuração versionada. Manter a raiz `./`. A entrada `server.ts` importa Fastify diretamente para que a detecção do backend reconheça a função; um arquivo que apenas importa outra entrada não atende a essa detecção. O erro `unused_function` em `server.ts` indica que a função não foi reconhecida; não resolver apagando a inclusão de `dist`, necessária para servir a interface.

- [x] Entrada do servidor e configuração versionável preparadas.
- [x] Rota agendada autenticada e trava implementadas.
- [x] Consulta periódica de dados persistidos na interface implementada.
- [ ] Neon conectado e migrações executadas na nuvem.
- [ ] Bucket privado S3 e SMTP configurados e verificados.
- [ ] Agendador frequente configurado.
- [ ] Upload de vídeos grandes adaptado e testado na nuvem.
- [ ] Build nativo da Vercel e rotas reais validados no Preview.
- [ ] `/api/health` retorna JSON com banco conectado.
- [ ] Cadastro, login, sessão segura e permissões entre os três perfis verificados.
- [ ] Aprovação manual de CREF, contratação e treino verificados.
- [ ] Recuperação de senha com entrega real de e-mail verificada.
- [ ] Comprovantes e vídeos privados acessíveis apenas aos perfis autorizados.
- [ ] Conversas entre duas sessões, reconexão e atualização entre instâncias verificadas.
- [ ] Administrador, backup cifrado e restauração da base de produção verificados.

## Referências

Verificação local desta preparação: TypeScript e build aprovados; 32 testes unitários e 3 testes da entrada de produção aprovados. O teste da entrada inicia o servidor real, serve a interface e a navegação, consulta a sessão e verifica o bloqueio do agendador sem credenciais externas. Usa configuração fictícia isolada e não comprova conexão com Neon, SMTP, S3 ou o runtime nativo da Vercel. O Docker estava indisponível durante a execução; a suíte completa com PostgreSQL não foi reexecutada nesta preparação.

- [Fastify na Vercel](https://vercel.com/docs/frameworks/backend/fastify)
- [WebSockets](https://vercel.com/docs/functions/websockets)
- [PostgreSQL via Marketplace](https://vercel.com/docs/postgres)
- [Tigris compatível com S3](https://vercel.com/marketplace/tigris)
- [Limites das Functions](https://vercel.com/docs/functions/limitations)
- [Limites do cron](https://vercel.com/docs/cron-jobs/usage-and-pricing)
