# ERS v2.0 — LinkAtletas — ampliação da Sprint 2

Data: 14/10/2026. Responsável pelo incremento: Lucca, com autoria Git `Lucca <luccacc.contato@gmail.com>`. Demanda SAGA nº 12871, Ivi-it; Projeto Integrador Interdisciplinar II, ADS/SENAI Félix Guisard. Prazo informado para a Sprint 2: 26/10/2026. A aprovação técnica de Lucca não representa aprovação docente ou submissão acadêmica.

## Histórico e fontes

| Versão | Referência e mudança |
|---|---|
| 1.0 | [ERS original entregue na Sprint 1](../referencias/ERS-Sprint-1-original.pdf), de 21/08/2026: 24 RF especificados, 16 RNF e 16 RN |
| 1.1 | [Incremento web inicial](../sprint-2/ERS-v1.1.md): API, PostgreSQL e fluxo esportivo completo; evidências históricas preservadas |
| 2.0 | [Ampliação aprovada](../superpowers/specs/2026-10-14-expansao-completa-design.md): comunicação, mídia, privacidade, recuperação, ciclos, financeiro e cliente nativo |

Outras fontes: [proposta da demanda](../referencias/Proposta-inicial-original.pdf), [roteiro dos professores](../referencias/Roteiro-professores-original.pdf), [plano de execução](../superpowers/plans/2026-10-14-expansao-completa.md). O cronograma da ERS original cita RF-25–32 sem detalhá-los; esta revisão mantém RF-01–24 e identifica novos requisitos com prefixo RF-A, sem inventar o conteúdo original ausente. PostgreSQL é o único banco relacional desta implementação.

## Objetivo, atores e escopo

Conectar atletas a treinadores com preferências compatíveis, acompanhar o treinamento e registrar a relação profissional. Atleta administra perfil, vínculo, execução, mensagens, agenda, avaliações e privacidade. Treinador submete credenciais, aceita alunos, prescreve, responde, corrige mídia e configura plano/carteira. Administrador decide credenciais, modera avaliações e configura a comissão. Serviços externos são atores secundários: armazenamento S3, SMTP, gateway Asaas e Google Agenda/Meet quando configurado.

Web React e app Expo usam a mesma API Fastify/PostgreSQL. Modo `academic` registra vínculos sem cobranças; modo `asaas` exige provedor configurado e vigência financeira para novas interações. O checkout hospedado evita formulário próprio de cartão. Aprovação profissional local registra conferência manual, sem alegar consulta automática oficial. O matchmaking é determinístico e explicável; não existe modelo treinado de IA.

Prioridades: P0, essencial ao fluxo; P1, complemento do acompanhamento; P2, validação/evolução externa. **Implementado** significa comportamento no código. **Testado local** depende das evidências no [relatório](relatorio-testes.md). **Pendente externo** depende de serviço/dispositivo real, não de um checkbox de código.

## Requisitos funcionais priorizados

