# Contratos compartilhados do LinkAtletas

Esta pasta mantém as definições de dados utilizadas pelo [site](../src/README.md), pela [API interna](../server) e pelo [aplicativo](../mobile/README.md). Seu objetivo é manter essas três partes compatíveis sem duplicar os mesmos tipos e catálogos em vários lugares.

## Por que esta pasta existe?

Quando o treinador publica um treino, a interface envia dados ao servidor. O servidor salva o registro e o disponibiliza ao atleta, pelo site ou aplicativo. Todos precisam concordar sobre os campos e os estados desse treino.

Por exemplo, o tipo `WorkoutInput` define título, vínculo, modalidade, data, instruções, situação e blocos. `Workout` acrescenta os dados retornados, como identificador, participantes e execução. As partes do sistema importam essas definições da mesma fonte.

Sem esse compartilhamento, seria necessário repetir e manter definições equivalentes no site, servidor e aplicativo. Uma alteração poderia ser aplicada em uma cópia e esquecida nas outras. A pasta não é uma exigência do React ou do PostgreSQL; é uma escolha de organização que resolve essa necessidade do projeto. **Na estrutura atual, seus arquivos são importados pelo código: removê-los sem substituir os usos quebra a compilação.**

## O que significa “contrato”?

Um contrato de dados descreve o formato esperado na comunicação: nomes de campos, tipos, campos opcionais e estados previstos. O nome `contracts` não se refere somente ao vínculo entre atleta e treinador.

A pasta contém dois tipos de recurso:

- **Tipos e interfaces TypeScript:** ajudam o compilador e o desenvolvedor a verificar a compatibilidade do código. São removidos na geração do JavaScript; não validam sozinhos o JSON recebido pela rede.
- **Constantes e catálogos:** valores efetivos, como modalidades e objetivos, usados em execução para preencher opções e apoiar a validação no servidor.

## Arquivos e responsabilidades

| Arquivo | Conteúdo | Exemplos de uso |
|---|---|---|
| [contracts.ts](contracts.ts) | Papéis, perfis, verificação profissional, vínculos, treinos, blocos, execuções, métricas, painel e formato de erro. Também define `SPORTS`, `GOALS`, `LEVELS` e `SLOTS`. | Interface de perfil, autenticação, prescrição de treino e validação dos catálogos no servidor. |
| [interaction-contracts.ts](interaction-contracts.ts) | Mensagens, notificações, avaliações, consultorias, entrada de agendamento e eventos de atualização. | Conversa entre participantes, agenda e atualização de notificações. |
| [billing-contracts.ts](billing-contracts.ts) | Configuração financeira, planos, carteira, assinaturas, pagamentos, estados e resumo de valores. | Telas financeiras e módulo financeiro da API. Define formatos; não realiza cobranças nem ativa o Asaas. |

### Exemplos de consumidores reais

- [ProfilePage](../src/pages/profile/ProfilePage.tsx) usa contratos e catálogos para o perfil.
- [Validação do servidor](../server/shared/validation.ts) utiliza os mesmos catálogos ao verificar entradas.
- [WorkoutsScreen do aplicativo](../mobile/src/screens/workouts/WorkoutsScreen.tsx) utiliza os formatos de treino e métrica.
- [useEvents](../src/hooks/useEvents.ts) usa o formato dos eventos de comunicação.
- [Módulo financeiro](../server/modules/billing) utiliza as definições financeiras.

## O que esta pasta não faz

- Não guarda contas, registros do banco, arquivos enviados ou credenciais.
- Não abre conexão com o Neon, Tigris, Brevo ou outros serviços.
- Não autentica usuários, decide permissões ou executa as operações de negócio.
- Não cria tabelas nem aplica migrações do PostgreSQL.
- Não substitui a validação dos dados recebidos pelo servidor.
- Não implementa uma API externa de CREF. Os tipos de verificação representam o fluxo atual de conferência manual.

O dado real passa pela API e pelo banco. A definição compartilhada descreve o formato que o código espera; não é uma cópia dos dados armazenados.

