# Conferência de escopo e homologações da Sprint 2

Conferência de 22/10/2026. Este registro esclarece os documentos recebidos; não representa aprovação docente nem novo resultado de testes de execução.

## Implementação e compromissos originais

Os nove entregáveis gerais possuem artefatos e evidências no [checklist](checklist-sprint-2.md). Isso não significa que todos os compromissos da proposta e da ERS original estejam concluídos. A ERS atual registra mudanças; atualizar o documento não obtém automaticamente o aceite dessas mudanças.

| Assunto | Por que alinhar com o professor | Pergunta objetiva |
|---|---|---|
| CREF | A [ERS original, cronograma, página 39](../referencias/ERS-Sprint-1-original.pdf#page=39) prevê API externa e aprovação automática na Sprint 2. A [proposta, página 4](../referencias/Proposta-inicial-original.pdf#page=4) e o fluxo alternativo da própria ERS admitem conferência manual quando a API não estiver disponível. O sistema implementa conferência administrativa auditada; não consulta o conselho oficialmente. | A contingência manual demonstrada atende à Sprint 2, mantendo a integração oficial dependente de acesso autorizado? |
| Nuvem | O [roteiro, seção 9, página 9](../referencias/Roteiro-professores-original.pdf#page=9) pede integração com serviço em nuvem quando prevista, e a proposta prevê hospedagem/armazenamento. Docker/S3/TLS locais não comprovam essa integração remota. A matriz curricular aceita diferentes tipos de evidência, mas isso não revoga a seção 9. | Qual integração remota e evidência devem funcionar nesta Sprint? O recorte local atual é aceito ou é necessário implantar um serviço remoto? |
| IA | A proposta classifica recomendação mais sofisticada como obrigatória para o projeto. O match atual pontua atributos por regras explicáveis; não é modelo treinado. A proposta não estabelece, nesse item, uma data específica para a IA avançada. | O algoritmo inicial atende à Sprint 2? Qual será o critério de aceite da IA na Sprint 3 ou da sua retirada formal do escopo? |
| Android/iOS | A proposta contempla ambos, e a ERS prevê interface mobile e web na Sprint 2. Android foi testado com APK integrado em emulador. Bundle iOS não comprova execução em iPhone. A publicação em lojas não aparece como exigência específica nos nove itens da Sprint 2. | O Android demonstrado atende ao recorte mobile desta Sprint? Quando serão exigidos iOS, aparelho físico e distribuição? |
| Banco de dados | Os documentos iniciais citam MySQL e PostgreSQL. A solução usa somente PostgreSQL, com persistência, migrações e recuperação verificadas. O requisito geral exige banco integrado; não exige dois SGBDs. | A simplificação para PostgreSQL único pode ser mantida como decisão de arquitetura documentada? |
| Demais reduções funcionais | Autosave contínuo, sincronização Google bidirecional e regras mais amplas de disponibilidade não estão concluídos. Não devem ser presumidos pelo funcionamento de rascunho manual, agenda própria ou match por disponibilidade. | Quais dessas funções permanecem obrigatórias para o MVP final e quais podem ser retiradas ou tratadas como evolução? |

## Eletiva I: identificação resolvida em 23/10/2026

O [roteiro, seção 4.1, página 5](../referencias/Roteiro-professores-original.pdf#page=5) traz apenas o rótulo **Eletiva I**, aplicação dos conhecimentos da eletiva ofertada e artefato aprovado pelo docente responsável. Não informa a denominação específica da disciplina nem enumera suas competências. Os demais materiais originais consultados também não fornecem essa identificação. A ERS descreve requisitos do software e não substitui o plano de ensino da disciplina.

Em 23/10/2026, Lucca informou ter verificado que a Eletiva I corresponde a **Projeto Integrador Interdisciplinar**. A [matriz](rastreabilidade.md) foi completada com essa identificação e com atividades/evidências do roteiro: integração das UCs, planejamento por Sprints, requisitos, implementação, testes e comunicação de resultados. Não permanece pendência de identificação da disciplina. Essa descrição registra a aplicação no projeto; não é transcrição de competências oficiais de uma ementa não recebida nem aprovação docente.

## O que testar agora e o que não está comprovado

- **Exigido agora:** fluxo integrado, banco, interface responsiva, validações e testes iniciais com evidências. Já existem os testes de API/unidade, navegador, aplicativo e APK integrado detalhados no [relatório](relatorio-testes.md). Não houve alteração de código nesta conferência; não se apresenta a evidência anterior como nova execução em 22/10.
- **Compromisso explícito da Sprint 2 que precisa de resolução:** CREF automático, mediante acesso oficial ou aceite da contingência prevista. Repetir testes locais não comprova consulta oficial.
- **Nuvem prevista:** confirmar a integração remota exigida pela seção 9. Não dar este item por atendido somente por containers locais ou CI hospedada. Implantação e teste remoto precisam de infraestrutura/configuração disponíveis, ou de aceite docente do recorte.
- **Financeiro avançado:** a [ERS original, página 40](../referencias/ERS-Sprint-1-original.pdf#page=40) o planeja para a Sprint 3. Homologação Asaas não é obrigação nominal dos nove itens da Sprint 2; se o financeiro for mantido no MVP final, o adaptador testado com respostas controladas não substitui homologação com o provedor. Não é necessário cobrar dinheiro real para homologar em sandbox.
- **Google, lojas e hardware:** não foram encontrados como homologações específicas obrigatórias nesta Sprint. Não declarar dispensa definitiva da Sprint 3: a necessidade depende dos requisitos mantidos no MVP. Execução em aparelho físico e iOS continua sem evidência; publicação em loja depende de contas e assinatura de distribuição.

Credenciais externas, infraestrutura remota e dispositivos não são substituídos por testes simulados. O [checklist de serviços](servicos-externos-sprint-2.md) especifica acessos e procedimentos; as [pendências do grupo](pendencias-lucca.md) continuam abertas até haver evidência ou decisão docente registrada.
