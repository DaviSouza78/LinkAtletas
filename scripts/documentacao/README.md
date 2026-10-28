# Documentação e diagramas

| Arquivo | Entrada e saída / função |
|---|---|
| [check-docs.ts](check-docs.ts) | Confere links em README raiz, documentação e guias de `scripts`; verifica OpenAPI e relações/colunas/chamadas dos diagramas contra os registros exportados. Grava `documentation-check.json`. |
| [export-openapi.ts](export-openapi.ts) | Inicializa a definição da aplicação e escreve `openapi.json` em `API_DOCS_DIR` ou `docs/evolucao`. Não inicia servidor HTTP. |
| [build-documents.ts](build-documents.ts) | Converte `requisitos/ERS-v2.md` e `relatorio-testes.md` em DOCX de apoio. Aceita `ERS-v2` ou `relatorio-testes` como seleção. |
| [build-ers-template.py](build-ers-template.py) | Monta a revisão do Word a partir de `--reference` e dos JSONs do template; também atualiza fontes e registro de geração. Não incorpora ajustes manuais posteriores do PDF. |
| [generate-use-cases.ts](generate-use-cases.ts) | Lê o subconjunto previsto do PlantUML e gera SVG com posições definidas. Não é renderizador PlantUML genérico. |
| [render-use-cases.ts](render-use-cases.ts) | Usa Chromium/Playwright para converter o SVG de casos de uso em PNG. |
| [render-ers-figures.mjs](render-ers-figures.mjs) | Usa Chromium para gerar PDFs vetoriais de casos de uso/DER e manifesto de hashes em `template/figuras`. |
| [render-documents.py](render-documents.py) | Renderiza PDFs existentes na raiz de `docs/evolucao` para PNGs e grava contagens para inspeção visual. Não converte Word para PDF. |
| [update-template-pdf.py](update-template-pdf.py) | **Histórico v2.5:** recompõe PDF a partir da Sprint 1. Saídas isoladas em `tmp/documentacao/ers-v2.5`; bloqueia substituir o PDF oficial. |
| [build-template-word.py](build-template-word.py) | **Histórico v2.5:** reconstrói texto com quadros sobre o PDF histórico. Exige PDF correspondente ao hash do registro e grava DOCX na mesma pasta histórica. |

Comandos usuais: `pnpm docs:check`, `pnpm api:export` e `pnpm docs:build`. Executar na raiz. Renderizações JavaScript exigem Chromium instalado pelo Playwright. Os geradores Python dependem de PyMuPDF e, conforme o arquivo, python-docx e Pillow; o gerador PDF histórico também usa fontes do Windows.

A exportação OpenAPI documenta a **API própria do LinkAtletas**. A conferência de diagramas usa o JSON de esquema exportado; sem exportação recente, não comprova correspondência com o banco atual. Links HTTP externos e âncoras internas não são validados por `docs:check`.

Os geradores sobrescrevem suas saídas. O gerador Word exige referência diferente da saída. O PDF histórico aceita `--output-dir`; o Word histórico aceita `--source-dir` e, opcionalmente, páginas como `1,2`. Esses processos antigos não devem recriar a ERS atual.

O [PDF final](../../docs/evolucao/ERS-template-original-atualizada.pdf) foi ajustado manualmente pela equipe. As fontes registram a geração anterior, sem garantir reprodução idêntica desse PDF. Conferir o [guia do template](../../docs/evolucao/template/README.md) antes de regenerar.

[Voltar aos scripts](../README.md)
