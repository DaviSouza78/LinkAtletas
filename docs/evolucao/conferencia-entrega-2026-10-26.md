# Conferência da entrega da Sprint 2 — 26/10/2026

## Conclusão e ressalva

Recomenda-se entregar o incremento funcional local com código, documentação e evidências, sem aguardar a conclusão da hospedagem. Isso não declara aceite acadêmico nem conclusão integral dos requisitos de nuvem.

O [roteiro original](../referencias/Roteiro-professores-original.pdf#page=9), seção 9.6, apresenta os nove entregáveis gerais, sem exigir uma URL pública nessa lista. A seção 9.5 exige demonstração real do sistema, apresentação das limitações e plano da Sprint 3. A página 9 também prevê integração com serviço em nuvem quando planejada; como a nuvem faz parte do LinkAtletas, essa ressalva precisa permanecer explícita. Na página 10, a Sprint 3 inclui conclusão, testes e implantação. A matriz da página 5 admite diagrama, URL, log, captura, configuração ou roteiro reproduzível como evidência de Computação em Nuvem.

Portanto, demonstração local funcional atende ao núcleo executável da Sprint 2; não é correto afirmar que ela comprova hospedagem remota ou garante aprovação sem ressalvas. Decisão final de avaliação pertence aos docentes.

## Material de entrega

- [Checklist dos nove entregáveis, com referências](checklist-sprint-2.md).
- [ERS final em PDF no template](ERS-template-original-atualizada.pdf) e [Word completo editável](ERS-completa-v2.5-editavel.docx). `ERS-v2.md`, `ERS-v2.docx` e `ERS-v2.pdf` são fontes/sínteses auxiliares; não substituir o documento completo pelo resumo.
- [Diagramas](diagramas.md), [backlog](backlog.md), [matriz de UCs](rastreabilidade.md), [decisões](decisoes.md) e [API](api.md).
- [Relatório de testes e limites das evidências](relatorio-testes.md).
- [Manual de execução](manual.md), [README](../../README.md) e [APK local](manual-apk-local.md).
- [Estado da implantação na Vercel](vercel.md), incluindo o que ainda não funciona.

A base acadêmica integrada está na `main`; a configuração da nuvem está em `preparacao-vercel`. Não promover a versão remota com falha de inicialização apenas para obter uma URL de API.

## Roteiro de demonstração

1. Iniciar os serviços Docker locais e conferir PostgreSQL, SMTP de desenvolvimento e S3 saudáveis.
2. Aplicar as migrações e iniciar API e interface conforme o manual, preservando volumes e chave de dados.
3. Demonstrar o fluxo: cadastro/perfil, submissão e conferência manual de CREF, descoberta de treinador, solicitação e aceite de vínculo, criação de treino e execução/feedback.
4. Mostrar persistência, validações, permissões e evidências de testes. Identificar dados fictícios, modo financeiro acadêmico e serviços locais.
5. Apresentar a nuvem como implantação parcial: interface publicada, Neon conectado, API preparada em Preview e serviços/segredos remotos ainda pendentes. Não usar a página pública isolada como evidência do fluxo integrado.
6. Cada integrante revisar os materiais, registrar sua participação real e concluir a própria entrega no ambiente acadêmico.

## Texto breve para registrar a limitação

O fluxo principal está implementado e possui evidências de testes no ambiente local integrado, com interface, API, PostgreSQL, armazenamento privado e SMTP de desenvolvimento. A implantação remota está em andamento: a interface foi publicada e o Neon conectado, mas a API pública e os serviços complementares ainda não estão homologados. A conclusão e os testes da implantação permanecem no plano de continuidade da Sprint 3.

## Conferência de hoje

O build web e a verificação TypeScript passaram em 26/10/2026. O Docker foi recuperado preservando os diretórios de sockets transitórios `Docker/run` e `docker-secrets-engine`, sem reset de volumes, bancos ou chaves. PostgreSQL, Mailpit e SeaweedFS ficaram saudáveis; migrações foram aplicadas e o seed preservou contas existentes.

- [95/95 testes Vitest de unidade/API](evidencias/verificacao-2026-10-26-vitest.json), sem falhas.
- [15/15 testes de navegador](evidencias/verificacao-2026-10-26/playwright-results.json), em Chromium, Firefox e WebKit, sem retries. Incluem fluxo principal, mensagens, mídia privada, recuperação de senha por SMTP local, responsividade e axe.
- [Estado real do ambiente local](evidencias/ambiente-2026-10-26.json): API saudável e interface HTTP 200.
- [CI completa do código corrigido](https://github.com/DaviSouza78/LinkAtletas/actions/runs/40070556602), concluída com sucesso; não substitui homologação da aplicação hospedada.

O servidor de demonstração foi iniciado em `http://localhost:5173`, com API em `http://localhost:3001/api/health`. Os resultados acima são locais, não comprovam a nuvem. A ERS completa permanece na versão 2.5; esta conferência não modifica o template nem os resultados históricos citados nela.

Avanço posterior no mesmo dia: o armazenamento Tigris foi configurado na Vercel para Production e Preview, com buckets privados e chaves independentes. Os [testes de produção](evidencias/tigris-2026-10-26.json) e [de Preview](evidencias/tigris-preview-2026-10-26.json) comprovaram escrita, leitura, exclusão do arquivo de teste e isolamento entre os ambientes. A implantação completa da aplicação continua pendente; consultar o [estado atualizado da nuvem](vercel.md).
