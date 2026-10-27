# Auditoria da ERS — Sprint 2

Registro histórico da revisão anterior à aplicação. As correções foram posteriormente autorizadas e estão documentadas em [correções aplicadas à versão 2.4](revisao-ers-aplicada-2026-10-24.md); as páginas e os estados abaixo se referem ao PDF de 61 páginas auditado, preservado no histórico Git.

Data: 24/10/2026. Responsável: Lucca Castilho Costa. Base do repositório: `ca0f7498348e342bdf0138d24c81b612f38791d4`. Situação: revisão concluída; correções propostas, não aplicadas nesta etapa.

## Parecer

A [cópia no template original](../ERS-template-original-atualizada.pdf) ainda precisa de revisão de conteúdo antes de ser adotada como ERS final da Sprint 2. A preservação gráfica foi verificada anteriormente, mas não comprova coerência semântica. O documento mistura partes da especificação inicial, alterações pontuais e uma segunda especificação nos apêndices, permitindo interpretações conflitantes.

Esta auditoria recomenda corrigir o documento existente, sem desenvolver funcionalidades novas para cumprir promessas antigas que a equipe já retirou ou adiou. As decisões de escopo são da equipe. Não se cria pendência de aceite docente.

## 1. Por que passou de 47 para 61 páginas

- Páginas 1–47: cópia da ERS original com 49 campos atualizados e histórico ampliado.
- Páginas 48–61: 14 páginas de continuação dos Apêndices, produzidas a partir da [ERS v2.3](../ERS-v2.md): requisitos, requisitos adicionais, fluxos, RNFs, regras, estados e evidências.
- O acréscimo veio dessa consolidação duplicada. Não decorre de exigência de 61 páginas pelo professor, nem significa que foram implementadas 14 páginas de funcionalidades novas.

**Decisão recomendada:** retirar as 14 páginas de duplicação depois de integrar os conteúdos necessários nas seções 1–6. Não basta cortar o PDF na página 47: atualmente os apêndices contêm informações indispensáveis que ainda não foram incorporadas ao corpo, como requisitos adicionais, critérios de RNF e limites efetivos.

Manter apenas o primeiro título **7. Apêndices**, em preto, como solicitado, respeitando o template. Se não restar material complementar necessário, não desenvolver apêndices nesta entrega. Eliminar a repetição de “7. Apêndices - continuação”. O número final de páginas dependerá da integração; não fixar artificialmente 47 nem reduzir fonte para forçar esse total.

## 2. O que a Sprint 2 exige sobre testes e apêndices

