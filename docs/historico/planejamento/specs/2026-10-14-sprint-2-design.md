# Sprint 2 — proposta de implementação para revisão

Data: 14/10/2026. Status: aprovada pelo usuário Lucca em 14/10/2026. Branch local: `sprint-2`.

## Objetivo e ponto de partida

Transformar o protótipo existente em uma aplicação integrada que demonstre o processo de conexão entre atleta e treinador e o acompanhamento de um treino, com persistência real, validações, testes e documentação rastreável. Prazo acadêmico informado no roteiro: 26/10/2026.

Base: repositório `DaviSouza78/LinkAtletas`, commit `17b32c74cc79c1fab05d762cf6346ad87ecc749d`, ERS v1.0 e roteiro da disciplina fornecidos na pasta `C:\Users\user\Downloads\integrador`.

O repositório contém React/TypeScript/Vite, estilos e componentes próprios. Autenticação, contratação, criação de treinos e feedback são demonstrativos. Não há API própria ou banco integrado. O trabalho será realizado no clone em `C:\dev\projects\LinkAtletas`; a falta de acesso como colaborador não impede desenvolvimento local. Publicação no GitHub depende de acesso posterior ou de um fork do usuário.

## Abordagens consideradas

| Alternativa | Benefício | Custo e impacto |
|---|---|---|
| A — Web existente + API Node/TypeScript + PostgreSQL | Reutiliza as telas, mantém a tecnologia prevista e permite demonstrar o fluxo com dois usuários reais | Adia o aplicativo nativo para a etapa seguinte; esse recorte precisa ser aprovado e registrado |
| B — Mesma base com aplicativo React Native já nesta Sprint | Aproxima a entrega da arquitetura original web/mobile | Inclui um segundo cliente, configuração Android/iOS e mais cenários de teste antes do prazo |
| C — Backend gerenciado com autenticação e banco como serviço | Reduz parte do trabalho de infraestrutura | Introduz dependência de conta externa e altera a arquitetura Node prevista e a forma de evidenciar o backend |

Recomendação: alternativa A. A proposta não remove React Native, pagamento ou mídia do projeto; distribui a implementação entre as Sprints. Se a avaliação exigir aplicativo nativo já na Sprint 2, selecionar B antes da implementação.

## Escopo funcional proposto para a Sprint 2

1. Cadastro real de atleta e treinador, login, consulta da sessão e logout.
2. Edição dos perfis com modalidade, nível, objetivo, orçamento, disponibilidade, localização e dados profissionais pertinentes.
3. Submissão do número de CREF e referência de comprovação. O treinador começa pendente; um administrador aprova ou reprova e informa justificativa. O sistema registra responsável e data da decisão. Aprovação neste ambiente significa conferência manual registrada, sem alegar consulta automática ao conselho.
4. Busca e recomendação de treinadores aprovados com pontuação calculada a partir dos perfis. Explicação dos critérios, filtros e estado sem resultados.
5. Solicitação de contratação persistida; o treinador aceita ou recusa. Apenas o aceite cria vínculo ativo. A mesma solicitação não pode ser aceita duas vezes nem gerar vínculos duplicados.
6. Carteira de alunos baseada em vínculos reais.
7. Treinador cria uma ficha com data, modalidade, orientações e blocos de exercícios; pode salvar rascunho e publicar. Somente vínculos ativos permitem prescrição.
8. O atleta vê suas fichas publicadas, registra execução completa ou parcial, métricas da modalidade, esforço de 1 a 10 e comentário. O treinador consulta esse retorno.
9. Inícios do atleta e treinador exibem os dados resultantes do fluxo integrado, com estados vazios para novas contas.
10. Telas centrais mantêm a identidade visual existente e funcionam em desktop e celular.

RF prioritários: RF-01 a RF-10, RF-14, RF-16, RF-17 e RF-23. RF-04 será atendido nesta etapa pela alternativa manual já descrita na ERS, com consulta automática registrada como pendência. A classificação de atendimento parcial será explícita.

## Funcionalidades reservadas e limitações declaradas

- Gateway, pré-autorização, cobrança recorrente, split e inadimplência: etapa financeira da Sprint 3, conforme planejamento original. O aceite nesta Sprint ativa um vínculo acadêmico sem cobrança. A interface precisa declarar essa condição, sem representar pagamento como confirmado.
- Upload/armazenamento de vídeos e correção de mídia: Sprint 3. Orientações de treino podem conter URL HTTPS de vídeo; isso não será apresentado como implementação do upload S3.
- Chat em tempo real, avaliações públicas, gestão avançada de assinaturas e moderação: backlog da Sprint 3.
- Aplicativo React Native: etapa seguinte na alternativa A; decisão de escopo sujeita à revisão do usuário e ao alinhamento acadêmico necessário.
- Google Agenda/Meet existente: preservar como integração opcional, sem acionar contas ou enviar convites durante desenvolvimento e testes. Consultorias e outras áreas fora do fluxo terão seu estado demonstrativo identificado até serem integradas.
- Não alegar atendimento integral da LGPD, testes iOS/Android nativos ou validação automática de CREF a partir deste incremento.

