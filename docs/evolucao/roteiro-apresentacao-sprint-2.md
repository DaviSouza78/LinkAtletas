# Roteiro de apresentação da Sprint 2

Para explicações completas e respostas às perguntas do professor, abrir a [apresentação completa](apresentacao-completa-sprint-2.md).

**Ordem:** ERS → GitHub → arquitetura e serviços → site → testes/API → decisões e próximos passos.
**Tempo sugerido:** 12–15 minutos. Usar os itens abaixo como lembrete, sem ler os documentos inteiros.

**Para demonstrar os critérios de avaliação:** ir ao [guia prático dos seis critérios](#guia-prático-dos-seis-critérios-de-avaliação), ao final deste roteiro. Ele reúne as telas, ações e evidências que devem ser apresentadas.

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

## Guia prático dos seis critérios de avaliação

As implementações e as evidências iniciais dos seis critérios estão disponíveis nas referências abaixo. Isso não significa ausência de bugs ou conclusão da auditoria ampliada de todas as funcionalidades e permissões, que continua em andamento. Não apresentar essa auditoria como aprovada.

As contas de demonstração do site publicado foram preparadas e tiveram login verificado: administrador, treinador e atleta. As credenciais estão no arquivo privado `C:\Users\user\Downloads\integrador\acessos-demonstracao.local.txt`, fora do GitHub. O treinador e o atleta já têm perfil, vínculo ativo, treino publicado e mensagem fictícios. Informar quais etapas foram preparadas antes; não apresentar esses registros como criados ao vivo.

### Critério 1 — fluxo principal de ponta a ponta

**Onde abrir:** [site](https://link-atletas.vercel.app/), [administração](https://link-atletas.vercel.app/admin), [alunos do treinador](https://link-atletas.vercel.app/treinador/alunos), [treinos do treinador](https://link-atletas.vercel.app/treinador/treinos) e [treino do atleta](https://link-atletas.vercel.app/atleta/treino).

**Demonstrar:** usar sessões separadas para os três papéis. Mostrar a aprovação manual do treinador, o vínculo ativo e o treino publicado. Criar/publicar um novo treino pelo treinador, registrar execução e feedback pelo atleta e abrir o resultado na conta do treinador. Atualizar a página para mostrar persistência. Os valores e orientações do treino são fictícios, sem recomendação de exercício real.

**Para mostrar também solicitação e aceite ao vivo:** cadastrar outro atleta fictício pela [tela de cadastro](https://link-atletas.vercel.app/cadastro), completar preferências compatíveis com o treinador demonstrativo, procurá-lo em [descoberta](https://link-atletas.vercel.app/atleta/descobrir), solicitar acompanhamento e aceitar na conta do treinador. O par já preparado tem vínculo ativo e não deve ser usado para fingir uma nova solicitação.

**Resultado esperado:** o treino passa do treinador ao atleta e a execução retorna ao treinador, com dados salvos. Não basta navegar entre telas.

**Evidência:** [jornada HTTPS em Preview](evidencias/vercel-fluxo-2026-10-26.json) e [relato dos testes manuais](testes-manuais-2026-10-27.md). A conferência manual de CREF é o requisito atual; aprovação fictícia não comprova registro profissional.

### Critério 2 — banco criado e integrado

**Onde abrir:** [saúde da API](https://link-atletas.vercel.app/api/health), [perfil do atleta](https://link-atletas.vercel.app/atleta/perfil), [console Neon](https://console.neon.tech/) e [dicionário de dados](dicionario-dados.md).

**Demonstrar:** mostrar a resposta `{"ok":true,"database":"postgresql"}`. Na conta fictícia, alterar a descrição do perfil para um texto reconhecível, como “Demonstracao de integracao Sprint 2”, salvar e atualizar a página. No Neon, selecionar o banco de **produção** e abrir `profiles`, localizando o `user_id` do atleta demonstrativo em `users`. Mostrar o mesmo texto no campo `bio`, atualizando a visualização da tabela se necessário. Exibir somente as colunas necessárias; não mostrar hashes de senha, sessões, tokens ou dados de contas reais. Depois, restaurar a descrição fictícia se desejar.

**Resultado esperado:** o dado gravado pelo site aparece no PostgreSQL e volta à interface após recarregar. O endpoint de saúde complementa a prova; sozinho não demonstra a gravação e leitura de um registro.

**Explicação breve:** “O site chama nossa API na Vercel. A API grava e consulta o PostgreSQL hospedado no Neon. O banco do Docker é separado e não é necessário para a aplicação pública funcionar.”

**Evidência:** [migrações do Neon](evidencias/neon-migrations-2026-10-26.json), [verificação de produção](evidencias/vercel-producao-2026-10-26.json), [migrações SQL](../../server/db/migrations) e [DER](diagramas.md). A resposta de saúde foi conferida novamente durante a preparação deste guia.

### Critério 3 — interface responsiva integrada ao back-end

**Onde abrir:** [site](https://link-atletas.vercel.app/), [perfil](https://link-atletas.vercel.app/atleta/perfil) e as telas do fluxo acima.

**Demonstrar:** abrir as ferramentas do navegador com F12, ativar a visualização de dispositivo e usar largura próxima de 390 px. Mostrar menu, formulário e botões, além da versão desktop. Salvar uma alteração e recarregar. Se precisar comprovar a chamada, abrir a aba Network/Rede, filtrar por Fetch/XHR e mostrar o caminho e o status da requisição do perfil, sem abrir cabeçalhos com credenciais nem exportar a sessão.

**Resultado esperado:** tela utilizável no celular, sem conteúdo essencial cortado, e dados persistidos pelo servidor. Apenas reduzir a janela não comprova a integração.

**Evidência:** [execução de treino em tela móvel](evidencias/verificacao-nuvem-entrega-2026-10-26/execucao-mobile.png), [agenda em tela móvel](evidencias/verificacao-nuvem-entrega-2026-10-26/chromium-agenda-mobile.png) e [resultado dos testes de navegador](evidencias/verificacao-nuvem-entrega-2026-10-26/playwright-results.json).

### Critério 4 — validações e tratamento de erros

**Onde abrir:** [login](https://link-atletas.vercel.app/login), [cadastro](https://link-atletas.vercel.app/cadastro), [administração](https://link-atletas.vercel.app/admin) e [documentação da API](https://link-atletas.vercel.app/api/docs/).

**Demonstrar:** tentar enviar formulário obrigatório vazio; tentar entrar com a conta fictícia e senha incorreta; mostrar a mensagem e corrigir o preenchimento para entrar normalmente. Com sessão de atleta, abrir `/admin` e mostrar que o acesso não é concedido. No treinador, tentar agendar duas consultorias no mesmo horário, se houver tempo, e mostrar a recusa por conflito. Evitar muitas tentativas de login para não acionar o limite de requisições durante a apresentação.

**Resultado esperado:** a entrada inválida não é aceita, a operação indevida é bloqueada e o usuário consegue corrigir o problema. Diferenciar bloqueio do formulário, validação da API e permissão por papel.

**Evidência:** [cenários e resultados manuais](testes-manuais-2026-10-27.md), [testes da API](../../tests/integration/api.test.ts), [testes de interações](../../tests/integration/interactions.test.ts) e [teste de entrada inválida em tela móvel](evidencias/login-mobile-erro.png). No Swagger, apontar os erros documentados; não executar alterações administrativas aleatórias.

### Critério 5 — testes iniciais com evidências

**Onde abrir e o que apontar:**

1. [Relatório dos testes](relatorio-testes.md): cenários, ambiente e limites.
2. [Resultado Vitest](evidencias/nuvem-2026-10-26-vitest.json): `numPassedTests: 99`, `numFailedTests: 0` e `success: true` dessa execução.
3. [Resultado Playwright](evidencias/verificacao-nuvem-entrega-2026-10-26/playwright-results.json): em `stats`, `expected: 15`, `unexpected: 0` e `flaky: 0` dessa execução.
4. [CI aprovada registrada](https://github.com/DaviSouza78/LinkAtletas/actions/runs/40420233293/attempts/2): expandir as etapas executadas; não mostrar somente o arquivo de configuração.
5. [Captura administrativa](evidencias/verificacao-nuvem-entrega-2026-10-26/aprovacao-administrativa.png) e [captura móvel](evidencias/verificacao-nuvem-entrega-2026-10-26/execucao-mobile.png): ilustrar o cenário testado.

**Resultado esperado:** evidências com cenário, resultado, data e ambiente identificáveis. As contagens acima foram conferidas nos arquivos ao preparar este guia; não representam uma nova execução das suítes nem o encerramento da auditoria ampliada.

### Critério 6 — código completo e versionado

**Onde abrir:** [repositório do grupo](https://github.com/DaviSouza78/LinkAtletas), [commits da main](https://github.com/DaviSouza78/LinkAtletas/commits/main/), [README](../../README.md), [web](../../src), [API](../../server), [contratos compartilhados](../../shared), [app](../../mobile), [testes](../../tests), [dependências](../../package.json) e [configuração de exemplo](../../.env.example).

**Demonstrar:** mostrar a branch `main`, abrir um commit de implementação e suas alterações, localizar as pastas e explicar os comandos de instalação no README. Mostrar que o `.env.example` documenta a configuração sem publicar as credenciais de produção. O repositório do grupo é a referência da entrega; o fork pessoal é uma cópia.

**Resultado esperado:** o código da versão entregue pode ser obtido do GitHub e possui histórico e instruções reproduzíveis. As alterações ainda locais da auditoria ampliada não fazem parte da versão publicada e não devem ser apresentadas como entregues.

## Ordem curta para abrir durante a avaliação

ERS → GitHub e commits → site com três sessões → fluxo de treino e feedback → saúde da API e gravação conferida no Neon → tela móvel → entradas inválidas e permissão → resultados dos testes e CI → checklist final.

Para lembrar a função dos fornecedores, abrir o [guia dos serviços externos](servicos-externos-sprint-2.md). Não é necessário mostrar telas de configuração ou chaves para comprovar integração.
