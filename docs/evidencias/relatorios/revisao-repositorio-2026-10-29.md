# Revisão do repositório — 29/10/2026

## Escopo

Inventário dos 356 arquivos versionados no início da revisão, referências e organização dos 46 READMEs, caminhos dos scripts/workflows, pacotes declarados e correspondência da documentação com as interfaces disponíveis. É uma revisão de manutenção e documentação; não substitui auditoria de segurança, homologação externa ou testes completos de todos os fluxos.

## Correções

- API agrupada em `docs/api`, com guia e OpenAPI juntos. Exportador e conferidor usam o novo caminho; o contrato exportado permaneceu equivalente.
- Índice dos diagramas reunido no README da própria pasta, sem dois índices concorrentes.
- E2E do fluxo esportivo renomeado para `training-flow.spec.ts`, preservando seu conteúdo e descoberta automática pelo Playwright.
- Matriz móvel passou a descrever operações por perfil, removendo a coluna inicial superada. Corrigidas instruções de Expo Go e de cadastro/login.
- Suíte Google Calendar acrescentada ao índice dos testes móveis; instruções dos roteiros alinhadas ao workflow consolidado.
- Removidos padrões de ignore de arquivos já retirados e seis dependências de ESLint sem configuração, comando ou consumidor no projeto.
- Conferidor de documentação ampliado para os Markdown de todo o repositório identificados pelo Git, incluindo novos arquivos não ignorados.

Não foram encontradas cópias byte a byte idênticas entre arquivos versionados, arquivos `.env` reais ou diretórios gerados como `node_modules`, `dist` e `.expo` versionados. Isso não equivale a varredura de segredos do conteúdo ou do histórico Git.

## Verificação

| Verificação | Resultado |
|---|---|
| `pnpm build` | Tipos e build aprovados. |
| `pnpm exec vitest run tests/unit` | 61 casos aprovados. |
| `pnpm --dir mobile typecheck` | Aprovado. |
| `pnpm --dir mobile check` | Matriz instalada do Expo aprovada. |
| `pnpm --dir mobile test` | 106 casos aprovados em oito arquivos. |
| `pnpm docs:check` | Links locais, 63 caminhos OpenAPI, 132 colunas e 47 relações do DER, 22 chamadas de sequência e 16 casos de uso conferidos. |
| `actionlint` | Workflows sem erros de validação. |
| Playwright `--list` | Configuração e descoberta dos testes carregadas; não equivale à execução dos cenários. |

Docker indisponível na máquina durante esta revisão: testes de integração com PostgreSQL, E2E, backup e TLS em contêineres não foram reexecutados. APK, dispositivo físico e autorização Google real também não foram executados. As evidências anteriores continuam identificadas por data e ambiente.

Os dois arquivos locais de auditoria/perfis ainda não publicados foram preservados e excluídos do commit desta revisão.

[Documentação](../../README.md) · [Relatórios](README.md)
