# Telas do atleta

[App.tsx](../../App.tsx) seleciona as telas por abas. Treinador e administrador utilizam a interface web; estes arquivos não implementam painéis nativos desses papéis.

| Área | Arquivo | Responsabilidade |
|---|---|---|
| Acesso | [auth/AuthScreen.tsx](auth/AuthScreen.tsx) | Cadastro/login, recuperação e redefinição de senha. |
| Início | [home/HomeScreen.tsx](home/HomeScreen.tsx) | Resumo do acompanhamento e atalhos. |
| Perfil | [profile/ProfileScreen.tsx](profile/ProfileScreen.tsx) | Dados, preferências esportivas e orçamento. |
| Descoberta | [connections/DiscoverScreen.tsx](connections/DiscoverScreen.tsx) | Filtros, compatibilidade e solicitação ao treinador. |
| Vínculos | [connections/ConnectionsScreen.tsx](connections/ConnectionsScreen.tsx) | Situação do acompanhamento e pedido de encerramento. |
| Treinos | [workouts/WorkoutsScreen.tsx](workouts/WorkoutsScreen.tsx) | Listagem e seleção dos treinos publicados. |
| Detalhe do treino | [workouts/WorkoutDetail.tsx](workouts/WorkoutDetail.tsx) | Blocos, execução, esforço, métricas, performance e feedback. |
| Mensagens | [messages/ChatScreen.tsx](messages/ChatScreen.tsx) | Seleção do vínculo para conversar. |
| Conversa | [messages/ChatWindow.tsx](messages/ChatWindow.tsx) | Histórico paginado, envio, anexos e leitura. |
| Agenda | [agenda/AgendaScreen.tsx](agenda/AgendaScreen.tsx) | Agendamento, reagendamento, cancelamento e abertura de reunião vinculada. |
| Avaliações | [reviews/ReviewsScreen.tsx](reviews/ReviewsScreen.tsx) | Publicação/edição, resposta recebida e denúncia. |
| Avisos | [notifications/NotificationsScreen.tsx](notifications/NotificationsScreen.tsx) | Consulta e marcação de notificações. |
| Financeiro | [billing/FinanceScreen.tsx](billing/FinanceScreen.tsx) | Modo acadêmico, assinaturas e checkout quando o servidor estiver configurado. |
| Privacidade | [privacy/PrivacyScreen.tsx](privacy/PrivacyScreen.tsx) | Consentimentos, saúde, exportação e encerramento com senha. |

Componentes exclusivos da área permanecem junto da tela, como `ChatWindow` e `WorkoutDetail`. O [seletor de vínculo](../components/connections/ContractSelector.tsx), usado em diferentes áreas, fica em `components`.

As telas exibem dados da API. Elegibilidade, permissões, validade profissional e estado financeiro são conferidos pelo servidor; esconder um botão não substitui autorização. Não utilizar contas reais para demonstrar exclusão de conta ou revogação de consentimentos.

[Código do aplicativo](../README.md)
