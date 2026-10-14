# LinkAtletas — ampliação das funcionalidades pendentes

Data: 14/10/2026. Status: ampliação recomendada aprovada por Lucca em 14/10/2026.

## Objetivo e referência

Ampliar a implementação da Sprint 2 para cobrir as funcionalidades ainda abertas no [checklist](../../sprint-2/checklist-sprint-2.md), preservando a aplicação já testada. Base: commit `51463da533be6558faae0a59dbd675d32d74816b`. A branch `sprint-2` permanece disponível como entrega anterior; a ampliação será desenvolvida em `evolucao-completa`.

O pedido atual autoriza desenvolver o máximo possível das funcionalidades restantes. Esta proposta define como fazê-lo e quais etapas ainda exigem credenciais, infraestrutura ou validação externa. A versão anterior foi aprovada com web responsiva, CREF manual e vínculo sem pagamento; a ampliação acrescenta novos clientes e serviços externos.

O trabalho será dividido em módulos com migrações cumulativas, mantendo dados existentes. Módulos locais serão concluídos e testados antes de serem marcados como feitos. Integração escrita, teste com servidor controlado, teste em sandbox e operação real serão registrados separadamente.

## Alternativas

| Abordagem | Vantagem | Impacto |
|---|---|---|
| A — ampliar a arquitetura existente, com serviços locais e adaptadores externos | Preserva Node/TypeScript/PostgreSQL e permite testar funções sem depender de contas externas | Ativação de pagamento, e-mail externo, CREF oficial e nuvem exige configuração posterior |
| B — priorizar publicação e serviços gerenciados antes dos módulos | Permite demonstrar diretamente pela internet quando as contas estiverem prontas | Depende imediatamente de conta de hospedagem, domínio e credenciais; pode envolver custos |
| C — reconstruir usando uma plataforma de backend gerenciado | Concentra autenticação, dados e arquivos em um provedor | Muda a arquitetura já aprovada e requer migração e conta externa |

**Recomendação: A**, com API modular, PostgreSQL, React web e cliente React Native/Expo. Toda a ampliação segue uma única arquitetura, executada nos módulos abaixo.

## 1. Comunicação e notificações

- Mensagens persistidas entre atleta e treinador vinculados, com paginação, confirmação de leitura e anexos autorizados.
- WebSocket autentica a sessão antes da conexão. Usuário só participa de conversas do seu vínculo; não existe sala pública de dados pessoais.
- Reconexão consulta o histórico persistido. Entrega em tempo real usa publicação após confirmação da gravação, sem substituir o banco por memória.
- Notificações internas persistidas para mensagem, treino, feedback, consultoria e eventos relevantes de conta/assinatura.
- Primeiro estágio usa uma instância da API. Escala de múltiplas instâncias precisa de broker distribuído, a ser declarada quando não for testada.

Aceite: duas sessões de navegador recebem mensagens sem recarga, histórico permanece após reconectar/reiniciar e terceiros não conseguem ler ou enviar para a conversa.

## 2. Avaliações, respostas e moderação

- Avaliação de 1 a 5, texto limitado, autoria do atleta e vínculo elegível.
- Regra inicial proposta: vínculo ativo há pelo menos sete dias, parametrizado por `REVIEW_MIN_DAYS`. Cenários acadêmicos de teste podem usar configuração explicitamente diferente.
- Uma avaliação por vínculo, com edição controlada e média calculada apenas de conteúdo publicado.
- Treinador pode responder à avaliação recebida. Usuários podem denunciar conteúdo; administrador pode ocultá-lo e registrar a decisão.
- Conteúdo removido da publicação não continua exposto por outra rota.

Aceite: vínculo precoce/ausente não avalia; publicação, resposta, cálculo de média e ocultação são verificáveis por testes de API e interface.

## 3. Upload, vídeos e documentos

- Upload privado de comprovação profissional, orientação de exercício, execução do atleta e anexo de mensagem, com finalidade e autorização por recurso.
- Armazenamento compatível com S3. Serviço local proposto: SeaweedFS em Docker, com bucket privado e credenciais de desenvolvimento; a mesma interface poderá apontar para S3 hospedado.
- Metadados no PostgreSQL: proprietário, finalidade, recurso relacionado, MIME, tamanho, chave do objeto, data e situação de retenção.
- Limites iniciais: documentos/imagens até 10 MiB; vídeos até 50 MiB. Conferir assinatura real do arquivo, extensão e MIME; não aceitar HTML executável ou caminhos fornecidos pelo usuário como chave de armazenamento.
- Conteúdo privado cifrado antes de armazenar, com AES-256-GCM e chave fora do Git. A API só entrega conteúdo após autorização e consegue reproduzir/baixar os formatos admitidos.
- Consentimento específico para vídeo de performance; revogação impede nova coleta e aciona a política de eliminação definida.
- Feedback/correção técnica vinculado à mídia enviada e visível às partes autorizadas.
- Referências externas HTTPS existentes continuam suportadas, distinguidas do upload próprio.

