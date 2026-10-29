# Esquema do banco

[database-schema.json](database-schema.json) contém tabelas, colunas e restrições exportadas do PostgreSQL; não contém registros dos usuários. É usado pelo [dicionário](../../banco/dicionario-dados.md), pelo DER e pelo conferidor de documentação.

Atualização: [export-schema.ts](../../../scripts/banco/export-schema.ts). O arquivo representa o esquema no momento da exportação; não é uma conexão ao Neon. Os resultados de unidade/API estão no [relatório de testes](../relatorio-testes.md).
