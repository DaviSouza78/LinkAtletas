# Apresentação completa — LinkAtletas, Sprint 2

Guia de fala, navegação e respostas para a apresentação. Usar como apoio, sem ler tudo. Tempo sugerido: 20–25 minutos. Para uma apresentação curta, usar o [roteiro resumido](roteiro-apresentacao-sprint-2.md). Os entregáveis e suas referências estão no [checklist](checklist-sprint-2.md).

## Preparação antes de apresentar

1. Abrir a [ERS final](ERS-template-original-atualizada.pdf), o [GitHub do grupo](https://github.com/DaviSouza78/LinkAtletas), o [site](https://link-atletas.vercel.app/), o [Neon](https://console.neon.tech/), a [API](https://link-atletas.vercel.app/api/docs/) e os [resultados de testes](relatorio-testes.md).
2. Separar as sessões de administrador, treinador e atleta em perfis de navegador distintos. Abas comuns do mesmo perfil compartilham o login. A janela anônima serve como sessão adicional; várias janelas anônimas do mesmo navegador podem compartilhar a mesma sessão.
3. Consultar as senhas no arquivo privado `C:\Users\user\Downloads\integrador\acessos-demonstracao.local.txt`. Não projetar esse arquivo nem arquivos `.env`.
4. No Neon, escolher o banco de **produção** conectado ao site. O banco de Preview e o banco do Docker são separados.
5. Manter o [registro de implantação](implantacao-2026-10-26.md) e as capturas como alternativa se houver problema de rede. Identificar registros históricos como evidências anteriores, não como demonstração ao vivo.

## Dados fictícios disponíveis

As contas principais são administrador, atleta e treinador. O par atleta/treinador já tem perfil compatível, aprovação fictícia identificada, vínculo ativo, mensagem e plano acadêmico sem cobrança real.

- **Treino concluído:** `DEMO - treino concluido`, com execução e feedback previamente preparados.
- **Treino publicado:** `DEMO - treino para executar ao vivo`, para registrar execução durante a apresentação.
- **Rascunho:** `DEMO - rascunho para publicar ao vivo`, visível ao treinador e inicialmente invisível ao atleta.
- **Agenda:** `DEMO - consultoria ficticia`, para mostrar o mesmo compromisso nas duas contas.
- **Administração:** um treinador adicional chamado `Treinador Pendente Demonstracao`, com solicitação de CREF fictícia pendente. Suas credenciais auxiliares estão no mesmo arquivo privado.

Esses dados foram preparados pela API, não por uma nova sessão de teste manual no navegador. O [registro da preparação e da integração com o banco](evidencias/demonstracao-preparada-2026-10-27.json) identifica o que foi verificado. Se alguém executar o treino, publicar o rascunho ou decidir a solicitação antes da apresentação, o estado muda: mostrar o estado real, sem fingir que continua pendente.

## Etapa 1 — contexto e ERS | 3 minutos

**Abrir:** [ERS final no template do professor](ERS-template-original-atualizada.pdf).

**Fala sugerida:** “O LinkAtletas conecta atletas a treinadores. O atleta organiza seu perfil e encontra acompanhamento compatível; o treinador prescreve e acompanha treinos; o administrador analisa a habilitação profissional e exerce as funções administrativas. Nesta Sprint entregamos o fluxo integrado, o banco, a interface, as validações, os testes e a documentação.”

**Mostrar:** objetivo, atores, histórico de revisões, um requisito funcional, regra de negócio, caso de teste e diagrama relacionado. Explicar que o documento foi atualizado para refletir o CREF manual. Não tentar percorrer todas as páginas.

**Pergunta: “O que mudou da Sprint 1 para a Sprint 2?”**

“Na Sprint 1 havia especificação, modelos e protótipos. Na Sprint 2 implementamos a comunicação entre interface, API e banco, autenticação, permissões e o fluxo de contratação e treino, com testes e implantação. As mudanças de escopo estão registradas nas decisões e na ERS.”

## Etapa 2 — GitHub e código versionado | 2 minutos

**Abrir:** [repositório](https://github.com/DaviSouza78/LinkAtletas), [commits](https://github.com/DaviSouza78/LinkAtletas/commits/main/) e [README](../../README.md).

**Mostrar:** `src` para interface, `server` para API/migrações/serviços, `shared` para contratos, `mobile` para aplicativo e `tests` para testes. Abrir um commit de implementação e suas alterações, além das instruções de execução.

**Fala sugerida:** “A referência da entrega é a branch main do repositório do grupo. As alterações têm histórico de autoria, e o README explica como reproduzir o ambiente. As credenciais são configuradas fora do Git.”

**Pergunta: “O fork é outra aplicação?”**

“É uma cópia do repositório na conta pessoal. A aplicação publicada é configurada na Vercel; o fork, sozinho, não executa a aplicação e não se mantém sincronizado automaticamente.”

## Etapa 3 — arquitetura e serviços | 2 minutos

**Abrir:** [guia dos serviços](servicos-externos-sprint-2.md) e [saúde da API](https://link-atletas.vercel.app/api/health).

**Fala sugerida:** “O navegador usa a interface React, preparada com Vite. Ela chama nossa API Node com Fastify, publicada na Vercel. A API valida a sessão e os dados e acessa o PostgreSQL no Neon. Os arquivos ficam no Tigris. Brevo envia e-mails, e cron-job.org dispara os trabalhos pendentes.”

**Explicar cada serviço:**

- **Vercel:** publicação da interface e execução da API por HTTPS.
- **Neon:** hospedagem do PostgreSQL e dos registros relacionais.
- **Tigris:** armazenamento privado de arquivos; o banco guarda referências e metadados.
- **Brevo:** entrega ao servidor SMTP dos e-mails da aplicação, incluindo recuperação de senha. Aceite pelo SMTP não garante chegada à caixa de entrada.
- **cron-job.org:** faz a chamada periódica à rota autenticada de jobs. A lógica é executada pela API, não pelo agendador.
- **GitHub Actions:** verifica o projeto e compila o APK nos workflows; não é o servidor do site.
- **Docker local:** PostgreSQL, SeaweedFS e Mailpit para desenvolver e testar. SeaweedFS representa o armazenamento S3 local; Mailpit captura e-mails locais.
- **Caddy:** HTTPS da implantação alternativa em contêineres, não da implantação atual na Vercel.

**Pergunta: “Se desligar seu computador, para?”**

“A aplicação pública continua na nuvem. Apenas o ambiente local para. Não há sincronização automática do PostgreSQL local com o Neon.”

**Pergunta: “Por que Vite e Fastify?”**

“Eles cumprem funções diferentes: Vite prepara e serve a interface durante o desenvolvimento; Fastify implementa as rotas da API, autenticação, validações e acesso ao banco. React cuida da interface.”

## Etapa 4 — administrador e CREF | 3 minutos

**Abrir:** [administração](https://link-atletas.vercel.app/admin), com a conta administrativa.

**Demonstrar:** localizar `Treinador Pendente Demonstracao`, mostrar a evidência fictícia e o estado pendente. Mostrar os campos da decisão e a necessidade de justificativa. Para demonstrar a mudança de estado, registrar explicitamente no motivo que se trata de fixture acadêmica sem comprovação profissional real. Não aprovar nem alterar usuários reais durante a apresentação.

**Resposta recomendada sobre a API do CREF:**

“A proposta inicial previa automatizar a consulta de CREF. Não temos uma API oficial integrada nem acesso homologado para executar essa consulta automaticamente. A equipe revisou o requisito na ERS: o treinador informa o registro e apresenta a evidência; o administrador consulta a fonte oficial disponível, confere a titularidade e a situação e registra aprovação ou reprovação, justificativa e validade quando aplicável. O sistema controla o acesso com base nessa decisão. A integração automática fica como evolução futura, dependente de uma fonte oficial viável.”

**Precisão da resposta:** não afirmar que uma API não existe em nenhum conselho, que o conselho negou acesso, que houve pedido formal ou que a automação foi concluída sem documentação que comprove isso. A limitação atual é não haver integração oficial disponível e homologada no projeto. Conferir manualmente o cadastro não exige desenvolver uma API externa própria.

**Pergunta: “Então o administrador só clica em aprovar?”**

“Não deveria decidir apenas pelo número informado. A operação administrativa exige a conferência externa da documentação e da situação do profissional. O sistema registra a decisão; ele não substitui a fonte oficial. Nesta apresentação usamos um cadastro fictício para demonstrar o fluxo, não uma validação profissional verdadeira.”

**Pergunta: “Isso é igual à validação automática?”**

“Não. A conferência humana tem custo operacional e depende da qualidade da análise. É a solução atual documentada. Automatizar exigiria integração confiável, regras de atualização e tratamento de indisponibilidade.”

## Etapa 5 — fluxo principal do treinador e atleta | 5 minutos

**Abrir:** [alunos do treinador](https://link-atletas.vercel.app/treinador/alunos), [treinos do treinador](https://link-atletas.vercel.app/treinador/treinos) e [treino do atleta](https://link-atletas.vercel.app/atleta/treino), em sessões diferentes.

1. Mostrar o vínculo ativo entre as contas fictícias. Informar que esse vínculo foi preparado antes.
2. Pelo treinador, abrir `DEMO - rascunho para publicar ao vivo` e mostrar os campos. Pelo atleta, mostrar que esse rascunho ainda não aparece.
3. Publicar o rascunho. Atualizar a conta do atleta e localizar a ficha publicada.
4. Pelo atleta, abrir `DEMO - treino para executar ao vivo`, marcar o bloco e preencher esforço e observação fictícios. Salvar a execução.
5. Pelo treinador, abrir o mesmo treino e mostrar o resultado recebido. Recarregar a página para confirmar persistência.
6. Se houver tempo, abrir mensagens e agenda nas duas contas. Mostrar a consultoria fictícia preparada, sem alegar reunião real no Google Meet.

**Fala sugerida:** “A informação nasce na conta do treinador, é recebida pelo atleta e volta como execução e feedback. As duas interfaces usam o mesmo registro do servidor, respeitando o papel e o vínculo.”

**Para demonstrar o início do vínculo ao vivo:** cadastrar outro atleta fictício em [cadastro](https://link-atletas.vercel.app/cadastro), preencher perfil compatível com Corrida, Condicionamento, Iniciante e disponibilidade do treinador, encontrar o treinador em [descoberta](https://link-atletas.vercel.app/atleta/descobrir), solicitar acompanhamento e aceitar na conta do treinador. A solicitação não se repete no par que já tem vínculo ativo.

**Pergunta: “São dados reais ou só telas?”**

“Os dados são fictícios, mas as operações usam a API e o banco reais da implantação. Podemos mostrar a persistência no Neon. Não são dados de atletas reais nem comprovação de exercício realizado.”

## Etapa 6 — comprovar integração com o banco | 3 minutos

**Abrir:** [perfil do atleta](https://link-atletas.vercel.app/atleta/perfil), [saúde da API](https://link-atletas.vercel.app/api/health), [Neon](https://console.neon.tech/) e [DER/dicionário](dicionario-dados.md).

**Demonstração mais forte:**

1. Mostrar `ok: true` e `database: postgresql` na saúde da API.
2. Pelo site, alterar a descrição do atleta fictício para `Demonstracao do banco - Sprint 2`, salvar e recarregar. Mostrar que o texto permanece.
3. No Neon de produção, consultar o mesmo atleta e mostrar esse texto em `profiles.bio`. A consulta abaixo lê somente dados da conta fictícia.
4. Alterar novamente pelo site, atualizar a consulta e mostrar a mudança. Se desejar, restaurar a descrição fictícia original ao terminar.
5. Mostrar a relação entre atleta, treinador e vínculo, sem exibir credenciais ou hashes.

**Consulta de leitura do perfil fictício:**

```sql
SELECT u.id, u.name, u.role, p.city, p.bio
FROM users u
JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'demo-athlete-84e371@example.com';
```

**Consulta do vínculo e dos treinos fictícios:**

```sql
SELECT c.id AS contract_id,
       a.name AS atleta,
       t.name AS treinador,
       c.status AS vinculo,
       w.title AS treino,
       w.status AS estado_treino,
       e.id IS NOT NULL AS possui_execucao
FROM contracts c
JOIN users a ON a.id = c.athlete_id
JOIN users t ON t.id = c.coach_id
LEFT JOIN workouts w ON w.contract_id = c.id
LEFT JOIN executions e ON e.workout_id = w.id
WHERE a.email = 'demo-athlete-84e371@example.com'
  AND t.email = 'demo-coach-cbc1e0@example.com'
ORDER BY w.created_at DESC;
```

As consultas são apenas `SELECT`; não removem nem alteram dados. Não usar `SELECT * FROM users` na apresentação, pois exporia colunas desnecessárias. O professor não precisa receber senha do banco: é possível comprovar pela demonstração acompanhada, pelas consultas e pelas evidências.

**Pergunta: “O health prova tudo?”**

“Ele comprova a verificação de conexão feita pela API. A prova do fluxo de dados é salvar pelo site, localizar o registro no Neon e recuperá-lo novamente. São verificações complementares.”

**Pergunta: “Por que PostgreSQL?”**

“Os dados possuem relações claras entre usuários, vínculos, treinos e execuções. PostgreSQL permite integridade referencial, restrições, índices e transações. Neon é o serviço que hospeda esse PostgreSQL.”

**Pergunta: “Por que as tabelas estão em inglês?”**

“É a convenção técnica adotada no código. O dicionário explica seu significado. Traduzir os nomes exigiria migração e atualização das consultas, testes e modelos; não melhora por si só a integração nem é necessário para comprovar o critério.”

**Pergunta: “Os arquivos também ficam no banco?”**

“Os binários ficam no Tigris. O PostgreSQL guarda os metadados e as relações. O acesso é mediado pela API, com controle de permissão e cifra no armazenamento.”

## Etapa 7 — responsividade, validações e permissões | 3 minutos

**Responsividade:** abrir F12 e o modo dispositivo, com largura próxima de 390 px. Mostrar menu, formulário e treino utilizáveis. Fazer uma operação de gravação e recuperar o resultado. Mostrar também a versão desktop.

**Entradas inválidas:** no [login](https://link-atletas.vercel.app/login) ou [cadastro](https://link-atletas.vercel.app/cadastro), tentar enviar campos obrigatórios vazios. Testar uma senha incorreta com conta fictícia e depois corrigir. Não repetir muitas tentativas para evitar o limitador durante a apresentação.

**Permissões:** na sessão de atleta, tentar abrir `/admin`. O painel administrativo não deve ficar acessível. Mostrar que o atleta não vê o rascunho do treinador antes da publicação.

**API:** se abrir Network/Rede, mostrar o método, o caminho e o status da operação; não projetar cabeçalhos de sessão ou tokens.

**Pergunta: “A segurança depende apenas de esconder botão?”**

“Não. A interface orienta a navegação, mas o servidor verifica autenticação, papel e acesso ao recurso. Uma rota protegida deve recusar a operação mesmo que alguém monte a requisição fora da interface. Os testes incluem verificações de autorização; a auditoria ampliada de todas as combinações ainda está em andamento.”

**Pergunta: “E se alguém enviar dados inválidos diretamente à API?”**

“O servidor também valida os campos e as regras. O banco tem restrições adicionais. A mensagem da interface ajuda o usuário, mas não substitui a validação do servidor.”

## Etapa 8 — API e testes com evidências | 3 minutos

**Abrir:** [Swagger](https://link-atletas.vercel.app/api/docs/), [guia da API](api.md), [relatório](relatorio-testes.md) e [GitHub Actions](https://github.com/DaviSouza78/LinkAtletas/actions).

**Mostrar no Swagger:** uma rota de autenticação e uma de treino, apontando campos, método, resposta e erros. Não confundir a API interna do LinkAtletas com uma API externa do conselho profissional.

**Mostrar os resultados registrados:**

- [API/unidade](evidencias/nuvem-2026-10-26-vitest.json): `numPassedTests: 99`, `numFailedTests: 0`, `success: true`.
- [Navegador](evidencias/verificacao-nuvem-entrega-2026-10-26/playwright-results.json): `expected: 15`, `unexpected: 0`, `flaky: 0`, nos três motores daquela execução.
- [CI aprovada registrada](https://github.com/DaviSouza78/LinkAtletas/actions/runs/40420233293/attempts/2): abrir as etapas e identificar a execução exibida.
- [Revisão manual](testes-manuais-2026-10-27.md): cenários, bugs encontrados, correções e limites.
- [Preparação desta demonstração](evidencias/demonstracao-preparada-2026-10-27.json): logins e persistência real na produção.

**Pergunta: “Vocês testaram tudo?”**

“Temos os testes iniciais exigidos e os cenários documentados, com resultado e ambiente identificados. Não afirmamos ausência de falhas ou que todas as combinações possíveis foram verificadas. A auditoria ampliada continua em andamento, e alterações ainda locais não estão sendo apresentadas como entregues.”

**Pergunta: “O teste automatizado substitui a apresentação?”**

“Não. Ele fornece uma verificação repetível dos cenários definidos. A demonstração mostra o comportamento da versão publicada; os relatórios preservam os resultados das execuções anteriores.”

## Etapa 9 — limites, decisões e encerramento | 2 minutos

**Abrir:** [decisões](decisoes.md), [backlog](backlog.md), [checklist](checklist-sprint-2.md) e [matriz de UCs](rastreabilidade.md).

**Fala sugerida:** “Os entregáveis possuem implementação ou documento referenciado. O fluxo demonstrado usa a aplicação pública, API e banco integrados. As decisões de escopo estão registradas, incluindo CREF manual. As evidências têm limites explícitos, e as evoluções estão no backlog.”

**Pergunta: “O pagamento já funciona com dinheiro real?”**

“Não está ativado. O sistema opera em modo acadêmico. Existe adaptador Asaas com testes controlados; homologação externa e cobrança real são etapas próprias. Não apresentamos testes simulados como pagamento aprovado pelo provedor.”

**Pergunta: “A agenda já cria reuniões no Google?”**

“A agenda própria funciona. A integração Google depende de configuração e autorização externas e não está homologada. Exibir um compromisso ou referência de reunião não comprova sincronização Google.”

**Pergunta: “O aplicativo está na loja?”**

“Não. Há aplicativo React Native/Expo e evidências de APK compilado, instalado e iniciado em emulador. Isso não comprova publicação em loja, teste em aparelho físico ou homologação iOS.”

**Pergunta: “Qual foi uma dificuldade técnica concreta?”**

“A adaptação da API à execução serverless e ao roteamento da Vercel, além do envio de arquivos grandes. O upload foi organizado em partes de 3 MiB, preservando os limites documentados. A implantação e seus testes estão registrados.”

**Pergunta: “Basta estar no GitHub para considerar entregue?”**

“Não. É preciso código acessível, fluxo funcionando, banco integrado e as evidências e documentos exigidos. O checklist reúne as referências; a submissão individual acontece no ambiente acadêmico.”

## Se algo falhar durante a demonstração

- **Login:** conferir o domínio público, o perfil correto do navegador e as credenciais privadas. Contas locais não servem na nuvem.
- **Dado não aparece no Neon:** conferir o ambiente de produção e atualizar a consulta/tabela. Não executar migração nem apagar dados para resolver uma dúvida de apresentação.
- **Treino não aparece:** conferir vínculo, papel da sessão e se foi publicado. Rascunho não deve aparecer ao atleta.
- **Troca de conta em outra aba:** usar outro perfil de navegador; a sessão é compartilhada entre abas do mesmo perfil.
- **Falha de rede:** registrar o que aconteceu e mostrar a evidência datada. Não afirmar que a demonstração ao vivo funcionou se ela falhou.

## Fechamento dos critérios

Fluxo completo: treino publicado → execução → feedback. Banco: alteração no site → registro no Neon → releitura. Interface: desktop e celular com gravação real. Validações: campo vazio, senha incorreta e papel indevido. Testes: resultados e CI identificados. Código: main, commits, fontes e README. ERS, diagramas, backlog, API e decisões permanecem acessíveis pelo checklist.
