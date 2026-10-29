# Equivalência funcional entre web e aplicativo

## Objetivo e escopo

Em 28/10/2026, a equipe definiu que atleta, treinador e administrador devem realizar no aplicativo as operações disponíveis para seu papel na interface web. A equivalência é funcional: navegação, campos e componentes são adaptados ao aparelho. O aplicativo usa a mesma API, contas, permissões e banco.

A matriz descreve as operações oferecidas pelo cliente móvel. A API continua responsável pelas regras e permissões; equivalência de telas não comprova homologação em aparelho ou autorização Google real. Cadastro público permite atleta/treinador; administrador é provisionado pelo procedimento existente, nunca pelo cadastro público.

## Abordagem

Manter React Native/Expo e ampliar o cliente existente. Telas comuns recebem papel/identidade da sessão e operações específicas ficam em pastas próprias. A alternativa de incorporar o site em WebView reduziria trabalho inicial, mas não atende à intenção de ter interface nativa. Duplicar aplicativo por perfil aumentaria manutenção e distribuição sem necessidade.

Sessão permanece no SecureStore e autorização permanece no servidor. Navegação utiliza uma lista explícita de destinos por papel, recusa destinos incompatíveis e é reiniciada ao trocar de sessão. Cada tela trata carregamento, erro, vazio e processamento. Ações destrutivas exigem confirmação e justificativa quando a API determina.

## Operações por perfil

| Área | Atleta | Treinador | Administrador |
|---|---|---|---|
| Login/restauração/logout/recuperação | Sim | Sim | Sim |
| Cadastro público | Sim | Sim | Não |
| Perfil esportivo | Próprio | Próprio, preço e CREF | Não existe equivalente web |
| Descoberta | Busca treinadores | Não aplicável | Não aplicável |
| Vínculos | Solicita/retira/encerra | Aceita/recusa/encerra | Não aplicável |
| Treinos | Lê e registra execução | Cria, edita, rascunha, publica, acompanha execução | Não aplicável |
| Arquivos esportivos | Performance e leitura autorizada | Orientações, feedback e leitura autorizada | Somente documento profissional |
| Mensagens | Conversa com treinador | Conversa com atleta | Não há conversa administrativa web |
| Agenda | Agenda/altera/cancela/histórico | Mesmas operações e conclusão; reunião | Não aplicável |
| Avaliações | Publica/edita/denuncia | Consulta/responde/denuncia | Oculta/restaura com justificativa |
| Financeiro | Consulta/checkout/cancelamento | Plano, carteira, totais e assinaturas | Comissão/carência |
| Privacidade | Consentimentos/saúde/exportação/encerramento | Mesmas operações próprias | Consulta pedidos administrativos |
| Avisos | Consulta/leitura | Consulta/leitura | Consulta/leitura |
| CREF manual | Não aplicável | Envia evidência/anexo, acompanha histórico | Aprova/recusa/suspende/revoga |


## Etapas e critérios de aceite

1. **Sessão e navegação:** login dos três papéis, restauração, cadastro atleta/treinador e menu por papel. Papel inválido não pode persistir sessão; administração nunca é opção de cadastro. Testar as três identidades e a troca de usuário.
2. **Jornada do treinador:** perfil/preço/CREF, solicitações, treinos completos com blocos e métricas, arquivos/feedback, conversa, agenda, avaliações e plano/carteira. Rascunho não vira execução; treino executado não é editado; somente vínculos elegíveis permitem novas operações.
3. **Administração:** conferência manual com documento privado, decisões justificadas, moderação, regras financeiras, pedidos de privacidade e avisos. Não oferecer acesso geral aos arquivos privados dos participantes.
4. **Complementos comuns:** contraparte correta, recuperação, histórico, reunião, leitura e erros. Campos/regras seguem os endpoints existentes.
5. **Validação:** tipos, matriz do SDK, testes de transporte/navegação/serialização e bundles Android/iOS. Comparar operações com a web. Ensaio APK e permissões de ponta a ponta são etapas separadas e devem ter resultado próprio.

