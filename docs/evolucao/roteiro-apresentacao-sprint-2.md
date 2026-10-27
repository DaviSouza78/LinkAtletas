# Roteiro de apresentação da Sprint 2

**Ordem:** ERS → GitHub → arquitetura e serviços → site → testes/API → decisões e próximos passos.
**Tempo sugerido:** 12–15 minutos. Usar os itens abaixo como lembrete, sem ler os documentos inteiros.

## Antes de começar

- [ ] Abrir [ERS completa em PDF](ERS-template-original-atualizada.pdf), [GitHub](https://github.com/DaviSouza78/LinkAtletas) e [site](https://link-atletas.vercel.app).
- [ ] Preparar contas fictícias e separar atleta, treinador e administrador em perfis/navegadores diferentes.
- [ ] Deixar [checklist da entrega](checklist-sprint-2.md), [diagramas](diagramas.md), [backlog](backlog.md) e [evidências](implantacao-2026-10-26.md) acessíveis.
- [ ] Não mostrar senhas, arquivos `.env`, chaves ou URLs de conexão com credenciais.

## 1. ERS — contexto e requisitos

- Objetivo do LinkAtletas e problema atendido.
- Atores: atleta, treinador e administrador.
- Requisitos funcionais, não funcionais e regras de negócio.
- CREF: conferência manual e auditada; automação como evolução.
- Diagramas: casos de uso, classes, DER e sequências.
- Casos de teste e histórico das revisões.
- Versão completa no template; síntese auxiliar não substitui o PDF completo.

## 2. GitHub — código e organização

- README e índice da documentação.
- Código: `src`, `server`, `shared` e `mobile`.
- Commits, pull requests e integração na `main`.
- Actions: build, testes, documentação e compilação Android.
- Checklist: referências dos nove entregáveis.

## 3. Arquitetura, banco e serviços externos

**Caminho dos dados:** site/app → API Fastify → PostgreSQL no Neon.

- **Vite + React:** interface web; **Node.js + Fastify:** API.
- **Vercel:** interface e API publicadas no mesmo domínio.
- **Neon:** PostgreSQL na nuvem; contas, perfis, vínculos, treinos e demais registros.
- **Tigris:** documentos e vídeos privados cifrados; banco guarda referências/metadados.
- **Brevo / SMTP:** envio de e-mails, incluindo recuperação de senha.
- **cron-job.org:** chama a rota protegida de tarefas a cada minuto; processa pendências e expirações.
- **Docker local:** PostgreSQL + SeaweedFS + Mailpit para desenvolver e testar.
- **Separação:** produção, Preview e desenvolvimento; dados não sincronizam automaticamente.
- **Independência:** desligar Docker/computador não interrompe o site na nuvem.
- **Asaas:** integração financeira preparada; modo acadêmico sem cobrança real.
- **Google Agenda/Meet:** integração opcional, sem homologação externa presumida.

## 4. Site — fluxo principal de ponta a ponta

1. Página inicial e visualização responsiva no celular.
2. Cadastro/login e preenchimento do perfil do atleta.
3. Treinador submete CREF/evidência.
4. Administrador confere e registra a decisão.
5. Atleta encontra treinador compatível e solicita vínculo.
6. Treinador aceita o vínculo.
7. Treinador cria e publica treino.
8. Atleta registra execução e feedback.
9. Treinador consulta o resultado; atualizar a página para mostrar persistência.

**CREF fictício:** identificar como cenário de teste; não apresentar como habilitação profissional real.

## 5. Complementos e validações

- Mensagens entre as duas contas e notificações.
- Arquivo privado, autorização e consentimento de performance.
- Agenda e avaliações, se houver tempo; avaliação exige elegibilidade do vínculo.
- Campo obrigatório, login inválido e restrições por papel.
- Recuperação de senha; não depender da chegada de e-mail durante a apresentação.
- Financeiro: mostrar claramente o modo acadêmico.

## 6. API, testes e aplicativo

- [Swagger da API](https://link-atletas.vercel.app/api/docs): autenticação, vínculos e treinos.
- [Saúde da API](https://link-atletas.vercel.app/api/health): conexão com PostgreSQL.
- 99 testes de API/unidade aprovados; execução completa de navegador aprovada na CI.
- Evidências de responsividade, permissões, persistência e arquivos de 5/50 MiB.
- Recuperação: token de uso único e revogação de sessões; aceite SMTP não garante caixa de entrada.
- APK: compilado com URL HTTPS, instalado e iniciado em emulador.
- Distinguir evidências locais, Preview e produção; emulador não comprova aparelho físico/iOS.

## 7. Decisões, dificuldades e encerramento

- [Decisões](decisoes.md): CREF manual, PostgreSQL e evolução do escopo.
- Dificuldades: runtime/rotas da Vercel, integrações e limite de upload.
- Solução de upload: partes de 3 MiB, mantendo limite de 50 MiB para vídeo.
- [Backlog](backlog.md): pagamentos reais, dispositivos/lojas e evoluções futuras.
- [Matriz de UCs](rastreabilidade.md) e participação dos integrantes.
- Encerrar voltando ao checklist dos entregáveis.

## Conferência final dos nove entregáveis

### 1. Código-fonte atualizado e versionado

- [ ] Abrir a `main` do [GitHub do grupo](https://github.com/DaviSouza78/LinkAtletas), mostrar o README e as pastas `src`, `server`, `mobile` e `tests`.
- Mostrar a lista de commits e abrir um PR integrado, como o [PR #3 da implantação](https://github.com/DaviSouza78/LinkAtletas/pull/3) ou o [PR #4 da organização](https://github.com/DaviSouza78/LinkAtletas/pull/4).
- Destacar: código, documentação e alterações possuem histórico; a entrega não depende apenas dos arquivos de um computador.

### 2. Fluxo principal funcional de ponta a ponta

- [ ] Demonstrar atleta, treinador e administrador: perfil → submissão/conferência manual de CREF → descoberta → solicitação e aceite do vínculo → publicação do treino → execução e feedback.
- Mostrar o resultado registrado pelo atleta na conta do treinador; atualizar a página para comprovar que permanece salvo.
- Se o tempo for curto, deixar contas e perfis preparados e executar ao vivo o vínculo e o treino. Dizer quais etapas estavam previamente preparadas.

### 3. Banco de dados criado e integrado

- [ ] Abrir o [DER](diagramas.md) e apontar as relações entre `users`, `profiles`, `contracts`, `workouts` e `executions`.
- Abrir [saúde da API](https://link-atletas.vercel.app/api/health): mostrar `ok: true` e `database: postgresql`.
- Mostrar um dado fictício salvo no site e recuperado após atualizar a página. Se abrir o Neon, mostrar as tabelas e somente dados de demonstração, sem a conexão ou credenciais.
- Explicar em uma frase: PostgreSQL é o banco; Neon hospeda o banco de produção; a API controla o acesso. Docker mantém outro banco local, independente.

### 4. Interface responsiva integrada ao back-end

- [ ] Mostrar uma tela funcional no desktop e depois na visualização de celular, com menu, formulário e botões utilizáveis.
- Salvar ou consultar um registro real pela interface; demonstrar que a outra conta recebe o resultado.
- Se perguntarem como integra: navegador → API Fastify na Vercel → PostgreSQL no Neon. A adaptação visual não substitui essa demonstração dos dados.

### 5. Validações e tratamento básico de erros

- [ ] Tentar enviar um formulário com campo obrigatório vazio e fazer login com senha incorreta; mostrar a mensagem e o formulário ainda utilizável.
- Mostrar que o treinador sem aprovação não fica disponível para contratação e que atleta não acessa funções administrativas.
- Opcional: mostrar uma evidência de acesso negado a arquivo de outro usuário no [registro de testes remotos](evidencias/vercel-preview-50mib-2026-10-26.json). Não usar documentos pessoais na demonstração.

### 6. Testes iniciais com evidências

- [ ] Abrir a [CI completa aprovada](https://github.com/DaviSouza78/LinkAtletas/actions/runs/40420233293/attempts/2) e expandir as etapas de testes, navegador/acessibilidade, aplicativo e TLS. Mostrar resultados, não apenas a existência do workflow.
- Abrir o [relatório dos 99 testes de API/unidade](evidencias/nuvem-2026-10-26-vitest.json); localizar `numPassedTests` e `numFailedTests`.
- Abrir o [resultado dos 15 testes de navegador](evidencias/verificacao-nuvem-entrega-2026-10-26/playwright-results.json); localizar `stats` e destacar `expected: 15`, `unexpected: 0` e `flaky: 0` nessa execução.
- Mostrar duas capturas: [aprovação administrativa](evidencias/verificacao-nuvem-entrega-2026-10-26/aprovacao-administrativa.png) e [execução no celular](evidencias/verificacao-nuvem-entrega-2026-10-26/execucao-mobile.png).
- Para comprovar nuvem, abrir o [resultado de produção](evidencias/vercel-producao-2026-10-26.json) e o [cron com execuções 200 OK](evidencias/cron-producao-ativo-2026-10-26.png). Se mencionar APK, mostrar a [inicialização no emulador](evidencias/android-nuvem-inicializacao-2026-10-26.png).
- Identificar a data e o ambiente de cada evidência. Não apresentar uma captura antiga como teste executado ao vivo nem afirmar que todas as tentativas passaram.

### 7. Documentação da API

- [ ] Abrir o [Swagger publicado](https://link-atletas.vercel.app/api/docs); expandir uma rota de autenticação e uma de treinos.
- Apontar método e caminho, campos obrigatórios da requisição, estrutura da resposta e códigos de erro/autenticação.
- Mostrar o [contrato OpenAPI publicado](https://link-atletas.vercel.app/api/openapi.json) e o [guia da API no repositório](api.md).
- Explicar: o contrato documenta como web e aplicativo usam o mesmo back-end. Não é necessário executar todas as rotas; operações protegidas precisam de sessão e podem alterar dados.

### 8. ERS, diagramas e backlog atualizados

- [ ] Voltar à [ERS completa](ERS-template-original-atualizada.pdf) e mostrar o histórico de revisões, um requisito funcional e seu caso de teste correspondente.
- Abrir os [diagramas atuais](diagramas.md): destacar o DER e uma sequência do fluxo demonstrado.
- Abrir o [backlog](backlog.md): apontar itens implementados e evoluções futuras, como automação do CREF, homologação financeira e dispositivos/lojas.
- Mostrar a [matriz de UCs](rastreabilidade.md) para relacionar disciplinas, atividades e evidências.

### 9. Registro de dificuldades, decisões e mudanças de escopo

- [ ] Abrir o [registro de decisões](decisoes.md) e selecionar dois exemplos: substituição da automação do CREF pela conferência manual e organização da solução com PostgreSQL/API compartilhada.
- Abrir o [registro da implantação](implantacao-2026-10-26.md): explicar a dificuldade de inicialização/roteamento na Vercel e o envio em partes de 3 MiB para arquivos grandes.
- Fechar com as [pendências reais](pendencias-lucca.md): revisão/entrega individual, aparelho físico/iOS e serviços opcionais ainda sem homologação. Reforçar que financeiro acadêmico não cobra e que limitações estão documentadas.

As caixas deste roteiro são lembretes do que mostrar na apresentação, não indicadores de funcionalidades pendentes.
