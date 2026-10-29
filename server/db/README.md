# Banco de dados

Conexão e manutenção do PostgreSQL. Neon hospeda o banco remoto; o PostgreSQL do Docker é um ambiente separado, sem sincronização automática.

| Arquivo/pasta | Função |
|---|---|
| [pool.ts](pool.ts) | Pool de conexões e transações, com descarte de conexão quando o rollback falha. |
| [migrate.ts](migrate.ts) | Aplica os SQLs em ordem, com trava e controle em `schema_migrations`; protege conteúdo legado de execuções em cifra. |
| [migrations](migrations) | Evolução do esquema: base esportiva, privacidade, comunicação, financeiro e uploads. |
| [seed.ts](seed.ts) | Dados fictícios locais sem sobrescrever contas existentes; recusa `NODE_ENV=production`. |
| [admin.ts](admin.ts) | Cria administrador com os dados fornecidos por variáveis de ambiente. |
| [init-test.sql](init-test.sql) | Cria as bases de teste na primeira inicialização do volume pelo Compose. |

Comandos, executados na raiz: `pnpm db:migrate`, `pnpm db:seed` e `pnpm db:admin`. Conferir o ambiente antes: eles podem modificar dados. Não executar seed na nuvem nem usar produção para testes que limpam tabelas.

Não editar SQL já aplicado para atualizar um banco existente; criar nova migração. Reiniciar o Docker não reaplica automaticamente `init-test.sql` sobre volume existente. Backups e restauração ficam em [scripts/banco](../../scripts/banco).

[Dicionário de dados](../../docs/evolucao/banco/dicionario-dados.md) · [Guia de testes](../../tests/README.md) · [Voltar ao servidor](../README.md)