| ID | Requisito | Prioridade | Comportamento e limite da versão 2 |
|---|---|---|---|
| RF-01 | Cadastro e edição de perfil do atleta | P0 | Conta, preferências e perfil; informações privadas de saúde opcionais com consentimento |
| RF-02 | Cadastro e edição de perfil do treinador | P0 | Perfil profissional, modalidades, objetivos, níveis, atendimento, horários e preço |
| RF-03 | Submissão de registro profissional | P0 | CREF, evidência textual e documento privado opcional, imagem/PDF validado |
| RF-04 | Validação automatizada com alternativa manual | P0/P2 | Conferência manual, motivo, documento, prazo e auditoria; automação oficial depende de contrato/acesso ainda não recebido |
| RF-05 | Autenticação e controle de acesso | P0 | Cookie HttpOnly web, Bearer opaco nativo, logout, recuperação por SMTP e invalidação de sessões |
| RF-06 | Processamento de matchmaking | P0 | Nota explicável sobre perfil; aprendizado automático/validação estatística continuam futuros |
| RF-07 | Busca e filtros de treinadores | P0 | Somente perfis aprovados, elegíveis e não vencidos/suspensos; filtros de modalidade, preço, nome e atendimento |
| RF-08 | Portfólio do profissional | P1 | Bio, modalidades, preço, CREF, compatibilidade e avaliações publicadas; não há curadoria pública de arquivos privados |
| RF-09 | Solicitação de contratação e assinatura | P0 | Solicitação de vínculo; aceite do treinador; intenção financeira e checkout recorrente em modo Asaas |
| RF-10 | Aceite/recusa de aluno | P0 | Decisão exclusiva do treinador destinatário, transação e histórico por ciclo |
| RF-11 | Pagamento recorrente | P1/P2 | Adaptador real Asaas, intenção/assinatura, eventos autenticados; sandbox real e cobrança real ainda requerem acessos |
| RF-12 | Split financeiro | P1/P2 | Carteira recebedora, comissão em basis points, solicitação de split e registros de evento; participação estimada não é repasse bancário homologado |
| RF-13 | Inadimplência e carência | P1 | Estados financeiros, prazo de carência, suspensão, jobs e conciliação; cenários de falha controlados |
| RF-14 | Prescrição de treinos | P0 | Blocos, modalidade, data, rascunho/publicação; exige vínculo e acesso financeiro/profissional adequados |
| RF-15 | Vídeos demonstrativos | P1 | Referência HTTPS por bloco e upload privado de orientação ligado à ficha |
| RF-16 | Consulta de treinos prescritos | P0 | Rascunhos privados do treinador, publicados para o atleta autorizado; histórico vinculado ao ciclo |
| RF-17 | Registro de execução e feedback | P0 | Blocos realizados, métricas validadas, esforço 1–10 e observações; payload privado cifrado; atualização de execução única |
| RF-18 | Vídeo de performance do atleta | P1 | Upload privado com consentimento específico, validação e correção técnica pelo treinador; revogação elimina mídia conforme política |
| RF-19 | Mensagens em tempo real | P1 | Histórico cifrado e paginado, WebSocket autenticado, anexo privado, leitura e reconexão |
| RF-20 | Avaliação pública do treinador | P1 | Nota 1–5 e texto por atleta em vínculo elegível, uma por ciclo, edição autorizada e média de conteúdo visível |
| RF-21 | Resposta a avaliações | P1 | Somente treinador avaliado responde; denúncia e moderação auditada |
| RF-22 | Cancelamento de assinatura/contrato | P1 | Retirada pendente, encerramento por participante, confirmação do provedor e preservação de período pago; novo ciclo preserva histórico |
| RF-23 | Carteira de alunos | P0 | Solicitações, ciclos, prescrição, execução, conversa, agenda e acompanhamento financeiro |
| RF-24 | Métodos de pagamento | P1/P2 | Meio de pagamento gerenciado no checkout do provedor; sem cartão bruto na aplicação; homologação externa pendente |

### Requisitos adicionais explicitamente definidos nesta ampliação

| ID | Requisito | Prioridade | Implementação |
|---|---|---|---|
| RF-A01 | Recuperar acesso por e-mail | P0 | Token aleatório de uso único, hash SQL, 30 minutos, outbox SMTP e sessões revogadas |
| RF-A02 | Notificações internas persistidas | P1 | Lista por destinatário, contador e leitura individual/em lote, publicação em tempo real |
| RF-A03 | Consultorias e agenda | P1 | Criar, reagendar, cancelar, concluir; bloquear sobreposição das agendas dos participantes; histórico e referência Google opcional |
| RF-A04 | Consentimento, exportação e encerramento | P0 | Finalidades versionadas, dados próprios em JSON, senha para encerramento, anonimização e controle de retenção |
| RF-A05 | Expirar/suspender credenciais profissionais | P0 | Prazo, job de expiração, suspensão/revogação motivada e remoção da descoberta |
| RF-A06 | App do atleta | P1/P2 | React Native/Expo, mesma API, token em SecureStore; tipos/bundles e homologação Android/iOS são evidências distintas |
| RF-A07 | Operação e recuperação | P1 | Container, proxy TLS, configuração de segredos, migrations, tarefas, backup/restauração e CI conforme artefatos e testes efetivos |
| RF-A08 | Moderação de conteúdo | P1 | Denúncia de avaliação, ocultação/restauração pelo administrador e histórico motivado |

## Fluxos textuais, alternativas e exceções

### UC-01 — Conta, perfil e recuperação (RF-01,02,05,A01)

Pré-condição: visitante sem sessão ou titular autenticado. Fluxo principal: preencher nome/e-mail/senha e papel permitido → validar/normalizar → gravar usuário/perfil → iniciar sessão → completar preferências → salvar. Alternativa de entrada: credenciais existentes. Subfluxo de recuperação: informar e-mail → receber resposta genérica → outbox SMTP envia link com token no fragmento → informar nova senha → bloquear/verificar token → atualizar hash e invalidar todas as sessões. Pós-condição: senha e perfil persistidos. Exceções: duplicidade 409; credenciais 401; token expirado/usado 400; administrador não pode ser escolhido no cadastro. Cliente nativo recebe token opaco e guarda em SecureStore; browser não armazena token em localStorage.