## Limites externos

- CREF é conferência manual; não existe integração automática com conselho nesta entrega.
- Modo acadêmico não realiza pagamentos. Configurar telas não homologa Asaas ou repasses reais.
- Google Calendar OAuth do navegador usa integração web específica. Não reutilizar client ID web como cliente OAuth nativo nem afirmar criação automática de Meet sem configuração/validação apropriadas. Registrar eventual diferença residual explicitamente.
- Exportação de bundles não comprova funcionamento no aparelho, acessibilidade, notificações push ou publicação em lojas.
- Eventos WebSocket dependem do ambiente; consulta de registros e atualização manual precisam continuar disponíveis.

## Registro de execução

### Código implementado nesta etapa

- [x] Login dos três perfis, validação do papel/token, restauração e logout; cadastro de atleta/treinador, sem cadastro público administrativo.
- [x] [Navegação por papel](../src/navigation/access.ts) e [identidade comum](../src/context/SessionContext.tsx); destinos incompatíveis não são renderizados pelo aplicativo.
- [x] Perfil do treinador com preço e [conferência profissional](../src/screens/verification/CoachVerification.tsx), evidência, documento privado e histórico.
- [x] Aceite/recusa e encerramento de vínculos, com identificação correta da contraparte.
- [x] [Prescrição de treinos](../src/screens/workouts/CoachWorkoutsScreen.tsx), editor com blocos, rascunho/publicação, edição permitida, retorno da execução, upload de orientação e feedback em performance.
- [x] Conversas/agenda reaproveitadas por participante; campo de reunião HTTPS e conclusão pelo treinador.
- [x] Avaliações por atleta, resposta do treinador, denúncia com motivo e [moderação administrativa](../src/screens/admin/AdminReviewsScreen.tsx).
- [x] [Plano/carteira](../src/screens/billing/CoachBillingSettings.tsx), totais financeiros e [comissão/carência administrativa](../src/screens/admin/AdminBillingScreen.tsx).
- [x] [CREF administrativo](../src/screens/admin/AdminVerificationScreen.tsx): decisão com justificativa/validade, suspensão/revogação e acesso ao documento profissional autorizado.
- [x] [Consulta administrativa de privacidade](../src/screens/admin/AdminPrivacyScreen.tsx), além da manutenção das operações pessoais existentes para atleta/treinador e avisos dos três perfis.
- [x] Listas selecionadas consultadas a cada 15 segundos em primeiro plano e ao retornar ao app, para não depender de WebSocket contínuo. Perfil não recebe atualização periódica durante edição.
- [x] Descarte de respostas antigas, remoção dos timers/listeners ao desmontar, trava contra toque duplicado e validação de links externos antes de abrir o navegador do sistema.

### Verificações e alcance

`pnpm --dir mobile typecheck`, `pnpm --dir mobile check`, a verificação adicional com `--noUnusedLocals --noUnusedParameters` e os bundles Hermes Android/iOS de `pnpm --dir mobile export` aprovados. A suíte tem **92 testes aprovados em sete arquivos**. Conferidos 115 links locais dos dez documentos Markdown de `mobile`, sem referências quebradas. A exportação é de bundles, não de APK/IPA instalável.

