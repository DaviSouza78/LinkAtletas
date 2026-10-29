# Automacoes do GitHub Actions

| Workflow | Disparo | Funcao |
|---|---|---|
| [ci.yml](ci.yml) | Todos os pushes, pull request ou execucao manual | Tipos/build, unidade/API, navegador, backup, esquema/diagramas, verificacoes moveis e HTTPS local. |
| [docs.yml](docs.yml) | Push de documentacao | Links locais e contratos documentados, sem iniciar servicos. |
| [android.yml](android.yml) | Manual ou chamada por outro workflow | Compilacao, inicializacao e ensaio integrado do APK. |

## Android

Selecionar o perfil `local` ou `cloud` e o modo:

- `build`: confere fontes e compila o APK, sem emulador.
- `startup`: compila ou baixa um APK e confere instalacao/tela de login no emulador, sem login de usuario nem alteracao de dados pela API.
- `integrated`: somente perfil local; testa atleta, treinador e administrador com API, PostgreSQL, SMTP capturado e S3 isolados.

`apk_run_id` e opcional: informa uma execucao deste workflow que gerou um APK do mesmo perfil. Vazio significa compilar novamente. O download verifica o SHA-256; commit do APK e do roteiro podem ser diferentes e devem ser conferidos no resultado. Nao ha run antigo ou URL ficticia como padrao.

```powershell
gh workflow run android.yml --repo DaviSouza78/LinkAtletas --ref main -f build_profile=cloud -f mode=build
gh workflow run android.yml --repo DaviSouza78/LinkAtletas --ref main -f build_profile=local -f mode=integrated
```

O teste integrado nunca cria fixtures em producao. Nenhum modo autoriza automaticamente uma conta Google pessoal. APK usa assinatura de desenvolvimento; emulador nao comprova homologacao fisica, iOS ou publicacao em lojas. Os testes Android rodam no runner do GitHub, sem abrir emulador no computador do integrante.

## Resultados e configuracao

Consultar a aba Actions e o commit de cada execucao. A CI preserva `test-evidence` por 14 dias. APK e evidencias Android tem retencao de 30 dias; artefatos expirados precisam ser gerados novamente.

As credenciais de banco, SMTP e S3 declaradas nos ensaios sao exclusivas do ambiente local isolado. Valores reais devem permanecer em secrets dos provedores. IDs OAuth publicos podem ser configurados nas variaveis `GOOGLE_WEB_CLIENT_ID` e `GOOGLE_IOS_CLIENT_ID` do repositorio.

[Documentacao do projeto](../../docs/README.md)

## Check de publicacao

O job `LinkAtletas - validacao completa` tem nome estavel e responde a todos os pushes, inclusive documentacao, para permitir sua exigencia antes da promocao de um deployment. No projeto Vercel, esse check do repositorio conectado (`luccalck/LinkAtletas`) e exigido antes da promocao em Production. A existencia de uma CI no repositorio do grupo nao gera automaticamente o mesmo resultado no fork.

Nao renomear o job sem atualizar a configuracao correspondente na Vercel. CI aprovada comprova os testes executados, nao homologacao Google, cobrancas reais ou dispositivos fisicos.

Ao usar um fork pela primeira vez, abrir a aba Actions e confirmar a habilitacao dos workflows desse fork. O bloqueio inicial do GitHub pode impedir disparos automaticos mesmo quando a API informa workflows ativos e uma execucao manual funciona. Conferir um push real antes de depender do check para liberar producao.