### UC-02 — Credenciais profissionais (RF-03,04,A05)

Treinador com perfil completo informa CREF/evidência e pode anexar documento privado validado → submissão pendente → administrador confere evidência → decide com motivo e prazo → grava decisão/auditoria → perfil aprovado entra na descoberta. Alternativa: recusa e nova submissão; prazo expira em job ou administrador suspende/revoga. Exceções: terceiro/atleta não submete; treinador não decide; documento alheio inválido; decisão repetida gera conflito. Somente titular e administrador autorizado veem documento. Consulta oficial automática permanece dependente de serviço autorizado.

### UC-03 — Descoberta, contratação e ciclo (RF-06–10,23)

Atleta preenche preferências → busca aprovados compatíveis → vê nota e razões → solicita → treinador aceita/recusa. Uma solicitação vigente por par é permitida. Ciclo recusado/encerrado permite novo ciclo com identificador próprio, sem mover fichas antigas. A nota considera objetivos 30, nível 20, orçamento 25 e disponibilidade 25; modalidade/aprovação são filtros; presencial considera cidade. Alternativas: filtros sem resultado ou revisão das preferências. Exceções: profissional inelegível, papel/propriedade incorretos, duplicidade ou aceite concorrente. Disponibilidade pontua a nota; não representa horário reservado.

### UC-04 — Assinatura, pagamento e conciliação (RF-09,11–13,24)

Pré-condição: ciclo aceito e modo Asaas habilitado, plano/carteira configurados. Atleta prepara checkout → servidor grava intenção e identificador → envia requisição de assinatura/split ao provedor → mostra URL hospedada → usuário conclui no gateway → webhook autentica `asaas-access-token` → persiste evento único → aplica transição e vigência → jobs processam pendências/carência/conciliação. Redirect não comprova pagamento. Alternativa: modo acadêmico mostra ausência de cobrança; sem credenciais informa indisponibilidade. Exceções: duplicata devolve intenção existente; timeout fica incerto; evento desconhecido permanece para conciliação; evento antigo não reduz período pago; falha não vira sucesso. Reenvio externo incerto não é feito cegamente.

### UC-05 — Prescrição, execução e mídia (RF-14–18)

Treinador com acesso válido seleciona atleta → define ficha/blocos → salva rascunho ou publica → atleta consulta publicado → executa blocos e informa métricas/esforço → servidor valida catálogo e cifra payload → treinador consulta retorno. Subfluxo de mídia: selecionar finalidade/recurso → conferir papel/vínculo/consentimento → validar assinatura/MIME/extensão/limite → cifrar AES-256-GCM → armazenar S3 privado e metadados → download autorizado recupera original → treinador registra correção de performance. Alternativas: execução parcial; atualizar registro; link HTTPS de referência. Exceções: vínculo inativo, métrica indevida, índice inválido, arquivo falso, tamanho excedido, ausência/revogação de consentimento e terceiro são negados. Revogação remove mídia de performance do titular. Novos treinos não são criados depois do encerramento efetivo.

### UC-06 — Mensagens e notificações (RF-19,A02)

Participante abre conversa → consulta histórico persistido/paginado → sessão autoriza WebSocket → envia texto/anexo REST → servidor confirma commit → publica para as partes e notifica destinatário → destinatário confirma leitura até cursor. Reconexão consulta novamente o banco. Exceções: terceiro não acessa conversa; vínculo encerrado não envia; sessão revogada fecha conexão; origem browser indevida é recusada; anexo precisa pertencer ao remetente e ciclo. Notificações só podem ser lidas/marcadas pelo destinatário. Uma instância de API utiliza publicação em memória após persistência; múltiplas instâncias precisam de broker ainda não homologado.

### UC-07 — Avaliar, responder e moderar (RF-20,21,A08)

Atleta em vínculo ativo pelo período mínimo (`REVIEW_MIN_DAYS=7` por padrão) escolhe nota e relata experiência → uma avaliação por ciclo é persistida → calcula-se média dos publicados. Autor edita; treinador avaliado responde. Usuário denuncia → administrador registra motivo e oculta/restaura → média/lista pública deixam de expor o oculto. Exceções: avaliação precoce, terceiro editando, resposta por profissional diferente, duplicidade e justificativa curta falham. Configuração de teste com período menor deve ser identificada como teste, nunca como regra real executada sete dias.

