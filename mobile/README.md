# LinkAtletas — aplicativo do atleta

Cliente React Native/Expo da mesma API Node/PostgreSQL. Perfis de treinador e administrador usam a interface web. Não há servidor nem dados fictícios próprios no aplicativo.

API pública: `https://link-atletas.vercel.app/api`. O [APK HTTPS compilado e seu ensaio em emulador](../docs/evolucao/evidencias/android/android-nuvem-2026-10-26.json) estão identificados pelo commit e pelo hash do artefato. Os resultados históricos e locais nas seções seguintes conservam seu alcance; início em emulador não comprova uso em aparelho físico ou publicação nas lojas.

## Organização

| Pasta | Responsabilidade |
|---|---|
| [src](src/README.md) | Código da interface, com telas por assunto, componentes, hooks, configuração, utilitários e transporte HTTP. |
| [tests](tests/README.md) | Testes de configuração, sessão, transporte e arquivos, com dependências nativas controladas. |
| [plugins](plugins/README.md) | Configuração nativa de rede para diferenciar APK local de produção. |
| [scripts](scripts/README.md) | Conferência reproduzível das dependências do SDK instalado. |

| Arquivo da raiz | Função |
|---|---|
| [index.ts](index.ts) | Registra o componente principal no Expo. |
| [App.tsx](App.tsx) | Compõe sessão, navegação por abas e estrutura visual do aplicativo. |
| [app.config.ts](app.config.ts) | Configuração Expo única: identidade, versão, plugins e perfis local/normal. Substitui o antigo `app.json`. |
| [metro.config.cjs](metro.config.cjs) | Permite ao bundler resolver os contratos de `../shared`. |
| [package.json](package.json) e [pnpm-lock.yaml](pnpm-lock.yaml) | Comandos, dependências exatas e instalação reproduzível do aplicativo. O pacote móvel tem dependências próprias. |
| [tsconfig.json](tsconfig.json) e [vitest.config.ts](vitest.config.ts) | Escopo de tipos e execução dos testes móveis. |
| [.env.example](.env.example) | Exemplo de endereço público da API; não contém credenciais de serviços. |
| [.gitignore](.gitignore) | Exclui dependências, ambiente local, bundles e projetos nativos gerados. |

As antigas telas agrupadas em `CoreScreens`, `InteractionScreens` e `AccountScreens` foram distribuídas por assunto. A [lista das telas](src/screens/README.md) mostra onde encontrar cada funcionalidade. As regras de permissão e os dados permanecem na API; a organização das pastas não concede acesso adicional.

`node_modules`, `.expo`, `dist`, `android` e `ios` são dependências, estado local ou saídas geradas e ficam fora do Git. Não remover dependências ou projetos nativos locais como se fossem arquivos inúteis: podem ser necessários para executar/compilar, e alterações nativas manuais devem ser conferidas antes de regenerar.

## Instalação e execução

Pré-requisitos: Node 24 e pnpm 10.33.2. Para a API local, iniciar os serviços da raiz, aplicar migrações e iniciar a API conforme o [manual](../docs/evolucao/operacao/manual.md). Para usar a API pública, o Docker do computador não é necessário. Execute a partir deste diretório:

```powershell
pnpm install --frozen-lockfile
if (!(Test-Path .env)) { Copy-Item .env.example .env }
pnpm start
```

Configure `EXPO_PUBLIC_API_URL` com a URL completa terminada em `/api`. Android em emulador pode alcançar o host em `http://10.0.2.2:3001/api`; iOS no simulador do Mac pode usar `http://localhost:3001/api`. Para o APK local standalone, prefira USB/ADB: `pnpm mobile:connect` na raiz verifica a API, cria o túnel e abre o aplicativo. O [manual do APK](../docs/evolucao/operacao/manual-apk-local.md) mostra instalação e configuração. Não é necessário expor API/banco à rede. Acesso direto por LAN exige configuração de rede pelo responsável e não é o perfil local restrito.

Abra com um cliente Expo compatível com SDK 57 ou development build. A compilação nativa local usa `pnpm android` (JDK/Android SDK) ou `pnpm ios` (Mac/Xcode). A disponibilidade do ambiente nativo precisa ser conferida separadamente; os comandos de tipos e exportação não o substituem. Compilação/distribuição EAS depende de conta e credenciais; nenhum aplicativo foi enviado às lojas.