## Diferença entre `shared/` e `server/shared/`

| Pasta | Alcance |
|---|---|
| `shared/` | Tipos e catálogos que podem ser reutilizados pelo site, API e aplicativo. |
| [server/shared/](../server/shared) | Recursos internos do servidor: segurança, erros, validação, criptografia e documentação de respostas. Não devem ser importados pelo navegador para executar operações privadas. |

Os formatos TypeScript também não substituem a [documentação OpenAPI](../docs/evolucao/openapi.json). O [guia da API](../docs/evolucao/api.md) e o Swagger descrevem as rotas HTTP. A autenticação web utiliza sessão por cookie; as rotas nativas fornecem token Bearer ao aplicativo. O resumo antigo de rotas foi retirado de `contracts.ts` para evitar duplicidade e a indicação incorreta de cookie obrigatório para todos os clientes.

## Conferência dos contratos — 28/10/2026

Os três arquivos TypeScript foram comparados com os campos selecionados e retornados pelos módulos da API, os schemas de entrada e os consumidores web/móveis.

| Arquivo | Resultado da revisão |
|---|---|
| `contracts.ts` | Acrescentados `currentStatus` e `currentReason` em `Verification`, já retornados pela API. O estado atual do perfil é diferente da decisão histórica da solicitação. A definição duplicada nas páginas de CREF foi removida. Os campos adicionais permanecem opcionais para preservar compatibilidade com consumidores e respostas anteriores. |
| `interaction-contracts.ts` | `ConsultationInput.description` passou a ser opcional, conforme a API: quando omitida na criação, o servidor usa texto vazio. Na resposta `Consultation`, a descrição continua obrigatória. Mensagens, notificações, avaliações e eventos foram conferidos sem necessidade de alteração. |
| `billing-contracts.ts` | Configuração, planos, carteira, assinaturas, pagamentos, totais e estados conferidos contra a API e as restrições do banco. Não foi identificada divergência que justificasse mudança. Os valores `amountCents` estão em centavos e `commissionBps` em pontos-base: 100 pontos-base equivalem a 1%. |

Esta revisão alinha as definições ao comportamento existente. Não ativa integrações externas, não altera tabelas e não representa conclusão da auditoria ampliada de permissões. As verificações de tipo e os testes complementam a comparação; os tipos sozinhos não fiscalizam respostas JSON em execução.

## Cuidados ao alterar um contrato

1. Identificar se o campo é de entrada, de resposta ou um catálogo utilizado em execução.
2. Localizar os consumidores no site, API, aplicativo e testes.
3. Atualizar a validação e a implementação do servidor quando necessário; editar uma interface não muda automaticamente o comportamento da API ou o banco.
4. Avaliar compatibilidade com dados existentes e versões anteriores do aplicativo. Um campo obrigatório novo pode exigir adaptação ou migração.
5. Conferir os tipos, os testes afetados e a documentação da API.

Não colocar senhas, chaves, dados pessoais ou funções exclusivas do servidor nesta pasta. Acrescentar uma modalidade ao catálogo, por exemplo, exige conferir também métricas, regras e formulários; alterar uma lista não garante que todo o fluxo suporte a novidade.

## Como verificar uma alteração

Executar os comandos a partir da raiz do repositório:

- `pnpm typecheck`: verifica a compatibilidade TypeScript da web, servidor e testes da raiz.
- `pnpm --dir mobile typecheck`: verifica o aplicativo, que possui configuração própria.
- `pnpm build`: verifica os tipos da raiz e compila a interface web.
- Executar os testes relacionados à mudança, seguindo o [guia de testes](../tests/README.md). Testes de integração exigem ambiente isolado; nunca apontá-los para produção.

Compilação aprovada ajuda a detectar inconsistências entre os contratos e seus consumidores, mas não comprova que todas as respostas reais recebidas pela rede estão corretas. Essa verificação depende da validação do servidor e dos testes dos fluxos.