Aceite: arquivo é armazenado no serviço S3 local, bytes armazenados não correspondem ao conteúdo em claro, download autorizado recupera o original, arquivo indevido/tamanho excedido é recusado e acesso de terceiro falha.

Fontes técnicas: [SeaweedFS S3](https://github.com/seaweedfs/seaweedfs/blob/master/weed/command/s3.go), [configuração oficial de serviços S3](https://github.com/seaweedfs/seaweedfs/blob/master/test/s3/iam/docker-compose.test.yml). Versões efetivamente usadas serão fixadas após conferir disponibilidade das imagens.

## 4. Recuperação de acesso e e-mail

- Solicitar recuperação por e-mail produz resposta genérica, sem revelar se a conta existe.
- Token aleatório de uso único, somente hash no banco, expiração de 30 minutos, tentativas limitadas e invalidado depois de usado.
- Nova senha invalida as sessões anteriores. E-mail de notificação de alteração não contém senha/token reutilizável.
- SMTP configurável. Mailpit local em Docker captura mensagens para testes; não encaminha e-mails reais a terceiros.
- Caixa de saída persistida e retentativas controladas evitam marcar uma notificação como enviada antes da confirmação SMTP.
- Em produção, SMTP, remetente e domínio precisam ser configurados pelo proprietário da aplicação.

Aceite: abrir a mensagem no Mailpit, usar o link uma vez, entrar com a nova senha, negar token expirado/reutilizado e invalidar sessão antiga.

Fonte: [Mailpit — SMTP e API de teste](https://mailpit.axllent.org/docs/).

## 5. Financeiro, assinatura e gateway

Proposta de provedor: **Asaas**, usando Checkout hospedado, assinaturas e split. Cartão não será coletado em formulário próprio nem armazenado bruto na plataforma.

- Cadastro do recebimento do treinador com referência de carteira do gateway, sem exigir dados bancários em texto livre.
- Plano do acompanhamento e percentual de comissão configurado pelo administrador, com valores monetários em centavos/decimal apropriado.
- Criar intenção de contratação e checkout de assinatura, guardar os identificadores do provedor e apresentar a URL hospedada.
- Não confirmar pagamento pelo redirecionamento do navegador. Processar eventos autenticados do gateway, registrar o ID único do evento e aplicar a transição financeira uma única vez.
- Estado financeiro separado do vínculo esportivo: aguardando pagamento, regular, carência, suspenso, cancelamento solicitado e encerrado.
- Quando a operação financeira estiver habilitada, acesso exige situação e vigência adequadas. O modo acadêmico sem cobrança continua identificável e explicitamente configurado para preservar a demonstração anterior.
- Dashboard financeiro e histórico trazem dados persistidos, identificando a origem local/sandbox/produção de cada operação.
- Cancelamento interrompe a renovação e preserva acesso até a vigência já paga. Falha do provedor não é apresentada como cancelamento concluído.
- Retentativas/conciliação são registradas em tarefas de processamento. Reenvio de webhook, clique duplo e respostas fora de ordem não duplicam uma cobrança local ou repasse registrado.
- Uma operação externa com resultado incerto não será reenviada indiscriminadamente: estado pendente e conciliação devem evitar nova solicitação financeira sem confirmação.
- Retornos e tokens do provedor são minimizados; métodos de pagamento são gerenciados no fluxo hospedado/referenciado pelo gateway.

Sem credenciais: implementar o adaptador real e testar seu contrato HTTP com servidor controlado; se houver modo financeiro local, ele deverá se chamar demonstração e ficar proibido em produção. Não marcar “gateway sandbox validado” até executar em conta sandbox real.

Para o split real, cada recebedor precisa de uma conta/carteira elegível no Asaas. A implementação não cria identidade financeira fictícia nem solicita abertura de conta de terceiros automaticamente.

Fontes: [Checkout](https://docs.asaas.com/docs/introdu%C3%A7%C3%A3o-1), [assinatura recorrente](https://docs.asaas.com/docs/checkout-com-assinatura-recorrente), [split](https://docs.asaas.com/docs/split-de-pagamentos), [webhooks e idempotência](https://docs.asaas.com/docs/about-webhooks). A documentação distingue o redirecionamento do pagador da confirmação por webhook.

## 6. Cancelamento e encerramento do relacionamento

- Atleta pode solicitar encerramento; treinador pode encerrar atendimento de seu vínculo, com motivo e confirmação.
- Preservar histórico autorizado e impedir novas prescrições/novas interações após encerramento.
- Acesso ao período já pago segue o estado financeiro. Retirada imediata do acesso por motivo de segurança possui registro administrativo separado.
- Solicitações pendentes podem ser retiradas; vínculos encerrados podem dar origem a novo ciclo sem alterar retroativamente os treinos do ciclo anterior.
- Adaptar a unicidade atual por par atleta/treinador para ciclos de relacionamento, mantendo apenas um ciclo vigente por par.

Aceite: encerramento é idempotente; terceiros não encerram; não gera renovação ou treino novo depois do prazo; histórico e nova contratação seguem as regras registradas.

## 7. Validação profissional, prazo e suspensão

- Submissão inclui número, documento privado e dados estritamente necessários à conferência.
- Decisão registra revisor, origem, motivo, documento, prazo de validade e histórico. Administrador pode suspender/revogar com justificativa e auditoria.
- Tarefa periódica expira aprovações vencidas e remove perfis da descoberta; notifica o profissional e permite nova submissão.
- Adaptador de validação externa somente pode aprovar se receber resposta autenticada e interpretável do serviço efetivamente autorizado; falha, ausência de configuração ou resposta desconhecida encaminham à conferência manual.
- Não tratar regex, número preenchido ou dados de seed como prova de regularidade oficial.

Dependência: ainda não foi localizado contrato/documentação de API oficial pública que permita a consulta automatizada no contexto recebido. A página de consulta do CONFEF não pôde ser acessada nesta inspeção. Isso não prova inexistência de API, mas impede assumir uma integração oficial pronta. Quando houver acesso/documentação, conectar o adaptador e coletar evidência real.

Aceite local: auditoria, expiração, suspensão e exclusão da descoberta testadas. Aceite externo: exige credencial/contrato do conselho ou serviço autorizado e retorno real registrado sem dados sensíveis.

## 8. Consultorias e agenda

- Consultoria persistida para vínculo elegível, com propósito, descrição, início, duração, estado e histórico.
- Verificação de conflito de horário, criação/cancelamento/reagendamento com autorização por vínculo e notificações internas.
- Interface web e app exibem agenda e próximo encontro.
- Adaptar a integração existente Google Agenda/Meet à persistência da aplicação. Modo sem Google registra a consultoria e informa que a videoconferência externa não foi criada.
- Criação de evento/convite real somente após configuração OAuth e ação explícita de um usuário do produto; testes automáticos não enviam convites para terceiros.

## 9. Cliente React Native/Expo

- App do atleta utiliza a mesma API e contratos: cadastro/login, perfil, busca, solicitações/assinaturas, treino, métricas, mídia, chat, agenda, avaliações, notificações e privacidade.
- Sessão nativa usa token opaco em armazenamento seguro, com autenticação explícita nas requisições. Sessões de browser continuam em cookie HttpOnly; não colocar token nativo em URLs ou logs.
- URL da API configurável por ambiente. Credenciais privadas de gateway/S3/SMTP não vão para o aplicativo.
- Configuração para Android/iOS e builds, com comandos reproduzíveis. Verificar tipos, dependências e geração de bundles nativos.
- Quando o ambiente permitir, produzir build Android e executar no emulador/dispositivo. Esta máquina não possui Java/Android SDK identificados; iOS compilado exige ambiente Xcode ou serviço de build autorizado.
- Se esses ambientes não estiverem disponíveis, registrar código/bundle como realizados e APK/IPA/execução em dispositivo como pendentes. Não chamar teste em browser de homologação Android/iOS.

Fontes: [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [pré-requisitos de builds locais](https://docs.expo.dev/guides/local-app-overview/), [credenciais de assinatura](https://docs.expo.dev/app-signing/app-credentials/).

## 10. Privacidade e proteção de dados

- Registro versionado de consentimentos por finalidade, com concessão/revogação e data.
- Exportação dos dados do próprio usuário; solicitação de encerramento/exclusão com reautenticação e invalidação de sessões.
- Eliminação/anonimização das informações conforme finalidade; retenção de registros financeiros/auditoria precisa de política definida para uso real, sem inventar um prazo legal na demonstração.
- Cifrar campos privados de saúde/biometria/notas sensíveis e mídia privada em repouso. Chaves geradas/configuradas fora do repositório; migração de registros existentes não pode causar perda silenciosa.
- Logs sanitizados e autorização em todo acesso; registro de ações administrativas sensíveis.
- Políticas editáveis de privacidade/termos e retenção; administrador verifica pedidos pendentes e resultado da eliminação.
- Testes demonstram os controles implementados. Não equivalem a parecer jurídico, auditoria independente ou comprovação integral de conformidade.

## 11. Implantação, TLS, backups e qualidade

- Dockerfile para a aplicação e composição de produção com PostgreSQL, S3/SMTP configuráveis, healthchecks e proxy HTTPS.
- Configurações de exemplo sem chaves reais; inicialização de produção recusa configurações inseguras ou modo de cobrança fictícia.
- Exercitar TLS local com CA de teste explicitamente usada na verificação, sem instalar confiança no sistema do usuário automaticamente.
- Scripts de backup e restauração PostgreSQL e roteiro de mídia/chaves. Testar restauração em banco isolado antes de marcar esse controle como concluído.
- Migração pré-deploy, execução de tarefas, logs de diagnóstico e métricas de saúde.
- CI com testes, build, verificação de links/documentos e evidências. Preparar publicação portátil em servidor/container; ativação de URL pública exige conta, domínio e segredos.
- Testes web em Chromium, Firefox e WebKit quando disponíveis; não atribuir resultado de WebKit automaticamente ao Safari real, nem Chromium ao Edge real.
- Auditoria automática de acessibilidade, correções de foco/teclado/contraste e relatório do que ainda exige avaliação manual.
- Teste de carga do matchmaking com ambiente, volume e percentis registrados. Não declarar escalabilidade ilimitada a partir de dados simulados pequenos.

## 12. Documentos, modelos e rastreabilidade

- Atualizar ERS, requisitos, regras, backlog e matriz com o comportamento ampliado e testes efetivos.
- Produzir casos de uso em notação UML formal; atualizar classes, DER e sequências preservando fontes editáveis.
- Gerar ERS e relatório em formato editável e PDF, além do Markdown, com conferência visual.
- Atualizar manual, configuração de serviços, documentação da API e roteiro de demonstração.
- Classificar cada item do checklist como implementado/testado localmente, validado em sandbox, aguardando ativação externa ou não homologado.
- Não preencher Eletiva I, aprovação docente, participação de colegas ou submissão acadêmica sem informações/evidências reais.

## Sequência de execução e verificação

1. Estabelecer contratos de API compartilhados, migrar dados de forma compatível e preparar SMTP/S3 locais.
2. Entregar comunicação, avaliações e notificações com testes de propriedade e persistência.
3. Entregar e-mail/recuperação, mídia/correção e controles de privacidade com testes de falha e criptografia.
4. Entregar ciclos de contratação, assinatura/financeiro e adaptador Asaas; separar testes locais de sandbox real.
5. Entregar expiração/suspensão profissional, consultorias e administração.
6. Entregar cliente Expo, gerar bundles e executar os testes/builds viáveis no ambiente.
7. Exercitar instalação/produção/TLS local, backup/restauração, navegadores, acessibilidade e carga.
8. Atualizar/renderizar documentos, diagramas, checklist e pacote versionado.

Cada etapa preserva os testes existentes ou registra explicitamente a mudança de regra que exige ajustá-los. Novas evidências não substituem silenciosamente as evidências históricas da Sprint 2.

## Informações necessárias para ativação externa

| Serviço | Informação ou acesso necessário | O que pode ser feito antes |
|---|---|---|
| Asaas sandbox/produção | API key do ambiente, token do webhook, URL alcançável e carteira dos recebedores | Adaptador, regras, checkout/financeiro e testes de contrato controlados |
| CREF automatizado | Serviço autorizado com documentação/acesso e interpretação de resultado | Submissão, documento, validação manual, prazo, suspensão e adaptador de integração |
| SMTP externo | Host/porta, autenticação e remetente autorizado | Fluxo completo com Mailpit local |
| S3 hospedado | Endpoint/região/bucket e credenciais | Armazenamento compatível S3 local, criptografia e autorização |
| Hospedagem pública | Conta/projeto, domínio, segredos e autorização de publicação/custos | Container, TLS local, scripts, CI e manual |
| App distribuído | Android SDK/JDK ou serviço de build; assinatura e contas para lojas; Xcode para build iOS local | Fonte React Native, configuração e bundles verificáveis |

Segredos não devem ser enviados em mensagens públicas ou gravados em arquivos versionados. A implementação usará variáveis locais/secret manager; não há criação de conta financeira, publicação em loja ou contratação de serviço prevista automaticamente nesta etapa.

## Critério final

Concluir e testar todas as funções viáveis no ambiente disponível, mantendo explícitos os requisitos que só podem ser comprovados em conta externa, dispositivo ou produção. O resultado não será apresentado como totalmente homologado se essas verificações não tiverem sido executadas. O checklist final deve conter evidência para cada marcação realizada.

## Revisão da proposta

O escopo cobre todas as categorias funcionais ainda abertas, preserva a base aprovada e distingue implementação de ativação/homologação. Os módulos foram separados para evitar uma alteração indivisível no produto existente. Provedores propostos e decisões de negócio iniciais estão explicitados para revisão antes da implementação.
