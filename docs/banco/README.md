# Banco de dados

[dicionario-dados.md](dicionario-dados.md) descreve as tabelas, colunas e relações do PostgreSQL implementado. Consulte o [DER e os demais diagramas](../diagramas/README.md) para a visão visual e a [documentação do banco no servidor](../../server/db/README.md) para migrações e operação.

O dicionário e o DER técnico são gerados por [export-schema.ts](../../scripts/banco/export-schema.ts). O metadado usado na conferência está em [database-schema.json](../evidencias/api/database-schema.json). A exportação descreve a estrutura; não contém uma cópia dos registros dos usuários.

O dicionário permite consultar a estrutura sem acesso ao Neon ou exposição de credenciais. Ele complementa o banco: a estrutura efetivamente aplicada é determinada pelas migrações e deve ser conferida quando houver alterações.

[Documentação](../README.md)
