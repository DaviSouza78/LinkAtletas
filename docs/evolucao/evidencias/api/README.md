# Evidências da API e do banco

Os JSONs registram resultados de execuções específicas; não são o código dos testes. A API testada é o back-end do LinkAtletas, incluindo a conferência manual de CREF.

- [Esquema do banco](database-schema.json): tabelas, colunas e restrições usadas na conferência do DER.
- [Unidade do servidor — 28/10](server-unit-2026-10-28.json): resultado da revisão de funções e regras do servidor.
- [Referência de unidade/API — 26/10](nuvem-2026-10-26-vitest.json): execução detalhada no relatório da entrega.
- [Regressão de referências de treino — 27/10](referencia-treino-2026-10-27.json) e [regressão da API](regressao-api-referencia-2026-10-27.json): validação dos campos de referência e verificações relacionadas.
- [Conjuntos posteriores completos](../execucoes/README.md): resultados de servidor, navegador e infraestrutura mantidos por execução.

As demais exportações datadas conservam as reexecuções e a preparação da demonstração. O resultado histórico vinculado pela ERS está em [vitest-results.json](../vitest-results.json), com uma única cópia publicada. Para interpretar nomes, quantidades e limitações, consulte o [relatório](../../relatorio-testes.md).

[Índice das evidências](../README.md)
