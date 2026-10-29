# Banco de dados

[dicionario-dados.md](dicionario-dados.md) descreve as tabelas, colunas e relações do PostgreSQL implementado. Consulte o [DER e os demais diagramas](../diagramas.md) para a visão visual e a [documentação do banco no servidor](../../server/db/README.md) para migrações e operação.

O dicionário e o DER técnico são gerados por [export-schema.ts](../../scripts/banco/export-schema.ts). O metadado usado na conferência está em [database-schema.json](../evidencias/api/database-schema.json). A exportação descreve a estrutura; não contém uma cópia dos registros dos usuários.

A demonstração da integração e as consultas indicadas ao professor estão no [guia de apresentação](../apresentacao/guia-completo-sprint-2.md). Os [testes remotos](../operacao/implantacao-2026-10-26.md) distinguem o banco Neon do ambiente Docker local.

[Documentação atual](../README.md)
