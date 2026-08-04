# LinkAtletas 🏃‍♂️🤝🏋️‍♀️

**Matchmaking e Gestão de Treinamento Esportivo**

Projeto Integrador Interdisciplinar II — Faculdade de Tecnologia SENAI Félix Guisard
Desenvolvido no contexto da **Saga SENAI de Inovação / Desafio SENAI de Projetos Integradores**, em atendimento a uma demanda real da indústria.

> 📄 Demanda original: [Plataforma GP Inovação SENAI — Demanda #12871](https://plataforma.gpinovacao.senai.br/plataforma/demandas-da-industria/interna/12871)
> 🏢 Empresa demandante: **Ivi-it**
> 📍 Escola: SENAI/SC — Joinville Sul
> 🗓️ Vigência: 16/07/2026 a 16/12/2027 (17 meses)

---

## Índice

- [Sobre o projeto](#sobre-o-projeto)
- [A equipe](#a-equipe)
- [O problema](#o-problema)
- [Objetivo da solução](#objetivo-da-solução)
- [Benefícios esperados](#benefícios-esperados)
- [Como o produto vai funcionar](#como-o-produto-vai-funcionar)
- [Restrições e requisitos obrigatórios](#restrições-e-requisitos-obrigatórios)
- [Arquitetura e tecnologias](#arquitetura-e-tecnologias)
- [Roadmap / MVP](#roadmap--mvp)
- [Como será desenvolvido](#como-será-desenvolvido)
- [Status do projeto](#status-do-projeto)
- [Licença](#licença)

---

## Sobre o projeto

Este repositório contém o desenvolvimento do **LinkAtletas**, projeto criado pela nossa equipe para o **Desafio SENAI de Projetos Integradores**, etapa da Saga SENAI de Inovação em que equipes de alunos desenvolvem, ao longo de cerca de 6 meses, um protótipo funcional de média fidelidade como resposta a um problema real proposto por uma empresa parceira.

A demanda foi proposta pela empresa **Ivi-it** (área de Tecnologia da Informação, SC) e consiste em criar um **ecossistema digital de matchmaking e gestão de treinamento esportivo**, conectando atletas a treinadores qualificados e oferecendo ferramentas de acompanhamento de performance.

## A equipe

**Nome da equipe:** LinkAtletas

| # | Integrante |
|---|------------|
| 01 | João Gabriel Floriano Olimpio |
| 02 | Miguel Oliveira de Almeida |
| 03 | Lucas Souza Silva |
| 04 | Davi Marcondes Paes de Souza |
| 05 | João Pedro Fonseca Alves de Carvalho |
| 06 | Lucca Castilho Costa |

## O problema

O mercado de assessoria esportiva hoje é **fragmentado, descentralizado e dependente de indicações**. Isso gera dois grandes pontos de dor:

- **Para os atletas** (amadores a profissionais): dificuldade em encontrar, comparar e validar treinadores alinhados aos seus objetivos, orçamento e modalidade — especialmente fora dos grandes centros urbanos ou em esportes de nicho (ex.: um atleta de triatlo no interior pode não ter um técnico especializado disponível na sua região).
- **Para os treinadores**: crescimento estagnado pela limitação geográfica de captação de alunos, além de perda de tempo gerindo treinos, alunos e pagamentos em ferramentas não integradas (planilhas, WhatsApp, agendas separadas etc.).

Esse cenário resulta em **baixa eficiência de mercado, insegurança nas contratações** (falta de validação profissional) e **limita o desenvolvimento esportivo** de atletas que não têm acesso a orientação qualificada.

## Objetivo da solução

Desenvolver um **ecossistema digital (aplicativo mobile + plataforma web)** que resolva esse problema em duas frentes complementares:

1. **Conexão inteligente (Matchmaking)** — um algoritmo de recomendação que cruza o perfil do atleta (modalidade, nível de experiência, objetivos, orçamento e disponibilidade) com o portfólio do treinador (especializações, certificações, metodologia e valores), sugerindo os matches mais aderentes.
2. **Ambiente de gestão** — após o match, a plataforma oferece um espaço de trabalho onde o treinador prescreve treinos, envia vídeos de execução e acompanha a evolução do aluno, enquanto o atleta registra feedbacks, envia vídeos de sua performance para correção técnica e realiza o pagamento das mensalidades com segurança.

## Benefícios esperados

- ⏱️ Reduzir o tempo de busca e contratação de profissionais esportivos qualificados.
- 📈 Aumentar a taxa de captação de alunos para treinadores e assessorias esportivas.
- 💰 Diminuir custos operacionais dos treinadores, centralizando a gestão de alunos em uma única ferramenta.
- 🛡️ Reduzir o risco de lesões, garantindo que atletas sejam orientados por profissionais com credenciais verificadas.
- 🌍 Democratizar o acesso a treinos personalizados, viabilizando consultorias 100% remotas ou híbridas em diversas modalidades.

## Como o produto vai funcionar

### 1. Cadastro e validação de perfis
- **Atletas** criam perfil informando modalidade, nível de experiência, objetivos, orçamento e disponibilidade.
- **Treinadores** criam perfil informando especializações, metodologia, valores e **credenciais profissionais** (ex.: CREF ou certificação internacional equivalente), que passam por um processo obrigatório de validação antes da aprovação — a plataforma **não pode** liberar um treinador sem essa checagem, para evitar exercício ilegal da profissão.

### 2. Matchmaking
- Algoritmo de recomendação cruza os critérios de ambos os lados e sugere os treinadores mais compatíveis com cada atleta (e vice-versa).
- Sistema de **avaliações (reviews)** dos treinadores por atletas já atendidos, para reforçar a confiança nas contratações.

### 3. Gestão do treinamento
- Treinador prescreve treinos e envia vídeos de execução/orientação.
- Atleta registra feedback, sobe vídeos da própria performance para correção técnica.
- Acompanhamento de métricas de evolução — a arquitetura precisa ser **flexível o suficiente para múltiplas modalidades**, já que cada esporte tem métricas diferentes (ex.: tempo/distância na corrida, carga/repetições em treino de força, pontuação/tática em esportes de precisão).
- No futuro, previsão de **integração com dispositivos vestíveis (smartwatches)** para automatizar a coleta de dados de performance.

## Restrições e requisitos obrigatórios

Esses pontos foram definidos pela empresa demandante como não-negociáveis:

- ✅ **Validação profissional obrigatória**: nenhum treinador pode ser aprovado sem validação de registro profissional (CREF ou equivalente).
- ✅ **Conformidade com a LGPD**: a plataforma lida com dados sensíveis de saúde e biometria dos atletas, exigindo tratamento e armazenamento adequados à lei.
- ✅ **Plataformas distintas por público**: experiência do atleta prioritariamente **mobile** (iOS e Android); painel do treinador funcionando **perfeitamente em ambiente Web**.

## Arquitetura e tecnologias

> A stack abaixo segue a orientação definida com a empresa (React/TypeScript) e as restrições da demanda (apps mobile para atletas + painel web para treinadores). Itens marcados como "proposto" ainda podem ser ajustados pela equipe ao longo do desenvolvimento.

| Camada | Tecnologia | Observação |
|---|---|---|
| Painel Web (treinadores) | React + TypeScript | Definido pela equipe |
| App Mobile (atletas) | React Native + TypeScript *(proposto)* | Reaproveita conhecimento/código do time em React |
| Backend / API | Node.js + TypeScript *(proposto)* | REST/GraphQL, autenticação por papéis (atleta / treinador / admin) |
| Banco de dados | PostgreSQL *(proposto)* | Dados relacionais + histórico de treinos/métricas |
| Armazenamento de mídia | Object storage (ex. S3-compatível) *(proposto)* | Vídeos de execução e performance |
| Integrações futuras | APIs de wearables (Apple Health, Google Fit, Garmin etc.) | Fora do escopo do MVP |
| Infra / CI-CD | Docker + GitHub Actions *(proposto)* | A definir com o avanço do projeto |

## Roadmap / MVP

O desenvolvimento será dividido em fases incrementais, priorizando primeiro o núcleo do produto (cadastro, validação e matchmaking) antes de gestão avançada e pagamentos:

1. **Fase 1 — Cadastro e validação**: cadastro de atletas e treinadores, fluxo de validação profissional (CREF/certificações).
2. **Fase 2 — Matchmaking**: algoritmo de recomendação baseado nos critérios de ambos os perfis + listagem/filtro de treinadores.
3. **Fase 3 — Ambiente de gestão**: prescrição de treinos, upload de vídeos, registro de métricas por modalidade, feedback do atleta.
4. **Fase 4 — Avaliações**: sistema de reviews de treinadores.
5. **Fase 5 (futuro, fora do MVP)** — integração com wearables para coleta automática de dados de performance.

## Como será desenvolvido

- **Metodologia**: desenvolvimento incremental por sprints, com entregas alinhadas às Unidades Curriculares (UCs) do curso e ao cronograma do Desafio SENAI de Projetos Integradores.
- **Fidelidade do protótipo**: conforme exigido pela Saga, o foco é entregar um **protótipo funcional de média fidelidade**, priorizando o fluxo principal (cadastro → validação → match → gestão do treino) antes de funcionalidades secundárias.
- **Privacidade por padrão**: por lidar com dados sensíveis de saúde/biometria, decisões de modelagem de dados e armazenamento seguirão princípios de minimização de dados e conformidade com a LGPD desde o início do projeto.
- **Separação de experiências**: o time desenvolverá o painel web (treinadores) e o app mobile (atletas) como frentes paralelas, compartilhando a mesma API/backend.

## Licença

Projeto acadêmico desenvolvido para fins educacionais no âmbito do Desafio SENAI de Projetos Integradores. Licença a definir pela equipe.
