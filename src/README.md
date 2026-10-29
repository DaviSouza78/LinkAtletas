# Interface web do LinkAtletas

Esta pasta contém a interface React/TypeScript executada no navegador. Ela apresenta as telas, administra a sessão do usuário e chama a API interna. O banco, os jobs e as regras de autorização do servidor ficam em [server](../server); o aplicativo React Native fica em [mobile](../mobile).

## Como a interface é iniciada

O [index.html](../index.html) carrega [main.tsx](main.tsx). Esse arquivo configura React, o roteador, o provedor de autenticação e os estilos. [App.tsx](App.tsx) associa os caminhos às páginas e aos papéis previstos.

Fluxo de dados: **página → serviço HTTP → API interna → resposta → estado React → tela**. O navegador não acessa diretamente o PostgreSQL ou as credenciais privadas dos provedores.

## Organização

```text
src/
  App.tsx              rotas da aplicação
  main.tsx             inicialização do React e dos provedores
  vite-env.d.ts        tipos de ambiente do Vite
  assets/              imagens importadas pelos componentes
  pages/               telas organizadas por assunto
  components/          componentes reutilizados ou extraídos das telas
  context/             sessão e autenticação compartilhadas
  hooks/               consulta remota, eventos e atualização periódica
  routes/              controle de navegação por sessão e papel
  services/            comunicação HTTP, uploads e integração opcional
  utils/               formatação e mensagens de erro
  styles/              estilos em arquivos temáticos, com ordem explícita
```

Não existe mais a pasta genérica `pages/integrated`. As páginas antes reunidas em arquivos extensos foram separadas por responsabilidade. Nomes e textos de interface preexistentes foram preservados; a organização não altera os caminhos públicos de navegação.

A imagem de destaque da página inicial fica em [assets/hero-training.webp](assets/hero-training.webp) e é importada pela `LandingPage`. O Vite inclui o arquivo no build com nome versionado por conteúdo. Não é necessária uma pasta `public` na raiz enquanto não houver arquivos que precisem de endereço fixo.

## Onde localizar cada funcionalidade

| Área | Arquivos principais | O que fazem |
|---|---|---|
| Apresentação pública | [LandingPage](pages/public/LandingPage.tsx) | Página inicial do projeto. |
| Acesso | [LoginPage](pages/auth/LoginPage.tsx), [PasswordRecoveryPage](pages/auth/PasswordRecoveryPage.tsx) | Login, cadastro e recuperação/redefinição de senha. |
| Painel | [DashboardPage](pages/dashboard/DashboardPage.tsx) | Resumo dos vínculos e treinos do usuário. |
| Perfil | [ProfilePage](pages/profile/ProfilePage.tsx) | Dados e preferências do atleta/treinador, incluindo submissão de CREF pelo treinador. |
| Conferência profissional | [AdminPage](pages/verification/AdminPage.tsx), [VerificationForm](pages/verification/VerificationForm.tsx) | Administração das solicitações, decisão manual e histórico de CREF. Não consulta API externa de conselho. |
| Descoberta e vínculos | [DiscoverPage](pages/connections/DiscoverPage.tsx), [ContractsPage](pages/connections/ContractsPage.tsx) | Busca de treinadores, solicitação e aceite do acompanhamento. |
| Treinos | [CoachWorkoutsPage](pages/workouts/CoachWorkoutsPage.tsx), [AthleteWorkoutsPage](pages/workouts/AthleteWorkoutsPage.tsx), [ExecutionForm](pages/workouts/ExecutionForm.tsx) | Prescrição, publicação, leitura e registro de execução/feedback. |
| Mensagens | [MessagesPage](pages/messages/MessagesPage.tsx), [Conversation](pages/messages/Conversation.tsx) | Seleção do vínculo e conversa entre os participantes. |
| Notificações | [NotificationsPage](pages/notifications/NotificationsPage.tsx) | Consulta dos avisos e marcação de leitura. |
| Agenda | [AgendaPage](pages/agenda/AgendaPage.tsx) | Consultorias, horários e operações autorizadas dos participantes. |
| Avaliações | [ReviewsPage](pages/reviews/ReviewsPage.tsx), [AdminReviewsPage](pages/reviews/AdminReviewsPage.tsx) | Avaliações elegíveis, denúncias e moderação. |
| Financeiro | [FinancePage](pages/billing/FinancePage.tsx), [AdminBillingPage](pages/billing/AdminBillingPage.tsx) | Plano, situação financeira e configurações administrativas. A ativação externa é distinta do modo acadêmico. |
| Privacidade | [PrivacyPage](pages/privacy/PrivacyPage.tsx), [HealthPanel](pages/privacy/HealthPanel.tsx), [AdminPrivacyPage](pages/privacy/AdminPrivacyPage.tsx) | Consentimentos, dados privados, exportação, encerramento de conta e solicitações administrativas. |

Atleta, treinador e administrador podem participar da mesma área com operações diferentes. Por isso as páginas são agrupadas por assunto, em vez de duplicar toda a interface em três pastas por papel.

## Componentes

| Arquivo | Responsabilidade |
|---|---|
| [AppShell](components/layout/AppShell.tsx) | Estrutura da área autenticada e navegação adequada ao papel. |
| [Logo](components/Logo.tsx) | Identidade visual compartilhada. |
| [Feedback](components/ui/Feedback.tsx) | Componentes `State`, `Notice` e `Empty`: carregamento, erro, sucesso, repetição e estado vazio. |
| [PageTitle](components/ui/PageTitle.tsx) | Título, descrição e ação da página. |
| [Badge](components/ui/Badge.tsx) | Rótulo visual dos estados retornados pelo sistema. |
| [ContractEndAction](components/connections/ContractEndAction.tsx) | Ação de encerramento do vínculo, usada nas telas relacionadas. |
| [WorkoutDetails](components/workouts/WorkoutDetails.tsx) | Dados da ficha, blocos e execução; referência externa exibida como texto. |
| [MediaPanel](components/media/MediaPanel.tsx) | Arquivos privados e feedback, usando os serviços de upload. |

