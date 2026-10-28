# ERS v1.1 — LinkAtletas — Sprint 2

Data: 14/10/2026. Versão editável do incremento, derivada da ERS v1.0 de 21/08/2026. A Sprint 1 foi entregue pelo grupo; esta revisão preserva seus identificadores e explicita as partes atendidas e futuras. Prazo informado da Sprint 2: 26/10/2026. A aprovação do recorte nesta conversa não equivale à aprovação acadêmica pelo professor.

## Histórico e fontes

| Versão | Origem e mudança |
|---|---|
| 1.0 | [ERS original preservada](../referencias/ERS-Sprint-1-original.pdf), recebida como `LinkAtletas_Documento_ERS_2026.pdf`; 24 RF detalhados, 16 RNF e 16 RN |
| 1.1 | Revisão Sprint 2: web responsiva, API e PostgreSQL, fluxos verificáveis, estados de atendimento, cenários RNF e rastreabilidade |

Fontes: demanda SAGA nº 12871, [proposta inicial](../referencias/Proposta-inicial-original.pdf), [roteiro da disciplina](../referencias/Roteiro-professores-original.pdf), repositório original no commit `17b32c74cc79c1fab05d762cf6346ad87ecc749d` e [proposta aprovada](https://github.com/DaviSouza78/LinkAtletas/blob/c472f2709d4053dda051d8d4da18fc9bf3096d8a/docs/historico/planejamento/specs/2026-10-14-sprint-2-design.md). A proposta tem redação histórica anterior à aprovação; a alternativa A foi aprovada nesta conversa em 14/10/2026. Não foi verificada uma API pública de CREF nem a situação atual da demanda na SAGA.

Correções: RF-02 nomeia corretamente o perfil do treinador. O corpo original detalha RF-01–24; RF-25–32 aparecem apenas no cronograma e não recebem especificações inventadas nesta revisão. Sequências usam os identificadores textuais corretos. PostgreSQL é o único banco relacional do incremento.

## Objetivo, atores e limites

Conectar atletas a treinadores compatíveis e centralizar prescrição, execução e retorno do treinamento. Atleta administra suas preferências e execuções; treinador submete comprovação profissional, decide solicitações e acompanha sua carteira; administrador confere a comprovação e registra a decisão.

A entrega web abrange cadastro → perfil → conferência profissional → busca/match → solicitação → aceite → treino → execução/feedback. Não processa pagamentos nem prescreve automaticamente treinos. CREF aprovado neste ambiente significa conferência manual registrada. Dados de seed são fictícios.

Prioridades: **P0** indispensável ao fluxo central; **P1** complemento; **P2** evolução. Estados: **implementado** descreve comportamento disponível no incremento, sujeito à verificação no relatório; **parcial** atende somente a parte delimitada; **futuro** não atende ao requisito integral. O relatório de testes prevalece sobre qualquer inferência de aprovação.

## Requisitos funcionais priorizados

| ID | Requisito preservado | Prioridade | Atendimento e limite da Sprint 2 |
|---|---|---|---|
| RF-01 | Cadastro e edição do perfil do atleta | P0 | Implementado: conta, perfil esportivo e preferências; sem saúde/biometria no cadastro mínimo |
| RF-02 | Cadastro e edição do perfil do treinador | P0 | Implementado: conta, perfil, modalidades, objetivos, níveis, preço e horários |
| RF-03 | Submissão de registro profissional | P0 | Parcial: CREF e referência de comprovação; sem upload/armazenamento de documento |
| RF-04 | Validação automatizada com alternativa manual | P0 | Parcial: decisão manual e auditoria; consulta automática futura |
| RF-05 | Autenticação e controle de acesso | P0 | Implementado: sessão, login/logout e autorização; recuperação de senha futura |
| RF-06 | Processamento de matchmaking | P0 | Implementado no recorte: pontuação determinística explicável; IA treinada futura |
| RF-07 | Busca e filtragem de treinadores | P0 | Implementado: somente aprovados e compatíveis com filtros/perfil |
| RF-08 | Visualização do portfólio | P1 | Parcial: perfil, preferências e preço; avaliações públicas e mídia futuras |
| RF-09 | Solicitação de contratação e assinatura | P0 | Parcial: solicitação persistida; sem pré-autorização de cartão/assinatura financeira |
| RF-10 | Aceite ou recusa do aluno | P0 | Implementado no vínculo acadêmico: aceite ativa vínculo; cobrança futura |
| RF-11 | Pagamento recorrente | P2 | Futuro; rota financeira exibe aviso de indisponibilidade |
| RF-12 | Split financeiro | P2 | Futuro; nenhuma transação real |
| RF-13 | Inadimplência e carência | P2 | Futuro; prazos e retentativas exigem definição |
| RF-14 | Prescrição de fichas de treino | P0 | Implementado: vínculo ativo, blocos, orientações, data, rascunho/publicação |
| RF-15 | Vídeos demonstrativos dos exercícios | P1 | Parcial: referência HTTPS em bloco; upload/S3 e biblioteca futuros |
| RF-16 | Consulta de treinos prescritos | P0 | Implementado: atleta vê suas fichas publicadas; treinador vê suas fichas |
| RF-17 | Registro de execução e feedback | P0 | Implementado: blocos, métricas, esforço 1–10 e comentário; reenvio atualiza registro |
| RF-18 | Vídeo de performance do atleta | P2 | Futuro; sem upload/correção de mídia |
| RF-19 | Mensagens em tempo real | P2 | Futuro; rota exibe aviso de indisponibilidade |
| RF-20 | Avaliação pública do treinador | P2 | Futuro; estrelas do protótipo não comprovam reviews |
| RF-21 | Resposta a avaliações | P2 | Futuro |
| RF-22 | Cancelamento de assinatura e contrato | P2 | Futuro; não há cobrança para cancelar no incremento |
| RF-23 | Gestão da carteira de alunos | P0 | Parcial: solicitações, vínculos e retorno reais; gestão avançada futura |
| RF-24 | Métodos de pagamento | P2 | Futuro; nenhum cartão capturado |

### UC-01 — Conta e perfil (RF-01, RF-02, RF-05)

Pré-condição: visitante sem sessão; cadastro público aceita atleta ou treinador. Fluxo: informar nome, e-mail e senha → validar no servidor → normalizar e-mail → persistir usuário/perfil → criar sessão → completar cidade, modalidades, objetivos, níveis, horários, modo e orçamento/preço → salvar. Pós-condição: perfil recuperável em nova sessão. Alternativa: usuário existente entra com senha. Exceções: e-mail duplicado gera conflito; senha inválida/credenciais erradas não criam sessão; visitante não acessa recursos privados; administrador não pode ser escolhido no cadastro.

### UC-02 — Conferência profissional (RF-03, RF-04)

Pré-condição: treinador autenticado. Fluxo: submeter CREF e referência → registrar pendência → administrador consulta → aprova/reprova com justificativa → gravar decisão e auditoria na mesma transação. Pós-condição: aprovado torna-se elegível à busca; pendente/reprovado fica fora. Alternativa: corrigir e reenviar conforme estado permitido. Exceções: atleta não submete registro; treinador não decide sua solicitação; decisão repetida/conflitante é rejeitada; falha de auditoria impede confirmar decisão. Não existe consulta automática ao conselho.

### UC-03 — Recomendar e solicitar vínculo (RF-06–09)

Pré-condição: atleta autenticado com perfil compatível e treinador aprovado. Fluxo: abrir descoberta → filtrar elegíveis → calcular pontuação → ordenar → mostrar critérios/perfil → solicitar vínculo → persistir `pending`. Pós-condição: solicitação visível aos dois participantes. Alternativas: ajustar filtros; lista vazia orienta completar preferências. Exceções: treinador não aprovado, modalidade/localidade incompatível ou solicitação pendente/ativa duplicada são rejeitados no servidor. A solicitação não confirma cobrança.

Pontuação: objetivo 30; nível 20; orçamento 25; interseção de disponibilidade 25. Critério incompatível recebe zero. Modalidade e aprovação são filtros; presencial depende de cidade compatível. Empate usa nome/identificador. Pesos totalizam 100; motivos acompanham o resultado. Disponibilidade influencia a nota, sem agenda reservada. Esse recorte altera a RN-09 original e está registrado nas decisões.

### UC-04 — Decidir solicitação e carteira (RF-10, RF-23)

Pré-condição: treinador destinatário autenticado e solicitação pendente. Fluxo: consultar solicitações → aceitar → atualizar para `active` com data → exibir vínculo na carteira. Alternativa: recusar (`rejected`); nova solicitação do par recusado pode retornar ao fluxo pendente. Exceções: decisão de terceiro é negada; repetição não gera outro vínculo; treinador inelegível não pode ativar contratação. Par atleta/treinador único e atualização transacional protegem duplicidade. Sem pré-autorização financeira.

### UC-05 — Prescrever e publicar (RF-14, RF-15)

Pré-condição: treinador autenticado com vínculo ativo. Fluxo: selecionar aluno → definir título, data, modalidade e orientações → informar blocos → salvar rascunho ou publicar → persistir ficha e blocos. Pós-condição: publicado aparece ao atleta correto. Alternativa: salvar rascunho explicitamente e retomar; referência HTTPS opcional. Exceções: vínculo inativo/alheio, bloco vazio, valores negativos e URL inválida são rejeitados. Rascunho não aparece ao atleta. Upload e autosave periódico não integram o incremento.

### UC-06 — Executar e acompanhar (RF-16, RF-17)

Pré-condição: atleta autenticado, ficha publicada do seu vínculo. Fluxo: abrir ficha → consultar orientações → marcar blocos → registrar métricas e esforço 1–10 → comentar → persistir execução → treinador consulta retorno. Alternativa: execução parcial; reenvio atualiza execução única. Exceções: ficha alheia/rascunho não é revelada; atleta não prescreve; índice inválido, métrica desconhecida ou valor fora do catálogo gera erro para correção. Não enviar dados corporais ou vídeos em texto livre.

### Fluxos reservados (RF-11–13, RF-18–22, RF-24)

Não possuem caminho funcional de aceite nesta Sprint. Evolução exige especificar gateway, falhas/webhooks, consentimento, mídia, moderação, cancelamento e elegibilidade de avaliação. Telas ilustrativas não substituem esses fluxos.

## Requisitos não funcionais e cenários de verificação

Ambiente: Node 24, pnpm 10, PostgreSQL 17, UI web local, dados fictícios. Cenários abaixo são procedimentos de aceite; resultados estão no [relatório](relatorio-testes.md). Existência do cenário não comprova sua execução.

| ID e prioridade | Estado | Procedimento, critério e evidência exigida |
|---|---|---|
| RNF-01 LGPD — P0 | Parcial: minimização/controle de acesso; ciclo de consentimento futuro | Criar conta fictícia, inspecionar campos/finalidade e acesso por terceiro. Exigir consentimento rastreável antes de dados sensíveis em implantação futura. Evidência: telas, registros e isolamento; conformidade integral não demonstrada |
| RNF-02 Criptografia saúde/biometria — P0 | Futuro integral; hash de senha não equivale a criptografia das métricas | Em implantação HTTPS comprovar TLS 1.3, AES-256 em repouso e gestão de chaves; rejeitar tráfego inseguro. Evidência: configuração/teste do ambiente; HTTP local não atende |
| RNF-03 Auditoria profissional — P0 | Parcial: decisão transacional; sem base independente inviolável | Decidir solicitação; conferir treinador, referência, responsável, horário/status; simular falha e verificar rollback. Evidência: API/SQL. Imutabilidade perante administrador do banco não alegada |
| RNF-04 Ocultar não validados — P0 | Implementado no catálogo consultado | Buscar antes/depois de decisão; pendente/reprovado fica fora e solicitação direta falha. Evidência: API/navegador. Não há atualização push do catálogo aberto |
| RNF-05 Cartão/PCI — P2 | Futuro; nenhuma captura de cartão | No gateway futuro inserir cartão sandbox e comprovar somente token/máscara em bases/logs. Evidência: sandbox e inspeção; ausência atual de cartão não certifica PCI |
| RNF-06 Match até 2 s — P1 | Regra disponível; SLA em carga não comprovado | Registrar base/hardware, aquecer e medir pelo menos 30 consultas; registrar p95 e exigir ≤2 s no cenário declarado. Evidência: medição, sem extrapolar base fictícia |
| RNF-07 Métricas extensíveis — P0 | Parcial: catálogo e valores flexíveis; modalidades limitadas | Consultar catálogo; registrar chave válida e rejeitar chave/limite inválido. Adicionar tipo no banco de teste e conferir campo dinâmico. Evidência: schema/API/tela; cadastro administrativo de modalidade futuro |
| RNF-08 Escala/70% — P2 | Futuro | Em nuvem aumentar carga até 70% do recurso e medir expansão, balanceamento e latência. Evidência: métricas/configuração; Compose local não comprova autoescala |
| RNF-09 Usabilidade mobile nativa — P1 | Parcial: web 390 px; nativo não homologado | Percorrer descoberta/execução em 390 px, teclado e zoom; sem perda de campos/ações ou rolagem horizontal. Evidência: captura/E2E; homologação nativa futura |
| RNF-10 Usabilidade web — P0 | Parcial: prescrição e rascunho explícito; sem autosave | Em 1440 px publicar com até 3 confirmações após preencher; salvar/reabrir rascunho. Evidência: navegador/captura; saída sem salvar pode perder edição |
| RNF-11 Feedback visual — P0 | Fluxo integrado; mídia/pagamento fora do recorte | Simular carregamento, entrada inválida e falha de rede; conferir espera, erro claro e sucesso só após resposta positiva. Evidência: E2E/roteiro manual |
| RNF-12 iOS/Android — P2 | Futuro | Instalar app em versões definidas dos dois SO; testar câmera, notificações e fluxo. Evidência: aparelhos/versões e gravação; viewport não equivale a teste nativo |
| RNF-13 Navegadores — P1 | Parcial: cobertura efetiva no relatório | Repetir fluxo em Chrome, Firefox, Edge e Safari com versões registradas. Evidência: relatório por navegador; Chromium sozinho não homologa os quatro |
| RNF-14 REST/OpenAPI — P0 | Implementado no recorte | Abrir `/api/docs` e `/api/openapi.json`; conferir contratos; enviar métrica incompatível e esperar 400 com campo. Evidência: especificação runtime/testes |
| RNF-15 Idempotência/reconciliação financeira — P2 | Futuro | No sandbox repetir webhook/chave e comprovar cobrança única; executar reconciliação. Evidência: eventos/extrato de teste; unicidade de vínculo não atende pagamento |
| RNF-16 Logs sanitizados — P0 | Parcial: sem corpos sensíveis em logs; diagnóstico limitado | Enviar senha/documento fictício identificável em requisição inválida; procurar marcador em logs/resposta; exigir ausência. Evidência sanitizada; não publicar cookies/tokens/dados reais |

## Regras de negócio preservadas

| ID | Regra | Atendimento/ajuste |
|---|---|---|
| RN-01 | Somente aprovado é publicado | Implementado no catálogo/solicitação; aprovação manual acadêmica |
| RN-02 | Decisão registra administrador, data/hora e documento | Parcial: referência e auditoria; sem arquivo armazenado |
| RN-03 | Registro vencido/revogado suspende visibilidade | Futuro: sem consulta periódica ou mecanismo completo de revogação |
| RN-04 | Mensalidade gera split | Futuro |
| RN-05 | Administrador configura taxa | Futuro |
| RN-06 | Falha financeira aplica retentativas/carência e notificações | Futuro |
| RN-07 | Não duplicar transação no ciclo | Futuro financeiro; vínculo/execução têm proteção própria |
| RN-08 | Match considera modalidade, nível, objetivos, orçamento e horários | Implementado com pesos; sem aprendizado automático |
| RN-09 | Solicitação exige disponibilidade; recusa não penaliza | Parcial/ajustada: disponibilidade pontua, não é filtro obrigatório nem agenda reservada; recusa não reduz nota |
| RN-10 | Interações registradas retroalimentam match | Parcial: solicitação/decisão persistem; cliques e aprendizado futuros |
| RN-11 | Prescrição exige vínculo ativo | Implementado e autorizado no servidor |
| RN-12 | Métricas seguem a modalidade | Implementado em catálogo/validação |
| RN-13 | Avaliação exige período mínimo de vínculo | Futuro; período deve ser definido |
| RN-14 | Saúde/biometria exige consentimento e finalidade | Parcial: cadastro mínimo não coleta esses dados; ciclo específico futuro. Métricas/comentários só fictícios na demonstração |
| RN-15 | Criptografia em repouso/trânsito | Futuro integral; HTTP local e JSON no banco não comprovam |
| RN-16 | Não armazenar cartão bruto; delegar ao gateway | Sem captura de cartão; integração futura |

## Dados, estados e invariantes

Usuário tem papel atleta, treinador ou administrador; perfil usa o identificador do usuário. Sessão guarda hash de token e expiração. Verificação tem `pending`, `approved` ou `rejected`; perfil também pode estar `unsubmitted`. Contrato tem `pending`, `active` ou `rejected`, com par atleta/treinador único. Ficha tem `draft` ou `published`, vinculada a contrato; blocos são ordenados. Execução é única por ficha, atualizável pelo atleta proprietário. Catálogo define modalidade, chave, unidade e limites; valores JSON são validados.

Banco mantém chaves estrangeiras/unicidade. API verifica papel, propriedade e estado; consultas são parametrizadas. E-mail é único sem distinção de maiúsculas. Cookie é HttpOnly; produção exige configuração explícita e HTTPS. Entrada inválida retorna 400; sessão ausente 401; papel indevido 403; recurso privado alheio 404; conflito 409. Falha inesperada recebe mensagem pública genérica.

[Diagramas](diagramas.md), [backlog](backlog.md) e [rastreabilidade](rastreabilidade.md) complementam esta ERS. Instalação está no README; evidências executadas ficam no relatório de testes.
