# Documentação e diagramas

| Arquivo | Função |
|---|---|
| [check-docs.ts](check-docs.ts) | Confere links locais, OpenAPI, colunas/relações do DER e chamadas das sequências. |
| [export-openapi.ts](export-openapi.ts) | Exporta o contrato da API própria para `docs/openapi.json` ou `API_DOCS_DIR`. |
| [generate-use-cases.ts](generate-use-cases.ts) | Converte o subconjunto PlantUML do projeto para SVG; não é um renderizador genérico. |
| [render-use-cases.ts](render-use-cases.ts) | Converte esse SVG para PNG usando Chromium/Playwright. |

Executar `pnpm docs:check` e `pnpm api:export` na raiz. A conferência utiliza o esquema exportado e não consulta diretamente o banco implantado. As renderizações exigem Chromium instalado pelo Playwright.

Os geradores das versões antigas da ERS foram retirados para evitar a recriação de conteúdo superado. O documento oficial está em [ERS-LinkAtletas.pdf](../../docs/requisitos/ERS-LinkAtletas.pdf).

[Scripts](../README.md)