| Arquivo | O que comprova |
|---|---|
| [api.test.ts](../tests/api.test.ts) | Transporte, sessão, cadastro, três perfis, resposta de erro, cabeçalho, upload das quatro finalidades e arquivos privados com módulos nativos controlados. |
| [config.test.ts](../tests/config.test.ts) | Políticas de URL para desenvolvimento, APK local e produção HTTPS. |
| [navigation.test.ts](../tests/navigation.test.ts) | Destinos permitidos por papel e recusa de papéis/destinos desconhecidos. |
| [workouts.test.ts](../tests/workouts.test.ts) | Blocos, decimais/limites, datas e referência em texto; recusa de edição de ficha executada ou transferência de vínculo. |
| [screens.test.tsx](../tests/screens.test.tsx) | React renderiza menus dos três papéis e executa handlers de vínculos, CREF, moderação, regras financeiras, prescrição, resposta e conclusão, com HTTP e primitivas nativas controlados. |
| [hooks.test.tsx](../tests/hooks.test.tsx) | Resposta atrasada descartada, atualização somente em primeiro plano, perfil sem polling e envio duplicado bloqueado. |
| [external-links.test.ts](../tests/external-links.test.ts) | Nenhum endereço HTTP/protocolo indevido/credencial/caractere impróprio chega ao mecanismo de abertura externa. |

Esses testes não acessam dados reais, não enviam dinheiro e não comprovam a autorização da API em produção. A resposta 403 simulada verifica o tratamento do cliente; permissões reais precisam do ensaio integrado correspondente. Renderização com primitivas controladas não valida layout, teclado, acessibilidade ou desempenho em aparelho.

### Pendências antes de declarar equivalência integral

1. Concluido o ensaio dos tres perfis (17 etapas) e a jornada ampliada do atleta (18 etapas), em API/PostgreSQL isolados. [Resultados, alcance e capturas](evidencias/android/README.md). Os dois roteiros reaproveitam o APK do commit 445c607; nao homologam Google, iOS ou aparelho fisico.
2. O novo roteiro `mobile/scripts/verify-roles.py` foi executado com sucesso pelo workflow integrado. O auxiliar original tambem aceita treinador e concluiu seu percurso atualizado. Os JSON registram separadamente o commit do roteiro e a origem do APK.
3. Concluir o ensaio real do OAuth nativo implementado, com consentimento no dispositivo, evento criado no Google e vinculo persistido. Clientes OAuth e API configurados nao substituem essa verificacao.
4. Conferir a matriz da web com a equipe, executar erros/permissões por recurso no ambiente integrado e revisar disposição/acessibilidade em telas reais. Só então atualizar ERS e documentação geral.

O estado é **ampliação implementada no cliente, em validação**. Não se declara equivalência completa, APK homologado ou integração Google concluída apenas por tipos, testes controlados e bundles aprovados.

[Aplicativo](../README.md) · [Telas atuais](../src/screens/README.md)

### Validacao nativa e OAuth em andamento

A integracao Google nativa foi implementada em `googleAuthorization.ts` e `googleCalendar.ts`, com SDK nativo e escopo `calendar.events.owned`. O ID web identifica o publico do token no SDK; Android tambem exige cliente proprio associado ao pacote e SHA-1 da assinatura. No iOS, e necessario o cliente iOS e o esquema correspondente. IDs sao publicos; nenhum segredo OAuth deve entrar no aplicativo.

A suite passou a 106 testes em oito arquivos, incluindo 14 casos controlados de autorizacao, cancelamento, escopo, expiracao, minimizacao de dados e recuperacao de evento sem duplicacao. Isso ainda nao comprova consentimento real do Google nem criacao real de Meet.

O roteiro Android foi atualizado para aceitar treinador e ganhou `mobile/scripts/verify-roles.py`, chamado pelo workflow integrado com foco `roles`. O ensaio usa API e PostgreSQL isolados, tres perfis ficticios e verificacao dos registros persistidos. Compilacao e execucao concluidas; resultados preservados em [evidencias Android](evidencias/android/README.md), com commits e limites proprios.

Projeto Google `linkatletas` configurado, Calendar API habilitada e clientes web, iOS e Android registrados. A assinatura de desenvolvimento foi extraida do APK compilado e conferida no cliente Android local e HTTPS. A conta profissional foi adicionada ao publico de teste. A autorizacao de uma conta e a criacao real de um evento sao verificacoes separadas, ainda pendentes.
