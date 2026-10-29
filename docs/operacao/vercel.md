# Implantação na Vercel

A interface React/Vite e a API Node/Fastify usam o mesmo domínio. A configuração versionada em [vercel.json](../../vercel.json) define o builder, o build e o encaminhamento das requisições. O arquivo [server.ts](../../server.ts) exporta a aplicação para o runtime da Vercel.

## Serviços e ambientes

- **Neon:** PostgreSQL remoto acessado pela API usando `DATABASE_URL` com TLS.
- **Tigris:** buckets privados compatíveis com S3 para arquivos; o banco guarda metadados e relações.
- **Brevo:** servidor SMTP de envio de e-mails. Mailpit é a alternativa local.
- **cron-job.org:** aciona a rota protegida `/api/internal/jobs` para processar tarefas pendentes.

Produção e Preview devem ter banco, buckets e credenciais independentes. As variáveis necessárias estão em [.env.example](../../.env.example); seus valores reais são cadastrados privadamente nos provedores. Não copiar credenciais locais para produção nem expor segredos com prefixos públicos.

### Isolamento de Preview

A integração Neon gerenciada fornece credenciais somente a Production, sem criação automática de branches por deployment. Preview usa uma conexão explícita para a base `linkatletas_preview`, em outro branch Neon, com usuário exclusivo sem `CREATEROLE`, `CREATEDB` ou `BYPASSRLS`. Aplicar as migrações nessa base limpa; não clonar dados pessoais ou sessões de produção. As credenciais de produção não devem aparecer nos aliases `DATABASE_*` de Preview.

O armazenamento utiliza buckets e chaves exclusivos. As variáveis `DATA_ENCRYPTION_KEY` e `CRON_SECRET` também devem ser distintas. Não substituir a chave de cifra de produção para organizar ambientes: isso impediria a leitura de dados já cifrados.

Em deployments com `VERCEL_ENV=preview`, o servidor exige `BILLING_MODE=academic` e bloqueia a entrega SMTP antes de consultar a fila ou abrir transporte. E-mails de recuperação ficam pendentes nesse ambiente; não são entregues. Preview não recebe a senha SMTP do Brevo de produção. O teste de entrega real deve ser feito em um ambiente autorizado próprio.

Quando disponível, `VERCEL_BRANCH_URL` define a origem HTTPS de Preview. Navegar pelo domínio estável do branch para operações autenticadas; uma URL específica de deployment pode não coincidir com a origem permitida.

Antes de liberar uma configuração nova, verificar conexão com TLS, negação de autenticação do banco com a credencial do outro ambiente, negação HTTP 403 entre buckets e cadastro/login com persistência somente em Preview. Deployments antigos conservam configurações antigas; não usá-los como ambiente de testes atual.

## Publicação

1. Instalar dependências e conferir `pnpm build` antes de publicar.
2. Configurar as variáveis do ambiente de destino e confirmar os serviços necessários.
3. Aplicar migrações com `pnpm db:migrate` apontando explicitamente para o banco correto. Não executar o seed de demonstração em produção.
4. Publicar a versão e consultar os logs da Vercel.
5. Conferir `/api/health`, login, persistência, permissões, envio de arquivos e processamento das tarefas.

O [manual](manual.md) descreve os comandos locais. Evidências já coletadas estão no [registro de implantação](../evidencias/relatorios/implantacao-2026-10-26.md); elas comprovam aquela execução, não o estado contínuo dos provedores.

## Cuidados

Uma CI aprovada, um commit enviado e um deployment em produção são eventos diferentes. Antes de usar um resultado como evidência, conferir ambiente, commit e data. WebSockets em serverless exigem considerar as limitações do provedor; o histórico de mensagens persiste no PostgreSQL.

Uploads grandes utilizam sessões autenticadas em partes. Conferir o [contrato da API](../api/README.md) e os limites do provedor antes de alterar essa configuração. Pagamentos reais, OAuth e publicação nas lojas têm requisitos próprios descritos em [continuidade](continuidade.md).

## Aprovação antes da produção

O Deployment Check `LinkAtletas - validacao completa`, importado do GitHub, é exigido para promoção em Production. Ele corresponde ao job de mesmo nome em `.github/workflows/ci.yml` no fork conectado à Vercel. O build pode terminar antes dos testes; a liberação do domínio deve aguardar a aprovação desse check no mesmo commit.

O workflow responde a todos os pushes, inclusive documentação, e permite execução manual. Se uma publicação ficar aguardando, conferir o commit, a execução no fork e o nome do check antes de tentar novamente. Uma CI aprovada somente no repositório do grupo não substitui o resultado do fork.
