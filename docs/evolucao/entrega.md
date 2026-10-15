# Entrega e índice — ampliação da Sprint 2

Este incremento amplia a entrega inicial preservada em [docs/sprint-2](../sprint-2/entrega.md). Comece pelo [checklist verificável](checklist-sprint-2.md), confira o [relatório de testes](relatorio-testes.md) e execute o [manual](manual.md).

Implementação: commit `fca8a18` e incrementos posteriores, autor Lucca <luccacc.contato@gmail.com>. Branch `evolucao-completa` publicada e integrada à `main` pelo [PR #1](https://github.com/DaviSouza78/LinkAtletas/pull/1), merge `f6a5a56`. Verificações: 75 testes Vitest, 15 cenários web em três motores e nove testes de transporte Expo aprovados; tipos/build, TLS/reinício e recuperação SQL/S3 conferidos localmente e na [CI remota](https://github.com/DaviSouza78/LinkAtletas/actions/runs/38656142290).

- [ERS v2: requisitos, fluxos, regras e cenários](ERS-v2.md).
- ERS [Word](ERS-v2.docx) / [PDF](ERS-v2.pdf), relatório [Word](relatorio-testes.docx) / [PDF](relatorio-testes.pdf).
- [API e contratos](api.md).
- [Diagramas e fontes UML/Mermaid](diagramas.md).
- [Backlog e pendências externas](backlog.md).
- [Matriz de rastreabilidade/UCs](rastreabilidade.md).
- [Decisões, dificuldades e mudanças](decisoes.md).
- [Proposta aprovada](../superpowers/specs/2026-10-14-expansao-completa-design.md) e [plano](../superpowers/plans/2026-10-14-expansao-completa.md).

O envio e merge no GitHub estão confirmados no [registro de publicação](publicacao.md). Nenhuma submissão ao ambiente acadêmico foi realizada. Apps/serviços reais e participação de cada integrante precisam de seus próprios registros; veja as [pendências de Lucca e do grupo](pendencias-lucca.md). Builds/bundles, inicialização e homologações externas são estados separados no checklist.

Pacotes locais em `C:/dev/output`: `LinkAtletas-Ampliacao.zip` (fonte/documentos/evidências), `LinkAtletas-Ampliacao.bundle` (histórico Git), `LinkAtletas-Ampliacao-manifest.json` (commit e checksums), `LinkAtletas-Mobile-Hermes.zip` (bundles Android/iOS) e `LinkAtletas-APK-verificacao/LinkAtletas-verificacao.apk` (APK Android de verificação). ZIP/bundle não incluem segredos locais, banco, objetos S3 ou chave de criptografia. A instalação recria os serviços e dados de demonstração; dados existentes exigem backup e chave originais.
