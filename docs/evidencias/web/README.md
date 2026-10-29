# Evidências da interface web

Capturas e resultados de testes de navegador. “Mobile” nos nomes de capturas desta pasta indica uma janela web estreita, usada na avaliação da responsividade; não identifica um APK.

- [playwright-results.json](playwright-results.json): resultado de navegador associado às capturas desta pasta.
- Arquivos iniciados por `chromium-`, `firefox-` e `webkit-`: capturas e verificações de acessibilidade por navegador. Arquivos de acessibilidade podem ter conteúdo idêntico quando nenhum problema foi encontrado, mantendo a identificação de cada navegador.
- `chrome-landing-*` e `chrome-local-*`: verificações específicas da página inicial e do ambiente local.
- Capturas de aprovação, treino e feedback: apoio visual à demonstração do fluxo principal.

O destino padrão dos testes de navegador é esta pasta e pode ser substituído por `EVIDENCE_DIR`. Uma nova execução pode atualizar as saídas. Os [conjuntos congelados por execução](../execucoes/README.md) e o [relatório de testes](../../relatorio-testes.md) identificam os resultados usados em cada revisão.

Relatórios HTML, traces e outros arquivos temporários devem permanecer fora da documentação versionada.

[Índice das evidências](../README.md)
