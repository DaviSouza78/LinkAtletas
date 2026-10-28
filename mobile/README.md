# LinkAtletas — aplicativo do atleta

Cliente React Native/Expo da mesma API Node/PostgreSQL. Perfis de treinador e administrador usam a interface web. Não há servidor nem dados fictícios próprios no aplicativo.

API pública: `https://link-atletas.vercel.app/api`. O [APK HTTPS compilado e seu ensaio em emulador](../docs/evolucao/evidencias/android/android-nuvem-2026-10-26.json) estão identificados pelo commit e pelo hash do artefato. Os resultados históricos e locais nas seções seguintes conservam seu alcance; início em emulador não comprova uso em aparelho físico ou publicação nas lojas.

## Instalação e execução

Pré-requisitos: Node 24, pnpm 10.33.2 e serviços da raiz em execução (`docker compose up -d --wait`, migrações, seed e API). Execute a partir deste diretório:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm start
```

Configure `EXPO_PUBLIC_API_URL` com a URL completa terminada em `/api`. Android em emulador pode alcançar o host em `http://10.0.2.2:3001/api`; iOS no simulador do Mac pode usar `http://localhost:3001/api`. Para o APK local standalone, prefira USB/ADB: `pnpm mobile:connect` na raiz verifica a API, cria o túnel e abre o aplicativo. O [manual do APK](../docs/evolucao/operacao/manual-apk-local.md) mostra instalação e configuração. Não é necessário expor API/banco à rede. Acesso direto por LAN exige configuração de rede pelo responsável e não é o perfil local restrito.

Abra com um cliente Expo compatível com SDK 57 ou development build. A compilação nativa local usa `pnpm android` (JDK/Android SDK) ou `pnpm ios` (Mac/Xcode). Estes comandos não foram executados neste ambiente sem SDK/JDK/Xcode. Compilação/distribuição EAS depende de conta, credenciais e autorização; nenhum aplicativo foi enviado às lojas.

## Verificações reproduzíveis

```powershell
pnpm typecheck
pnpm check
pnpm test
$env:EXPO_PUBLIC_API_URL = 'https://api.seu-dominio.example/api'
pnpm export
```

`pnpm check` confere as versões exatas instaladas e a matriz nativa do SDK fixado no lockfile. `pnpm check:updates` consulta as recomendações online do Expo; um patch novo deve ser avaliado, recompilado e testado antes de substituir o APK validado. A consulta de atualizações é separada da checagem reproduzível de compatibilidade.

Use sua URL real de HTTPS antes de distribuir. O domínio `.example` acima é apenas documentação. Builds de produção recusam chamadas HTTP e mostram o erro de configuração; builds de desenvolvimento podem usar a rede local. O Metro precisa do arquivo `metro.config.cjs` para resolver o catálogo compartilhado em `../shared`.

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
