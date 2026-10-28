# Evidências por assunto

O [relatório de testes](../relatorio-testes.md) explica os cenários e resultados. Esta pasta organiza os arquivos de apoio; a existência de um arquivo não significa que todos os seus cenários passaram.

| Pasta | Conteúdo |
|---|---|
| [api](api/) | Resultados Vitest, regressões e metadados do banco. |
| [web](web/) | Capturas da interface, responsividade, acessibilidade e resultados de navegador. |
| [android](android/) | Aplicativo, APK, emulador, testes móveis e capturas. |
| [nuvem](nuvem/) | Verificações de Vercel, Neon, Tigris, Brevo e agendador. |
| [infraestrutura](infraestrutura/) | Backup, TLS, carga, dependências e ambiente local. |
| [github](github/) | Registros de CI e pull requests. |
| [documentacao](documentacao/) | Conferências de links, materiais e elaboração dos documentos. |
| [execucoes](execucoes/) | Conjuntos que já pertenciam a uma mesma sessão ou execução, preservados juntos. |

Os resultados históricos foram movidos sem alterar seu conteúdo. Caminhos internos presentes em JSON, XML ou logs podem identificar a localização original no momento do teste. Os links dos documentos atuais foram ajustados para as novas pastas.

Somente `android-integrated-result.json` e `vitest-results.json` permanecem também na entrada desta pasta: a ERS final contém links diretos para esses dois endereços. São cópias históricas de compatibilidade, não execuções adicionais. As conferências atuais de documentação são geradas em `documentacao/`.

Resultados de navegador gerados no ambiente local usam `web/` por padrão. O destino pode ser substituído por `EVIDENCE_DIR`. Relatórios HTML temporários e traces permanecem ignorados pelo Git.