### UC-08 — Consultoria e agenda (RF-A03)

Participante de vínculo válido define início/duração/objetivo → servidor bloqueia agendas em ordem, verifica sobreposição e grava encontro → envia notificação. Alternativas: reagendar/cancelar com motivo; treinador registra conclusão após início. Sem Google, agenda local informa ausência de reunião externa. Com Client ID e ação explícita do treinador, OAuth cria evento/Meet na própria agenda e API guarda referência; nenhum teste envia convites reais. Reagendamento/cancelamento local exige ajustar também o evento externo enquanto sincronização automática não estiver homologada. Exceções: terceiro, horário passado, sobreposição ou motivo ausente são recusados.

### UC-09 — Encerrar vínculo (RF-22)

Participante informa motivo e confirma → servidor autoriza titularidade e bloqueia ciclo → no acadêmico encerra imediatamente; no Asaas solicita cancelamento da renovação → confirma provedor/guarda vigência paga → encerra acesso ao fim do período. Histórico permanece autorizado; novo ciclo não altera anterior. Repetição é idempotente. Falha/resultado incerto do provedor mantém estado pendente e requer conciliação. Segurança/suspensão profissional pode bloquear novas interações independentemente do período pago, com auditoria.

### UC-10 — Privacidade (RF-01,A04)

Titular consulta política/finalidades → concede/revoga consentimento versionado → dados privados de saúde exigem consentimento → exporta seus dados → confirma senha e pede encerramento → concilia financeiro, remove arquivos/conteúdo privado e anonimiza conta → invalida sessões → administrador consulta resultado. Alternativa: exportação sem encerramento. Exceções: senha errada; conta com assinatura não conciliada; falha de remoção de arquivo não é apresentada como encerramento concluído. Retenção acadêmica minimizada é descrita na política; prazo legal e conformidade integral não são presumidos. Backups restaurados precisam reaplicar pedidos de eliminação.

## Requisitos não funcionais e cenários de verificação

Procedimentos são critérios de aceite, não resultados presumidos. Para cada execução consulte ambiente/data e limites no relatório.

| ID | Cenário e critério | Alcance/limite |
|---|---|---|
| RNF-01 LGPD | Conceder/revogar, exportar só dados próprios, reautenticar exclusão, negar terceiros; conferir SQL/objetos | Controles de privacidade locais; parecer jurídico e operação pública não homologados |
| RNF-02 Criptografia saúde/biometria | Consultar SQL/S3: ausência de texto em claro; decrypt roundtrip; IV/tag íntegros; executar TLS local | AES-256-GCM e gestão de chave implementados; relatório deve distinguir TLS local de domínio público |
| RNF-03 Auditoria profissional | Decidir/suspender/expirar; conferir revisor, motivo, prazo e referência; decisão/auditoria transacionais | Administrador direto do banco continua fora da garantia de imutabilidade |
| RNF-04 Ocultar não validados | Pendentes, suspensos/vencidos/rejeitados fora da busca e ações protegidas | Regra no servidor; uma lista já aberta precisa ser consultada novamente |
| RNF-05 Cartão/PCI | Conferir checkout hospedado, ausência de PAN/CVV SQL/logs e minimização do webhook | Adaptador e teste HTTP controlado; não certifica PCI ou conta gateway real |
| RNF-06 Match até 2 s | Dataset/ambiente declarados; aquecer, medir concorrência e p50/p95/p99; p95 ≤2 s no cenário | Resultado somente após execução de carga, sem extrapolar base sintética |
| RNF-07 Métricas extensíveis | Consultar catálogo, gravar chaves válidas e rejeitar desconhecidas/fora de limite; tela dinâmica | Modalidades principais fixadas em contratos; catálogo administrativo/novos esportes ainda podem exigir código/migração |
| RNF-08 Escala/70% | Testar expansão/balanceamento em nuvem e medir recursos | Não homologado; Docker/TLS e carga local não provam autoescala |
| RNF-09 App responsivo | Web em 390/1440 sem overflow; cliente Expo tipos/bundles | Bundle não equivale a instalação nem teste em dispositivo |
| RNF-10 Usabilidade | Prescrever/publicar, reabrir rascunho, teclado/foco; instruções e confirmações claras | Rascunho explícito; autosave contínuo ainda não implementado |
| RNF-11 Feedback visual | Erro de rede/validação, estado de envio e sucesso após resposta positiva; sem falso pagamento | E2E efetivo e capturas conforme relatório |
| RNF-12 Android/iOS | Compilar/instalar em versões definidas, executar armazenamento/upload/chat/treino | Homologação nativa e distribuição pendentes de SDK/JDK, Xcode/serviço e dispositivos |
| RNF-13 Navegadores | Fluxo em Chromium/Firefox/WebKit; registrar versões e axe | Engines testados não são automaticamente Edge/Safari reais; leitor de tela exige avaliação própria |
| RNF-14 REST/OpenAPI | Swagger runtime e schemas reais; exemplo inválido devolve campo/erro | API compartilhada web/nativo, sem segredos no cliente |
| RNF-15 Idempotência financeira | Checkout concorrente, webhook repetido/antigo, timeout e cancelamento incerto; conciliar sem duplicar | HTTP controlado; repetir em sandbox real antes da ativação |
| RNF-16 Logs sanitizados | Marcadores sensíveis não aparecem em logs públicos; token reset em fragmento, Bearer fora de URL | Revisão/teste local não substituem monitoramento/auditoria independente |