O [roteiro, seção 9.6, página 9](../../referencias/Roteiro-professores-original.pdf#page=9) exige testes iniciais com evidências e ERS, diagramas e backlog atualizados. Não lista uma seção de apêndices nem uma segunda especificação integral como entregável.

**Seção 6 — Casos de Testes: deve ser desenvolvida agora.** É a seção já disponível no template para apresentar os testes iniciais e a rastreabilidade às evidências. O relatório completo pode continuar separado, referenciado por links. Não é necessário executar testes financeiros externos, publicar em lojas ou concluir toda a bateria final da Sprint 3 para preencher esta seção com os testes que já existem.

**Seção 7 — Apêndices: conteúdo complementar é opcional nesta Sprint.** A seção não deve concentrar requisitos atuais ausentes do corpo. Manter o título original uma única vez, em preto, sem as 14 páginas repetidas, após realocar o conteúdo pertinente.

## 3. Método, fontes e limites

Foram conferidos o texto das 61 páginas, a estrutura e as figuras da cópia; a ERS original de 47 páginas; a fonte Markdown v2.3; o roteiro; o backlog; os modelos atuais; o relatório e registros de testes. A inspeção visual utiliza as renderizações da versão auditada. Foram lidos trechos de implementação para conferir divergências específicas em verificação, matching, mídias, avaliações, pagamentos, jobs e cliente móvel.

Fontes principais:

- [ERS no template, objeto principal da auditoria](../ERS-template-original-atualizada.pdf).
- [ERS original preservada](../../referencias/ERS-Sprint-1-original.pdf).
- [ERS editável atual](../ERS-v2.md), [backlog](../backlog.md), [matriz](../rastreabilidade.md), [modelos](../diagramas.md), [relatório](../relatorio-testes.md).
- [Verificação profissional](../../../server/modules/verification.ts), [matching](../../../server/modules/matching.ts), [interações](../../../server/modules/interactions.ts), [mídias](../../../server/modules/media.ts), [Asaas](../../../server/services/asaas.ts), [jobs](../../../server/jobs.ts).
- [App de treino](../../../mobile/src/screens/WorkoutsScreen.tsx), [transporte móvel](../../../mobile/src/api.ts), [contratos](../../../shared/contracts.ts).
- [Ensaio APK](../evidencias/android-integrated-result.json), [carga](../evidencias/carga-matchmaking.json), [banco](../evidencias/database-schema.json), [verificação gráfica anterior](../evidencias/ers-template-verificacao.json).

Não houve nova execução da aplicação, homologação externa, teste em aparelho ou pesquisa dos preços comerciais nesta auditoria. Resultados históricos não foram tratados como testes executados em 24/10. Leitura direcionada de código não equivale a auditoria exaustiva de segurança do software. Não se emite certificação jurídica, PCI ou de acessibilidade.

Páginas citadas abaixo são as posições físicas no PDF de 61 páginas, começando pela capa; o sumário atual não é uma referência confiável de paginação.

## 4. Registro de correções estruturais e de apresentação

Prioridade **A**: corrigir para evitar contradição ou declaração indevida na entrega. **B**: completar clareza, rastreabilidade e apresentação. Todos os itens estão pendentes de aplicação.

| ID | Prioridade | Local | Achado e correção proposta |
|---|---|---|---|
| E01 | A | Corpo × pp. 48–61 | Há duas descrições de requisitos sem regra única de precedência. Incorporar o comportamento vigente no corpo e eliminar a repetição dos apêndices. Não apagar conteúdo novo antes dessa integração. |
| E02 | A | p. 47, seção 6 | Só existem CT001 e CT002 como títulos. Faltam pré-condições, passos, entradas, esperado, resultado observado e evidência. Preencher os casos iniciais relevantes e referenciar o relatório existente. |
| E03 | B | p. 47 e pp. 48–61 | Títulos 6 e 7 verdes e cabeçalho 7 repetido. Deixar 6 e 7 em preto; manter somente o título 7 original. Não alterar fontes, tamanhos e estilos restantes. |
| E04 | A | p. 4 | Sumário omite a seção 2 e suas subdivisões, repete referência isolada “1”, aponta cronograma para p. 34 em vez de 38 e testes/apêndices para 41/42 em vez de 47. Atualizar a lista completa e as páginas após fechar a edição. Não confundir número impresso com posição física. |
| E05 | B | pp. 43–47 | Seção 5 tem dois títulos “5.1”; as sequências se chamam RF01/RF02, IDs que na ERS significam cadastro de atleta/treinador. Renumerar subseções preservando a seção principal e usar nomes/IDs corretos para os processos. |
| E06 | A | pp. 44–47 | As imagens UML/DER preservadas são históricas, não os modelos atuais do repositório. Trocar pelas figuras atuais e conferir legibilidade, atores, cardinalidades, CREF manual e contratação antes do checkout. Não basta citar modelos atualizados no apêndice. |
| E07 | B | pp. 1–3 | Preservar identificação, autores e histórico real. O nome do sexto integrante está separado na p. 2; a matriz usa forma mais completa para esse nome. Conferir a grafia com o cadastro da equipe antes de qualquer correção, sem inventar nomes. Não atribuir a autoria original exclusivamente a Lucca. |
| E08 | B | pp. 7–8, 16, 19, 37–39 | Alterações por posições fixas deixaram recuos/espaços artificiais, junções e frases mal conectadas. Exemplos: “arquivos de mídia pesados de mídia” (p. 8), “Profissional:A decisão” (p. 37) e “contendo a requisitos” (p. 38). Rever a frase inteira, mantendo o estilo original, em vez de substituir só fragmentos. |
| E09 | B | PDF e fonte | Conferir pesquisa, cópia/colagem, links e leitura na ordem correta após a edição direta do PDF. Há hífens/separadores diferentes na extração de trechos inseridos. Mesma família de fonte não comprova equivalência de codificação ou editabilidade em Word. |
| E10 | B | Histórico e arquivos | Registrar a próxima revisão com data efetiva, versão, descrição e autor; manter todas as revisões anteriores. Não reescrever datas passadas como se os novos resultados tivessem ocorrido nelas. Sincronizar PDF, fonte e documento editável quando as correções forem autorizadas. |

## 5. Escopo, viabilidade e cronograma

| ID | Prioridade | Local | Achado e correção proposta |
|---|---|---|---|
| G01 | A | pp. 5–8 | A descrição geral apresenta gateway e alta disponibilidade em nuvem como parte da operação, enquanto a versão executada usa modo acadêmico e serviços locais. Distinguir objetivo do produto, implementação atual e implantação pendente. Incluir também web para atleta e administrador, existentes na solução. |
| G02 | A | pp. 10–13 | Planos Starter/Pro/Business/Enterprise, cotas de 3/20 alunos e comissões por plano não estão demonstrados como funcionalidades implementadas. Classificar a tabela como proposta comercial futura, sem vincular o aceite da Sprint 2 a essa monetização. A comissão administrativa atual não equivale a esses quatro planos. |
| G03 | B | pp. 8–13 | Os totais estimados conferem: R$ 7.018,00 iniciais; R$ 1.025,00 mensais; 408 h × R$ 16,00 = R$ 6.528,00. Preservar como estimativas acadêmicas, não gastos ou contratos reais; explicitar premissas e evitar sugerir preços atuais verificados ou custos já pagos. |
| G04 | A | pp. 38–40 | Ainda há RF-25–32 sem especificação na programação da Sprint 3, embora a versão atual use RF-A01–A08. Substituir as referências por IDs efetivamente definidos. Não inventar requisitos para preencher essa faixa. |
| G05 | B | pp. 38–41 | O texto atualizou início da Sprint 2 para 21/09, mas manteve Sprint 3 em 26/10; o roteiro registra 09/11–30/11. Harmonizar calendário oficial e planejamento interno, identificando diferenças justificadas. A imagem do cronograma antigo também precisa acompanhar a revisão. |
| G06 | B | pp. 14, 39 e 41 | Há protótipo associado a Figma no cronograma, links do Stitch na seção 4 e item “Prototipagem de Baixa Fidelidade:” sem complemento. Identificar as ferramentas/atividades reais; não apresentar tarefas apenas previstas como realizadas. |
| G07 | B | pp. 41–43 | Protótipos são referências de concepção e não evidências da interface integrada. Identificar figuras históricas e acrescentar/referenciar telas reais necessárias à Sprint 2; a interface administrativa não está claramente coberta pelas três figuras atuais. “Professor” no link deve ser distinguido do papel “Treinador”. |
| G08 | A | pp. 48–61 | Prioridades P0/P1/P2 misturam importância, dependência e futuro; RF06 está P0 na ERS e F10 P2 no backlog. Separar prioridade do requisito de estado e etapa de entrega. Um requisito não está implementado só porque tem código parcial ou prioridade baixa. |

## 6. Requisitos funcionais — cobertura e divergências

| Requisito / página | Situação auditada | Correção necessária para a ERS da Sprint 2 |
|---|---|---|
| RF01, pp. 14–15 | O perfil exige atleta autenticado, mas o título também diz cadastro. O alternativo cita fila de recomendação. | Separar criação de conta da manutenção do perfil; não afirmar fila/cálculo em segundo plano quando a busca recalcula a nota. Incorporar consentimentos e validações reais. |
| RF02, p. 15 | Título corrigido para treinador; descrição ainda sugere especializações/metodologia e planos como campos distintos. | Mapear nome, bio, modalidade, nível, objetivo, preço, cidade, atendimento e disponibilidade aos campos reais. Não prometer campos/planos sem representação correspondente. |
| RF03–04, pp. 15–17 | Procedimento manual e ator administrador estão corretos. “CREF ou certificação equivalente” e “validar extensão dos dados” são ambíguos; documento aparece como necessário na descrição do RF03, mas é opcional no código. | Uniformizar CREF, evidência obrigatória e documento opcional; distinguir formato de número de regularidade profissional. Registrar perfil completo como pré-condição; aprovação vigente e análise indisponível sem aprovação por suposição. |
| RF04, p. 16 e UC02 | A ERS diz que o administrador registra evidência da consulta; a decisão da API aceita status, motivo e validade, enquanto `evidence` da submissão vem do treinador. | Especificar o procedimento humano e o conteúdo esperado no motivo (fonte, data e resultado), sem afirmar que há campo técnico obrigatório separado ou consulta automática. Se a equipe exigir campo novo, registrar como evolução, não desenvolver nesta auditoria. |
| RF04, RF-A05 | Validade não é quantificada no corpo; o servidor usa 365 dias quando uma aprovação não informa prazo. | Documentar padrão configurado no código e prazo explícito opcional; esclarecer suspensão, rejeição e expiração, sem equiparar validade administrativa à validade de uma cédula oficial. |
| RF05, p. 17 | Entrada descrita como redirecionamento exclusivamente mobile para atleta e sessão genérica. | Incluir login web para atleta, cookie HttpOnly web, Bearer no app, logout e recuperação. Administrador não pode ser escolhido no cadastro público. |
| RF06, pp. 17–18 | Alternativo promete reduzir nota por incompatibilidade geográfica; o código retorna nenhum match quando presencial exige cidade incompatível. | Descrever filtro obrigatório de atendimento/cidade e pontuação 30/20/25/25, ordenação e desempate. Não chamar o motor de modelo treinado. |
| RF07, p. 18 | Há filtro por nota média na ERS; o schema de `/coaches` aceita modalidade, texto, preço máximo e atendimento, sem filtro de rating. | Retirar rating dos filtros atuais ou mantê-lo apenas como evolução. Não confundir nota de avaliação com score de compatibilidade. |
| RF08, pp. 18–19 | Portfólio mistura campos conceituais e conteúdo privado. | Descrever dados efetivamente públicos; documentos profissionais e mídias privadas não são portfólio público. Tratar perfil removido/inelegível pela resposta real, sem garantir navegação automática específica não comprovada. |
| RF09–10, p. 19 | Sequência textual agora aceita vínculo antes de checkout; modo acadêmico aparece apenas no detalhe. | Tornar a distinção de modos uniforme no escopo e no fluxo; incluir duplicidade, decisão por destinatário e ciclos históricos. Harmonizar com a figura de sequência, que continua antiga. |
| RF11–13, pp. 20–21 | O corpo ainda promete liquidação, retenção de saldo e retentativas como se a plataforma controlasse o banco/gateway. | Documentar adaptador, webhook, vigência, carência e conciliação reais; resultado incerto não pode ser repetido cegamente. Split solicitado/estimado não comprova repasse. Classificar sandbox como não homologado e financeiro avançado como continuidade da Sprint 3. |
| RF14, pp. 21–22 | Prescrição e rascunho explícito são coerentes, mas faltam precondições detalhadas. | Explicitar vínculo, aprovação profissional e regra de acesso financeiro quando aplicável; impedir novos treinos após encerramento sem prometer apagar histórico. |
| RF15–16, p. 22 | A ERS descreve biblioteca de exercícios e upload de vídeo por exercício; a versão atual usa referência HTTPS por bloco e mídia privada de orientação ligada à ficha. | Definir granularidade e acesso reais, sem inventar biblioteca pública ou infraestrutura remota já ativa. Distinguir publicado de rascunho e consulta histórica. |
| RF17, p. 23 | Fluxo principal coerente; faltam limites de esforço, catálogo, exclusividade e edição. | Esforço 1–10, métricas permitidas por modalidade e uma execução por ficha com atualização autorizada. Corrigir “o atleta concluí”. |
| RF18, pp. 23–24 | Promete câmera integrada, pausa e retentativa automática de upload. O app usa seletor de documentos e transporte de arquivo; isso não comprova câmera própria ou upload retomável. | Descrever seleção/upload efetivos, consentimento, tamanho, falha e reenvio pelo usuário. Incluir correção técnica e revogação. Não confundir reconexão do chat com retomada de upload. |
| RF19, p. 24 | Promete notificação push/web de dispositivo. A implementação conferida persiste notificações internas e publica eventos WS. | Usar notificação interna; não afirmar push do sistema operacional. Especificar leitura, paginação, reconexão e autorização de anexos. |
| RF20–21, pp. 24–25 | RF20 admite avaliação após encerrar contratação; o fluxo atual exige vínculo ativo. RN13/apêndice dizem sete dias ativos. | Uniformizar sete dias por padrão, vínculo elegível ativo e uma avaliação por ciclo, edição/resposta e moderação. Trocar “tréplica” por resposta e retirar pontuação duplicada. |
| RF22–23, pp. 25–26 | RF22 só trata atleta/assinatura paga; RF23 diz cancelar treinos futuros ao encerrar. | Contemplar participante autorizado e modo acadêmico sem cobrança; preservar histórico e distinguir impedimento de novas ações de cancelamento/deleção de fichas existentes. Não declarar cancelamento externo concluído em timeout. |
| RF24, pp. 26–27 | Fluxo foi atualizado para checkout, mas alternativo ainda supõe observação direta da rejeição de cartão pela aplicação. | Distinguir respostas/eventos acessíveis ao servidor do comportamento do checkout; listar falta de configuração e confirmação pendente sem falso sucesso. |
| RF-A01–A08, pp. 51–52 | Existem apenas na consolidação adicional e no Markdown. | Integrar à seção 2.1 com IDs preservados: reset, notificações, agenda, privacidade, validade profissional, app, operação e moderação. Não reclassificar como oito funcionalidades novas obrigatórias só por migrarem de seção. |

### Parâmetros concretos que devem aparecer ou ser referenciados

- Evidência CREF obrigatória; documento opcional. Motivo obrigatório na decisão; validade futura opcional com padrão atual de 365 dias.
- Uploads: 50 MiB para vídeo e 10 MiB para os demais tipos no módulo consultado; comprovação profissional não aceita vídeo. Especificar também o efeito dos limites globais da requisição ao consolidar o texto.
- Tipos reconhecidos: PNG, JPEG, WebP, PDF, MP4 e WebM; não significa que toda finalidade aceita todos eles.
- Avaliações: 1–5, período mínimo padrão de sete dias, configuração reduzida explicitamente só em teste isolado.
- Não inventar tamanho de senha, timeout, prazo de retenção, paginação ou tipo de arquivo aceito: extrair dos schemas/contratos vigentes quando preencher cada campo.

## 7. Requisitos não funcionais — todos os 16 conferidos

| RNF / páginas | Achado e ação proposta |
|---|---|
| RNF01, p. 27 | Consentimento de saúde aparece obrigatório no cadastro. A versão atual separa consentimentos e dados opcionais. Especificar finalidades/revogação/exportação/encerramento e não apresentar uma certificação LGPD a partir de testes técnicos. |
| RNF02, p. 28 | Recusa absoluta de HTTP contradiz perfil demonstrativo em loopback/ADB. Distinguir HTTPS de produção, TLS local ensaiado e exceção local restrita; registrar AES-256-GCM e chave fora do Git sem afirmar cifra de todos os campos públicos. |
| RNF03, pp. 28–29 | Auditoria manual está adequada no essencial. Especificar campos e atomicidade reais; não atribuir imutabilidade contra administrador direto do banco. Evidência de teste não é consulta real de conselho. |
| RNF04, p. 29 | “Remove imediatamente durante a navegação” não equivale a filtro na próxima consulta. Descrever bloqueio no servidor e atualização da lista; não prometer atualização instantânea de toda tela já aberta. |
| RNF05, pp. 29–30 | Ainda promete token de cartão com bandeira/últimos dígitos e filtros que impedem qualquer PAN/CVV. Ajustar ao checkout hospedado e às referências efetivamente armazenadas. Sanitização não é certificação PCI nem garantia universal contra qualquer texto indevido. |
| RNF06, pp. 30–31 | Cache de recomendações não existe no caminho conferido; a evidência de carga declara ausência de cache. Definir a meta mensurável de p95 e ambiente, sem generalizar os 200 pedidos/500 perfis sintéticos a produção. |
| RNF07, p. 31 | Inclusão administrativa de modalidade sem mudar código conflita com catálogo fixado em contratos. Separar métricas extensíveis para esportes atuais de novos esportes/CRUD administrativo futuro. |
| RNF08, pp. 31–32 | Autoescala em 70%, balanceador e fila prioritária não estão comprovados. Marcar como evolução fora do aceite atual, mantendo a necessidade de hospedagem real separada. Hospedar não significa implementar autoescala. |
| RNF09, p. 32 | Garantia de Material/HIG, alto contraste e fontes ampliadas não é demonstrada por viewport/axe. Especificar testes atuais e verificações de dispositivo ainda não executadas, sem remover critérios que a equipe mantiver para a evolução. |
| RNF10, p. 33 | Rascunho manual corrigido. Acrescentar critério observável de tarefa/conclusão, erro e reabertura; evitar “menor número de cliques possível” sem medida. |
| RNF11, pp. 33–34 | Definir espera, erro, sucesso e prevenção de envio duplicado; não exigir porcentagem real se existe somente indicador de carregamento. |
| RNF12, p. 34 | Instalação via lojas e adaptação automática universal Android/iOS não descrevem a entrega real. Informar APK local/emulador API 35; iPhone, IPA, aparelhos físicos e lojas não homologados. Definir versões-alvo concretas quando forem testadas. |
| RNF13, pp. 34–35 | Detecção de engine e tela de aviso de navegador legado não estão demonstradas pelo E2E. Distinguir três motores de Chrome/Edge/Safari reais e registrar dimensões/limites de acessibilidade sem afirmar cobertura universal. |
| RNF14, p. 35 | OpenAPI e REST existentes são positivos. Wearables permanecem possibilidade de integração, não recurso homologado. Incluir autenticação, autorização, erros e schemas reais, não apenas resposta 400. |
| RNF15, p. 36 | A chamada consultada não demonstra envio de chave de idempotência ao gateway. Não garantir que o provedor retorna sempre o original. Documentar unicidade/locks locais, webhook idempotente e conciliação de resultado incerto; horário noturno depende de agendamento, não só da existência de `jobs.ts`. |
| RNF16, pp. 36–37 | Manter sanitização e critérios de marcadores sensíveis; retirar absolutos sobre todo log conter exclusivamente ID anônimo. Vincular aos cenários efetivamente executados e ao limite de revisão local. |

## 8. Regras de negócio — todos os 16 conferidos

| Regras | Resultado e correção proposta |
|---|---|
| RN01–03 | Aprovação manual, auditoria, suspensão e validade fazem sentido. Corrigir a junção gráfica da RN02 e uniformizar os campos/prazos com RF03–04. |
| RN04–07 | Condicionar financeiro ao modo Asaas, definir comissão/carência reais e substituir garantias de repasse/repetição automática por estados/eventos/idempotência locais. |
| RN08–10 | RN09 foi corrigida para pontuação. RN10 ainda sugere retroalimentação do algoritmo; distinguir registro de interações de aprendizado automático futuro. Uniformizar filtros e pesos com RF06–07. |
| RN11–12 | Incluir acesso profissional/financeiro aplicável, catálogo de métricas e uma execução por ficha; histórico não pode ser apagado por inferência de encerramento. |
| RN13 | Sete dias por padrão é coerente com o servidor; harmonizar com RF20, que ainda aceita contratação encerrada. |
| RN14–16 | Consentimentos separados, proteção em repouso/transporte e checkout hospedado devem seguir as restrições reais; não confundir política de privacidade com conformidade certificada ou chave de cifra com hash de senha. |

## 9. Seção 5 — diagramas: correções obrigatórias de coerência

As figuras das pp. 44–47 foram preservadas por fidelidade visual, mas não representam integralmente a revisão atual. O DER inserido é pequeno e anterior ao modelo de 36 tabelas/45 FKs; o desenho de sequência da contratação ainda apresenta pré-autorização/etapas anteriores ao fluxo atual. O texto atualizado no corpo não corrige essas imagens.

Usar os modelos atuais já existentes, sem criar diagramas adicionais apenas para aumentar a entrega:

1. [Casos de uso](../diagramas/casos-de-uso.puml): remover automação do conselho como interação obrigatória; manter administrador responsável pela decisão manual.
2. [Classes](../diagramas/classes.mmd): compatibilizar atores, verificação/documento opcional, contratos/ciclos e principais entidades. Modelo conceitual não deve ser apresentado como classes ORM implementadas.
3. [DER](../diagramas/der.mmd): distinguir 35 tabelas de domínio e `schema_migrations`, 45 FKs e relações polimórficas sem FK. Dimensionar para leitura, sem comprimir tudo numa figura ilegível.
4. [Sequência de contratação](../diagramas/sequencia-contratacao.mmd): solicitação, aceite, modo acadêmico ou checkout posterior, webhook e resultado incerto.
5. [Sequência de treino](../diagramas/sequencia-treino.mmd): papel, vínculo, publicação, execução, consentimento e mídia privada conforme fluxo implementado.

Preservar fontes e estilos do texto do template. Atualização de conteúdo de figura não é justificativa para redesenhar capa, margens e tipografia do documento. A numeração e as legendas precisam corresponder ao sumário e aos RFs efetivos.

## 10. Seção 6 — conteúdo mínimo proposto para esta Sprint

Manter CT001/CT002 e detalhar, sem renumerar evidências históricas de forma enganosa. Acrescentar casos correspondentes ao fluxo principal e a falhas relevantes já testadas:

- Cadastro de atleta/treinador e login inválido.
- Submissão de CREF e decisão manual; pendente/rejeitado não aparece na descoberta.
- Busca/matching, solicitação, aceite e bloqueio de terceiro.
- Prescrição/publicação, consulta do atleta e execução/feedback.
- Entrada inválida e erro de serviço tratado sem falso sucesso.
- Quando mostrado na demonstração ampliada: recuperação SMTP, upload privado/consentimento, chat, notificações e avaliações.

Cada caso deve informar: ID, RF/RNF/RN relacionado, objetivo, papel e pré-condições, entrada, passos, esperado, observado, estado, data/ambiente e link da evidência existente. “Previsto” e “não executado” são estados válidos e distintos de aprovado.

Referenciar, sem copiar indiscriminadamente todos os logs para a ERS:

- [82 testes de API/unidade](../evidencias/vitest-results.json).
- [15 E2E](../evidencias/playwright-results.json).
- [Testes móveis e limites](../evidencias/mobile-verificacao.md).
- [18 etapas de APK](../evidencias/android-integrated-result.json): emulador, serviços locais reais, período de avaliação reduzido somente em fixture, sem aparelho físico ou financeiro externo.
- [Relatório completo](../relatorio-testes.md), [limites de carga](../evidencias/carga-matchmaking.json) e [modelos/banco](../diagramas.md).

Não apresentar 18 etapas como 18 testes de todas as combinações de aparelhos. Não somar suítes heterogêneas para prometer cobertura integral. Evidência anterior deve conservar a sua data, commit e ambiente.

## 11. Plano de aplicação posterior

1. Fixar o recorte atual da Sprint 2, preservando decisões da equipe e distinguindo futuro/externo.
2. Corrigir escopo geral, RFs, RNFs e regras na seção original correspondente; integrar os RF-A e critérios necessários dos apêndices.
3. Atualizar cronograma, figuras e legendas, sem reescrever a autoria da Sprint 1.
4. Desenvolver a seção 6 com os testes e evidências existentes; não desenvolver funções da Sprint 3 para preencher texto.
5. Remover a duplicação das pp. 48–61 após conferir que nenhum conteúdo obrigatório ficou perdido. Manter apenas o título 7 solicitado, sem cabeçalhos repetidos.
6. Deixar títulos 6 e 7 em preto. Corrigir conexões de frases, espaçamento e termos; preservar o restante do padrão do template.
7. Recalcular sumário e referências com a paginação final; atualizar o histórico e sincronizar as representações da ERS.
8. Conferir texto, figuras, fontes, cores, links, extração e cada página renderizada. A comparação visual deve permitir as alterações necessárias, em vez de exigir que erros antigos permaneçam só para conservar pixels.

Não há estimativa artificial de páginas finais. A prioridade é um único texto coerente e verificável, sem repetir a especificação nem remover conteúdo obrigatório para reduzir tamanho.

## 12. Controle desta auditoria

- [x] Revisar estrutura, conteúdo das seções 1–7 e os 14 apêndices de continuação.
- [x] Conferir cobertura dos 24 RF originais, 8 RF-A, 16 RNF e 16 RN.
- [x] Identificar contradições concretas com implementação/evidências e pontos que precisam apenas de precisão documental.
- [x] Separar testes iniciais obrigatórios de apêndices opcionais e de homologações futuras.
- [x] Registrar correções e ordem de aplicação.
- [ ] Aplicar correções: **não autorizado nesta etapa; não realizado**.
- [ ] Declarar documento final pronto para entrega: depende das correções e da revisão da equipe.

Artefato principal auditado: SHA-256 `cb32649af1b73a44be513f89e5215a4ad747eb7699ed73f8b9dc6cf568248bd4`.

O arquivo original da Sprint 1, a cópia de 61 páginas, a ERS v2, o código e os testes não foram alterados para executar esta auditoria. Somente este registro é novo.
