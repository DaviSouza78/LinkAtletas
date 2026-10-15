# Pendências de Lucca e do grupo

Atualizado em 15/10/2026. Os nove entregáveis técnicos da Sprint 2 possuem referências no [checklist](checklist-sprint-2.md). O código está publicado na `main`; [PR #1 integrado](https://github.com/DaviSouza78/LinkAtletas/pull/1) e [CI completa aprovada](https://github.com/DaviSouza78/LinkAtletas/actions/runs/38656142290). Os itens abaixo dependem de pessoas, acessos ou ambientes externos.

## Para a entrega acadêmica

- [ ] Revisar com o grupo a ERS, diagramas, backlog e demonstração, seguindo o [manual](manual.md); registrar eventuais ajustes solicitados pelo professor.
- [ ] Informar o nome e as competências da Eletiva I para completar a [matriz de UCs](rastreabilidade.md), sem inventar conteúdo curricular.
- [ ] Cada integrante registrar sua participação efetiva e realizar sua própria entrega no ambiente acadêmico. O enunciado exige entrega individual de todos.
- [ ] Conferir prazo, formato de anexos e exigências adicionais no ambiente da disciplina. Não foi efetuada submissão acadêmica automática.

## Para executar no computador de Lucca

- [ ] Iniciar o Docker Desktop e confirmar `Engine running` antes dos comandos do README. Na retomada de 15/10, o Desktop falhou na inicialização do Inference manager porque o Windows não permitiu acessar o socket `dockerInference`. A tentativa de preservá-lo por renomeação também foi recusada pelo sistema. Reabra o Docker Desktop; se o erro persistir, reinicie o Windows e tente novamente. Nenhum banco ou volume foi apagado. A validação final completa foi executada e aprovada no ambiente isolado do GitHub.

## Para usar serviços externos ou publicar a aplicação

- [ ] Disponibilizar domínio/infraestrutura e configurar banco, armazenamento privado, SMTP, chave de cifra e HTTPS conforme o [manual de operação](manual.md). O ambiente Docker/TLS local já foi verificado; não há site/API públicos implantados.
- [ ] Configurar conta e credenciais Asaas de sandbox, carteira/split e webhook, executar uma cobrança de teste e conferir cancelamento e conciliação. O adaptador possui testes HTTP controlados; nenhum pagamento real foi realizado. Ativar produção só após homologação e decisão do responsável.
- [ ] Obter acesso autorizado ao serviço oficial de CREF se a integração automática for exigida. A conferência manual com auditoria já está implementada.
- [ ] Configurar Google OAuth/Agenda/Meet se exigido. Abrir um link de calendário/reunião não equivale a sincronização bidirecional.
- [ ] Validar os textos e procedimentos operacionais de privacidade/retenção com o responsável pelo projeto antes de receber dados reais.

Credenciais devem ser configuradas em variáveis de ambiente ou secrets do provedor. Não colocar chaves no repositório, nos anexos ou no chat.

## Para homologar e distribuir o aplicativo

- [x] APK Android de verificação compilado: [run e SHA-256](publicacao.md), [registro do build](evidencias/github-android-build.json).
- [x] Instalação e abertura da tela de login no emulador Android API 35: [resultado](evidencias/android-emulator-result.json) e [captura real](evidencias/android-emulator-startup.png).
- [ ] Definir uma API HTTPS acessível ao aparelho, configurar a variável pública de repositório `EXPO_PUBLIC_API_URL` e executar novamente o workflow manual `Android APK verification`. O APK existente aponta para `https://api.linkatletas.example/api`, um endereço documental sem backend real.
- [ ] Executar o [roteiro completo em aparelho](evidencias/mobile-verificacao.md), incluindo sessão, uploads, chat, recuperação, privacidade, conectividade e TalkBack/VoiceOver; registrar modelo/versão e evidências.
- [ ] Para lojas: fornecer conta e chave de assinatura de distribuição Android; para IPA/iOS, conta/certificados Apple e ambiente Mac/Xcode ou serviço de build autorizado. A chave de desenvolvimento do APK existente serve para verificação.

## Evoluções registradas

IA treinada, autosave contínuo, novas modalidades administrativas, broker/autoescala e sincronização Google bidirecional permanecem no [backlog](backlog.md). São evoluções declaradas; não devem ser apresentadas como implementadas nem confundidas com ausência dos nove artefatos obrigatórios da Sprint 2.
