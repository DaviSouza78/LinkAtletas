# Escopo atual e homologações da Sprint 2

Revisão de 23/10/2026. As mudanças da ERS são decisões da equipe, consolidadas nesta versão. Este registro distingue escopo atual, evidências de implementação e evoluções; não representa nova execução de testes.

## Decisões de escopo

| Assunto | Escopo atual | Estado e continuidade |
|---|---|---|
| CREF | Conferência humana na fonte oficial, com decisão administrativa motivada, validade e auditoria | Fluxo manual implementado. RF-04 atualizado; automação é evolução futura condicionada a fonte oficial viável |
| Nuvem | Implantação remota da aplicação e dos serviços necessários ao fluxo | Pendente de implantação e testes remotos. Docker/S3/TLS locais e CI hospedada não comprovam o produto implantado |
| IA | Match determinístico por modalidade, objetivos, nível, orçamento e disponibilidade | Implementado e testado por regras explicáveis. Modelo treinado permanece evolução futura |
| Android/iOS | Cliente Expo e APK Android integrado em emulador | Android com 18 etapas aprovadas; aparelho físico, IPA/iPhone e lojas sem homologação. Bundle não comprova execução em iOS |
| Banco de dados | PostgreSQL único | Migrações, persistência e recuperação verificadas. A menção inicial a dois SGBDs foi substituída por decisão de arquitetura |
| Demais evoluções | Rascunho salvo por ação explícita, agenda própria e disponibilidade usada no match | Autosave contínuo, sincronização Google bidirecional e outras evoluções estão no backlog; não são apresentados como concluídos |

A [ERS](ERS-v2.md), o [backlog](backlog.md) e as [decisões](decisoes.md) documentam o recorte. Os [materiais originais](revisao-materiais.md) são preservados como histórico e referência da evolução.

## Eletiva I

A contribuição da **Eletiva I** está relacionada na [matriz](rastreabilidade.md), com atividades e evidências de integração das UCs, planejamento por Sprints, requisitos, implementação, testes e comunicação de resultados.

## Verificação e entrega

Os nove entregáveis gerais possuem artefatos e evidências no [checklist](checklist-sprint-2.md). O [roteiro, seção 9, página 9](../referencias/Roteiro-professores-original.pdf#page=9) estabelece fluxo principal integrado e demonstração real. O fluxo manual de CREF é o requisito vigente; os testes comprovam persistência e auditoria, sem alegar consulta automática.

O financeiro avançado foi planejado na [ERS original, página 40](../referencias/ERS-Sprint-1-original.pdf#page=40) para a Sprint 3. Se mantido no MVP, a homologação em sandbox deverá comprovar a integração com o provedor; testes HTTP controlados não equivalem a pagamento/repasse externo. Google, aparelhos e lojas seguem os estados específicos do [checklist de serviços](servicos-externos-sprint-2.md).

Permanecem a implantação em nuvem, a revisão coletiva e as entregas individuais. Credenciais externas, infraestrutura remota e dispositivos não são substituídos por testes simulados; ver [pendências do grupo](pendencias-lucca.md).
