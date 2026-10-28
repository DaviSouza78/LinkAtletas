# Equivalência funcional entre web e aplicativo

## Objetivo e escopo aprovado

Em 28/10/2026, a equipe definiu que atleta, treinador e administrador devem realizar no aplicativo as operações disponíveis para seu papel na interface web. A equivalência é funcional: navegação, campos e componentes são adaptados ao aparelho. O aplicativo usa a mesma API, contas, permissões e banco.

Esta evolução fica restrita a `mobile`. A ERS, a documentação geral, o servidor e os contratos compartilhados não serão alterados nesta etapa. Se faltar suporte na API, registrar o impedimento aqui antes de ampliar o escopo. Cadastro público permite atleta/treinador; administrador é provisionado pelo procedimento existente, nunca pelo cadastro público.

## Abordagem

Manter React Native/Expo e ampliar o cliente existente. Telas comuns recebem papel/identidade da sessão e operações específicas ficam em pastas próprias. A alternativa de incorporar o site em WebView reduziria trabalho inicial, mas não atende à intenção de ter interface nativa. Duplicar aplicativo por perfil aumentaria manutenção e distribuição sem necessidade.

Sessão permanece no SecureStore e autorização permanece no servidor. Navegação utiliza uma lista explícita de destinos por papel, recusa destinos incompatíveis e é reiniciada ao trocar de sessão. Cada tela trata carregamento, erro, vazio e processamento. Ações destrutivas exigem confirmação e justificativa quando a API determina.

## Matriz inicial

| Área | Atleta | Treinador | Administrador | Situação inicial |
|---|---|---|---|---|
| Login/restauração/logout/recuperação | Sim | Sim | Sim | Login/restauração recusavam os outros papéis. |
| Cadastro público | Sim | Sim | Não | Somente atleta no cliente. |
| Perfil esportivo | Próprio | Próprio, preço e CREF | Não existe equivalente web | Perfil inicialmente de atleta. |
| Descoberta | Busca treinadores | Não aplicável | Não aplicável | Implementada para atleta. |
| Vínculos | Solicita/retira/encerra | Aceita/recusa/encerra | Não aplicável | Somente visão do atleta. |
| Treinos | Lê e registra execução | Cria, edita, rascunha, publica, acompanha execução | Não aplicável | Somente execução do atleta. |
| Arquivos esportivos | Performance e leitura autorizada | Orientações, feedback e leitura autorizada | Somente documento profissional | Cliente sem operação do treinador/admin. |
| Mensagens | Conversa com treinador | Conversa com atleta | Não há conversa administrativa web | Seletor precisa exibir contraparte correta. |
| Agenda | Agenda/altera/cancela/histórico | Mesmas operações e conclusão; reunião | Não aplicável | Conclusão e campo reunião ausentes no cliente. |
| Avaliações | Publica/edita/denuncia | Consulta/responde/denuncia | Oculta/restaura com justificativa | Cliente somente atleta. |
| Financeiro | Consulta/checkout/cancelamento | Plano, carteira, totais e assinaturas | Comissão/carência | Cliente somente atleta. |
| Privacidade | Consentimentos/saúde/exportação/encerramento | Mesmas operações próprias | Consulta pedidos administrativos | Cliente sem visão administrativa. |
| Avisos | Consulta/leitura | Consulta/leitura | Consulta/leitura | Reutilizável por papel. |
| CREF manual | Não aplicável | Envia evidência/anexo, acompanha histórico | Aprova/recusa/suspende/revoga | Telas nativas ausentes. |

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

1. Executar nova compilação/instalação e percurso dos três perfis em APK, com backend de teste e contas fictícias, registrando casos e resultados separados dos testes controlados.
2. O roteiro `scripts/android/verify-integrated.py`, fora de `mobile`, ainda espera a rejeição do treinador no cliente. Foi preservado pelo limite de escopo; atualizar o roteiro e o cenário nativo em uma etapa autorizada que inclua os scripts/workflow. O resultado histórico daquele ensaio não valida esta revisão.
3. Definir e validar OAuth nativo para criação automática de evento Google/Meet. A operação web correspondente não foi apresentada como nativa. Informar/abrir reunião HTTPS e registrar a consulta continuam disponíveis.
4. Conferir a matriz da web com a equipe, executar erros/permissões por recurso no ambiente integrado e revisar disposição/acessibilidade em telas reais. Só então atualizar ERS e documentação geral.

O estado é **ampliação implementada no cliente, em validação**. Não se declara equivalência completa, APK homologado ou integração Google concluída apenas por tipos, testes controlados e bundles aprovados.

[Aplicativo](../README.md) · [Telas atuais](../src/screens/README.md)

### Validacao nativa e OAuth em andamento

A integracao Google nativa foi implementada em `googleAuthorization.ts` e `googleCalendar.ts`, com SDK nativo e escopo `calendar.events.owned`. O ID web identifica o publico do token no SDK; Android tambem exige cliente proprio associado ao pacote e SHA-1 da assinatura. No iOS, e necessario o cliente iOS e o esquema correspondente. IDs sao publicos; nenhum segredo OAuth deve entrar no aplicativo.

A suite passou a 105 testes em oito arquivos, incluindo 13 casos controlados de autorizacao, cancelamento, escopo, expiracao, minimizacao de dados e recuperacao de evento sem duplicacao. Isso ainda nao comprova consentimento real do Google nem criacao real de Meet.

O roteiro Android foi atualizado para aceitar treinador e ganhou `mobile/scripts/verify-roles.py`, chamado pelo workflow integrado com foco `roles`. O ensaio usa API e PostgreSQL isolados, tres perfis ficticios e verificacao dos registros persistidos. Sua execucao e compilacao estao em andamento; nao substituir os resultados historicos antes de concluir.

O cadastro de clientes Google depende do acesso ao Google Cloud e do aceite dos termos pelo titular. A assinatura de desenvolvimento do APK sera publicada como fingerprint no artefato de compilacao para configurar o cliente Android. A autorizacao de uma conta e a criacao real de um evento sao verificacoes separadas, ainda pendentes.