Componentes exclusivos de uma área também podem ficar ao lado de sua página, como o formulário de execução e a conversa. Componentes compartilhados ficam em `components`; funções de rede não ficam misturadas com o JSX da tela.

## Sessão, rotas e hooks

- [AuthContext](context/AuthContext.tsx): provedor da sessão, usuário atual e operações de autenticação.
- [ProtectedRoute](routes/ProtectedRoute.tsx): componente `Protected`, que trata carregamento/erro de sessão e redireciona quando o papel não corresponde à rota.
- [LoginRoute](routes/LoginRoute.tsx): decide se apresenta o login ou redireciona uma sessão já autenticada.
- [useRemote](hooks/useRemote.ts): consulta HTTP, estado de carregamento/erro, recarga e cancelamento de requisição obsoleta.
- [useEvents](hooks/useEvents.ts): conexão de eventos, reconexão e descarte de callbacks após desmontagem.
- [usePersistedRefresh](hooks/usePersistedRefresh.ts): atualização periódica dos registros persistidos enquanto a página está visível.

Esses controles de navegação melhoram a experiência, mas **a autorização precisa continuar sendo verificada pela API**. Esconder um botão ou redirecionar uma página não substitui a permissão no servidor.

## Serviços e contratos

- [api.ts](services/api.ts): cliente da API interna, envio de JSON e tratamento das respostas de erro.
- [media.ts](services/media.ts): tipo `MediaItem` e envio de arquivos, incluindo sessões divididas em partes. A autorização e os limites também são verificados no servidor.
- [googleCalendar.ts](services/googleCalendar.ts): integração opcional com Google Calendar/Meet, condicionada à configuração e autorização da conta.
- [googleCalendar.types.ts](services/googleCalendar.types.ts): tipo usado por esse adaptador, separado dos contratos da agenda interna.
- [formatters.ts](utils/formatters.ts): moeda, data e horários apresentados pela interface.
- [errors.ts](utils/errors.ts): extração da mensagem de erro usada pelas páginas.

Os contratos reais compartilhados com a API e o aplicativo ficam em [shared](../shared). O antigo `src/types.ts` reunia tipos do protótipo sem consumidores; os que não eram usados foram retirados. O tipo efetivamente utilizado pelo adaptador de calendário foi preservado no arquivo específico acima.

Ter um adaptador Google no código não comprova sua ativação externa. O estado dos fornecedores, CREF manual e financeiro acadêmico está no [guia dos serviços](../docs/operacao/servicos-externos-sprint-2.md).

## Estilos

[styles/index.css](styles/index.css) é a entrada única dos estilos e importa os arquivos na ordem necessária à cascata. O conteúdo anteriormente reunido em `styles.css` foi separado sem alterar a sequência das regras.

| Arquivo | Área |
|---|---|
| [base.css](styles/base.css) | Variáveis, regras gerais e botões. |
| [public.css](styles/public.css) | Identidade e página pública. |
| [auth.css](styles/auth.css) | Tela de acesso. |
| [workspace.css](styles/workspace.css) | Estrutura autenticada, painéis, listas e cartões. |
| [messages.css](styles/messages.css) | Conversa e elementos de comunicação. |
| [agenda.css](styles/agenda.css) | Calendário, compromissos e formulário de agendamento. |
| [athlete.css](styles/athlete.css) | Área do atleta e apresentação dos treinos. |
| [modals.css](styles/modals.css) | Diálogos e formulários relacionados. |
| [charts.css](styles/charts.css) | Gráficos e indicadores. |
| [account.css](styles/account.css) | Perfil, financeiro e avisos. |
| [responsive.css](styles/responsive.css) | Ajustes responsivos gerais preexistentes. |
| [application.css](styles/application.css) | Regras dos fluxos persistidos e das funcionalidades ampliadas; inclui ajustes responsivos próprios. |

Algumas regras visuais do protótipo permanecem nesses arquivos. A organização não as removeu apenas por parecerem antigas: excluir seletores exige conferir seus consumidores e o efeito visual. Não reordenar os imports sem verificar a cascata, principalmente nos tamanhos de celular.

## Como trabalhar nesta pasta

1. Localizar a funcionalidade na tabela de páginas.
2. Se a mudança for visual, conferir o componente e o arquivo de estilo correspondente.
3. Se envolver dados, conferir o serviço, o contrato em `shared` e a rota do servidor.
4. Preservar os caminhos de navegação, estados de carregamento/erro e permissões previstas.
5. Conferir tipos, compilação e os testes proporcionais à alteração.

Os comandos são executados na raiz do repositório: `pnpm dev:all` inicia web e API locais; `pnpm build` verifica tipos e compila; os testes de navegador usam `pnpm test:e2e` com os serviços e a base isolada preparados. Ver [manual de execução](../docs/operacao/manual.md) e [guia dos testes](../tests/README.md).

Configurações de banco, SMTP, armazenamento e chaves privadas pertencem ao servidor. Variáveis `VITE_*` são acessíveis ao cliente e não devem conter segredos. Não acrescentar credenciais ao código da interface.