Nenhuma tarefa reservada será marcada como concluída nos documentos da Sprint 2.

## Arquitetura proposta

- Frontend: React/TypeScript/Vite atual, com cliente HTTP centralizado, estado de sessão carregado da API e componentes reutilizáveis de carregamento, erro e ausência de dados.
- API: Node.js/TypeScript com Fastify, organizada por autenticação, perfis, validação profissional, recomendação, vínculos e treinos. Rotas sob `/api`.
- Banco: PostgreSQL único, acesso parametrizado por `pg`, migrations SQL versionadas e dados fictícios de demonstração inseridos por comando explícito. A escolha de banco único resolve a menção simultânea a MySQL e PostgreSQL da ERS.
- Desenvolvimento: frontend encaminha `/api` para o servidor. Comandos reproduzíveis iniciam banco, aplicam migrations, carregam dados e executam os serviços.
- Banco em Docker Compose com volume persistente; também aceitar `DATABASE_URL` para uma instância PostgreSQL existente. Nesta máquina Docker Desktop está instalado, mas o engine não estava ativo durante a inspeção. Isso deverá ser resolvido e testado na implementação, sem substituir silenciosamente PostgreSQL por um banco em memória.
- Produção de demonstração: API e frontend no mesmo domínio para reduzir configuração de sessão e origem. Credenciais reais ficam em variáveis de ambiente fora do Git.

Estrutura prevista:

```text
server/
  app.ts                  composição e configuração da API
  index.ts                inicialização e encerramento
  db/                     conexão, migrations e seed
  modules/auth/           autenticação, sessões e autorização
  modules/profiles/       dados de atleta e treinador
  modules/verification/   decisão manual e auditoria
  modules/matching/       filtros e pontuação
  modules/contracts/      solicitações, aceite e vínculos
  modules/workouts/       prescrição, publicação e execução
  shared/                 erros, validação e utilitários comuns
src/services/api.ts       comunicação HTTP do frontend
src/pages/admin/          fila de validação profissional
tests/                    integração e testes do fluxo no navegador
docs/sprint-2/            ERS, diagramas, backlog, decisões e evidências
```

Os módulos expõem interfaces pequenas. Não reestruturar componentes visuais sem necessidade para a integração.

## Modelo de dados e invariantes

Entidades: usuários; sessões; perfis de atleta e treinador; modalidades; disponibilidades; submissões e auditoria de validação; solicitações de contratação; vínculos; fichas de treino; blocos de exercícios; catálogo de tipos de métricas por modalidade; execuções e valores de métricas.

- E-mail único sem distinção de maiúsculas; papel definido no servidor. Cadastro público não pode criar administradores.
- Senhas armazenadas somente como hash com sal usando função própria para senhas. Sessões opacas e expirantes armazenadas no servidor; cookie HttpOnly, SameSite e Secure quando HTTPS estiver habilitado.
- Consultas de aluno, vínculo, treino e execução verificam o usuário autenticado e a propriedade do recurso.
- Administrador é criado por comando de bootstrap/seed de desenvolvimento. Não há senha administrativa fixa habilitada silenciosamente em produção.
- Decisão profissional e auditoria são gravadas na mesma transação.
- Treinadores pendentes ou reprovados não aparecem em busca nem podem receber novas solicitações.
- Aceite só pelo treinador destinatário e com solicitação pendente; transação e restrições de unicidade protegem concorrência.
- Treino pertence a um vínculo; rascunhos ficam visíveis somente ao treinador proprietário.
- Execução pertence ao atleta do vínculo e à ficha publicada. Reenvio atualiza o mesmo registro definido para aquela ficha, sem duplicar a contagem.
- Valores de métricas seguem tipo, unidade e limites do catálogo da modalidade. O sistema não permitirá números negativos em duração, distância ou carga.

## Matchmaking inicial explicável

Não requer treinamento de IA. Modalidade compatível e validação profissional são filtros obrigatórios. Atendimento presencial exige localização compatível. Para os profissionais elegíveis, calcular pontuação de 0 a 100 com critérios documentados: objetivo/especialidade 30 pontos, nível atendido 20, orçamento 25 e disponibilidade 25. Critérios sem informação não recebem pontos e são explicados na resposta. Empates usam nome e identificador para ordem estável.

Esses pesos são uma decisão inicial proposta, com casos de teste determinísticos. O relatório registrará a base fictícia e não alegará validação estatística da recomendação.

## API e tratamento de erros

