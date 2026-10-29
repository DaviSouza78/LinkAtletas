# Evidências por assunto

O [relatório de testes](../relatorio-testes.md) explica os cenários e resultados. Esta pasta organiza os arquivos de apoio; a existência de um arquivo não significa que todos os seus cenários passaram.

| Pasta | Conteúdo |
|---|---|
| [api](api/README.md) | Resultados Vitest, regressões e metadados do banco. |
| [web](web/README.md) | Capturas da interface, responsividade, acessibilidade e resultados de navegador. |
| [android](android/README.md) | Aplicativo, APK, emulador, testes móveis e capturas. |
| [nuvem](nuvem/README.md) | Verificações de Vercel, Neon, Tigris, Brevo e agendador. |
| [infraestrutura](infraestrutura/README.md) | Backup, TLS, carga, dependências e ambiente local. |
| [github](github/README.md) | Registros de CI e pull requests. |
| [documentacao](documentacao/README.md) | Conferências de links, materiais e elaboração dos documentos. |
| [execucoes](execucoes/README.md) | Conjuntos que já pertenciam a uma mesma sessão ou execução, preservados juntos. |

Os resultados históricos foram movidos sem alterar seu conteúdo. Caminhos internos presentes em JSON, XML ou logs podem identificar a localização original no momento do teste. Os links dos documentos atuais foram ajustados para as novas pastas.

Os arquivos [android-integrated-result.json](android-integrated-result.json) e [vitest-results.json](vitest-results.json) têm uma única cópia, na entrada desta pasta, para preservar os links diretos da ERS final. São resultados históricos identificados no relatório, não execuções adicionais. As conferências atuais de documentação são geradas em `documentacao/`.

Resultados de navegador gerados no ambiente local usam `web/` por padrão. O destino pode ser substituído por `EVIDENCE_DIR`. Relatórios HTML temporários e traces permanecem ignorados pelo Git.
