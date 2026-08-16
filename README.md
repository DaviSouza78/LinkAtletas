# LinkAtletas

Protótipo funcional e responsivo de uma plataforma que conecta atletas a treinadores verificados e centraliza a gestão do treinamento esportivo.

O projeto foi construído como base web do ecossistema LinkAtletas. A experiência do treinador prioriza desktop, enquanto a área do atleta é mobile-first e já serve como referência visual e funcional para um futuro aplicativo React Native.

Projeto Integrador Interdisciplinar II da Faculdade de Tecnologia SENAI Félix Guisard, desenvolvido para a Saga SENAI de Inovação em resposta à [demanda #12871](https://plataforma.gpinovacao.senai.br/plataforma/demandas-da-industria/interna/12871), proposta pela empresa Ivi-it.

### Equipe

| # | Integrante |
| --- | --- |
| 01 | João Gabriel Floriano Olimpio |
| 02 | Miguel Oliveira de Almeida |
| 03 | Lucas Souza Silva |
| 04 | Davi Marcondes Paes de Souza |
| 05 | João Pedro Fonseca Alves de Carvalho |
| 06 | Lucca Castilho Costa |

## O que está implementado

### Site público

- Landing page responsiva com proposta de valor, benefícios, fluxo do produto, segurança, FAQ e chamadas para os dois públicos.
- Comunicação explícita sobre validação de CREF, LGPD, atendimento remoto/híbrido e pagamentos protegidos.
- Identidade visual original e asset fotográfico local, sem dependência de banco de imagens externo.

### Autenticação demonstrativa

Dois acessos locais e separados por papel:

| Papel | E-mail | Senha |
| --- | --- | --- |
| Treinador | `emailtreinador@email.com` | `senhatreinador` |
| Atleta | `emailatleta@email.com` | `senhaatleta` |

A sessão é mantida no `localStorage`. Não existe autenticação real ou transmissão das credenciais neste protótipo.

### Painel do treinador

- Visão geral com alunos ativos, adesão, treinos, feedbacks, carga semanal e agenda.
- Gestão de alunos com busca e filtros por modalidade/status.
- Biblioteca de treinos com visualização em cards ou lista.
- Calendário de consultorias com propósito, descrição, atleta, horário e duração.
- Criação automática de evento e chamada do Google Meet quando o OAuth está configurado.
- Mensagens com histórico e envio local demonstrativo.
- Financeiro com receita recorrente, split ilustrativo, repasses e transações.
- Perfil profissional com CREF verificado, especialidades e status de documentação.

### Portal do atleta

- Início com treino do dia, ciclo atual, métricas e contato com o treinador.
- Matchmaking com percentual de compatibilidade, filtros e perfis verificados.
- Notificações de novas consultorias e cartão do próximo encontro, incluindo pauta e acesso ao Meet.
- Detalhe do treino com blocos, vídeo de orientação, esforço percebido e upload simulado.
- Mensagens responsivas.
- Perfil esportivo, configurações e central de privacidade.
- Navegação inferior própria para telas pequenas.

## Tecnologias

- React 19
- TypeScript
- Vite
- React Router
- Lucide React
- CSS responsivo sem framework de UI

Os dados são mockados em `src/data/mock.ts` para manter o protótipo demonstrável sem backend.

## Como executar

Requisitos: Node.js 20+ e pnpm (ou npm).

```bash
pnpm install
pnpm dev
```

Acesse `http://localhost:5173`.

Para validar o bundle de produção:

```bash
pnpm build
pnpm preview
```

## Estrutura principal

```text
src/
  components/       componentes compartilhados, navegação e shell
  context/          sessão e autenticação demonstrativa
  data/             atletas, treinadores, treinos e métricas mockadas
  pages/
    athlete/        experiência mobile-first do atleta
    coach/          painel web do treinador
    shared/         fluxos compartilhados, como mensagens
  App.tsx           rotas e proteção por papel
  styles.css        design system e breakpoints responsivos
```

## Rotas

| Rota | Finalidade |
| --- | --- |
| `/` | Site público |
| `/login` | Login por papel |
| `/treinador` | Dashboard do treinador |
| `/treinador/alunos` | Gestão de alunos |
| `/treinador/treinos` | Prescrição e biblioteca |
| `/treinador/consultorias` | Calendário, agendamento e Google Meet |
| `/treinador/mensagens` | Conversas e feedbacks |
| `/treinador/financeiro` | Receitas e repasses |
| `/treinador/perfil` | Perfil e validação profissional |
| `/atleta` | Início do atleta |
| `/atleta/descobrir` | Matchmaking |
| `/atleta/treino` | Execução e feedback do treino |
| `/atleta/mensagens` | Conversa com treinador |
| `/atleta/perfil` | Perfil e privacidade |

## Decisões de produto incorporadas

- O treinador só é apresentado ao atleta quando possui credencial verificada.
- O matchmaking explica a compatibilidade e considera modalidade, objetivo, orçamento, localização e forma de atendimento.
- As métricas são exibidas de forma flexível por modalidade; a modelagem definitiva deve usar um catálogo de tipos e valores de métricas.
- Saúde, biometria e vídeos aparecem como dados sensíveis e devem possuir consentimento, finalidade, retenção e controle de acesso no backend real.
- O financeiro representa recorrência e split, mas não processa pagamentos.
- O treinador agenda a consultoria; a plataforma registra uma notificação interna e, com o Google conectado, cria um evento com Meet e envia o convite de calendário ao atleta.
- Wearables e marketplace esportivo permanecem fora do escopo do MVP.

## Configurar Google Agenda e Meet

O modo local funciona sem credenciais: a agenda e a notificação do atleta são criadas, mas o link real do Meet fica pendente. Para habilitar a integração oficial:

1. Crie ou selecione um projeto no Google Cloud Console.
2. Ative a **Google Calendar API**.
3. Configure a tela de consentimento OAuth.
4. Crie um **OAuth Client ID** do tipo **Aplicativo da Web**.
5. Adicione `http://localhost:5173` em **Origens JavaScript autorizadas**. Na publicação, adicione também o domínio HTTPS de produção.
6. Copie `.env.example` para `.env` e informe o Client ID:

```env
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
```

7. Reinicie `pnpm dev`, entre como treinador, abra **Consultorias** e clique em **Conectar Google Agenda**.

A integração solicita somente o escopo `calendar.events`. Ao confirmar um agendamento, o sistema chama `events.insert` com `conferenceDataVersion=1`, solicita uma conferência `hangoutsMeet`, adiciona o atleta como participante e usa `sendUpdates=all` para enviar o convite.

O Client ID web não é um segredo, mas nunca adicione Client Secret ou tokens OAuth ao frontend. Para uma versão com agendamentos em segundo plano e acesso duradouro, use o fluxo de autorização por código com backend e armazenamento criptografado de refresh tokens.

## Próxima etapa recomendada

Transformar o protótipo em aplicação full-stack com API Node.js/TypeScript, PostgreSQL, armazenamento S3, autenticação baseada em papéis, trilha de auditoria, validação manual/assistida de CREF, gateway compatível com split/recorrência e políticas reais de retenção e consentimento LGPD.

## Aviso

Este projeto é um protótipo acadêmico. Dados, pagamentos, validações, envio de mídia e mensagens são simulados e não devem ser interpretados como implementação pronta para produção.
