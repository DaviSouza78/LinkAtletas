# Entrega e índice — ampliação da Sprint 2

Este incremento amplia a entrega inicial preservada em [docs/sprint-2](../sprint-2/entrega.md). Comece pelo [checklist verificável](checklist-sprint-2.md), confira o [relatório de testes](relatorio-testes.md) e execute o [manual](manual.md).

Implementação inicial ampliada: commit `fca8a18`, integrada pelo [PR #1](https://github.com/DaviSouza78/LinkAtletas/pull/1), merge `f6a5a56`. Revisão de 15–20/10 na branch `revisao-sprint-2`, com autoria Lucca <luccacc.contato@gmail.com>. Verificações desta revisão: 82 testes Vitest, 15 cenários web em três motores e 22 testes de transporte/configuração Expo aprovados; tipos/build, TLS/reinício e recuperação SQL/S3 conferidos na [CI da revisão](https://github.com/DaviSouza78/LinkAtletas/actions/runs/39645457806). Os resultados antigos permanecem identificados como históricos.

- [ERS v2.3: requisitos, fluxos, regras, cenários e histórico de revisões](ERS-v2.md). Atualização documental de 23/10/2026 consolida as decisões da equipe; os pacotes anteriores permanecem identificados pelo commit de sua publicação.
- [Cópia atualizada no template original](ERS-template-original-atualizada.pdf), para revisão da equipe; [preservação e método](template/README.md).
- ERS [Word](ERS-v2.docx) / [PDF](ERS-v2.pdf), relatório [Word](relatorio-testes.docx) / [PDF](relatorio-testes.pdf).
- [API e contratos](api.md).
- [Diagramas e fontes UML/Mermaid](diagramas.md).
- [Backlog e pendências externas](backlog.md).
- [Matriz de rastreabilidade/UCs](rastreabilidade.md).
- [Decisões, dificuldades e mudanças](decisoes.md).
- [Proposta aprovada](../superpowers/specs/2026-10-14-expansao-completa-design.md) e [plano](../superpowers/plans/2026-10-14-expansao-completa.md).

O envio e merge no GitHub estão confirmados no [registro de publicação](publicacao.md). Nenhuma submissão ao ambiente acadêmico foi realizada. Apps/serviços reais e participação de cada integrante precisam de seus próprios registros; veja as [pendências de Lucca e do grupo](pendencias-lucca.md). Builds/bundles, inicialização e homologações externas são estados separados no checklist.

Pacotes locais em `C:/dev/output`: `LinkAtletas-Ampliacao.zip` (fonte/documentos/evidências), `LinkAtletas-Ampliacao.bundle` (histórico Git), `LinkAtletas-Ampliacao-manifest.json` (commit e checksums), `LinkAtletas-Mobile-Hermes.zip` (bundles Android/iOS) e `LinkAtletas-APK-verificacao/LinkAtletas-verificacao.apk` (APK Android de verificação). ZIP/bundle não incluem segredos locais, banco, objetos S3 ou chave de criptografia. A instalação recria os serviços e dados de demonstração; dados existentes exigem backup e chave originais.

## Complementos desta revisão

[Revisão dos materiais](revisao-materiais.md), [checklist de serviços externos](servicos-externos-sprint-2.md), [manual APK local](manual-apk-local.md), [dicionário de dados](dicionario-dados.md) e [auditoria de bibliotecas](seguranca-dependencias.md). Os registros da ampliação anterior acima são históricos; a revisão atual é identificada na [publicação](publicacao.md).

O APK local corrigido aprovou [18/18 etapas integradas](evidencias/android-integrated-result.json), com serviços reais de desenvolvimento e dados fictícios. O formato do pacote revisado é `LinkAtletas-Sprint-2-Revisada.zip`, `.bundle`, `LinkAtletas-local.apk`, `manifesto.json`, `SHA256SUMS` e `LEIA-ME.md`, na [release da revisão](https://github.com/DaviSouza78/LinkAtletas/releases/tag/v0.3.0-sprint-2-revisao-1). O manifesto identifica separadamente fonte da entrega, fonte/build do APK e roteiro de verificação. Pasta local prevista: `C:/dev/output/LinkAtletas-Sprint-2-Revisada`.
