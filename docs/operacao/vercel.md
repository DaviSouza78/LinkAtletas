# Implantação na Vercel

A interface React/Vite e a API Node/Fastify usam o mesmo domínio. A configuração versionada em [vercel.json](../../vercel.json) define o builder, o build e o encaminhamento das requisições. O arquivo [server.ts](../../server.ts) exporta a aplicação para o runtime da Vercel.

## Serviços e ambientes

- **Neon:** PostgreSQL remoto acessado pela API usando `DATABASE_URL` com TLS.
- **Tigris:** buckets privados compatíveis com S3 para arquivos; o banco guarda metadados e relações.
- **Brevo:** servidor SMTP de envio de e-mails. Mailpit é a alternativa local.
- **cron-job.org:** aciona a rota protegida `/api/internal/jobs` para processar tarefas pendentes.

Produção e Preview devem ter banco, buckets e credenciais independentes. As variáveis necessárias estão em [.env.example](../../.env.example); seus valores reais são cadastrados privadamente nos provedores. Não copiar credenciais locais para produção nem expor segredos com prefixos públicos.

## Publicação

1. Instalar dependências e conferir `pnpm build` antes de publicar.
2. Configurar as variáveis do ambiente de destino e confirmar os serviços necessários.
3. Aplicar migrações com `pnpm db:migrate` apontando explicitamente para o banco correto. Não executar o seed de demonstração em produção.
4. Publicar a versão e consultar os logs da Vercel.
5. Conferir `/api/health`, login, persistência, permissões, envio de arquivos e processamento das tarefas.

O [manual](manual.md) descreve os comandos locais. Evidências já coletadas estão no [registro de implantação](../evidencias/relatorios/implantacao-2026-10-26.md); elas comprovam aquela execução, não o estado contínuo dos provedores.

## Cuidados

Uma CI aprovada, um commit enviado e um deployment em produção são eventos diferentes. Antes de usar um resultado como evidência, conferir ambiente, commit e data. WebSockets em serverless exigem considerar as limitações do provedor; o histórico de mensagens persiste no PostgreSQL.

Uploads grandes utilizam sessões autenticadas em partes. Conferir o [contrato da API](../api.md) e os limites do provedor antes de alterar essa configuração. Pagamentos reais, OAuth e publicação nas lojas têm requisitos próprios descritos em [continuidade](continuidade.md).