Grupos de endpoints: `/auth/register`, `/auth/login`, `/auth/session`, `/auth/logout`; `/profiles/me`; `/coaches`; `/verifications`; `/admin/verifications`; `/contracts`; `/workouts`; `/workouts/:id/execution`; `/dashboard`.

Detalhar contratos de requisição/resposta e permissões em OpenAPI, com exemplos fictícios e respostas 400, 401, 403, 404 e 409. Nenhuma resposta devolve hash de senha, token de sessão ou documento privado de outro usuário.

Validação no servidor é obrigatória; validação no formulário melhora a experiência. Padronizar erro com código, mensagem e campos afetados. Dados inválidos retornam 400; sessão ausente 401; acesso indevido 403 ou 404 conforme recurso; conflito de estado/duplicidade 409; falha inesperada 500 com mensagem pública genérica e log sanitizado.

Proteger mutações por verificação de origem/CSRF, cookies apropriados e limitação de tentativas de login. Não registrar senhas, cookies, corpos completos de dados pessoais ou documentos em logs. Guardar somente dados necessários ao fluxo; coleta adicional de saúde/biometria exige consentimento específico e não integra o cadastro mínimo.

## Validação técnica e evidências

1. Registrar o resultado do build original antes de mudanças.
2. Testar regras de pontuação, restrições de prescrição, validação de métricas e transições de solicitação.
3. Testar API contra PostgreSQL isolado: cadastro, e-mail duplicado, login incorreto, sessão expirada/ausente, aprovação profissional, busca, contratação, rascunho/publicação e execução.
4. Verificar isolamento entre dois atletas e entre dois treinadores; tentativa de acesso a recursos de terceiros precisa falhar.
5. Testar o fluxo completo no navegador com contextos separados de administrador, treinador e atleta. Recarregar a página e reiniciar a API para comprovar persistência.
6. Verificar as telas centrais em larguras de 390 px e 1440 px, sem rolagem horizontal causada pelo layout, com formulários operáveis por teclado.
7. Gerar logs, relatório de execução e capturas reais. Falhas e verificações não executadas serão declaradas. Não criar evidências de aprovação profissional externa ou pagamento real.

Vitest poderá cobrir testes de unidade/API; Playwright cobrirá o navegador. Testes de integração não usarão banco compartilhado com os dados de demonstração.

## Documentação e rastreabilidade

- ERS v1.1 da Sprint 2 em formato editável no repositório, preservando o PDF original da Sprint 1 como referência histórica. Corrigir o título RF-02 e registrar RF-25–RF-32 como referências sem especificação encontrada, sem inventar requisitos atribuídos à entrega anterior.
- Diagramas atualizados de casos de uso, classes, DER e duas sequências dos processos principais, com fonte Mermaid e representação visual para revisão. Identificadores coerentes com os RF textuais.
- Backlog por requisito e entregável, com estados reais, critérios de aceite e pendências. Não atribuir contribuição individual sem evidência.
- Registro de decisões: banco único, validação manual, critérios de match, momento do aceite, recorte web/mobile e integrações reservadas.
- Registro de dificuldades técnicas e soluções efetivamente encontradas.
- OpenAPI; README e guia de execução, variáveis, migrations, dados de demonstração, testes e limitações.
- Matriz requisito → endpoint/tela → teste → evidência e relação inicial com UCs. A eletiva permanece identificada como informação curricular a confirmar, sem declarar uma disciplina fictícia.

## Critérios para considerar a Sprint 2 pronta tecnicamente

- Uma instalação seguindo o README cria o banco e inicia os serviços.
- Uma conta nova não depende de dados hardcoded para usar o fluxo central.
- O treinador pendente fica fora da busca, a decisão administrativa persiste e libera o perfil aprovado.
- Um atleta encontra um treinador, solicita vínculo e aguarda aceite; recusas e duplicidades são tratadas.
- Um treinador aceita, publica uma ficha e recebe o registro de execução do atleta correto.
- Os dados continuam após recarregar a interface e reiniciar o servidor.
- A API rejeita dados inválidos e acesso de terceiros, com mensagens compreensíveis na interface.
- Build, testes da API/banco e fluxo de navegador passam, ou o relatório declara de forma explícita impedimentos e pendências que impossibilitam concluir a entrega.
- Os nove entregáveis da Sprint 2 possuem artefato ou evidência verificável. A aceitação acadêmica continua sendo do professor.

## Revisão desta proposta

Conferido contra os entregáveis e os RF centrais: arquitetura, fluxo, persistência, permissões, erros, testes e documentação estão definidos. As decisões que alteram a distribuição original de escopo estão explicitadas, especialmente web responsiva antes de React Native e ativação acadêmica sem gateway. Proposta aprovada pelo usuário; implementação autorizada em 14/10/2026.