## Verificações reproduzíveis

```powershell
pnpm typecheck
pnpm check
pnpm test
$env:EXPO_PUBLIC_API_URL = 'https://link-atletas.vercel.app/api'
pnpm export
```

`pnpm check` confere as versões exatas instaladas e a matriz nativa do SDK fixado no lockfile. `pnpm check:updates` consulta as recomendações online do Expo; um patch novo deve ser avaliado, recompilado e testado antes de substituir o APK validado. A consulta de atualizações é separada da checagem reproduzível de compatibilidade.

Use HTTPS real no perfil normal antes de distribuir e remova `EXPO_PUBLIC_BUILD_PROFILE=local` desse ambiente. Builds de produção recusam chamadas HTTP e mostram erro de configuração; desenvolvimento pode usar a rede local. O perfil `local` possui exceção restrita a loopback/emulador, descrita no manual do APK. O Metro precisa de `metro.config.cjs` para resolver o catálogo compartilhado em `../shared`.

O export gera bundles Hermes Android/iOS em `dist/`, ignorado pelo Git. Geração de bundles e testes do transporte com módulos nativos controlados não comprovam execução em dispositivo, APK/IPA, leitura de tela ou homologação nas lojas. Veja [evidências](../docs/evolucao/evidencias/android/mobile-verificacao.md).

Há um APK **LinkAtletas Local**, pacote separado com HTTP limitado a loopback/emulador e conexão por USB, compilado com Expo 57.0.30: [manual](../docs/evolucao/operacao/manual-apk-local.md), [evidências e limites](../docs/evolucao/evidencias/android/mobile-verificacao.md). O APK antigo com domínio `.example` permanece histórico. O perfil normal exige HTTPS real e assinatura de distribuição para lojas.

## Funcionalidades

- Cadastro e login do atleta, restauração de sessão, logout, recuperação e redefinição de senha.
- Perfil, preferências de matchmaking, descoberta e solicitação/encerramento de vínculos.
- Treinos publicados, blocos realizados, esforço, métricas por modalidade e notas ao treinador.
- Envio de performance mediante consentimento, arquivos privados, download/compartilhamento explícito e correções recebidas.
- Chat com WebSocket autenticado por cabeçalho, reconexão, histórico paginado e confirmação de leitura.
- Agenda com agendamento, reagendamento, cancelamento e histórico; abertura de reunião externa já vinculada.
- Avaliações elegíveis, edição, leitura de resposta e pedido de moderação.
- Notificações persistidas, financeiro e acesso ao checkout hospedado somente quando configurado.
- Consentimentos versionados, dados privados de saúde, exportação e solicitação de exclusão com senha.

Recuperação: o e-mail enviado contém o link web seguro de redefinição. O usuário pode abri-lo no navegador ou copiar o token após `token=` para a tela “Redefinir senha” do aplicativo. O esquema `linkatletas` está reservado para integração futura; não há universal links homologados. A criação OAuth de evento Google acontece na interface web quando configurada; o aplicativo abre a referência persistida, sem criar convites em segundo plano.

## Sessão e arquivos privados

Somente o token opaco é armazenado no SecureStore; senha e chaves de serviços não são persistidas. HTTP utiliza `Authorization: Bearer`, e WebSocket usa cabeçalho nativo. Tokens nunca são enviados em query string. Sessões invalidadas pelo servidor retornam à entrada. Senha incorreta na confirmação de exclusão permite nova tentativa sem encerrar uma sessão válida.

Compartilhar um arquivo ou exportação cria uma cópia transitória no cache privado, abre a folha de compartilhamento do sistema e remove a cópia após a ação. Destinos selecionados pelo usuário podem manter suas próprias cópias. Segredos Asaas, S3, SMTP e de criptografia pertencem exclusivamente ao servidor; não use prefixo `EXPO_PUBLIC_` para eles.

Referências de versão e segurança: [Expo SDK](https://docs.expo.dev/versions/latest/), [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [compilação local](https://docs.expo.dev/guides/local-app-overview/).
