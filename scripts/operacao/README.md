# Inicialização em contêineres

| Arquivo | Função |
|---|---|
| [init-production.ts](init-production.ts) | Gera senhas/chave exclusivas e cria `.env.production.local` e `.s3-production.local`, recusando arquivos existentes. O padrão usa HTTPS local, Mailpit e financeiro acadêmico. |
| [production-start.ts](production-start.ts) | Aplica migrações com a conexão configurada, fecha o pool de migração e inicia o servidor. É o comando de entrada do Dockerfile. |

`pnpm production:init` prepara a instalação local do [Compose com TLS](../../compose.production.yaml); não inicia contêineres, publica na Vercel ou configura Neon, Tigris e Brevo.

O procedimento completo está no [manual](../../docs/evolucao/operacao/manual.md). Variáveis exportadas no terminal podem prevalecer sobre `--env-file`; conferir o ambiente sem imprimir credenciais. Os arquivos gerados ficam ignorados pelo Git e a chave AES deve ser preservada separadamente dos backups.

O script de entrada pode alterar o esquema do banco configurado. Não executá-lo somente para consultar status; a rota `/api/health` atende a essa finalidade. A Vercel usa o ponto de entrada próprio na raiz, não este comando Docker.

[Voltar aos scripts](../README.md) · [Dockerfile](../../Dockerfile)