## Regras de negócio preservadas e ajustes

| ID | Regra e implementação |
|---|---|
| RN-01 | Somente treinador aprovado/elegível aparece na descoberta |
| RN-02 | Aprovação registra administrador, horário, origem manual, motivo, prazo e documento quando fornecido |
| RN-03 | Expiração, suspensão e revogação retiram visibilidade e bloqueiam novas ações protegidas |
| RN-04 | Mensalidade em modo Asaas solicita split para carteira elegível; só evento autenticado confirma estado financeiro |
| RN-05 | Administrador configura comissão 0–50% (basis points) e carência 0–30 dias |
| RN-06 | Pendência financeira mantém jobs/eventos e conciliação; carência vencida bloqueia novas interações; resultado incerto não é reemitido cegamente |
| RN-07 | Eventos/chaves de provedor únicos, intenção única por ciclo e lock transacional impedem duplicação local |
| RN-08 | Match considera modalidade, nível, objetivos, orçamento e horários, com razões explícitas |
| RN-09 | Disponibilidade compõe pontuação; não reserva agenda. Recusa não reduz nota. Esta é mudança documentada da redação original |
| RN-10 | Solicitação/decisão e interações persistem; treinamento/retroalimentação automática do match permanece futuro |
| RN-11 | Novas prescrições exigem ciclo ativo e acesso profissional/financeiro válido |
| RN-12 | Métricas respeitam chave, unidade e limites da modalidade; execução é única por ficha |
| RN-13 | Avaliação exige vínculo ativo há sete dias por padrão; uma por ciclo; alteração da configuração precisa ser explicitada |
| RN-14 | Saúde e performance exigem consentimento separado e finalidade, com revogação registrada |
| RN-15 | Conteúdo privado utiliza AES-256-GCM em repouso e HTTPS na implantação configurada; chave fora do Git e preservada no backup |
| RN-16 | Cartão bruto não é coletado/armazenado pela aplicação; meio de pagamento gerenciado pelo checkout hospedado |

## Dados e invariantes

Migrações cumulativas [001–005](../../server/db/migrations/): usuário/perfil/sessão; verificação/auditoria; ciclos de contrato; treino/blocos/métricas/execução; consents/history/private_health; media/feedback; reset/outbox/privacy/auditoria; messages/notifications/reviews/reports/moderation/consultations/history; billing_settings/wallets/plans/subscriptions/payments/splits/events/jobs/audit. Chaves estrangeiras, índices e unicidade protegem referências, execução, review por ciclo e evento financeiro.

Verificação: `unsubmitted`, `pending`, `approved`, `rejected`, `suspended`, `expired`. Contrato: `pending`, `active`, `rejected`, `cancelled`, `suspended`; índice parcial permite um vigente por par. Treino: `draft`/`published`. Financeiro: `awaiting_payment`, `regular`, `grace`, `suspended`, `cancellation_requested`, `ended`, `uncertain`. Agenda: `scheduled`, `cancelled`, `completed`. Uso de estados não implica comprovação de transação externa.

Consultas parametrizadas, validação Zod e autorização por usuário/recurso/estado. Erros: 400 entrada inválida, 401 sessão/credencial, 403 papel/ação, 404 recurso privado alheio, 409 conflito, 413 arquivo, 429 limite, 503 serviço não configurado. Mensagem pública de falha inesperada é genérica. Os [diagramas](diagramas.md), [backlog](backlog.md), [rastreabilidade](rastreabilidade.md), [API](api.md), [manual](manual.md) e [checklist](checklist-sprint-2.md) integram esta ERS.
